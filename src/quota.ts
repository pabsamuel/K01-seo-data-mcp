import {mkdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import {join} from 'node:path';
import type {Plan} from './license.js';
export const FREE_TOOLS = new Set(['gsc_query','gsc_sitemaps','pagespeed']);
export class Quota {
  constructor(private readonly dir:string) {}
  async take(plan:Plan,tool:string,now=Date.now()) {
    if(plan==='free' && !FREE_TOOLS.has(tool)) throw new Error('PAID_LICENSE_REQUIRED');
    await mkdir(this.dir,{recursive:true,mode:0o700});
    const lock=join(this.dir,'usage.lock');
    try {await mkdir(lock);} catch {throw new Error('USAGE_LOCKED: another process is writing; after a crash remove usage.lock only when all MCP processes are stopped');}
    try {
      const file=join(this.dir,'usage.json');
      let old={day:'',count:0,last:0};
      try {old=JSON.parse(await readFile(file,'utf8'));} catch(e:any) {if(e.code!=='ENOENT') throw new Error('USAGE_FILE_INVALID');}
      if(typeof old.day!=='string' || !Number.isSafeInteger(old.count) || old.count<0 || !Number.isFinite(old.last)) throw new Error('USAGE_FILE_INVALID');
      if(now<old.last-300000) throw new Error('CLOCK_ROLLBACK_DETECTED');
      const day=new Date(now).toISOString().slice(0,10);
      const count=old.day===day ? old.count : 0;
      const limit=plan==='free'?20:plan==='starter'?1000:5000;
      if(count>=limit) throw new Error(`DAILY_LIMIT quota reset=${new Date(Date.parse(day)+86400000).toISOString()}`);
      await writeFile(file+'.tmp',JSON.stringify({day,count:count+1,last:now}),{mode:0o600});
      await rename(file+'.tmp',file);
    } finally {await rm(lock,{recursive:true});}
  }
}
