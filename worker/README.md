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

## Optional: log visitor questions

By default the Worker doesn't store anything — every question is answered
and forgotten. If you want to see what visitors actually ask (useful for
improving the static fallback bot's intents, or just curiosity), you can
opt into logging:

1. Create a KV namespace:

   ```bash
   npx wrangler kv namespace create CHAT_LOG
   ```

   This prints an `id`. Add it to `wrangler.toml`:

   ```toml
   [[kv_namespaces]]
   binding = "CHAT_LOG"
   id = "paste-the-id-here"
   ```

2. Redeploy: `npm run deploy`. That's it — the `/logs` endpoint is protected
   without any extra secret to manage. The `/admin` panel's "Chat Log" tab
   reuses the GitHub PAT you already pasted there: the Worker calls GitHub's
   `/user` API with it and only allows the request through if it belongs to
   the repo owner (`developerhridu`).

3. (Optional) For scripted/curl access outside the browser, you can still
   set a static admin key as a fallback credential:

   ```bash
   npx wrangler secret put ADMIN_KEY
   ```

   Then redeploy, and fetch recent Q&A pairs (last 100, newest first) with:

   ```bash
   curl -H "Authorization: Bearer <your-admin-key>" \
     https://hridu-portfolio-ai-chat.<your-subdomain>.workers.dev/logs
   ```

Until you complete step 1, `/logs` returns `501 Logging is not configured`
and the chat itself works exactly the same either way — logging is
fire-and-forget and never blocks or affects the answer a visitor sees.

## Notes

- The Worker fetches `content/*.json` directly from
  `raw.githubusercontent.com/developerhridu/developerhridu.github.io/main`,
  cached at Cloudflare's edge for 5 minutes. Any content you update via the
  site's `/admin` panel is reflected within a few minutes automatically —
  no need to redeploy the Worker when only content changes.
- CORS is allowed for `https://developerhridu.github.io` and
  `http://localhost:3000` (for local dev). Update `ALLOWED_ORIGINS` in
  `src/index.ts` if you ever serve the site from a different origin.
- There's no rate limiting built into the Worker itself. If you see abuse,
  add a Rate Limiting rule in the Cloudflare dashboard for this Worker's
  route — the free Workers AI daily quota also acts as a natural ceiling.
