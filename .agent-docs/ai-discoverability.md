# AI discoverability handoff

How to bring a site up to what jnao.se now does for AI agents. Written for an agent working in another repo. Read it all, then run the audit before changing anything.

Reference implementation in the jnaose repo: `next.config.js`, `src/lib/siteSummary.ts`, `src/app/llms.txt/route.ts`, `src/app/index.md/route.ts`, `src/app/robots.txt/route.ts`.

## What to add

| Item | What it does | jnao.se |
|---|---|---|
| `Link` header on `/` | Points agents at machine-readable resources (RFC 8288) | `</llms.txt>; rel="describedby"; type="text/plain", </sitemap.xml>; rel="describedby"; type="application/xml"` |
| `/llms.txt` | Markdown summary of the site, served as `text/plain` | Generated from the site's data files |
| Markdown negotiation | `Accept: text/markdown` on a page returns markdown; browsers still get HTML | `/` and `/work` rewrite to `/index.md`, one shared summary |
| `Content-Signal` in `robots.txt` | States AI usage preferences; voluntary, blocks nothing | `Content-Signal: ai-train=no, search=yes, ai-input=yes` |

`sitemap.xml` and `robots.txt` are prerequisites; add them if missing.

## Ask the owner first

- **Content signals:** the values are the owner's decision. `search` is listing in search results, `ai-input` is live use in AI answers, `ai-train` is model training. `ai-input=no` works against `llms.txt` and markdown negotiation.
- **Scope of markdown:** one shared summary suits a site with a few short pages. A site with many content pages needs per-page markdown, which is a bigger job and needs its own plan.

## Skip unless the site really has the thing

Never advertise something that does not exist. The scanner marks these as failed on a plain site, and that is fine.

| Scanner check | Only applies if the site has |
|---|---|
| `apiCatalog` | A public API. `sitemap` is not an IANA-registered relation, which is why the sitemap link above uses `describedby` |
| `oauthDiscovery`, `oauthProtectedResource`, `authMd` | Sign-in for agents or an OAuth server |
| `mcpServerCard`, `a2aAgentCard`, `agentSkills`, `webMcp` | An MCP server, an agent, or agent skills |
| `dnsAid` | Agent endpoints to publish in DNS (early draft) |
| `personalAgentProtocol` (Poppy) | Accounts that a person's agent can act on (draft) |

These may genuinely apply to apps with accounts or APIs, so check each site rather than copying the jnao.se answers. `ard` was not looked into. Web Bot Auth and the commerce checks were neutral on jnao.se.

## Audit

```sh
curl -sI https://SITE/ | grep -iE '^(link|vary):'
curl -s https://SITE/robots.txt
curl -s -H 'Accept: text/markdown' https://SITE/ | head -1
curl -s -X POST https://isitagentready.com/api/scan -H 'Content-Type: application/json' -d '{"url":"https://SITE"}'
```

Per-check results are at `checks.<group>.<name>.status` in the scan response. These hosts may need sandbox approval.

## Next.js implementation

- **Summary:** keep one function that builds the markdown from existing data, so new content appears automatically. Both routes call it.
- **Routes:** `src/app/llms.txt/route.ts` and `src/app/index.md/route.ts`, each with `export const dynamic = 'force-static'`, differing only in `Content-Type`.
- **Link and Vary:** `headers()` in `next.config.js`, using `source: '/'` for `Link`.
- **Rewrites:** must be in `beforeFiles`, or the page wins over the rewrite. Match with `has: [{ type: 'header', key: 'accept', value: '.*text/markdown.*' }]`.
- **robots:** jnao.se replaced `src/app/robots.ts` with `src/app/robots.txt/route.ts`. The two cannot coexist. Whether Next's robots helper accepts custom directives was not checked.
- **Other frameworks:** the outcomes are the same; on Vercel the same rewrites and headers can go in `vercel.json`, though that route is untested.

## Known issues

- **`Vary: Accept`:** set in config, but dropped from HTML responses by `next start` and missing from both versions on Vercel. Vercel's cache still kept them apart: three alternating rounds on `/` and `/work` were correct with `x-vercel-cache: HIT`. A cache in front of Vercel could mix them.
- **Client navigation:** a request with `RSC: 1` returning `307` to `?_rsc` is normal, not a regression.
- **Zsh test scripts:** never name a loop variable `path`, since it overwrites `PATH`. `echo ===` aborts the script, which skips any `kill` after it and leaves a server running.
- **Local servers:** check a port is free before `next start`. On a busy port you test a different app, and it can look like your change failed.
- **Vercel previews:** Vercel Authentication blocks plain `curl`. Use the form below from the linked repo folder. It failed at first with `Not authorized`, then worked, for a reason that was not found. Turning off Deployment Protection while testing is the fallback.

```sh
vercel curl / --deployment https://PREVIEW.vercel.app -- --silent --header 'Accept: text/markdown' | head -1
```

## Done means

1. Lint, type-check and the build pass.
2. On a production build, `/` sends `Link`, and `/llms.txt`, `robots.txt` and the negotiated pages return the right content types.
3. On a preview, alternate markdown, HTML, markdown on each negotiated path.
4. Repeat on the live site with plain `curl`, checking `x-vercel-cache` to confirm cached responses were tested.
5. Re-run the scan: `linkHeaders`, `markdownNegotiation` and `contentSignals` should pass. The scan level may stay at 1, which is expected on a site without APIs or sign-in.
