import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../billing/worker.mjs';
test('production Worker ignores execution context as clock argument',async()=>{const r=await worker.fetch(new Request('https://example.com/healthz'),{}, {waitUntil(){}});assert.equal((await r.json()).mode,'preview');});
test('six published pages have responsive viewport, language, working local CSS',async()=>{for(const name of ['','docs','support','privacy','eula','refunds']){const html=await readFile('site/'+(name?name+'/':'')+'index.html','utf8');assert.match(html,/<html lang="en">/);assert.match(html,/width=device-width/);assert.match(html,/href="\/style.css"/);assert.match(html,/<h1>/);}const home=await readFile('site/index.html','utf8');assert.match(home,/npm package is not yet published/);assert.match(home,/data-plan="starter" hidden/);assert.match(home,/data-plan="pro" hidden/);});

test('support page title and description answer the provider-error question first (20 Nov 2026)',async()=>{const html=await readFile('site/support/index.html','utf8');const title=/<title>([^<]*)<\/title>/.exec(html)[1];const desc=/<meta name="description" content="([^"]*)"/.exec(html)[1];assert.match(title,/^SEO Data MCP help/);assert.ok(title.length<=60);assert.ok(desc.length<=155);assert.match(desc,/SEO Data MCP/);assert.match(html,/<h1>Get setup help\.<\/h1><p>Provider error in <a href="\/">SEO Data MCP<\/a>\?/);});
