# Tei (Evan) Chang — Portfolio

Personal portfolio site built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. The home page features an interactive physics-style experience; other sections cover profile, experience, projects, and contact.

**Live site:** [evch1204.github.io](https://evch1204.github.io/)

## Tech stack

| Layer | Choice |
|--------|--------|
| UI | React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Motion | Motion (`motion/react`) |
| Icons | Lucide React, react-icons, Simple Icons |
| Build | Vite 6 |
| Hosting | GitHub Pages (GitHub Actions) |

## Project structure

```
├── .github/workflows/   # CI: build + deploy Pages
├── public/              # Static assets served as-is (e.g. resume.pdf)
├── images/              # Source images the app does not import
├── src/
│   ├── App.tsx          # Shell: tab state, header, page switch, footer
│   ├── main.tsx
│   ├── index.css
│   ├── assets/images/   # The images the app imports
│   ├── content/         # What a non-engineer edits: copy, links, data
│   │   ├── site.ts      # Name, email, links, resume
│   │   ├── projects.ts
│   │   ├── experience.ts
│   │   ├── skills.ts
│   │   ├── tech.tsx
│   │   └── contributions.json
│   ├── components/      # Section, SectionHeading, Tag, Modal, SiteFooter
│   ├── layout/          # Header, sliding-pill nav, the tab list
│   ├── lib/             # Link labels, file download, home clock
│   └── pages/
│       ├── home/        # Home screen, home-screen.css, physics/ playground
│       ├── about/       # Profile, tech, GitHub activity, resume
│       ├── experience/  # Journey and education lists
│       ├── projects/    # Featured card, card grid, detail modal
│       └── contact/
├── index.html
├── vite.config.ts       # `@` is an alias for src/
├── tsconfig.json
└── package.json
```

## Scripts

```bash
npm ci          # install dependencies (CI-friendly)
npm run dev     # local dev server (port 3000)
npm run build   # production build → dist/
npm run preview # preview the production build locally
npm run lint    # TypeScript check (tsc --noEmit)
```

## Local development

1. Clone the repository.
2. `npm ci` (or `npm install`).
3. `npm run dev` and open the URL shown in the terminal (e.g. `http://localhost:3000`).

## Deployment (GitHub Pages)

The workflow **Deploy GitHub Pages** (`.github/workflows/pages.yml`) runs on pushes to **`main`** or **`master`**: it installs dependencies, runs `npm run build`, and publishes the **`dist`** folder.

In the repo: **Settings → Pages** — source should be **GitHub Actions** for this workflow to deploy.

`vite.config.ts` uses `base: '/'` for a **user** site (`username.github.io`). Project sites under a subpath need `base: '/repo-name/'` instead.

## Customization

- **Copy & meta:** `index.html`
- **Name, email, links, resume filename:** `src/content/site.ts`
- **Routes / tabs:** `src/layout/nav.ts`; the pages themselves live in `src/pages/`
- **Home interaction:** `src/pages/home/` (`HomeScreen.tsx`, `home-screen.css`, `physics/`)
- **Projects & featured content:** `src/content/projects.ts`
- **Experience & education:** `src/content/experience.ts`
- **Resume file:** add or replace `public/resume.pdf` (linked from the app)

## Environment & secrets

No API keys are required for the static site. Optional `.env` files are listed in `.gitignore`. Client-side code is public after deploy — do not put secrets in the repo or in `VITE_*` variables.

## License

Personal project; adapt for your own portfolio if you fork it.
