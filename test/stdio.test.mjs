import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('real stdio MCP initialize, list eight tools, call error without stdout corruption',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'seo-stdio-'));
  const transport=new StdioClientTransport({command:process.execPath,args:['dist/cli.js'],env:{PATH:process.env.PATH,SEO_MCP_STATE_DIR:dir},stderr:'pipe'});
  const client=new Client({name:'acceptance-test',version:'1.0.0'});
  try {await client.connect(transport);const result=await client.listTools();assert.equal(result.tools.length,8);const write=result.tools.find(t=>t.name==='indexnow_submit');assert.equal(write.annotations.readOnlyHint,false);const r=await client.callTool({name:'gsc_sitemaps',arguments:{site:'sc-domain:atesensoftware.com'}});assert.equal(r.isError,true);assert.match(r.content[0].text,/GOOGLE_CREDENTIALS_MISSING/);}finally{await client.close();await rm(dir,{recursive:true,force:true});}
});
