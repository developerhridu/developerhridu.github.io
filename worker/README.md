# Portfolio AI Chat Worker

A Cloudflare Worker that answers visitor questions on the portfolio site using
Workers AI, grounded in the live content from `content/*.json` in this repo
(fetched fresh from GitHub on each request, so it never goes stale). It also
backs a few smaller site features that need somewhere to persist state that a
static site can't provide itself: reader counts, reactions, and (optionally)
public testimonial submissions — see below.

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

## Reader counts (blog posts & case studies)

Already set up — a `VIEWS` KV namespace is bound in `wrangler.toml`, so no
further steps needed. Each blog/case-study detail page calls `/views` once
per browser (deduped via `localStorage`) to increment and display its count.

- `POST /views` with `{ "type": "blog" | "case-study", "slug": "..." }` —
  increments and returns `{ "count": N }`.
- `GET /views?type=...&slug=...` — read-only, doesn't increment. Used by the
  admin dashboard and the "Most Read" widget on the listing pages.
- `GET /views/top?type=blog|case-study&limit=5` — top N slugs by view count
  for that type, plus `total` (sum across all matching entries). Omit `type`
  to rank/sum across both content types at once (used by the admin
  dashboard's "Total Views" stat).

If you ever need to reset a count, delete its key directly:

```bash
npx wrangler kv key delete "views:blog:<slug>" --namespace-id <VIEWS-namespace-id>
```

## Reactions ("was this helpful")

Also already set up, reusing the same `VIEWS` namespace under a
`reactions:<type>:<slug>` key — no separate namespace needed.

- `POST /reactions` with `{ "type", "slug", "action": "add" | "remove" }` —
  the client toggles a heart/thumbs-up button, tracked per-browser via
  `localStorage`, same dedup idea as view counts.
- `GET /reactions?type=...&slug=...` — read-only.

## Optional: let visitors submit their own testimonials

Off by default. When on, `content/testimonials.json` gets a new entry with
`published: false` whenever someone submits the form at `/testimonials/submit`
on the site — it shows up in the admin's Testimonials tab for you to review
and approve, exactly like any other draft. Nothing goes live without you.

This one needs real write access to the repo from a public, unauthenticated
endpoint, so it can't reuse the admin's session token the way `/logs` and
the content-editing tabs do — it needs its own credential:

1. On GitHub, create a **fine-grained personal access token**
   (Settings → Developer settings → Personal access tokens → Fine-grained
   tokens) scoped to **only this repository**, with **Contents:
   Read and write** permission and nothing else.

2. Set it as a Worker secret:

   ```bash
   npx wrangler secret put CONTENT_PAT
   ```

   Paste the token when prompted.

3. Redeploy: `npm run deploy`.

Until you do this, the submission form shows "Submissions aren't open yet"
and `/testimonials/submit` returns `501`. There's no CAPTCHA or rate limit —
just a honeypot field and basic validation — since spam still lands as an
unpublished draft you review, not something that goes live automatically.

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
