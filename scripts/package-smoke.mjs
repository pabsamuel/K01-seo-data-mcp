import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import assert from 'node:assert/strict';
const cwd=await mkdtemp(join(tmpdir(),'seo-packed-'));
const npm=join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
const tgz=resolve('artifacts/pabsamuel-seo-data-mcp-0.1.0.tgz');
const client=new Client({name:'packed-npx-smoke',version:'1.0.0'});
const env=Object.fromEntries(['PATH','Path','SystemRoot','COMSPEC','TEMP','TMP','LOCALAPPDATA','APPDATA','USERPROFILE'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));env.SEO_MCP_STATE_DIR=join(cwd,'state');
const transport=new StdioClientTransport({command:process.execPath,args:[npm,'exec','--yes','--package',tgz,'--','seo-data-mcp'],cwd,env,stderr:'pipe'});
try {await client.connect(transport);const list=await client.listTools();assert.equal(list.tools.length,8);const result=await client.callTool({name:'gsc_sitemaps',arguments:{site:'sc-domain:atesensoftware.com'}});assert.equal(result.isError,true);assert.match(result.content[0].text,/GOOGLE_CREDENTIALS_MISSING/);await mkdir('evidence',{recursive:true});await writeFile('evidence/package-smoke.json',JSON.stringify({date:new Date().toISOString(),package:'pabsamuel-seo-data-mcp-0.1.0.tgz',launch:'npm exec (npx equivalent) from clean temporary cwd',initialize:'pass',toolCount:list.tools.length,call:'pass; expected missing-credentials error'},null,2)+'\n');console.log('PACKED_NPX_SMOKE_PASS: initialized, 8 tools, expected sanitized call error.');}finally{await client.close();await rm(cwd,{recursive:true,force:true});}
