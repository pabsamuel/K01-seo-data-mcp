import {Tools} from '../dist/tools.js';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const env=process.env;
const dir=await mkdtemp(join(tmpdir(),'seo-live-'));
const tools=new Tools({stateDir:dir,credentials:env.GOOGLE_APPLICATION_CREDENTIALS,bingKey:env.BING_API_KEY,indexnowKey:env.INDEXNOW_KEY,googleApiKey:env.GOOGLE_API_KEY,license:env.SEO_MCP_LICENSE});
const base={site:'sc-domain:atesensoftware.com'};
const end=new Date(Date.now()-3*86400000).toISOString().slice(0,10);
const start=new Date(Date.now()-31*86400000).toISOString().slice(0,10);
const probes={gsc_query:{...base,startDate:start,endDate:end},gsc_sitemaps:base,gsc_inspect:{...base,url:'https://atesensoftware.com/'},bing_query_stats:{site:'https://atesensoftware.com/'},bing_crawl_issues:{site:'https://atesensoftware.com/'},pagespeed:{url:'https://atesensoftware.com/'},crux:{origin:'https://atesensoftware.com'},indexnow_submit:{host:'atesensoftware.com',urls:['https://atesensoftware.com/'],confirm:true}};
const report=[];
try {
  for(const [name,args] of Object.entries(probes)) {
    let error;
    if(name.startsWith('gsc_')&&!env.GOOGLE_APPLICATION_CREDENTIALS)error='GOOGLE_CREDENTIALS_MISSING';
    else if(name.startsWith('bing_')&&!env.BING_API_KEY)error='BING_API_KEY_MISSING';
    else if(name==='crux'&&!env.GOOGLE_API_KEY)error='GOOGLE_API_KEY_MISSING';
    else if(name==='indexnow_submit'&&!env.INDEXNOW_KEY)error='INDEXNOW_KEY_MISSING_OR_INVALID';
    else if(!['gsc_query','gsc_sitemaps','pagespeed'].includes(name)&&!env.SEO_MCP_LICENSE)error='PAID_LICENSE_REQUIRED';
    if(error){report.push({name,status:'blocked',error});continue;}
    try {const r=await tools.call(name,args);report.push({name,status:'pass',responseKeys:Object.keys(r)});}catch(e){report.push({name,status:'failed',error:e.message});}
  }
  await mkdir('evidence',{recursive:true});
  await writeFile('evidence/live.json',JSON.stringify({date:new Date().toISOString(),report,network:tools.net.trace},null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}finally{await rm(dir,{recursive:true,force:true});}
if(report.some(r=>r.status!=='pass'))process.exitCode=1;
