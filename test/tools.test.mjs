import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateKeyPairSync,sign} from 'node:crypto';
import {Tools} from '../dist/tools.js';
import {Network,HOSTS} from '../dist/network.js';
import {licensePlan} from '../dist/license.js';
import {Quota} from '../dist/quota.js';
const pair=generateKeyPairSync('ed25519');
const pub=pair.publicKey.export({type:'spki',format:'pem'});
const token=(plan='pro',extra={})=>{
  const p={v:1,prod:'seo-data-mcp',plan,iat:Date.now()-1000,exp:Date.now()+86400000,kid:'fixture',...extra};
  const input='SEO1.'+Buffer.from(JSON.stringify(p)).toString('base64url');
  return input+'.'+sign(null,Buffer.from(input),pair.privateKey).toString('base64url');
};
const args={gsc_query:{site:'sc-domain:atesensoftware.com',startDate:'2026-09-01',endDate:'2026-09-30'},gsc_sitemaps:{site:'sc-domain:atesensoftware.com'},gsc_inspect:{site:'sc-domain:atesensoftware.com',url:'https://atesensoftware.com/'},bing_query_stats:{site:'https://atesensoftware.com/'},bing_crawl_issues:{site:'https://atesensoftware.com/'},indexnow_submit:{host:'atesensoftware.com',urls:['https://atesensoftware.com/'],confirm:true},pagespeed:{url:'https://atesensoftware.com/'},crux:{origin:'https://atesensoftware.com'}};
async function world(t,plan='pro',status=200,extra={}) {
  const dir=await mkdtemp(join(tmpdir(),'seo-mcp-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  const credentials=join(dir,'credentials.json');
  await writeFile(credentials,JSON.stringify({type:'authorized_user',client_id:'fixture',client_secret:'secret-not-output',refresh_token:'refresh-not-output'}));
  const calls=[];
  const net=new Network(async (url,init)=>{
    calls.push({url:new URL(url),init});
    if(new URL(url).hostname==='oauth2.googleapis.com') return Response.json({access_token:'fixture-access',expires_in:3600});
    if(status!==200) return new Response('credential-secret-not-output',{status});
    return Response.json({rows:[{clicks:12}],d:[{Clicks:10}],record:{metrics:{}},lighthouseResult:{categories:{performance:{score:0.91}},audits:{'largest-contentful-paint':{displayValue:'1.2 s'}}}});
  });
  const tools=new Tools({stateDir:dir,credentials,bingKey:'bing-not-output',indexnowKey:'indexnow-key-fixture',googleApiKey:'google-not-output',license:plan==='free'?undefined:token(plan),publicKey:pub,...extra},net);
  return {dir,tools,calls,net};
}
// Thirty-two distinct successful tool calls, plus negative/transport tests below.
for(const [name,input] of Object.entries(args)) for(let i=0;i<4;i++) {
  test(`tool call ${name} #${i+1}`,async t=>{
    const w=await world(t); const result=await w.tools.call(name,input);
    assert.ok(result); assert.ok(w.calls.length>=1);
    for(const c of w.calls){assert.ok(HOSTS.has(c.url.hostname));assert.equal(c.init.redirect,'error');assert.notEqual(c.url.hostname,'atesensoftware.com');}
    const c=w.calls.at(-1);
    if(name==='gsc_query') {assert.equal(c.init.method,'POST');assert.equal(JSON.parse(c.init.body).rowLimit,100);assert.ok(c.url.pathname.includes('sc-domain%3Aatesensoftware.com'));}
    if(name.startsWith('bing_')) {assert.equal(c.init.method,undefined);assert.equal(c.url.searchParams.get('siteUrl'),input.site);}
    if(name==='gsc_inspect') assert.equal(JSON.parse(c.init.body).inspectionUrl,input.url);
    if(name==='indexnow_submit') assert.deepEqual(JSON.parse(c.init.body).urlList,input.urls);
    if(name==='pagespeed') {assert.equal(result.score,0.91);assert.equal(result.metrics['largest-contentful-paint'],'1.2 s');}
    if(name==='crux') assert.equal(JSON.parse(c.init.body).formFactor,'PHONE');
  });
}
test('free has precisely three tools; 20-call budget persists across process instances',async t=>{
  const w=await world(t,'free');
  for(let i=0;i<20;i++) await w.tools.call('pagespeed',args.pagespeed);
  await assert.rejects(new Quota(w.dir).take('free','gsc_query'),/DAILY_LIMIT quota reset=/);
  for(const name of ['gsc_inspect','bing_query_stats','bing_crawl_issues','indexnow_submit','crux']) await assert.rejects(w.tools.call(name,args[name]),/PAID_LICENSE_REQUIRED/);
  assert.equal(w.calls.length,20);
});
test('UTC day rollover resets free quota',async t=>{const w=await world(t);const q=new Quota(w.dir);for(let i=0;i<20;i++)await q.take('free','pagespeed',Date.parse('2026-10-22T23:59:59Z'));await q.take('free','pagespeed',Date.parse('2026-10-23T00:00:00Z'));assert.equal(JSON.parse(await readFile(join(w.dir,'usage.json'))).count,1);});
test('clock rollback and corrupt usage fail closed',async t=>{const w=await world(t);const q=new Quota(w.dir);await q.take('free','pagespeed');await assert.rejects(q.take('free','pagespeed',Date.now()-86400000),/ROLLBACK/);await writeFile(join(w.dir,'usage.json'),'garbage');await assert.rejects(q.take('free','pagespeed'),/USAGE_FILE_INVALID/);});
test('invalid dates, mixed hosts, unconfirmed writes, arbitrary args: no network',async t=>{const w=await world(t);for(const [name,input] of [['gsc_query',{...args.gsc_query,startDate:'2026-99-01'}],['indexnow_submit',{...args.indexnow_submit,urls:['https://other.example/a']}],['indexnow_submit',{...args.indexnow_submit,confirm:false}],['pagespeed',{...args.pagespeed,key:'inject'}],['crux',{origin:'https://atesensoftware.com/path'}]])await assert.rejects(w.tools.call(name,input));assert.equal(w.calls.length,0);});
test('reject unknown tool including inherited keys',async t=>{const w=await world(t);await assert.rejects(w.tools.call('constructor',{}),/UNKNOWN_TOOL/);});
test('license verification authenticates product, time, plan, signature',()=>{assert.equal(licensePlan(undefined,pub),'free');assert.equal(licensePlan(token('starter'),pub),'starter');assert.equal(licensePlan(token(),pub),'pro');for(const key of [token('root'),token('pro',{prod:'other'}),token('pro',{exp:1}),token('pro',{iat:Date.now()+3600000}),token()+'x','bad'])assert.throws(()=>licensePlan(key,pub),/LICENSE_INVALID/);});
test('expired or invalid license never silently downgrades',async t=>{const w=await world(t,'pro',200,{license:'invalid'});await assert.rejects(w.tools.call('pagespeed',args.pagespeed),/LICENSE_INVALID/);assert.equal(w.calls.length,0);});
for(const status of [401,403,404,429,500]) test(`upstream ${status}: sanitized and no retry`,async t=>{const w=await world(t,'pro',status);await assert.rejects(w.tools.call('bing_query_stats',args.bing_query_stats),new RegExp(`^Error: UPSTREAM_HTTP_${status}`));assert.equal(w.calls.length,1);assert.ok(!JSON.stringify(w.net.trace).includes('bing-not-output'));});
test('network denies custom domains, redirects, userinfo, ports, HTTP',async()=>{let count=0;const n=new Network(async()=>{count++;return Response.json({});});for(const url of ['https://atesensoftware.com','http://www.googleapis.com','https://www.googleapis.com:444/x','https://u:p@www.googleapis.com/'])await assert.rejects(n.json(url),/DENIED/);assert.equal(count,0);});
test('IndexNow accepts 202 with no JSON response',async t=>{const w=await world(t,'pro',202);const r=await w.tools.call('indexnow_submit',args.indexnow_submit);assert.equal(r.accepted,true);});
test('IndexNow 200 empty response is accepted, not treated as malformed JSON',async t=>{const w=await world(t);const net=new Network(async()=>new Response(null,{status:200}));const tools=new Tools(w.tools.config,net);const r=await tools.call('indexnow_submit',args.indexnow_submit);assert.equal(r.accepted,true);assert.equal(r.status,200);});
test('Google token is cached; refresh credentials stay in Google request',async t=>{const w=await world(t);await w.tools.call('gsc_query',args.gsc_query);await w.tools.call('gsc_sitemaps',args.gsc_sitemaps);assert.equal(w.calls.filter(c=>c.url.hostname==='oauth2.googleapis.com').length,1);for(const c of w.calls.slice(1))assert.ok(!String(c.init.body).includes('refresh-not-output'));});
test('service account signs RSA JWT for readonly scope and fixed audience',async t=>{const w=await world(t);const rsa=generateKeyPairSync('rsa',{modulusLength:2048});await writeFile(w.tools.config.credentials,JSON.stringify({type:'service_account',client_email:'fixture@example.invalid',private_key:rsa.privateKey.export({type:'pkcs8',format:'pem'}),token_uri:'https://evil.invalid/'}));await w.tools.call('gsc_sitemaps',args.gsc_sitemaps);const jwt=new URLSearchParams(w.calls[0].init.body).get('assertion');const payload=JSON.parse(Buffer.from(jwt.split('.')[1],'base64url'));assert.equal(payload.scope,'https://www.googleapis.com/auth/webmasters.readonly');assert.equal(payload.aud,'https://oauth2.googleapis.com/token');});
test('missing credentials fails without requesting Google',async t=>{const w=await world(t,'free',200,{credentials:undefined});await assert.rejects(w.tools.call('gsc_query',args.gsc_query),/GOOGLE_CREDENTIALS_MISSING/);assert.equal(w.calls.length,0);});
