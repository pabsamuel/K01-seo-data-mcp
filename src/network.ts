export const HOSTS = new Set(['oauth2.googleapis.com','www.googleapis.com','searchconsole.googleapis.com','ssl.bing.com','api.indexnow.org','chromeuxreport.googleapis.com']);
export type Fetcher = typeof fetch;
export class Network {
  readonly trace: {host: string; path: string; status: number}[] = [];
  constructor(private readonly transport: Fetcher = fetch) {}
  async json(url: string, init: RequestInit = {}): Promise<any> {
    const u = new URL(url);
    if (u.protocol !== 'https:' || u.port || u.username || u.password || !HOSTS.has(u.hostname)) throw new Error('NETWORK_DESTINATION_DENIED');
    let r: Response;
    try { r = await this.transport(url, {...init, redirect: 'error', signal: AbortSignal.timeout(60000)}); }
    catch { throw new Error('UPSTREAM_NETWORK_ERROR'); }
    this.trace.push({host:u.hostname,path:u.pathname,status:r.status});
    if (!r.ok) {
      await r.body?.cancel();
      const retry = r.headers.get('retry-after');
      throw new Error(`UPSTREAM_HTTP_${r.status}${r.status === 429 ? ` quota reset=${retry && /^\d+$/.test(retry) ? new Date(Date.now()+Number(retry)*1000).toISOString() : 'provider-unspecified'}` : ''}`);
    }
    if (r.status === 202 || r.status === 204 || (u.hostname === 'api.indexnow.org' && r.status === 200)) { await r.body?.cancel(); return {accepted:true,status:r.status}; }
    try { return await r.json(); } catch { throw new Error('UPSTREAM_INVALID_JSON'); }
  }
}
export function post(body: unknown, token?: string): RequestInit {
  return {method:'POST',headers:{'content-type':'application/json',...(token ? {authorization:`Bearer ${token}`} : {})},body:JSON.stringify(body)};
}
