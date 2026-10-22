# SEO Data MCP

Local stdio MCP server for Google Search Console, Bing Webmaster, IndexNow, PageSpeed Insights and CrUX. Your SEO data goes directly from those APIs to your MCP client; it does not pass through Atesen Software. No LLM APIs, hosted proxy or telemetry.

## Install in five lines
```sh
# Node.js 22+; download the .tgz from the GitHub release while npm publication is pending
npx -y --package ./pabsamuel-seo-data-mcp-0.1.0.tgz seo-data-mcp --help
# Put your own Google service_account or authorized_user JSON in a private directory
claude mcp add --transport stdio --env GOOGLE_APPLICATION_CREDENTIALS=/private/google.json seo-data -- npx -y --package /absolute/path/pabsamuel-seo-data-mcp-0.1.0.tgz seo-data-mcp
# Restart your MCP client, then ask it to list sitemaps for sc-domain:your-domain.example
```
After npm publication the command becomes `npx -y @pabsamuel/seo-data-mcp@0.1.0`. npm installation, authentication and Claude-specific GUI installation are not claimed as complete; real stdio MCP integration is tested.

Claude Desktop config (merge this inside `mcpServers`):
```json
{"seo-data":{"command":"npx","args":["-y","--package","C:/absolute/path/pabsamuel-seo-data-mcp-0.1.0.tgz","seo-data-mcp"],"env":{"GOOGLE_APPLICATION_CREDENTIALS":"C:/private/google.json"}}}
```
Use an absolute `npx.cmd` path on Windows if your client cannot locate `npx`. Never commit client config containing credentials.

## Tools and plans
| Tool | Purpose | Free |
|---|---|---|
| `gsc_query` | Search analytics, dates, dimensions, pagination | Yes |
| `gsc_sitemaps` | List sitemaps | Yes |
| `gsc_inspect` | Indexed URL inspection, not a live test | No |
| `bing_query_stats` | Verified-site query statistics | No |
| `bing_crawl_issues` | Verified-site crawl issues | No |
| `indexnow_submit` | Submit same-host URLs; requires `confirm:true` | No |
| `pagespeed` | Lighthouse performance summary | Yes |
| `crux` | Origin field metrics; low traffic can return 404 | No |

Free: 3 tools / 20 attempts per UTC day. Starter: $12/month, all tools / 1,000 attempts per UTC day. Pro: $29/month, all tools / 5,000 attempts per UTC day. Billing is currently **preview/closed**, not a live paid offering. Provider quotas are separate. Starter/Pro limits are product implementation decisions; the brief specifies only the free cap and prices.

Why pay: URL inspection, Bing diagnostics, IndexNow and CrUX plus larger daily capacity. Attempts count even when credentials/provider calls fail; schema-invalid requests do not count. Quota uses a local lock and persistent counter shared by processes. This is local software: users control their filesystem and clock, so limits are not a tamper-proof remote meter.

## Bring your own credentials
`GOOGLE_APPLICATION_CREDENTIALS`: path to Google service-account JSON or user-owned OAuth `authorized_user` JSON. Enable Search Console API. First try adding the service-account email to the Search Console property's Settings → Users and permissions as **Full** user. No site membership was available in this build session, so real SA acceptance is pending.

Fallback: create your own Desktop OAuth client and, with Google Cloud CLI, run:
```
gcloud auth application-default login --client-id-file=/private/desktop-client.json --scopes=https://www.googleapis.com/auth/webmasters.readonly
```
Point the env variable to the generated `application_default_credentials.json`. Configure yourself as a test user in your Google project; testing-mode refresh tokens may need reauthorization. No publisher OAuth verification is required because there is no shared publisher client.

Other environment variables:
| Variable | Meaning |
|---|---|
| `BING_API_KEY` | Your Bing Webmaster key for a verified site |
| `GOOGLE_API_KEY` | Your API key with PageSpeed and Chrome UX Report APIs enabled |
| `INDEXNOW_KEY` | 8–128 character verification key hosted on your domain |
| `SEO_MCP_LICENSE_FILE` | Private text file containing the offline license (preferred) |
| `SEO_MCP_LICENSE` | Alternative inline license; avoid shell history/config sharing |
| `SEO_MCP_STATE_DIR` | Private quota directory; default `~/.seo-data-mcp` |

No credentials are read from project `.env` files. The client must explicitly pass env variables. Read-only Google scope only. Tokens are cached in memory and refreshed directly with Google; credential-file token endpoints are ignored. IndexNow never fetches arbitrary URLs itself, and refuses URLs/keyLocation on other hosts.

## Privacy and licensing
Only these hosts can receive MCP requests: `oauth2.googleapis.com`, `www.googleapis.com`, `searchconsole.googleapis.com`, `ssl.bing.com`, `api.indexnow.org`, `chromeuxreport.googleapis.com`. No redirects or automatic retries. Trace records omit query strings, headers and bodies. npm installation and your MCP/AI host are separate from tool traffic; your chosen host may process the reports.

License format: `SEO1.<base64url JSON>.<Ed25519 signature>`. Public key ships with the package; private key is excluded. Product, tier, issue/expiry timestamps and signature are checked locally. Subscription keys expire at the paid period end. Retrieve a fresh key after renewal; there are no background activation calls. Refunds/cancellations cannot instantly revoke an offline key. See [LICENSE](LICENSE), [privacy](https://seo-data.atesensoftware.com/privacy/) and [terms](https://seo-data.atesensoftware.com/eula/).

## Build and evidence
```
npm ci
npm test
npm audit --omit=dev
npm pack --pack-destination artifacts
npm run live
```
Tests use explicit synthetic responses; these are not live API evidence. `test/stdio.test.mjs` runs the actual MCP SDK client against the spawned stdio executable. `test/billing.test.mjs` uses real SQLite and Ed25519 with signed synthetic Paddle payloads; no sandbox checkout/payment occurred. `evidence/live.json` records live blockers without secrets. `SUBMIT.md` contains exact browser handoff and billing provisioning steps. `STATE.md` tracks acceptance.

## Primary references
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) (MIT), [Zod](https://github.com/colinhacks/zod) (MIT). Dependencies retain their licenses.
- [Google authorization](https://developers.google.com/webmaster-tools/v1/how-tos/authorizing), [analytics](https://developers.google.com/webmaster-tools/v1/searchanalytics/query), [sitemaps](https://developers.google.com/webmaster-tools/v1/sitemaps/list), [inspection](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect).
- [Service-account property setup](https://learn.microsoft.com/en-us/azure/databricks/ingestion/lakeflow-connect/google-search-console-source-setup), [Bing JSON API](https://learn.microsoft.com/en-us/bingwebmaster/), [IndexNow](https://www.indexnow.org/documentation), [PageSpeed](https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed), [CrUX](https://developer.chrome.com/docs/crux/api).

Historical research anchor: Advanced GSC MCP, $4,766 MRR / 147 subscriptions recorded in the 22 October portfolio brief. Not independently reverified here; no earnings claims are used in the listing.
