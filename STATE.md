# K01 task record
Scope: Node/TypeScript stdio MCP, eight SEO tools, offline Ed25519 licensing, free 3 tools/20 calls per UTC day, Starter $12/month, Pro $29/month; npm package and directory handoff.
Evidence read: K01 + #8 revenue anchor + K01 table row in 2026-10-22-20k-klon-listesi.md; marketplace playbook common/7/7a/9.
Revenue figures are historical source claims, not a revenue forecast or listing claim.
Single writer: root agent; research agent owns no files.
Acceptance: 30+ tool tests; real stdio client; packed npx execution; dependency audit; live 8-tool probe; offline-license/payment lifecycle tests; public install/docs/privacy/support/EULA pages.
Pre-build gate: no GOOGLE/BING/GSC/CRUX/PAGESPEED environment credentials found. Cannot verify SA site membership. Implement both service-account and user-owned OAuth paths; live acceptance remains blocked until credentials/site access exist.
npm identity probe: ENEEDAUTH; publishing needs browser login/2FA. No bypass.
## Final acceptance evidence (22 October 2026)
- Implemented all eight tools, readonly Google SA/user OAuth auth, six-host network allowlist/no redirects/no automatic retries, explicit IndexNow write confirmation, three-tool free tier (20/day), Starter $12/month and Pro $29/month with offline expiring Ed25519 licenses.
- `npm test`: **61 pass, 0 fail**, including 32 successful synthetic tool calls, actual SDK stdio initialize/list/call, quota/date/clock handling, credential isolation, RSA service-account JWT, and signed synthetic Paddle events against real SQLite. Raw output: evidence/tests.txt.
- `npm audit --omit=dev`: **0 vulnerabilities**. npm package contains 16 files, no credentials/private key. Both npm and MCPB packages built; MCPB manifest and official registry JSON schema validate.
- Clean-temporary-directory npm exec (npx equivalent) of the real .tgz: **pass**, initialized, eight tools, sanitized missing-credential call. evidence/package-smoke.json. No registry publication is claimed.
- `wrangler deploy`: successful; production version b91dc5e9-8ea4-4040-8126-a8a021d2bcd7; https://seo-data.atesensoftware.com and https://seo-data-mcp.sametatesen2.workers.dev. Static install/docs/support/privacy/EULA/refunds pages are live; billing remains preview and exposes no payment identifiers.
- Real Chromium checks: six pages × 1440/375 widths, HTTP 200, no horizontal overflow/page errors, no visible paid buttons, install-guide click passes. Home desktop/mobile screenshots visually inspected. evidence/visual.json and evidence/screenshots/.
- `npm run live`: **0/8 real-provider successes**. Google credentials absent; Bing key absent; CrUX API key absent; IndexNow key absent. The single real PageSpeed attempt returned `UPSTREAM_HTTP_429 quota reset=provider-unspecified`; no retry, provider gave no reset time. evidence/live.json. Full eight-tool, service-account site access and real network acceptance remain unmet.
- `npm publish --access public`: attempted once; **npm error code ENEEDAUTH** / **npm error need auth This command requires you to be logged in to https://registry.npmjs.org/**. Browser login/2FA handoff is in SUBMIT.md; official registry depends on this publication.
- Paddle: signed synthetic event → real SQLite → key → offline Starter/Pro unlock passes. **No actual sandbox checkout/payment**, live catalog, DB provisioning or shared router mutation performed: no Paddle credentials available to this task. Preview route returns BILLING_NOT_CONFIGURED. Manual browser/provisioning steps and subscription/refund limitations are documented in SUBMIT.md; no sale is claimed.
- Claude Desktop/Claude Code installs not exercised in their real signed-in apps; verified stdio protocol and tarball npx execution are available now. Client configs and Google BYOK fallback are documented.
- Directory handoff: Smithery MCPB + Glama copy prepared. PulseMCP submissions paused; mcp.so requires `$39 one-time publishing fee` and was not used. No money spent, no paid LLM/API/proxy used, no contact data collected.
- Public source and release publication: final Git commit/push/release verification follows this record. Use `git log -1` and GitHub release v0.1.0 as the exact source of commit and artifact evidence.

Remaining authorized work requires account/session access: npm login/2FA; Google/Bing/site verification; actual sandbox checkout; directory submissions through browser UI. SUBMIT.md is the complete handoff for Claude. Samet-only phone/identity step is one line there.
