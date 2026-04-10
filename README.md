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
├── images/              # Project and profile images
├── src/
│   ├── App.tsx          # Layout, tabs, sections
│   ├── HomeScreen.tsx   # Home hero + physics blocks
│   ├── TechIWorkWith.tsx
│   ├── projectsData.ts
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
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
- **Routes / tabs / sections:** `src/App.tsx`
- **Home interaction:** `src/HomeScreen.tsx`, `src/home-screen.css`
- **Projects & featured content:** `src/projectsData.ts`
- **Resume file:** add or replace `public/resume.pdf` (linked from the app)

## Environment & secrets

No API keys are required for the static site. Optional `.env` files are listed in `.gitignore`. Client-side code is public after deploy — do not put secrets in the repo or in `VITE_*` variables.

## License

Personal project; adapt for your own portfolio if you fork it.
