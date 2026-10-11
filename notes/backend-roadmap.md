# Backend Roadmap for the Portfolio

How to get real-backend flexibility (proper login, drafts, a media library, a database) without losing what's good about the static site: free hosting, fast pages, and nothing to keep running.

**Core principle:** put a real API in front of the content, but keep the public site static.

## Current state

- The admin edits JSON files in this repo through the GitHub API, using a pasted personal access token.
- Every save is a commit, and that commit triggers a rebuild of the static site on GitHub Pages.
- Limits:
  - Only file edits; no real login.
  - No draft or scheduled publishing.
  - No media library.
  - No searching or filtering of content.
  - Every edit costs a full rebuild.

## Options

### 1. Git-based CMS (lowest effort, about a weekend)

Replace the hand-built admin with **Keystatic**, **TinaCMS** or **Decap CMS**.

- They read and write the same JSON and Markdown files in the repo.
- You get a proper editor, image handling, and GitHub OAuth login instead of a pasted token.
- Editorial review can happen through pull requests.
- The site stays static on GitHub Pages; most of the work is swapping out `components/admin/*`.

### 2. Extend the existing Cloudflare Worker (medium effort)

The repo already has a Worker in `worker/`. Add:

- **Database:** Cloudflare D1 (SQLite) for content.
- **File storage:** R2 for images and proof documents.
- **Login:** Cloudflare Access or GitHub OAuth.

How it fits together:

- The admin calls the Worker instead of GitHub.
- The site still builds statically: it pulls content from the Worker at build time.
- The Worker triggers a GitHub Actions rebuild after each save.
- This gives a real database (drafts, scheduled posts, testimonial moderation, a contact-form inbox) and stays on Cloudflare's free tier.

### 3. ASP.NET Core backend (most effort; recommended)

As a .NET engineer, the backend itself becomes a flagship portfolio project.

- **API:** ASP.NET Core with EF Core and PostgreSQL, using clean architecture or a modular monolith.
- **Login:** JWT plus refresh tokens or ASP.NET Identity, with roles (admin, editor) and an audit log of every change.
- **Content features:**
  - Draft, scheduled, published and archived states.
  - Version history with rollback.
  - A media library on Azure Blob or R2.
- **Moderation and inbox:**
  - A testimonials moderation queue.
  - A contact and booking inbox.
  - View and reaction counts moved off the Worker.
- **Rebuilds:** a webhook to GitHub Actions rebuilds the static site on publish, so the public site stays static and fast and keeps working even if the API is down.
- **Hosting:** Azure App Service free tier, Render or Fly.io, with Neon or Supabase for Postgres.
- **Showcase:** a case study on the site about building the backend for the site.

## Suggested path

1. **Now:** move admin login from a pasted token to GitHub OAuth through the Worker. It's small and a big safety win.
2. **Next:** build option 3 one area at a time.
   - Start with clients, projects and case studies.
   - Keep the JSON files as a fallback.
   - Switch the build to read from the API.
3. **Later:**
   - An analytics dashboard.
   - Scheduled posts.
   - An AI-assisted writing helper in the admin.
   - A public API with Swagger docs as part of the showcase.

Whichever option is chosen, keep the public site static. That gives backend flexibility without paying for a server, or depending on one staying up, just to show the portfolio.

## Next step

Draft the API design for option 3: endpoints, data model, and how login works.
