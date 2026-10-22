const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
const enc=new TextEncoder();
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const un64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export async function issue(privatePem,payload) {
  const der=un64(privatePem.replace(/-----[^-]+-----/g,'').replace(/\s/g,''));
  const pk=await crypto.subtle.importKey('pkcs8',der,{name:'Ed25519'},false,['sign']);
  const input='SEO1.'+b64(enc.encode(JSON.stringify(payload)));
  const signature=await crypto.subtle.sign('Ed25519',pk,enc.encode(input));
  return input+'.'+b64(new Uint8Array(signature));
}
async function validSignature(raw,header,secret,now) {
  if(!secret||!header)return false;
  const ts=header.match(/(?:^|;)ts=(\d+)(?:;|$)/)?.[1];
  const sigs=[...header.matchAll(/(?:^|;)h1=([0-9a-f]{64})(?=;|$)/g)].map(m=>m[1]);
  if(!ts||Math.abs(now/1000-Number(ts))>300||!sigs.length)return false;
  const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  for(const s of sigs) {
    const bytes=Uint8Array.from(s.match(/../g),c=>parseInt(c,16));
    if(await crypto.subtle.verify('HMAC',key,bytes,enc.encode(`${ts}:${raw}`)))return true;
  }
  return false;
}
export function ready(env) {
  return Boolean(env.DB&&env.SIGNING_PRIVATE_KEY&&env.PADDLE_WEBHOOK_SECRET&&env.STARTER_PRICE_ID&&env.PRO_PRICE_ID&&env.CLIENT_TOKEN?.startsWith('live_')&&env.PADDLE_ENV==='live'&&env.ISSUANCE_ENABLED==='true');
}
export async function handle(request,env,now=Date.now()) {
  const u=new URL(request.url);
  if(u.pathname==='/healthz'||u.pathname==='/api/config')return json(200,{mode:ready(env)?'open':'preview',paddleEnv:env.PADDLE_ENV??'unconfigured',...(ready(env)?{clientToken:env.CLIENT_TOKEN,starterPrice:env.STARTER_PRICE_ID,proPrice:env.PRO_PRICE_ID}:{})});
  if(u.pathname==='/api/license'&&request.method==='POST') {
    if(!ready(env))return json(503,{error:'BILLING_NOT_CONFIGURED'});
    if(request.headers.get('origin')!==u.origin)return json(403,{error:'ORIGIN_DENIED'});
    if(Number(request.headers.get('content-length')??0)>1024)return json(413,{error:'BODY_TOO_LARGE'});
    const raw=await request.text();if(enc.encode(raw).length>1024)return json(413,{error:'BODY_TOO_LARGE'});
    let b;try{b=JSON.parse(raw);}catch{return json(400,{error:'INVALID_JSON'});}
    if(!/^[a-f0-9]{64}$/.test(b.install??''))return json(400,{error:'INSTALL_INVALID'});
    const row=await env.DB.prepare('SELECT license FROM licenses WHERE install = ?').bind(b.install).first();
    return row?json(200,{license:row.license}):json(404,{error:'LICENSE_NOT_READY'});
  }
  if(u.pathname==='/paddle'&&request.method==='POST') {
    if(!env.PADDLE_WEBHOOK_SECRET||!env.DB||!env.SIGNING_PRIVATE_KEY)return json(503,{error:'BILLING_NOT_CONFIGURED'});
    // Sandbox can only issue in an explicitly separate sandbox environment/key/DB.
    if(!['live','sandbox'].includes(env.PADDLE_ENV))return json(503,{error:'PADDLE_ENV_REQUIRED'});
    if(Number(request.headers.get('content-length')??0)>1048576)return json(413,{error:'BODY_TOO_LARGE'});
    const reader=request.body?.getReader();let raw='';let size=0;const decoder=new TextDecoder();
    if(reader)for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1048576){await reader.cancel();return json(413,{error:'BODY_TOO_LARGE'});}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();
    if(!await validSignature(raw,request.headers.get('paddle-signature'),env.PADDLE_WEBHOOK_SECRET,now))return json(401,{error:'INVALID_SIGNATURE'});
    let e;try{e=JSON.parse(raw);}catch{return json(400,{error:'INVALID_JSON'});}
    if(typeof e.event_id!=='string'||typeof e.event_type!=='string')return json(400,{error:'INVALID_EVENT'});
    if(e.event_type!=='transaction.completed')return json(200,{ok:true,ignored:true});
    const d=e.data;
    // Only a catalog-matched paid recurring item issues a license; custom_data cannot select a plan.
    const items=d?.items??[];
    const matched=items.filter(x=>[env.STARTER_PRICE_ID,env.PRO_PRICE_ID].filter(Boolean).includes(x.price?.id));
    if(matched.length!==1)return json(200,{ok:true,ignored:true});
    if(d.status!=='completed'||!d.subscription_id||!d.billing_period?.ends_at)return json(400,{error:'NOT_A_PAID_SUBSCRIPTION'});
    const install=d.custom_data?.seo_install;
    if(d.custom_data?.app!=='seo-data-mcp'||!/^[a-f0-9]{64}$/.test(install??''))return json(400,{error:'INSTALL_MISSING'});
    const expiry=Date.parse(d.billing_period.ends_at);const occurred=Date.parse(e.occurred_at);
    if(!Number.isFinite(expiry)||expiry<=now||expiry>now+370*86400000||!Number.isFinite(occurred))return json(400,{error:'BILLING_PERIOD_INVALID'});
    if(await env.DB.prepare('SELECT id FROM events WHERE id = ?').bind(e.event_id).first())return json(200,{ok:true,duplicate:true});
    const license=await issue(env.SIGNING_PRIVATE_KEY,{v:1,prod:'seo-data-mcp',plan:matched[0].price.id===env.PRO_PRICE_ID?'pro':'starter',iat:now,exp:expiry,kid:d.subscription_id});
    await env.DB.batch([
      env.DB.prepare('INSERT INTO licenses (install, license, occurred) VALUES (?, ?, ?) ON CONFLICT(install) DO UPDATE SET license=excluded.license, occurred=excluded.occurred WHERE excluded.occurred > licenses.occurred').bind(install,license,occurred),
      env.DB.prepare('INSERT OR IGNORE INTO events (id) VALUES (?)').bind(e.event_id)
    ]);
    return json(200,{ok:true});
  }
  if(u.pathname.startsWith('/api/')||u.pathname==='/paddle')return json(404,{error:'NOT_FOUND'});
  return env.ASSETS.fetch(request);
}
export default {fetch(request,env){return handle(request,env);}};
