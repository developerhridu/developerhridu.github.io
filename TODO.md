# TODO

Planned features not yet started. Each entry has enough detail to pick back
up without re-deriving the plan from scratch.

## Traffic graph in the admin Dashboard (via Google Analytics)

**Status:** Not started — blocked on Google Cloud setup (see step 1).

**Why:** The admin Dashboard tab (`components/admin/Dashboard.tsx`) currently
shows total blog/case-study views, pending testimonials, and recent chat
questions. Real site-wide traffic (pageviews, active users) isn't shown
anywhere in `/admin` — you'd have to leave the site and check
analytics.google.com. GA4 is already wired up site-wide via
`content/config.json`'s `gaMeasurementId` / `app/layout.tsx`'s gtag.js, so
the data already exists; this just surfaces a slice of it in-admin.

**Decision made:** Pull real data from the GA4 Reporting API (not a
from-scratch pageview counter) — GA4 already tracks referrers, geography,
devices, etc. far better than anything worth hand-rolling.

### Step 1 — Google Cloud setup (you only, not buildable by Claude)

1. In [Google Cloud Console](https://console.cloud.google.com), create a
   project (or reuse one) and enable the **Google Analytics Data API**.
2. Create a **Service Account** in that project, generate a JSON key for it.
3. In **Google Analytics** → Admin → your GA4 property → **Property Access
   Management**, add the service account's email as a **Viewer**.
4. Grab your GA4 **Property ID** (a plain number, e.g. `123456789` — found
   in Admin → Property Settings. This is different from the `G-XXXXXXX`
   Measurement ID already in `content/config.json`).

### Step 2 — Worker (`worker/src/index.ts`)

New endpoint: `GET /analytics/traffic?days=30`, protected the same way as
`/logs` (GitHub-owner-token check via `isRepoOwnerToken` — traffic numbers
are private business data, not public).

Internally:
- Sign a JWT with the service account's private key (Cloudflare Workers
  support RS256 signing via the Web Crypto API —
  `crypto.subtle.importKey`/`crypto.subtle.sign`) to get a short-lived
  Google OAuth2 access token from `https://oauth2.googleapis.com/token`.
- Call GA4 Data API's `runReport`:
  `https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport`
  for daily pageviews + active users over the requested range.
- Return `{ dates: [...], pageViews: [...], users: [...] }`.

New Worker secrets needed: `GA_SERVICE_ACCOUNT_EMAIL`,
`GA_SERVICE_ACCOUNT_KEY`, `GA_PROPERTY_ID`.

### Step 3 — Admin Dashboard (`components/admin/Dashboard.tsx`)

Add a chart block showing daily pageviews (and active users) over the last
30 days. No new npm dependency — hand-roll a small SVG bar/line chart (the
data shape is simple, and this codebase doesn't use a charting library
anywhere else).

### Caveat

This is meaningfully more setup than anything else wired into the Worker so
far (JWT signing + OAuth2 token exchange vs. a simple KV read/write in the
view-counter/reactions endpoints), and it's fully blocked on completing the
Google Cloud steps above first.
