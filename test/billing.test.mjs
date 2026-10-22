import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {generateKeyPairSync,createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {handle,issue,ready} from '../billing/worker.mjs';
import {licensePlan} from '../dist/license.js';
const pair=generateKeyPairSync('ed25519');
const privatePem=pair.privateKey.export({type:'pkcs8',format:'pem'});
const publicPem=pair.publicKey.export({type:'spki',format:'pem'});
const install='f'.repeat(64),now=Date.now();
function world(t) {
  const db=new DatabaseSync(':memory:');db.exec(readFileSync('billing/migrations/0001.sql','utf8'));t.after(()=>db.close());
  const prepare=sql=>({bind(...args){const stmt=db.prepare(sql);return {first:async()=>stmt.get(...args)??null,run:async()=>stmt.run(...args)};}});
  return {DB:{prepare,batch:async stmts=>{db.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}}},SIGNING_PRIVATE_KEY:privatePem,PADDLE_WEBHOOK_SECRET:'fixture-secret',STARTER_PRICE_ID:'pri_starter',PRO_PRICE_ID:'pri_pro',PADDLE_ENV:'sandbox',ISSUANCE_ENABLED:'true',CLIENT_TOKEN:'test_fixture'};
}
function event(plan='pro',extra={}) {return {event_id:'evt_1',event_type:'transaction.completed',occurred_at:new Date(now).toISOString(),data:{status:'completed',subscription_id:'sub_fixture',billing_period:{ends_at:new Date(now+30*86400000).toISOString()},custom_data:{seo_install:install,app:'seo-data-mcp'},items:[{price:{id:'pri_'+plan}}],...extra}};}
function request(e,secret='fixture-secret',ts=Math.floor(now/1000)) {const raw=JSON.stringify(e);const h=createHmac('sha256',secret).update(`${ts}:${raw}`).digest('hex');return new Request('https://billing.example/paddle',{method:'POST',headers:{'paddle-signature':`ts=${ts};h1=${h}`},body:raw});}
for(const plan of ['starter','pro'])test(`signed sandbox Paddle event issues offline ${plan} license; idempotent`,async t=>{const env=world(t);const e=event(plan);assert.equal((await handle(request(e),env,now)).status,200);const row=await env.DB.prepare('SELECT license FROM licenses WHERE install = ?').bind(install).first();assert.equal(licensePlan(row.license,publicPem,now),plan);assert.equal((await (await handle(request(e),env,now)).json()).duplicate,true);});
test('reject invalid/stale webhook signatures',async t=>{const env=world(t);assert.equal((await handle(request(event(),'bad'),env,now)).status,401);assert.equal((await handle(request(event(),'fixture-secret',1),env,now)).status,401);});
test('custom_data cannot select paid tier; unrecognized catalog ignored',async t=>{const env=world(t);const e=event('pro',{items:[{price:{id:'pri_unknown'}}]});const r=await handle(request(e),env,now);assert.equal((await r.json()).ignored,true);assert.equal(await env.DB.prepare('SELECT license FROM licenses WHERE install = ?').bind(install).first(),null);});
test('expiry and install are mandatory',async t=>{const env=world(t);for(const extra of [{billing_period:{}},{custom_data:{app:'seo-data-mcp',seo_install:'guess'}},{status:'draft'},{subscription_id:null}])assert.equal((await handle(request(event('pro',extra)),env,now)).status,400);});
test('older paid event does not overwrite newer license',async t=>{const env=world(t);await handle(request(event('pro')),env,now);const older=event('starter');older.event_id='evt_old';older.occurred_at=new Date(now-10000).toISOString();await handle(request(older),env,now);const row=await env.DB.prepare('SELECT license FROM licenses WHERE install = ?').bind(install).first();assert.equal(licensePlan(row.license,publicPem,now),'pro');});
test('production preview exposes no payment identifiers; sandbox cannot open checkout',async t=>{const env=world(t);assert.equal(ready(env),false);const r=await (await handle(new Request('https://billing.example/api/config'),env)).json();assert.equal(r.mode,'preview');assert.equal(r.clientToken,undefined);assert.equal((await handle(new Request('https://billing.example/api/license',{method:'POST'}),env)).status,503);});
test('live webhook cannot issue a license while issuance is disabled, even with a valid paid signature',async t=>{const env=world(t);env.PADDLE_ENV='live';env.CLIENT_TOKEN='live_fixture';env.ISSUANCE_ENABLED='false';const r=await handle(request(event()),env,now);assert.equal(r.status,503);assert.equal((await r.json()).error,'ISSUANCE_DISABLED');assert.equal(await env.DB.prepare('SELECT license FROM licenses WHERE install = ?').bind(install).first(),null);});
test('live redemption requires origin and 256-bit capability',async t=>{const env=world(t);env.PADDLE_ENV='live';env.CLIENT_TOKEN='live_fixture';await handle(request(event()),env,now);const req=(body,origin)=>new Request('https://billing.example/api/license',{method:'POST',headers:{origin},body:JSON.stringify(body)});assert.equal((await handle(req({install},'https://other.example'),env)).status,403);assert.equal((await handle(req({install:'guess'},'https://billing.example'),env)).status,400);const r=await (await handle(req({install},'https://billing.example'),env)).json();assert.equal(licensePlan(r.license,publicPem,now),'pro');});
