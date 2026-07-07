# developerhridu.github.io

Personal portfolio site for **Mizanur Rahman** — Software Engineer specializing in ASP.NET Core, microservices, and OTA/B2B platforms. Live at [developerhridu.github.io](https://developerhridu.github.io).

## Stack

- **[Next.js 16](https://nextjs.org)** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** for styling
- **Framer Motion** for animation, **lucide-react** for icons
- **next-mdx-remote** + **gray-matter** for MDX-based blog posts
- Static export (`output: "export"` in `next.config.ts`) deployed to **GitHub Pages** via GitHub Actions

## Content-driven architecture

All resume/portfolio content lives in plain JSON files under `content/`, not hardcoded in components. Update these to change what's shown on the site:

| File | Drives | Loader |
|---|---|---|
| `content/profile.json` | Name, bio, contact info, social links, skill ratings | `getProfile()` |
| `content/experience.json` | Work experience (`experiences`) | `getExperiences()` |
| `content/education.json` | Education history (`education`) | `getEducation()` |
| `content/skills.json` | Categorized skills (backend/frontend/architecture/devops/tools) | `getSkillsCategory()` |
| `content/projects.json` | Project showcase entries | `getProjects()` / `getFeaturedProjects()` |
| `content/certifications.json` | Training & certifications list | `getCertifications()` |
| `content/blog/*.mdx` | Blog posts (frontmatter + MDX body) | `lib/mdx.ts` |

Loader functions live in `lib/content.ts`; shared TypeScript shapes are in `types/index.ts`.

Some components (e.g. `Education.tsx`, `Certifications.tsx`) import their JSON directly rather than going through a loader — check the component before assuming `lib/content.ts` is the only path in.

## Project structure

```
app/                  Next.js App Router routes (/, /about, /experience, /projects, /blog, /contact)
components/
  sections/           Page sections (Hero, About, Experience, Projects, Education, Certifications, Contact)
  ui/                 Shared UI primitives (GlassCard, SectionHeading, ...)
content/              JSON content + MDX blog posts (see table above)
lib/                  Content loaders (content.ts) and MDX parsing (mdx.ts)
types/                Shared TypeScript interfaces
```

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
```

Other scripts:

```bash
npm run build     # production build (static export to ./out)
npm run start     # serve the production build
npm run lint      # eslint
```

## Deployment

Pushing to `main` triggers `.github/workflows/nextjs.yml`, which builds the static export and deploys it to GitHub Pages. No manual deploy step needed.

## Adding a new content section

Follow the pattern used for Certifications:

1. Add the shape to `types/index.ts`.
2. Add a `content/<section>.json` file.
3. Add a loader in `lib/content.ts`.
4. Add a `components/sections/<Section>.tsx` component (model it on `Education.tsx`).
5. Wire it into the relevant page in `app/`.
