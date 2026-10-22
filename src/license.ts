import {verify} from 'node:crypto';
// Production public key only. Private key stays in the billing service's secret store.
export const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA6nU31EUR33/obVDTgioBriT6j+DjghMHLe93YECANPY=
-----END PUBLIC KEY-----`;
export type Plan = 'free'|'starter'|'pro';
export function licensePlan(key:string|undefined, publicKey=PUBLIC_KEY, now=Date.now()):Plan {
  if (!key) return 'free';
  try {
    if(key.length>4096) throw 0;
    const [prefix,body,sig,...rest]=key.split('.');
    if(prefix!=='SEO1' || rest.length || !body || !sig || !/^[\w-]+$/.test(body) || !/^[\w-]{86}$/.test(sig)) throw 0;
    if(!verify(null,Buffer.from(`${prefix}.${body}`),publicKey,Buffer.from(sig,'base64url'))) throw 0;
    const p=JSON.parse(Buffer.from(body,'base64url').toString());
    if(p.v!==1 || p.prod!=='seo-data-mcp' || !['starter','pro'].includes(p.plan) || !Number.isSafeInteger(p.exp) || !Number.isSafeInteger(p.iat) || p.iat>now+300000 || p.exp<=now || p.exp<=p.iat || p.exp-p.iat>370*86400000 || typeof p.kid!=='string') throw 0;
    return p.plan;
  } catch {throw new Error('LICENSE_INVALID_OR_EXPIRED');}
}
