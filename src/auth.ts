import {readFile} from 'node:fs/promises';
import {createSign} from 'node:crypto';
import {Network,post} from './network.js';
export class GoogleAuth {
  private cached?: {token:string; until:number};
  constructor(private readonly net:Network, private readonly file?:string) {}
  async token(): Promise<string> {
    if (this.cached && this.cached.until > Date.now()+60000) return this.cached.token;
    if (!this.file) throw new Error('GOOGLE_CREDENTIALS_MISSING');
    let c:any;
    try {c=JSON.parse(await readFile(this.file,'utf8'));} catch {throw new Error('GOOGLE_CREDENTIALS_FILE_INVALID');}
    let body: URLSearchParams;
    if (c.type === 'service_account' && c.client_email && c.private_key) {
      const now=Math.floor(Date.now()/1000);
      const encode=(x:unknown)=>Buffer.from(JSON.stringify(x)).toString('base64url');
      const input=`${encode({alg:'RS256',typ:'JWT'})}.${encode({iss:c.client_email,scope:'https://www.googleapis.com/auth/webmasters.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600})}`;
      let sig:string;
      try {sig=createSign('RSA-SHA256').update(input).sign(c.private_key,'base64url');} catch {throw new Error('GOOGLE_PRIVATE_KEY_INVALID');}
      body=new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${input}.${sig}`});
    } else if (c.type==='authorized_user' && c.client_id && c.client_secret && c.refresh_token) {
      body=new URLSearchParams({grant_type:'refresh_token',client_id:c.client_id,client_secret:c.client_secret,refresh_token:c.refresh_token});
    } else throw new Error('GOOGLE_CREDENTIALS_TYPE_INVALID');
    const r=await this.net.json('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:body.toString()});
    if(typeof r.access_token!=='string' || !Number.isFinite(Number(r.expires_in))) throw new Error('GOOGLE_TOKEN_RESPONSE_INVALID');
    this.cached={token:r.access_token,until:Date.now()+Number(r.expires_in)*1000};
    return r.access_token;
  }
}
