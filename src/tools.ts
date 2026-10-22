import {z} from 'zod';
import {Network,post} from './network.js';
import {GoogleAuth} from './auth.js';
import {licensePlan} from './license.js';
import {Quota} from './quota.js';
const https=z.string().url().refine(x=>{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port;},'Use an HTTPS URL without credentials or a port');
const site=z.string().min(1).max(2048).refine(x=>/^sc-domain:[a-z0-9.-]+$/i.test(x)||https.safeParse(x).success,'Use sc-domain:example.com or an HTTPS property URL');
const date=z.iso.date();
export const schemas={
  gsc_query:z.object({site,startDate:date,endDate:date,dimensions:z.array(z.enum(['query','page','country','device','date','searchAppearance'])).max(6).default(['query']),rowLimit:z.number().int().min(1).max(25000).default(100),startRow:z.number().int().min(0).max(10000000).default(0)}).strict().refine(x=>x.startDate<=x.endDate,'startDate must precede endDate'),
  gsc_sitemaps:z.object({site}).strict(),
  gsc_inspect:z.object({site,url:https}).strict(),
  bing_query_stats:z.object({site:https}).strict(),
  bing_crawl_issues:z.object({site:https}).strict(),
  indexnow_submit:z.object({host:z.string().regex(/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i),urls:z.array(https).min(1).max(10000),keyLocation:https.optional(),confirm:z.literal(true)}).strict(),
  pagespeed:z.object({url:https,strategy:z.enum(['mobile','desktop']).default('mobile')}).strict(),
  crux:z.object({origin:https,formFactor:z.enum(['PHONE','DESKTOP','TABLET']).default('PHONE')}).strict()
};
export type ToolName=keyof typeof schemas;
export const descriptions:Record<ToolName,string>={gsc_query:'Read Search Console search performance. Paginate using startRow. Free tier.',gsc_sitemaps:'List Search Console sitemaps. Free tier.',gsc_inspect:'Read Google indexed URL inspection; does not request indexing. Paid.',bing_query_stats:'Read Bing Webmaster query statistics for a verified site. Paid.',bing_crawl_issues:'Read Bing Webmaster crawl issues for a verified site. Paid.',indexnow_submit:'WRITE: submit URLs to IndexNow, requires explicit confirm:true and a hosted verification key. Paid.',pagespeed:'PageSpeed Lighthouse score and selected audits. Free tier.',crux:'Chrome UX Report 28-day field metrics; low-traffic sites may have no record. Paid.'};
export interface Config {credentials?:string;bingKey?:string;indexnowKey?:string;googleApiKey?:string;license?:string;stateDir:string;publicKey?:string}
export class Tools {
  private auth:GoogleAuth; private quota:Quota;
  constructor(readonly config:Config,readonly net=new Network()) {this.auth=new GoogleAuth(net,config.credentials);this.quota=new Quota(config.stateDir);}
  async call(name:ToolName,args:unknown):Promise<any> {
    if(!Object.hasOwn(schemas,name)) throw new Error('UNKNOWN_TOOL');
    const parsed=schemas[name].safeParse(args);
    if(!parsed.success) throw new Error('INVALID_ARGUMENTS: '+parsed.error.issues.map(x=>x.message).join('; '));
    const a:any=parsed.data;
    if(name==='indexnow_submit') {
      if(a.urls.some((x:string)=>new URL(x).hostname!==a.host)|| (a.keyLocation&&new URL(a.keyLocation).hostname!==a.host)) throw new Error('INDEXNOW_HOST_MISMATCH');
    }
    if(name==='crux' && new URL(a.origin).origin!==a.origin.replace(/\/$/,'')) throw new Error('CRUX_ORIGIN_REQUIRED');
    await this.quota.take(licensePlan(this.config.license,this.config.publicKey),name);
    if(name.startsWith('gsc_')) {
      const token=await this.auth.token();
      if(name==='gsc_inspect') return this.net.json('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',post({siteUrl:a.site,inspectionUrl:a.url},token));
      const base=`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(a.site)}`;
      if(name==='gsc_sitemaps') return this.net.json(`${base}/sitemaps`,{headers:{authorization:`Bearer ${token}`}});
      const {site:_,...query}=a;
      return this.net.json(`${base}/searchAnalytics/query`,post(query,token));
    }
    if(name.startsWith('bing_')) {
      if(!this.config.bingKey) throw new Error('BING_API_KEY_MISSING');
      const u=new URL(`https://ssl.bing.com/webmaster/api.svc/json/${name==='bing_query_stats'?'GetQueryStats':'GetCrawlIssues'}`);
      u.search=new URLSearchParams({siteUrl:a.site,apikey:this.config.bingKey}).toString();
      return this.net.json(u.href);
    }
    if(name==='indexnow_submit') {
      const key=this.config.indexnowKey;
      if(!key || !/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw new Error('INDEXNOW_KEY_MISSING_OR_INVALID');
      return this.net.json('https://api.indexnow.org/indexnow',post({host:a.host,key,urlList:a.urls,...(a.keyLocation?{keyLocation:a.keyLocation}:{})}));
    }
    if(name==='crux') {
      if(!this.config.googleApiKey) throw new Error('GOOGLE_API_KEY_MISSING');
      return this.net.json(`https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${encodeURIComponent(this.config.googleApiKey)}`,post(a));
    }
    const u=new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    u.search=new URLSearchParams({url:a.url,strategy:a.strategy,category:'performance',...(this.config.googleApiKey?{key:this.config.googleApiKey}:{})}).toString();
    const r=await this.net.json(u.href);
    const l=r.lighthouseResult;
    return {url:a.url,strategy:a.strategy,score:l?.categories?.performance?.score,fetchTime:l?.fetchTime,metrics:Object.fromEntries(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index'].map(k=>[k,l?.audits?.[k]?.displayValue??null])),fieldData:r.loadingExperience??null};
  }
}
