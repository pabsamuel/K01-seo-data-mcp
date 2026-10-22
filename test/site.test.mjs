import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../billing/worker.mjs';
test('production Worker ignores execution context as clock argument',async()=>{const r=await worker.fetch(new Request('https://example.com/healthz'),{}, {waitUntil(){}});assert.equal((await r.json()).mode,'preview');});
test('six published pages have responsive viewport, language, working local CSS',async()=>{for(const name of ['','docs','support','privacy','eula','refunds']){const html=await readFile('site/'+(name?name+'/':'')+'index.html','utf8');assert.match(html,/<html lang="en">/);assert.match(html,/width=device-width/);assert.match(html,/href="\/style.css"/);assert.match(html,/<h1>/);}const home=await readFile('site/index.html','utf8');assert.match(home,/npm package is not yet published/);assert.match(home,/data-plan="starter" hidden/);assert.match(home,/data-plan="pro" hidden/);});
