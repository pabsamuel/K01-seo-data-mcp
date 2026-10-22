#!/usr/bin/env node
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {Tools,schemas,descriptions,type ToolName} from './tools.js';
import {readFile} from 'node:fs/promises';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
if(process.argv.includes('--help')) {
  console.log('seo-data-mcp: local stdio MCP. Env: GOOGLE_APPLICATION_CREDENTIALS (service_account or authorized_user JSON), BING_API_KEY, INDEXNOW_KEY, GOOGLE_API_KEY, SEO_MCP_LICENSE or SEO_MCP_LICENSE_FILE, SEO_MCP_STATE_DIR. See https://seo-data.atesensoftware.com/docs/');
} else {
  const env=process.env;
  let license=env.SEO_MCP_LICENSE;
  if(env.SEO_MCP_LICENSE_FILE) {try {license=(await readFile(env.SEO_MCP_LICENSE_FILE,'utf8')).trim();}catch{console.error('LICENSE_FILE_UNREADABLE');process.exit(1);}}
  const tools=new Tools({credentials:env.GOOGLE_APPLICATION_CREDENTIALS,bingKey:env.BING_API_KEY,indexnowKey:env.INDEXNOW_KEY,googleApiKey:env.GOOGLE_API_KEY,license,stateDir:env.SEO_MCP_STATE_DIR??join(homedir(),'.seo-data-mcp')});
  const server=new McpServer({name:'seo-data-mcp',version:'0.1.0'});
  for(const name of Object.keys(schemas) as ToolName[]) {
    server.registerTool(name,{description:descriptions[name],inputSchema:schemas[name],annotations:{readOnlyHint:name!=='indexnow_submit',destructiveHint:false,idempotentHint:name!=='indexnow_submit',openWorldHint:true}},async (args:unknown):Promise<CallToolResult>=>{
      try {return {content:[{type:'text',text:JSON.stringify(await tools.call(name,args))}]};}
      catch(e) {return {isError:true,content:[{type:'text',text:e instanceof Error?e.message:'TOOL_FAILED'}]};}
    });
  }
  await server.connect(new StdioServerTransport());
}
