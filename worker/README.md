# Portfolio AI Chat Worker

A Cloudflare Worker that answers visitor questions on the portfolio site using
Workers AI, grounded in the live content from `content/*.json` in this repo
(fetched fresh from GitHub on each request, so it never goes stale).

## One-time setup

1. **Create a free Cloudflare account** at https://dash.cloudflare.com/sign-up
   if you don't have one (Workers AI's free tier needs no credit card).

2. From the `worker/` folder, install dependencies:

   ```bash
   cd worker
   npm install
   ```

3. Log in to Cloudflare from the CLI:

   ```bash
   npx wrangler login
   ```

   This opens a browser to authorize the CLI against your account.

4. Deploy:

   ```bash
   npm run deploy
   ```

   Wrangler will print a URL like
   `https://hridu-portfolio-ai-chat.<your-subdomain>.workers.dev` — that's
   your live endpoint.

5. Paste that URL into `content/aiChatWorkerUrl` field in
   `content/config.json` back in the main project, e.g.:

   ```json
   "aiChatWorkerUrl": "https://hridu-portfolio-ai-chat.your-subdomain.workers.dev"
   ```

   Commit that change. The chat widget automatically switches from the
   static fallback to real AI answers once this URL is set.

## Local development

```bash
npm run dev
```

Runs the Worker locally (Workers AI calls still hit Cloudflare's real
infrastructure — there's no fully-offline mode for AI bindings).

## Updating

Whenever you change `src/index.ts`, just run `npm run deploy` again — no
account setup needed a second time.

## Notes

- The Worker fetches `content/*.json` directly from
  `raw.githubusercontent.com/developerhridu/developerhridu.github.io/main`,
  cached at Cloudflare's edge for 5 minutes. Any content you update via the
  site's `/admin` panel is reflected within a few minutes automatically —
  no need to redeploy the Worker when only content changes.
- CORS is locked to `https://developerhridu.github.io`. If you ever serve
  the site from a different origin, update `ALLOWED_ORIGIN` in
  `src/index.ts`.
- There's no rate limiting built into the Worker itself. If you see abuse,
  add a Rate Limiting rule in the Cloudflare dashboard for this Worker's
  route — the free Workers AI daily quota also acts as a natural ceiling.
