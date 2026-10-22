# K01 submission handoff — Claude agent

Authorization already covers publish/push/submission. Spend $0; do not buy directory placement, hosting, API quota or proxy services. Do not bypass login, CAPTCHA or payment walls. No Chrome/browser extension is needed. Use the normal web UI available to your agent.

## Current deliverables and truthful status
- Repo: `C:\Users\sametatesen2\Desktop\Projeler\K01-seo-data-mcp`
- GitHub: https://github.com/pabsamuel/K01-seo-data-mcp
- Release: https://github.com/pabsamuel/K01-seo-data-mcp/releases/tag/v0.1.0
- Site: https://seo-data.atesensoftware.com/ (preview, billing closed).
- Listing copy: `listing/LISTING.md`; npm metadata: `package.json`; official registry metadata: `server.json`.
- npm publish was attempted and blocked by `npm error code ENEEDAUTH` / `npm error need auth This command requires you to be logged in to https://registry.npmjs.org/`.
- Google/Bing/site credentials are not configured in this session. `evidence/live.json` is the exact real probe record. No real eight-tool success or Paddle checkout is claimed.

## 1. Google/Bing acceptance, before claiming production readiness
1. Open Search Console in the account that owns `atesensoftware.com`. Use the site's existing property; do not create duplicates. Settings → Users and permissions → add the user's own service-account email as Full user. Keep the JSON key private and outside Git. The agent must not copy it into chat/logs.
2. If adding that account fails, record the exact error and use the user's own Desktop OAuth client (README command), with that account added as a test user. Do not create a shared publisher OAuth client or start paid APIs.
3. Verify Bing site ownership and enable API access; put the existing key into the MCP client environment, not this document. Enable only the required free Google API access without adding billing/automatic top-ups.
4. Host an IndexNow key file on the same domain only after checking existing file ownership. Never overwrite another project's verification file. Set `INDEXNOW_KEY` locally. IndexNow test submits the home URL and may notify search engines.
5. With a real Starter/Pro license and env credentials, run `npm run live` once. Accept only eight `pass` results with real data. A CrUX 404 can mean insufficient traffic; record it as an unmet acceptance criterion rather than fabricate a record. On 429 record reset/Retry-After and stop retries.
6. Configure Claude Desktop using the README; restart, list tools and run sitemap/query. Add the same command in Claude Code and verify it there. Time the setup only after credentials exist. The SDK test alone does not prove these two client installations.

## 2. npm browser login and publication
1. Open https://www.npmjs.com/login in the normal web UI. Sign into the existing `pabsamuel` account; never print credentials. Do not register a paid organization.
2. In a terminal in this repo run `npm login --auth-type=web`; follow the displayed official device/login URL. Complete 2FA using the account's existing authorized mechanism.
3. Run `npm whoami` (must be `pabsamuel`), then `npm test`, `npm audit --omit=dev`, `npm pack --pack-destination artifacts`, inspect its file list, then `npm publish --access public`.
4. Verify https://www.npmjs.com/package/@pabsamuel/seo-data-mcp and run `npx -y @pabsamuel/seo-data-mcp@0.1.0 --help` in a clean temporary directory. Test a real stdio initialize/list as well.
5. Update preview copy only after publication is verified. `scripts/site.mjs` generates the website; update the source and regenerate before deploy. Never claim the pending npm package is already published.

## 3. Official MCP Registry
Official guide: https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx
1. npm publication is a prerequisite. Install the official `mcp-publisher` binary following its OS release guide; never use a lookalike package.
2. `mcp-publisher login github` opens GitHub device authorization. Confirm the account `pabsamuel`. Namespace `io.github.pabsamuel/seo-data-mcp` must match `package.json.mcpName` and `server.json.name`.
3. Validate `server.json` with the publisher's current schema, then run `mcp-publisher publish`. Do not enable remote hosting.
4. Verify the record in https://registry.modelcontextprotocol.io/ and save its exact version URL/result into STATE.md.

## 4. Smithery (local stdio bundle)
Official: https://smithery.ai/docs/build/publish
1. Use the `.mcpb` bundle in the GitHub release; it includes the executable and production dependencies, with BYOK configuration. Do not choose URL/HTTP hosting or a gateway/proxy.
2. Sign into the existing Smithery account in the web UI. Use the current official CLI login flow if required.
3. `smithery mcp publish ./artifacts/seo-data-mcp.mcpb -n <existing-org>/seo-data-mcp` (replace the org with the account's actual namespace). If a paid plan is requested, stop and record the exact block.
4. Paste `listing/LISTING.md`, disclose preview billing status, and confirm the runtime is local stdio. Save the public listing URL only after verifying it exists.

## 5. Glama
Official: https://glama.ai/mcp/faq
1. Open https://glama.ai/mcp/servers → Add MCP Server; sign in with the existing account if prompted.
2. Submit the public GitHub repository URL above. Name: SEO Data MCP. Paste the short description/full copy from listing/LISTING.md. glama.json lists the maintainer.
3. Do not start paid hosting. Record the resulting public listing/review status in STATE.md; automated indexing is not approval.

## 6. Paused/paid directories: do not submit
- PulseMCP: https://www.pulsemcp.com/ currently says new submissions and listing changes are paused. Check the announcement once; no repeated submission attempts.
- mcp.so: https://mcp.so/submit?type=server displays `$39 one-time publishing fee`. This is blocked by the user's $0 rule. Do not pay or search for a bypass.

## 7. Paddle catalog + webhook + real sandbox checkout
The MCP executable never contacts billing. Only this separate website/worker uses Paddle. Existing router: `C:\Users\sametatesen2\Desktop\Projeler\paddle-hooks`, endpoint `https://paddle-hooks.atesensoftware.com/paddle`. Do not replace its shared ROUTES value or edit another session's tree.

1. Open the existing Paddle **sandbox** dashboard. Create SEO Data MCP product and two recurring monthly prices: Starter USD **12**, Pro USD **29**. In Turkish locale type whole numbers `12` and `29`, not `12.00`. Inspect stored cents: 1200/2900. No real charge/card is permitted.
2. Provision a **separate sandbox** Worker, D1 database, domain and Ed25519 signing key. Keep its public key out of the production package; sandbox keys must never unlock the production binary. Use `billing/worker.mjs` and `billing/migrations/0001.sql`. Configure `PADDLE_ENV=sandbox` and sandbox price IDs; do not set it to live. Existing preview does not contain DB or webhook credentials and answers `BILLING_NOT_CONFIGURED`.
3. Route sandbox `transaction.completed` notifications to `/paddle`. The handler validates `Paddle-Signature` (HMAC SHA-256, 5-minute window), catalog price, completed status, subscription ID, billing-period expiry and random installation token. It signs a key and saves it atomically/idempotently; renewal updates only newer events. Unrelated event types are ignored. Logs never include bodies/secrets.
4. Run a real Paddle sandbox checkout using its documented test payment mechanism only; `custom_data` must contain `{app:'seo-data-mcp',seo_install:'<64 random hex characters>'}`. Verify delivered notification, resulting DB license, and unlock with the sandbox public key in a temporary test build. This actual checkout was **not performed** by Codex. Unit tests cover synthetic signed payloads, not provider payment execution.
5. For production, use the production public key already embedded in `src/license.ts`; its private key is saved only in the ignored `secrets/signing-private.pem` (never upload to Git or paste in chat). Store via Wrangler secret stdin. Create a production D1 only if within the existing free allowance; bind DB and apply migration. Set live catalog IDs, CLIENT_TOKEN, PADDLE_ENV=live, ISSUANCE_ENABLED=true and PADDLE_WEBHOOK_SECRET. Configure the shared router route `app:seo-data-mcp` plus actual product ID to `https://seo-data.atesensoftware.com/paddle`, secret name `T_SEO_DATA_MCP`; coordinate the shared router-state/adapters update with its owner and run its tests.
6. Production product/price setup can use the Paddle dashboard (Catalog → Products → New product / New price; Settings → Authentication → Client-side tokens) or add this product's adapter to `AI-EKIP\PADDLE\lib\adapters.mjs` using `billing/paddle-catalog.json` and the existing router=true pattern. Do not open another active notification destination if the router is already the account destination. No live API key was available to this task, and the shared infrastructure was left unchanged.
7. Settings → Website approval → add `seo-data.atesensoftware.com`, with product/docs/privacy/support/EULA/refunds pages all reachable. Do not retry a rejected domain via another domain. Set checkout open only after approval and real sandbox acceptance. `GET /healthz` must then report mode=open and paddleEnv=live, with correct live client token. Current state is preview.
8. In checkout the site creates a 256-bit random installation capability; paid webhook custom_data carries it. POST /api/license retrieves only that capability's key on the same origin. Save the key privately to SEO_MCP_LICENSE_FILE, then verify all eight tools appear/unlock. Retrieve renewal keys manually; offline licenses expire at period end. Refunds cannot revoke them immediately. Do not claim otherwise.
9. The billing data includes an opaque subscription ID/token and event IDs; do not collect contacts or report data. For deletion requests, verify via the installation capability and delete the matching DB license. Remove old event records only after the reconciliation policy is satisfied; no scheduled retention job is included yet.

Samet'e ait adım: Erişilemeyen telefon/OTP veya kimlik doğrulaması istenirse yalnız o adımı Samet tamamlar; kimlik/telefon bilgisi toplanmaz.
