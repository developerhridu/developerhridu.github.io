# developerhridu.github.io

Personal portfolio site for **Mizanur Rahman** — Software Engineer specializing in ASP.NET Core, microservices, and OTA/B2B platforms. Live at [developerhridu.github.io](https://developerhridu.github.io).

## Stack

- **[Next.js 16](https://nextjs.org)** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** for styling
- **Framer Motion** for animation, **lucide-react** for icons
- **react-markdown** + **remark-gfm** + **rehype-sanitize** for article bodies (Markdown stored in JSON, not `.mdx` files)
- **Cloudflare Worker** (`worker/`) for view counts, reactions, click tracking, search logs and the AI chat
- Admin CMS at `/admin` that commits straight to this repo with a GitHub token
- Static export (`output: "export"` in `next.config.ts`) deployed to **GitHub Pages** via GitHub Actions

## Content-driven architecture

All resume/portfolio content lives in plain JSON files under `content/`, not hardcoded in components. Update these to change what's shown on the site:

| File | Drives | Loader |
|---|---|---|
| `content/profile.json` | Name, bio, contact info, social links, skill ratings | `getProfile()` |
| `content/experience.json` | Work experience (`experiences`) | `getExperiences()` |
| `content/education.json` | Education history (`education`) | `getEducation()` |
| `content/tech-stack.json` | Categorized skills (backend/frontend/architecture/devops/tools) | `getSkillsCategory()` |
| `content/projects.json` | Project showcase entries | `getProjects()` / `getFeaturedProjects()` |
| `content/certifications.json` | Training & certifications list | `getCertifications()` |
| `content/blogs.json` | Blog posts (`posts`, Markdown in the `body` field) | `getBlogPosts()` |
| `content/case-studies.json` | Case studies (`caseStudies`) | `getCaseStudies()` |
| `content/clients.json` | Client pages (`clients`) | `getPublishedClients()` |
| `content/testimonials.json` | Testimonials (`testimonials`) | `getPublishedTestimonials()` |
| `content/config.json` | Site URL, service ids, timings, list lengths | imported directly; editable at `/admin` → Site Config |
| `content/seo.json` | Per-route metadata (`routes`) | `getSeo()` |
| `content/menu.json` | Navigation (`navLinks`) | imported directly |

Loader functions live in `lib/content.ts`; shared TypeScript shapes are in `types/index.ts`.
There is no MDX pipeline — article bodies are Markdown strings inside those JSON files, rendered
with `react-markdown` (`components/ui/markdownComponents.tsx`).

Some components (e.g. `Education.tsx`, `Certifications.tsx`) import their JSON directly rather than going through a loader — check the component before assuming `lib/content.ts` is the only path in.

## Project structure

```
app/                  App Router routes, including /admin and the og-image generators
components/
  sections/           Page sections (Hero, About, Experience, Projects, Contact, ...)
  ui/                 Shared UI primitives (GlassCard, SectionHeading, modals, ...)
  admin/              The CMS: editors, media manager, dashboard, validation
content/              All site content as JSON (see table above)
lib/                  Content loaders, the GitHub commit layer, search index, SEO helpers
scripts/              Build-time codegen (responsive images, tech icons)
tests/                Node test-runner suites (no bundler; see tests/hooks.mjs)
types/                Shared TypeScript interfaces
worker/               Cloudflare Worker — separate toolchain, deployed by hand
```

## Image conventions

Images live in `public/images/`, one folder level deep:

| Folder | Holds |
| --- | --- |
| `logos/` | every organization logo (clients, employers, issuers, schools) |
| `blog/`, `case-studies/`, `projects/`, `clients/`, `certifications/`, `testimonials/`, `profile/` | images used by that content type only |
| `shared/` | other images used by two or more content types |

Why it matters: the admin CMS deletes an entry's images when they sit in that entry type's own folder and nothing else of the *same type* uses them. An image shared across types must live in `shared/` (or `logos/`) so removing one entry can't break another's page.

Names are lowercase kebab-case without spaces (`foodi-crm-cover-1.png`). Reference images by their `/images/...` path. `npm run build` also generates resized WebP copies in `public/_img/` (git-ignored) for responsive `srcset`s. Use the admin **Media** tab to browse folders, see where each image is used, and upload or delete.

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
```

Other scripts:

```bash
npm run build     # production build (static export to ./out)
npm run start     # serve the production build
npm run verify    # everything CI gates on: typecheck + worker typecheck + lint + tests
npm run typecheck # tsc --noEmit
npm run lint      # eslint, warnings included (--max-warnings=0)
npm test          # Node's test runner over tests/**/*.test.mts
```

Run `npm run verify` before pushing: CI runs the same four checks and a failure there
stops the deploy.

## Deployment

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which
type-checks, lints, tests, builds the static export and deploys it to GitHub Pages. A failure in
any of those steps stops the deploy, so a broken build cannot go live.

The Cloudflare Worker in `worker/` is **not** deployed by CI — it is released by hand:

```bash
cd worker && npm run deploy    # wrangler deploy
```

Its types are checked on push by [`.github/workflows/worker-check.yml`](.github/workflows/worker-check.yml).

## Admin CMS

`/admin` edits every file under `content/` and commits to this repo. It needs a GitHub token
with Contents read/write on this repository, pasted once and kept in `localStorage`; there is no
server-side auth, so treat that token as the only credential. Edits are queued and published as a
single commit (`lib/adminStore.ts`, `lib/github.ts`), and each publish triggers a deploy.

## Adding a new content section

Follow the pattern used for Certifications:

1. Add the shape to `types/index.ts`.
2. Add a `content/<section>.json` file.
3. Add a loader in `lib/content.ts`.
4. Add a `components/sections/<Section>.tsx` component (model it on `Education.tsx`).
5. Wire it into the relevant page in `app/`.
