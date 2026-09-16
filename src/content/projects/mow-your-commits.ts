import mowOverview from '@/assets/images/projects/mow-your-commits/overview.jpg';
import mowDeep from '@/assets/images/projects/mow-your-commits/deep.jpg';
import mowWinter from '@/assets/images/projects/mow-your-commits/winter.jpg';
import mowFlat from '@/assets/images/projects/mow-your-commits/flat.jpg';
import mowOg from '@/assets/images/projects/mow-your-commits/og.jpg';
import type { Project } from './types';
import { GITHUB_URL } from '@/content/site';

export const MOW_YOUR_COMMITS: Project = {
  id: 'mow-your-commits',
  cardTitle: 'mow your commits',
  kind: 'Playable README',
  group: 'apps',
  liveUrl: 'https://evch1204.github.io/mow-your-commits/',
  githubUrl: `${GITHUB_URL}/mow-your-commits`,
  panel: { kind: 'screenshot', src: mowOverview },
  cardDescription:
    'Your GitHub contribution graph as a lawn: every day is a patch of grass, a heavy day grows a hedge, and you drive a mower over the year. A GitHub Action mows it nightly into your profile README.',
  cardTags: ['JavaScript', 'three.js', 'Canvas', 'GitHub Actions'],
  keyFeatures: [
    'Type any GitHub username and the lawn becomes that account’s real graph — no login, no token',
    'Drive the mower with WASD or arrow keys; a combo climbs when days fall within 0.9 s of each other',
    'A hand-drawn 2D canvas view and a cel-shaded three.js view of the same simulation',
    'A GitHub Action renders the lawn to SVG every night and updates your profile README',
    'Light and dark themes, seasons, animation, a calendar year, and a transparent background as URL options',
  ],
  technologies: ['JavaScript', 'three.js', 'Canvas 2D', 'Vite', 'GitHub Actions', 'SVG'],
  caseStudy: {
    hero: {
      src: mowDeep,
      alt: 'Driving view of the 3D lawn in spring: a small red mower between hedges of grass, month signs on a fence, a +19 combo counter',
      caption: 'Riding the mower through a busy spring — the +19 is the current combo',
    },
    summary:
      'The contribution graph is a chart everyone on GitHub already reads. This turns it into a place: a lawn you can mow, and a picture your README can keep.',
    sections: [
      {
        heading: 'Why',
        body: [
          'It is inspired by the contribution snake, which showed that a profile README can hold something playful and still be generated. The goal here was a shareable one-shot toy: something a visitor wants to try once with their own graph, with polish and feel put ahead of features. Grass is the metaphor — a day with commits grows, a heavy day grows a hedge you can pick out from across the room, and mowing is a satisfying way to read a year.',
          'Two decisions were fixed from the start. It had to work for anyone with no setup: type a username and see your own graph, no login, no token, nothing to install. And the README version had to be the same board as the game, rendered by a GitHub Action, so what lands on a profile is exactly what was mowed rather than a separate drawing. The art direction is a doodle: Patrick Hand lettering, ink outlines, paper-coloured background, and a “boiling” wobble on the lines.',
        ],
      },
      {
        heading: 'How it plays',
        body: [
          'Each of the 52 × 7 tiles is a patch of grass whose height and density follow the real contribution count, not just GitHub’s four colour levels; the best 3% of days grow dandelions. Click the lawn, then WASD or the arrow keys drive the mower. Cutting a day pops out the real GitHub tile with its count. Cut another day within 0.9 seconds and the combo climbs — “combo x7” shows in the strip above the board from three up — and the end card keeps your best, plus a time for the full 52 weeks.',
          'C jumps to the overview shot, R regrows the lawn, and dragging looks around in 3D; on a phone there is an on-screen pad. Seasons follow the calendar along the fence: frost and snow in winter, blossom in spring, leaves in autumn. Sound is optional and entirely synthesised from oscillators — an engine that follows the throttle, a snip per cut, a chime on a best day and a fanfare at the end — so there is nothing to download.',
        ],
        figure: {
          src: mowWinter,
          alt: 'Driving view in winter: snow on the grass, a +22 combo counter over the mower',
          caption: 'January on the same lawn — snow, and a +22 combo',
        },
      },
      {
        heading: 'README integration',
        body: [
          'A GitHub Action mows your graph every night and commits the picture to your profile repository. The install is three steps under the lawn on the site: “add the workflow to GitHub” opens GitHub’s own new-file editor with .github/workflows/lawn.yml already written in (nothing is saved until you press GitHub’s commit button); “run it once” opens that workflow’s page in the Actions tab; “copy markdown” gives you a <picture> block with a light and a dark source to paste at the top of your README. There is no app to authorise and no permissions to grant — the install is a URL.',
          'The rendered SVG is the game board drawn through the same code as the site, with Patrick Hand embedded so it looks the same everywhere. Each output line in the workflow takes options: theme=dark for GitHub’s dark ramp, animate=1 for the mower to mow the whole year row by row and the lawn to regrow, weather=0 for GitHub’s exact greens with no seasons, bg=0 for a transparent picture, year=2025 for a calendar year, and mowed, mower and caption to set the starting state.',
        ],
        figure: {
          src: mowFlat,
          alt: 'The flat 2D view: a hand-drawn contribution grid with month labels, a +27 x21 combo and a tooltip reading Wed, 25 Mar 2026 · 3 contributions',
          caption: 'The flat view mid-mow — the same board the README SVG is drawn from',
        },
      },
      {
        heading: 'Architecture',
        body: [
          'A pure, DOM-free simulation in src/core — board, contributions, grass, lawn, palette, route and the GitHub fetch — is the single source of truth. Two renderers read from it: src/render2d draws the hand-drawn canvas, src/render3d builds the cel-shaded three.js scene. src/export turns the same state into SVG and PNG, with the font embedded, and the Action is a thin wrapper around that export with zero runtime dependencies. Keeping the core free of the DOM is what lets the Action, the 2D view and the 3D view agree on every tile.',
          'Data comes from the public contribution graph through a CORS-open mirror, which is what lets the site run as a static page on GitHub Pages. If you paste a fine-grained token with no permissions it talks to GitHub’s GraphQL API directly instead, private contributions included; the token stays in the browser and never touches a URL. The project is MIT-licensed and was pushed in September 2026.',
        ],
      },
    ],
    details: [
      { label: 'Year', value: '2026' },
      { label: 'License', value: 'MIT' },
    ],
    gallery: [
      {
        src: mowOverview,
        alt: 'The whole year from above in autumn: a long lawn with month signs on a fence, a barn and a windmill',
        caption: 'The whole year from above, in autumn',
      },
      {
        src: mowOg,
        alt: 'Social card for mow your commits',
        caption: 'Social card',
      },
    ],
  },
};
