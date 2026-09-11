import shotRunningMap from '@/assets/images/shot-runningmap.jpg';
import shotDrawSpace from '@/assets/images/shot-drawspace.jpg';
import shotBookWithMe from '@/assets/images/shot-bookwithme.jpg';
import shotDocs from '@/assets/images/shot-docs.jpg';
import musclePhoto from '@/assets/images/muscle.jpg';
import emgRaw from '@/assets/images/projects/ergonomic-risk/emg-raw.jpg';
import emgRoc from '@/assets/images/projects/ergonomic-risk/roc.jpg';
import emgTree from '@/assets/images/projects/ergonomic-risk/tree.jpg';
import emgAccel from '@/assets/images/projects/ergonomic-risk/accelerometer.jpg';
import runningMapHome from '@/assets/images/projects/runningmap/home.jpg';
import runningMapRoute from '@/assets/images/projects/runningmap/route.jpg';
import runningMapMyRoutes from '@/assets/images/projects/runningmap/my-routes.jpg';
import bookWithMeHome from '@/assets/images/projects/bookwithme/home.jpg';
import bookWithMeDashboard from '@/assets/images/projects/bookwithme/dashboard.jpg';
import bookWithMeMeetings from '@/assets/images/projects/bookwithme/meetings.jpg';
import docsHome from '@/assets/images/projects/docs/home.jpg';
import docsEditor from '@/assets/images/projects/docs/editor.jpg';
import nbaTarget from '@/assets/images/projects/nba-analytics/target-correlation.jpg';
import nbaHeatmap from '@/assets/images/projects/nba-analytics/heatmap.jpg';
import nbaTree from '@/assets/images/projects/nba-analytics/tree.jpg';
import gamingCorr from '@/assets/images/projects/gaming-scraping/correlations.png';
import gamingCorrBinned from '@/assets/images/projects/gaming-scraping/correlations-binned.png';
import gamingKd from '@/assets/images/projects/gaming-scraping/kd-vs-winrate.png';
import gamingScore from '@/assets/images/projects/gaming-scraping/score-vs-winrate.png';
import mowOverview from '@/assets/images/projects/mow-your-commits/overview.jpg';
import mowDeep from '@/assets/images/projects/mow-your-commits/deep.jpg';
import mowWinter from '@/assets/images/projects/mow-your-commits/winter.jpg';
import mowFlat from '@/assets/images/projects/mow-your-commits/flat.jpg';
import mowOg from '@/assets/images/projects/mow-your-commits/og.jpg';
import { GITHUB_URL } from './site';

export type ProjectGroup = 'apps' | 'data';

/**
 * Names a drawing that lives with the projects page. Content refers to it by
 * id; the SVG itself is never imported here.
 */
export type IllustrationId = 'hand-cube';

/** A picture: an imported image, or one of the page's drawings. */
export type Figure = {
  alt: string;
  /** One line under the picture, in mono. */
  caption: string;
} & ({ src: string; illustration?: never } | { illustration: IllustrationId; src?: never });

/** What a card's panel shows: a screenshot fills the window from the top; a figure or drawing sits in it whole. */
export type CardPanel = { kind: 'screenshot'; src: string } | { kind: 'figure'; figure: Figure };

export type CaseStudySection = {
  heading: string;
  /** Paragraphs. */
  body: string[];
  figure?: Figure;
};

export type CaseStudy = {
  /** The first thing the modal shows. */
  hero: Figure;
  /** One or two sentences under the title. */
  summary: string;
  /** Three to five: why, how it works, results, what was learned. */
  sections: CaseStudySection[];
  /**
   * The register on the right, after the Kind and Group rows the modal adds
   * from the project itself: context, data, year when known.
   */
  details: { label: string; value: string }[];
  /**
   * Real pictures only, and only ones not already shown as the hero or a
   * section figure: the modal's gallery lists those first, in reading order,
   * then these.
   */
  gallery: Figure[];
};

export type Project = {
  id: string;
  cardTitle: string;
  cardDescription: string;
  cardTags: string[];
  /** The numbered "What it does" list. */
  keyFeatures: string[];
  technologies: string[];
  githubUrl?: string;
  /** Short excerpt for the featured project hero (report-style preview). */
  reportPreview?: string;
  /** Category shown as the card's eyebrow label. */
  kind: string;
  /** Which run of cards the project sits in on the projects page. */
  group: ProjectGroup;
  /** Deployed site. Shown on the card as its bare host name. */
  liveUrl?: string;
  panel: CardPanel;
  caseStudy: CaseStudy;
};

const FEATURED_PROJECT_ID = 'ergonomic-risk' as const;

export const PROJECT_GROUPS: { id: ProjectGroup; label: string }[] = [
  { id: 'apps', label: 'Apps & interfaces' },
  { id: 'data', label: 'Data & systems' },
];

export const groupLabel = (group: ProjectGroup) => PROJECT_GROUPS.find((g) => g.id === group)?.label ?? group;

const SCU = 'Santa Clara University';

/** Declaration order is the modal's prev / next order: featured, then apps, then data. */
export const PROJECTS: Project[] = [
  {
    id: 'ergonomic-risk',
    cardTitle: 'Ergonomic Risk Detection',
    kind: 'Research',
    group: 'data',
    panel: {
      kind: 'figure',
      figure: {
        src: musclePhoto,
        alt: 'Logistic regression predictions versus true labels on two PCA components',
        caption: 'Logistic regression on the first two PCA components',
      },
    },
    cardDescription:
      'Wearable EMG and IMU data from controlled repetitive-lifting trials, trained with logistic and random forest models to classify high- vs low-risk biomechanical conditions.',
    cardTags: ['Python', 'EMG', 'IMU', 'Random Forest'],
    keyFeatures: [
      'Wearable EMG and IMU data collection under controlled lifting protocols',
      'Feature extraction and comparative modeling (e.g., logistic vs. random forest)',
      'Risk stratification for repetitive tasks and discussion of sensor-specific contributions',
      'Implications for real-time occupational monitoring and future IMU feature work',
    ],
    technologies: ['Python', 'Jupyter', 'Data Analysis', 'Scikit-learn', 'Matplotlib'],
    githubUrl: `${GITHUB_URL}/EMGT311-ENGR184-Final-Project`,
    reportPreview:
      'We collected surface EMG (biceps and deltoids) and IMU data during controlled repetitive lifting and trained models—including logistic regression and random forest—to classify low- vs high-risk conditions from EMG-only and IMU-only feature sets, toward eventual multimodal fusion. Random forest classifiers with EMG features reliably distinguished risk levels by capturing meaningful muscle-activation variation, whereas IMU features showed limited separation between categories in this protocol, exposing gaps in biomechanical signal for IMU under these trials. Together, the results support EMG-driven ML as a viable path to real-time occupational monitoring; next steps include broader cohorts, stronger IMU feature engineering, and careful balance of fatigue manipulation with participant safety.',
    caseStudy: {
      hero: {
        src: musclePhoto,
        alt: 'Scatter plot of logistic regression predictions versus true labels on the first two PCA components',
        caption: 'Logistic regression: predicted colour vs. true shape on the first two PCA components',
      },
      summary:
        'Can a wearable tell a risky lift from a safe one? Surface EMG and IMU signals from two people, four trials, and two classifiers — one of which worked.',
      sections: [
        {
          heading: 'Why',
          body: [
            'Repetitive lifting is one of the most common causes of workplace injury, and the usual way to assess it is a checklist filled in by an observer. The question for this course project (EMGT 311 / ENGR 184, a group project) was whether cheap wearable sensors could do that assessment continuously instead: strap on a few muscle sensors and a motion unit, and let a model flag when a task has drifted into a high-risk pattern.',
            'We framed it as binary classification. Each trial was recorded under a condition we labelled either low risk or high risk, and the model had to recover that label from short windows of signal alone. The interesting part was not the model choice so much as which sensor carried the information: muscle activation (EMG) or body motion (IMU).',
          ],
        },
        {
          heading: 'Data & sensors',
          body: [
            'Four recordings: Person 1 and Person 2, each doing a high-risk and a low-risk trial. Every file has 56 columns with five rows of metadata at the top. Four surface-EMG sensors sat on the right bicep, right deltoid, left bicep and left deltoid, reporting in millivolts; the IMU units reported acceleration on X, Y and Z in G and gyroscope rates in degrees per second.',
            'The raw EMG traces show what the model is up against. The deltoid channels spike hard during each lift while the biceps barely move off zero, and the difference between a low-risk and a high-risk trial is a matter of how often and how sharply those spikes come, not a different shape of signal. The accelerometer trace tells a similar story: gravity sits on one axis at about 1 G and the lift shows up as a slow swing on the other two.',
          ],
          figure: {
            src: emgRaw,
            alt: 'Four raw EMG traces for Person 1, low-risk trial: the left deltoid spikes repeatedly while the other three channels stay near zero',
            caption: 'Raw EMG, Person 1 low-risk trial — the left deltoid does most of the work',
          },
        },
        {
          heading: 'Method',
          body: [
            'EMG pipeline: fill missing values with the column mean, clip outliers beyond three standard deviations, standardise with StandardScaler, then slide a 100-sample window across each trial in steps of 30. Each window becomes one row with five statistics per sensor — mean, max, min, standard deviation and RMS — so 20 features. Rows were split 70 / 30 with stratification and a fixed seed of 42.',
            'The IMU pipeline used the same windowing but different features: the peak, mean, total and range of the acceleration magnitude, and the same four for the gyroscope magnitude. Two models were fitted to each feature set. Logistic regression with L2 regularisation (liblinear) is the baseline — linear, fast, easy to read. A random forest of 100 trees is the non-linear comparison. Accuracy, a confusion matrix, per-class precision, recall and F1, and a ROC curve for the linear model came out of scikit-learn.',
          ],
          figure: {
            src: emgTree,
            alt: 'The first three levels of one tree from the random forest: splits on Max_EMG_S1, Max_EMG_S2 and Std_EMG_S2',
            caption: 'One tree from the forest, cut at depth 3 — the first split is the right bicep’s peak',
          },
        },
        {
          heading: 'Results',
          body: [
            'Logistic regression on EMG features reached 57.70% accuracy with an AUC of 0.59 — only a little better than a coin toss. Its confusion matrix ([[1030, 951], [734, 1268]]) shows it leaning towards calling things high risk; F1 was 0.55 for low risk and 0.60 for high risk over 1,981 and 2,002 windows. The PCA view at the top of this page is the same story in two dimensions: the classes overlap almost completely along any straight line.',
            'The random forest on the same EMG features reached 0.83 accuracy, with a confusion matrix of [[1682, 299], [374, 1628]] and F1 of 0.83 for both classes (precision 0.82 / 0.84, recall 0.85 / 0.81). Looking at one of its trees explains why: the useful boundaries are thresholds on peak amplitude and spread — Max_EMG_S1 ≤ 4.189, then Max_EMG_S2 ≤ 4.057, then Std_EMG_S2 ≤ 0.093 — which a linear model cannot express.',
            'The IMU pipeline did not work. A random forest on the motion features scored 0.53 accuracy, but with a recall of 0.98 for high risk and 0.08 for low risk ([[176, 1958], [43, 2105]]) — the model had collapsed to calling almost everything high risk. The accelerometer traces suggest why: the lifting motion looks much the same in both conditions, so the magnitude statistics carry little signal.',
          ],
          figure: {
            src: emgRoc,
            alt: 'ROC curve for the logistic regression model, area under the curve 0.59',
            caption: 'ROC of the logistic model, AUC 0.59 — the linear baseline barely separates the classes',
          },
        },
        {
          heading: 'What’s next',
          body: [
            'The honest conclusion is narrower than the headline number. Two people and four trials is a very small dataset, and the 83% comes from windows that overlap in time, so neighbouring rows in the train and test sets are similar. The result says EMG amplitude statistics carry risk information that a tree ensemble can pick up; it does not yet say the model would hold up on a third person.',
            'Next steps we wrote down: a broader cohort, IMU features that describe the shape of a lift (angles, timing) rather than the size of the motion, and — the point that mattered most in the report — a protocol that manipulates fatigue enough to create real risk without putting participants at that risk. Fusing the two sensor streams only makes sense once the IMU side carries signal on its own.',
          ],
        },
      ],
      details: [
        { label: 'Context', value: `EMGT 311 / ENGR 184, ${SCU}` },
        { label: 'Data', value: '2 people · 4 trials · 4 EMG + IMU' },
      ],
      gallery: [
        {
          src: emgAccel,
          alt: 'Accelerometer X, Y and Z traces for Person 1 low-risk trial',
          caption: 'Accelerometer, Person 1 low risk',
        },
      ],
    },
  },
  {
    id: 'bookwithme',
    cardTitle: 'BookWithMe',
    kind: 'Scheduling',
    group: 'apps',
    liveUrl: 'https://bookwithme.app.space',
    panel: { kind: 'screenshot', src: shotBookWithMe },
    cardDescription:
      'Publishes a booking page for a meeting type — duration, description and live availability — so a guest picks a slot in their own time zone and it lands on the host schedule.',
    cardTags: ['React', 'Scheduling', 'Calendar'],
    keyFeatures: [
      'Per-meeting-type booking pages with duration and description',
      'Month calendar that greys out days with no remaining availability',
      'Guest-side time-zone selection, defaulting to the visitor’s own zone',
      'Host schedule view showing what is already booked for a given day',
      'Shareable public link, no account required for the guest',
    ],
    technologies: ['React', 'TypeScript', 'Calendar API', 'Date-fns'],
    caseStudy: {
      hero: {
        src: shotBookWithMe,
        alt: 'A BookWithMe booking page for a weekly meeting: the meeting details on the left, a month calendar in the middle and the day’s slots on the right',
        caption: 'The public booking page — meeting details, a month, and the day’s free slots',
      },
      summary:
        'A scheduling tool that turns open calendar availability into a shareable link. The host defines a meeting type; the guest picks a free slot in their own time zone.',
      sections: [
        {
          heading: 'Why',
          body: [
            'Finding a meeting time by email takes three or four round trips and still ends up in the wrong time zone. A booking link removes the back-and-forth: the host says what kind of meeting it is and when they are free, and the guest picks. The design goal was that the guest side needs no account and no explanation — a name, a duration, a calendar with the empty days greyed out, and a list of times in whatever zone the guest is in.',
          ],
        },
        {
          heading: 'How it works',
          body: [
            'The host side is a dashboard with six areas: an assistant view, the dashboard itself, event types, meetings, availability and analytics. A new account is walked through three steps — connect Google Calendar so bookings sync and Meet links are generated, create an event type (a meeting template others can book), and set availability, which defaults to Monday to Friday. Each event type gets its own public page and a copyable link.',
            'The guest page shows the meeting’s name, duration and description on the left and a month calendar in the middle; days with no remaining availability are greyed out, and picking a day lists its open slots on the right. The time-zone selector defaults to the visitor’s own zone. A booking lands on the host’s schedule, where the day view shows what is already taken. Dates are handled with date-fns and the host’s calendar through the Calendar API.',
          ],
          figure: {
            src: bookWithMeDashboard,
            alt: 'The BookWithMe host dashboard: up-next meeting, totals for meetings, upcoming, event types and today, a weekly meeting-time chart, a calendar, the booking link with Share and View buttons, and the upcoming schedule',
            caption: 'The host dashboard — totals, the weekly meeting-time chart, the calendar and the booking link',
          },
        },
        {
          heading: 'Notes',
          body: [
            'BookWithMe is one of the app.space tools built at DeepSpace, in React and TypeScript. The Meetings page lists every booking with the guest’s contact, its status (upcoming, past, cancelled) and a details drawer with the meeting’s details, its questions and any additional information the guest left.',
          ],
        },
      ],
      details: [{ label: 'Context', value: 'DeepSpace' }],
      gallery: [
        {
          src: bookWithMeMeetings,
          alt: 'The Meetings page: a table of bookings with profile, contact and status, and a details drawer open on a past meeting with Details, Questions and Additional Information tabs',
          caption: 'Meetings — every booking, filtered by status, with a details drawer',
        },
        {
          src: bookWithMeHome,
          alt: 'The BookWithMe host dashboard, signed out: a sidebar with Assistant, Dashboard, Event types, Meetings, Availability and Analytics, and a Getting Started checklist',
          caption: 'A new account’s getting-started list: connect Google Calendar, create an event type, set availability',
        },
      ],
    },
  },
  {
    id: 'runningmap',
    cardTitle: 'RunningMap',
    kind: 'Route planner',
    group: 'apps',
    liveUrl: 'https://runningmap.app.space',
    panel: { kind: 'screenshot', src: shotRunningMap },
    cardDescription:
      'Plot a running route leg by leg on an interactive map — drag a point to fine-tune the line, shift-click to remove it — with live distance and walk, bike or drive pacing as the route grows.',
    cardTags: ['React', 'Mapping', 'Geolocation'],
    keyFeatures: [
      'Tap-to-draw routing with draggable waypoints and shift-click removal',
      'Live distance readout and walk / bike / drive / manual pacing modes',
      'Place search to jump the map to an address or landmark',
      'Parks-nearby lookup and freehand shape drawing for area planning',
      'Accounts for saving routes, with an anonymous mode for one-off planning',
    ],
    technologies: ['React', 'TypeScript', 'MapLibre', 'OpenFreeMap', 'Geolocation API'],
    caseStudy: {
      hero: {
        src: runningMapRoute,
        alt: 'RunningMap planner with a 2.06-mile loop drawn through a city grid: five waypoints, the finish point selected, the parks-nearby panel open and the distance card showing walk pacing',
        caption: 'A 2.06 mi loop, five points in — parks nearby open, walk pacing, ~40 min',
      },
      summary:
        'A browser route planner for runners. Tap the map to drop a start point, keep tapping to extend the line, and watch the distance and time estimate update as you go.',
      sections: [
        {
          heading: 'Why',
          body: [
            'Most running apps plan a route after the fact — they record where you went. I wanted the opposite: decide the distance first, then find a loop that comes to it. That means the planner has to be quick to draw with, quick to correct, and honest about the number, because “about 5K” is the whole point of the exercise.',
            'It also had to work with nothing set up. Opening the site drops you straight into the map as an anonymous user with a one-card hint (tap to drop a start point, drag a point to fine-tune, shift-click to remove it, or search a place to jump there). Signing in only adds saving, so a one-off plan never has to go through an account.',
          ],
        },
        {
          heading: 'How it works',
          body: [
            'A route is an ordered list of waypoints. Tapping adds one to the end; each point is draggable afterwards so the line can be nudged onto the right side of a street, and shift-click removes a point without breaking the route in two. The distance readout in the bottom card updates continuously, and the pace model under it switches between walk, bike, drive and manual, changing the time estimate rather than the line.',
            'The toolbar below the readout carries undo, redo and delete, then export and share. Two side tools sit next to the planner: parks nearby, which lists green space around the current view, and draw a shape, for freehand area planning when the route is not a line at all. Search in the top-right jumps the map to an address or landmark, and the locate button centres on the browser’s geolocation.',
          ],
        },
        {
          heading: 'Under the hood',
          body: [
            'The map is MapLibre GL with OpenFreeMap tiles — the attribution in the corner reads OpenFreeMap © OpenMapTiles, data from OpenStreetMap — so there is no per-tile billing key in the app. The route, its waypoints and the freehand shapes are drawn on the map from React state, and distance is summed over the legs as they change. The locate button uses the browser’s Geolocation API.',
            'The app is React and TypeScript, built at DeepSpace alongside the other app.space tools. Routes belong to an account when there is one; the anonymous mode keeps the planner usable without signing in.',
          ],
        },
        {
          heading: 'Notes',
          body: [
            'Two gestures carry most of the editing — drag a point to adjust the line, shift-click a point to remove it — and the hint card on first open exists so they are discoverable. Saved routes collect on a My Routes page as small map thumbnails with their distance and pacing, each with a Run it button; runs recorded against them show up under Recent activities.',
          ],
          figure: {
            src: runningMapMyRoutes,
            alt: 'The My Routes page: four saved routes as map thumbnails with their distance and walk, bike or drive pacing, each with a Run it button',
            caption: 'My Routes — saved loops with their distance, pacing and a Run it button',
          },
        },
      ],
      details: [
        { label: 'Context', value: 'DeepSpace' },
        { label: 'Map', value: 'MapLibre · OpenFreeMap' },
      ],
      gallery: [
        {
          src: shotRunningMap,
          alt: 'RunningMap planner on first open: a map of North America with a hint card that says tap the map to drop your start point',
          caption: 'Planner, first open — the hint card explains the three gestures',
        },
        {
          src: runningMapHome,
          alt: 'The planner at full window size, signed out',
          caption: 'Planner, full window',
        },
      ],
    },
  },
  {
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
  },
  {
    id: 'docs',
    cardTitle: 'Docs',
    kind: 'Document workspace',
    group: 'apps',
    liveUrl: 'https://docs.app.space',
    panel: { kind: 'screenshot', src: shotDocs },
    cardDescription:
      'A document workspace with a searchable library, folders, templates and sharing — documents open into a block editor with live formatting and autosave.',
    cardTags: ['React', 'Rich Text', 'Editor'],
    keyFeatures: [
      'Searchable document library with folders, favourites and an uncategorised bin',
      'Templates for starting a document from a known structure',
      'Block-based editor with live formatting and autosave',
      'Shared-with-me view for documents other people have sent over',
      'Grid and list layouts, sorted by last edited',
    ],
    technologies: ['React', 'TypeScript', 'Rich Text Editor', 'Autosave'],
    caseStudy: {
      hero: {
        src: shotDocs,
        alt: 'Docs: a document open in the block editor with the library sidebar on the left',
        caption: 'A document in the editor, the library in the sidebar',
      },
      summary:
        'A writing workspace rather than a single editor: documents live in folders, get favourited, shared and found again, and open into a block editor that saves as you type.',
      sections: [
        {
          heading: 'Why',
          body: [
            'A text editor is easy; the hard part of a docs tool is everything around the document. Where does it go, how do you find it again in a month, who else can see it, and what happens if you close the tab mid-sentence. This project started from those questions, so the library came first and the editor was built to fit it.',
          ],
        },
        {
          heading: 'How it works',
          body: [
            'The workspace opens on the library: a search box across everything, a sidebar with Library, Shared with me, Favorites and Uncategorized, and a Folders list beneath. Documents can be shown as a grid or a list and are sorted by last edited. Templates start a document from a known structure instead of a blank page.',
            'Opening a document drops into a block-based editor with live formatting — headings, lists and the usual marks render as you type — and autosave, so there is no save step and closing the tab loses nothing. Sharing puts a document in the other person’s Shared with me view.',
          ],
          figure: {
            src: docsEditor,
            alt: 'A Project Brief template open in the Docs editor: a formatting toolbar with text styles, font size, bold, italic, lists, quotes, links, images and tables, a word and page count in the header, and Share and download buttons',
            caption: 'The editor on the Project Brief template — toolbar, word and page count, Share',
          },
        },
        {
          heading: 'Notes',
          body: [
            'Docs is one of the app.space tools built at DeepSpace, in React and TypeScript. The header keeps a live word count and an estimated page count next to Share and download, so a document’s length is always in view.',
          ],
        },
      ],
      details: [{ label: 'Context', value: 'DeepSpace' }],
      gallery: [
        {
          src: docsHome,
          alt: 'The Docs library, signed out: search, a New Folder tile, Templates and New Document buttons, and grid / list toggles sorted by last edited',
          caption: 'The library — search, folders, templates, grid or list',
        },
      ],
    },
  },
  {
    id: 'drawspace',
    cardTitle: 'DrawSpace',
    kind: 'Diagram canvas',
    group: 'apps',
    liveUrl: 'https://drawspace.app.space',
    panel: { kind: 'screenshot', src: shotDrawSpace },
    cardDescription:
      'An infinite diagramming canvas with pen, shape, arrow and text tools that render in a hand-drawn style, organised into files and folders with zoom and full undo history.',
    cardTags: ['React', 'Canvas', 'Diagramming'],
    keyFeatures: [
      'Pen, rectangle, diamond, ellipse, arrow, line and text tools',
      'Hand-drawn rendering style for shapes, connectors and labels',
      'Infinite pannable canvas with zoom controls and full undo / redo',
      'File and folder organisation across multiple canvases, plus a trash bin',
      'Search across saved canvases and account sync between devices',
    ],
    technologies: ['React', 'TypeScript', 'Canvas API', 'SVG'],
    caseStudy: {
      hero: {
        src: shotDrawSpace,
        alt: 'DrawSpace: a flowchart drawn in a hand-drawn style with a file sidebar on the left',
        caption: 'A flowchart on the canvas, files and folders in the sidebar',
      },
      summary:
        'A sketching and diagramming tool built around a hand-drawn rendering style, so a flowchart looks like something worked out on paper rather than generated.',
      sections: [
        {
          heading: 'Why',
          body: [
            'Diagrams made in a tool tend to look finished before the thinking is. A hand-drawn line says “draft” on its own, which makes it easier to share an idea early and easier to throw away. That is the whole premise: a canvas whose default output looks sketched, with just enough structure — shapes that snap, arrows that follow their endpoints — that the sketch stays legible when it is moved around.',
            'The second premise is that diagrams come in sets. One canvas is never the whole picture, so the tool is organised like a workspace: files inside folders, a trash bin, search across everything, and an account so the same files are on every device.',
          ],
        },
        {
          heading: 'How it works',
          body: [
            'The tools are the usual set — pen, rectangle, diamond, ellipse, arrow, line and text — and every one of them renders through the same hand-drawn pass, so a rectangle and a freehand stroke share the same wobble. Arrows attach to shapes and follow them when a shape is dragged. The canvas is infinite and pannable, with zoom controls in the corner and full undo and redo on the history.',
            'The drawing surface is the Canvas API, with SVG alongside it, in React and TypeScript. The sidebar on the left is the file system: canvases sit inside folders, deleted ones go to the trash, and search runs across everything saved.',
          ],
        },
        {
          heading: 'Notes',
          body: [
            'DrawSpace is one of the app.space tools built at DeepSpace, in React and TypeScript. It is behind a login, which is why there is a single screenshot here: the canvas view above is the only public capture.',
          ],
        },
      ],
      details: [{ label: 'Context', value: 'DeepSpace' }],
      gallery: [],
    },
  },
  {
    id: 'hand-tracker',
    cardTitle: 'Hand Tracking 3D Cube',
    kind: 'Computer vision',
    group: 'apps',
    panel: {
      kind: 'figure',
      figure: {
        illustration: 'hand-cube',
        alt: 'Illustration of the hand-tracker’s output: the 21-point hand skeleton and the colour-coded wireframe cube',
        caption: 'The landmark skeleton and the colour-coded cube',
      },
    },
    cardDescription:
      'Maps 21 MediaPipe hand landmarks onto a 3D cube in real time: an open right palm rotates it, a two-finger pinch scales it, with smoothing to kill jitter.',
    cardTags: ['Python', 'MediaPipe', 'OpenCV', 'NumPy'],
    keyFeatures: [
      'Right-palm rotation: hand pitch and yaw drive cube rotation around X and Y',
      'Two-finger pinch scaling using one index finger from each hand',
      'Smoothing algorithms to suppress jitter from frame-to-frame landmark noise',
      'Colour-coded cube edges and live hand-landmark visualisation',
      'Real-time processing straight from the webcam via OpenCV',
    ],
    technologies: ['Python', 'MediaPipe', 'OpenCV', 'NumPy'],
    githubUrl: `${GITHUB_URL}/hand_tracker`,
    caseStudy: {
      hero: {
        illustration: 'hand-cube',
        alt: 'Illustration: the 21 MediaPipe hand landmarks joined as a skeleton, next to a wireframe cube with green front edges, blue back edges and red connecting edges',
        caption: 'Illustration of what the program draws: the landmark skeleton and the colour-coded cube',
      },
      summary:
        'A Python program that controls a wireframe cube with your hands. MediaPipe finds 21 landmarks per hand in the webcam feed; the program turns them into rotation and scale.',
      sections: [
        {
          heading: 'Why',
          body: [
            'The question behind this one is how much work sits between “here are 21 points on a hand” and a control you can actually use. A cube is the simplest object with a visible orientation, so it makes every mistake obvious: if the maths is off, the cube spins the wrong way; if the smoothing is off, it shakes.',
            'The whole thing is one Python file, hand_tracking_cube.py, on top of three libraries: OpenCV for the camera, the window and the drawing; MediaPipe Hands for the landmarks, with two-hand detection on; and NumPy for the matrices. A second file, hand_track_test.py, only checks that the three imports work. It runs at roughly 30 frames a second, with MediaPipe taking about 30 ms of each frame.',
          ],
        },
        {
          heading: 'Gestures',
          body: [
            'Rotation mode starts when the right palm is open, defined as at least four of the five fingers extended. A finger counts as extended when its tip is farther from the wrist (landmark 0) than its base joint, the MCP; the thumb is compared against its IP joint instead, because the thumb’s MCP sits too close to the wrist to be a useful reference. This is a distance test rather than an angle test, which makes it stable when the hand turns.',
            'Scale mode needs both hands. When two hands are visible, the 3D distance between the two index fingertips (landmark 8 on each) becomes the scale, clamped between 0.5× and 3×. Pinch the fingers together and the cube shrinks; spread them and it grows. Quit is the q key.',
          ],
        },
        {
          heading: '3D math',
          body: [
            'Orientation comes from two vectors on the palm. The wrist-to-middle-MCP vector (landmarks 0 → 9) is normalised, and pitch = atan2(z, y) and yaw = atan2(x, y) come off it; roll is atan2 of the index-MCP-to-pinky-MCP vector (5 → 17). Tilting the hand up gives a positive pitch and the cube rotates forward; turning it left gives a positive yaw and the cube turns left.',
            'The cube is eight vertices at ±1 on each axis and twelve edges. Each frame, every vertex goes through the rotation matrices in order — X, then Y, then Z — is multiplied by the base scale of 200 pixels and the gesture scale, and is projected orthographically (no perspective) onto a point centred at 75% of the frame width. The edges are then sorted by their average depth and drawn back to front so the near ones paint on top: the front face is green, the back face blue, the four connecting edges red, with thickness growing from 2 to 4 pixels as an edge comes closer. Vertices are white dots.',
          ],
        },
        {
          heading: 'Smoothing',
          body: [
            'Raw landmark positions jitter by a pixel or two between frames, and atan2 amplifies that into a visible shake. Two filters fix it. An exponential moving average keeps 85% of the previous value and takes 15% of the new one (SMOOTHING_FACTOR = 0.85; the README describes it as an 80 / 20 split, the code says 85 / 15). A dead zone of 0.05 ignores any change smaller than that, so a hand held still produces a cube that is actually still.',
            'The cost is a little lag on fast movements, which is the right trade for a demo. Lighting is the main practical limit — MediaPipe loses the hand in a dark room — and the scale gesture needs both index fingers clearly visible and not overlapping. There are no screenshots of the program in the repository, so the picture at the top of this page is an illustration of what it draws.',
          ],
        },
      ],
      details: [
        { label: 'Input', value: 'Webcam · 21 landmarks × 2 hands' },
        { label: 'Runs', value: 'Python 3.7+ · ~30 FPS' },
      ],
      gallery: [],
    },
  },
  {
    id: 'nba-analytics',
    cardTitle: 'NBA Analytics Engine',
    kind: 'Data science',
    group: 'data',
    panel: {
      kind: 'figure',
      figure: {
        src: nbaTarget,
        alt: 'Heatmap of feature correlation with the target rank',
        caption: 'Correlation with the target rank',
      },
    },
    cardDescription:
      'Ranks NBA players from fourteen per-game statistics with a decision tree trained on 2022, tested against the real 2024-25 ranking, and used to score trades.',
    cardTags: ['Python', 'Pandas', 'Scikit-learn', 'NumPy'],
    keyFeatures: [
      'Fourteen per-game features (MPG, PPG, 2PA, 3PA, FTA, TPG and more) predicting a player’s rank',
      'Decision tree and KNN regressors trained on the 2022 season, scored on a hold-out and on 2023-24',
      'Comparison against the actual 2024-25 ranking: share of players within ±30 places, MAE and R²',
      'Tiers by predicted rank — Superstar, Starter, Role Player, Bench',
      'A trade simulator that sums rank on each side and says which team comes out ahead',
    ],
    technologies: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'Matplotlib', 'Seaborn'],
    githubUrl: `${GITHUB_URL}/NBA-Statistic-Analysis---184-Proj`,
    caseStudy: {
      hero: {
        src: nbaTarget,
        alt: 'Correlation heatmap of the fourteen features and the target rank; MPG and PPG are −0.92 with rank',
        caption: 'Correlation with the target — minutes and points are −0.92 with rank; turnovers barely register',
      },
      summary:
        'Given a season of box-score statistics, how well can a tree predict where a player lands in the league ranking a year later? A CSCI 184 project in pandas and scikit-learn.',
      sections: [
        {
          heading: 'Why',
          body: [
            'Player rankings are argued about all year, and the arguments are mostly about which statistics should count. This project asks the model version of that question: train on one season’s per-game numbers with the ranking as the target, and see how far the same model gets on the next season. A useful side effect is a number for every player, which is what a trade calculator needs.',
            'It was the final project for CSCI 184 at Santa Clara University, done in a Jupyter notebook with pandas, NumPy, scikit-learn, matplotlib and seaborn.',
          ],
        },
        {
          heading: 'Data',
          body: [
            'Four CSV files. nba2022.csv is the training set: the 2022 season with fourteen features and the rank. NBA2024.csv is the 2023-24 season the model is asked to rank. CurrentMVP.csv adds advanced metrics — Win Shares, WS/48, VORP, BPM and team wins — for the MVP-candidate view, and nba_statistic_2024_rank.csv is the actual 2024-25 ranking used as ground truth.',
            'The fourteen features are minutes per game, turnover percentage, free-throw attempts and percentage, two-point attempts and percentage, three-point attempts and percentage, then points, rebounds, assists, steals, blocks and turnovers per game. The correlation heatmap shows the shape of the problem: MPG and PPG are both −0.92 with rank (a better player has a lower rank number), followed by 2PA and TPG at −0.78, FTA at −0.72 and 3PA at −0.70. Turnover percentage is the only feature that goes the other way, at 0.14. The attempts and the minutes are all strongly correlated with each other, so much of the fourteen is the same signal measured several ways.',
          ],
          figure: {
            src: nbaHeatmap,
            alt: 'Feature-to-feature correlation heatmap on a red-yellow-green scale',
            caption: 'Feature-to-feature correlation — attempts, minutes and points move together',
          },
        },
        {
          heading: 'Models',
          body: [
            'An unbounded DecisionTreeRegressor was the first pass; it scored a test MSE of 14.18 on a 25% hold-out from 2022, which is suspiciously good — a deep tree memorises the year it was trained on. The model I kept is a DecisionTreeRegressor with max_depth = 5, trained on scaled 2022 data. Its first split is minutes per game, and the branches below it are free-throw attempts, three-point attempts, points and turnover percentage, which matches the correlation table.',
            'Applied to 2023-24 and compared with the real 2024-25 ranking, the depth-5 tree puts 44.85% of players within ±30 places, with a mean absolute error of 58.6 and an R² of 0.65. On the 2022 hold-out the same tree scores an MAE of 5.0 and 92.16% within ±10 — that gap between in-distribution and next-season performance is the main finding. (One caveat on the notebook: the print label says ±10, but the tolerance variable used was 30.) A KNeighborsRegressor with k = 5 was the comparison; it agreed with the true ranking for 31.84% of players within ±30, R² 0.64, and had an MSE of 6,100 on the hold-out. A plain LinearRegression was tried and dropped after it predicted negative ranks — an unbounded line extrapolates past the top of the league.',
          ],
          figure: {
            src: nbaTree,
            alt: 'The depth-5 decision tree: the root splits on MPG, then on MPG and FTA, then on 3PA, TO% and PPG',
            caption: 'The depth-5 tree — minutes first, then attempts and points',
          },
        },
        {
          heading: 'Trade simulator',
          body: [
            'Each player gets a tier from their rank: Superstar for a rank of 10 or better, Starter up to 50, Role Player up to 150, Bench otherwise. The simulator takes two lists of names, looks each one up, sums the ranks on each side (lower is better) and reports the totals, the tier of every player involved, and which side wins the trade. It is deliberately simple — no contracts, no positions, no age — so the answer is transparent.',
            'The demo call in the notebook found none of its four example players, because the names in the ranking file were formatted differently from the ones typed in, and reported a “perfectly balanced” 0 – 0 trade. Name matching between the datasets turned out to be its own problem, which is why the repository carries a name_order_mismatches.csv alongside the modified-names files.',
          ],
        },
        {
          heading: 'What I learned',
          body: [
            'Three things. A hold-out from the same season is not a test of a ranking model; the only honest number is the one from the following season, and it was much worse. A bounded target needs a bounded model — the linear regression’s negative ranks were the clearest lesson in the project. And most of the work in a “modelling” project is joining tables: aligning player names across four files took longer than fitting any of the models.',
          ],
        },
      ],
      details: [
        { label: 'Context', value: `CSCI 184, ${SCU}` },
        { label: 'Seasons', value: '2022 → 2023-24 · 2024-25 truth' },
      ],
      gallery: [],
    },
  },
  {
    id: 'gaming-scraping',
    cardTitle: 'Gaming Statistics & Web Scraping',
    kind: 'Data science',
    group: 'data',
    panel: {
      kind: 'figure',
      figure: {
        src: gamingKd,
        alt: 'Scatter plot of kills per death against win rate for about 900 Valorant leaderboard players',
        caption: 'K/D vs. win rate',
      },
    },
    cardDescription:
      'Scrapes ~900 players off the Valorant leaderboard and asks which of their stats actually tracks win rate. K/D does; headshot percentage does not.',
    cardTags: ['Python', 'Web Scraping', 'Data Analysis'],
    keyFeatures: [
      'Scrapes 30 pages × 30 players of the mobalytics.gg Valorant leaderboard with requests and BeautifulSoup',
      'Collects rank, win rate, average score, K/D, kills per round, headshot % and main agent into scores.csv',
      'Bins every stat into five equal-width bins and compares correlations binned versus raw',
      'A hand-written Pearson correlation, so the number is not a library call',
      'Scatter plots and correlation bars in matplotlib',
    ],
    technologies: ['Python', 'Requests', 'BeautifulSoup', 'NumPy', 'Matplotlib'],
    githubUrl: `${GITHUB_URL}/Gaming-Statistic-Web-Scrapping-Analysis`,
    caseStudy: {
      hero: {
        src: gamingCorr,
        alt: 'Bar chart of raw correlation with win rate: average score 0.25, kills per death 0.47, kills per round 0.31, headshot percentage 0.02',
        caption: 'Correlation with win rate, raw — K/D 0.47, kills / round 0.31, average score 0.25, headshot % 0.02',
      },
      summary:
        'Which of the numbers on a Valorant leaderboard actually go with winning? Scrape about 900 players, compute the correlations by hand, and check whether binning changes the answer.',
      sections: [
        {
          heading: 'Why',
          body: [
            'Competitive shooters show players a row of statistics — kill / death ratio, kills per round, average combat score, headshot percentage — and it is not obvious which of them matter. Headshot percentage in particular is treated as a skill badge. This CSCI 185 project asks the plain question: across a lot of high-ranked players, which stat correlates with win rate, and by how much.',
            'The second aim was to do the data collection myself rather than download a dataset, and to write the statistic myself rather than call a library, so that every step of the number could be explained.',
          ],
        },
        {
          heading: 'Scraping',
          body: [
            'The source is the Valorant leaderboard on mobalytics.gg. A loop requests 30 pages with requests, parses each with BeautifulSoup and reads 30 player rows per page — about 900 players in all — pulling rank, win rate, average score, K/D, kills per round, headshot percentage and main agent. The rows are written to scores.csv so the analysis can rerun without touching the site again.',
            'The scraper is tied to the page’s HTML structure, so it breaks when the site changes its markup; the notebook notes this and expects the selectors to be edited. Being polite matters too: a fixed number of pages, one pass, and a saved CSV rather than repeated hits.',
          ],
        },
        {
          heading: 'Analysis',
          body: [
            'Each statistic was binned into five equal-width bins between its minimum and maximum, and the correlation with win rate was computed twice — once on the raw values and once on the bin indices — to see whether coarsening the data changed the ranking of the stats. The correlation is a hand-written Pearson: subtract the means, sum the products, divide by n times the two standard deviations, with a length check first.',
            'Raw correlations with win rate: K/D 0.468, kills per round 0.315, average score 0.255, headshot percentage 0.024. Binned: 0.424, 0.300, 0.219, 0.004. Binning lowers every number a little and changes nothing about the order.',
          ],
          figure: {
            src: gamingCorrBinned,
            alt: 'Bar chart of binned correlation with win rate: average score 0.22, kills per death 0.42, kills per round 0.30, headshot percentage 0.00',
            caption: 'The same four correlations on the binned data — same order, slightly lower',
          },
        },
        {
          heading: 'Findings',
          body: [
            'K/D is the strongest single predictor of win rate in this sample, kills per round is second, and headshot percentage is essentially unrelated to winning — at 0.02 raw and 0.004 binned it is noise. Average score sits in between, which makes sense since it is partly built from kills.',
            'The scatter plots carry the caveat. Win rates pile up at exactly 0%, 50% and 100%, because many leaderboard players had only one or two recorded games at the time of the scrape; a single win reads as 100%. Those rows dilute every correlation and are the main reason the coefficients are modest. A better version would require a minimum number of games before a player counts, and would scrape more than one snapshot.',
          ],
          figure: {
            src: gamingKd,
            alt: 'Scatter of kills per death against win rate; points cluster in rows at 0, 50 and 100 percent',
            caption: 'K/D vs. win rate — the rows at 0, 50 and 100% are players with one or two games',
          },
        },
      ],
      details: [
        { label: 'Context', value: `CSCI 185, ${SCU}` },
        { label: 'Sample', value: '30 pages × 30 players' },
      ],
      gallery: [
        {
          src: gamingScore,
          alt: 'Average score against win rate',
          caption: 'Average score vs. win rate',
        },
      ],
    },
  },
];

export const FEATURED_PROJECT = PROJECTS.find((p) => p.id === FEATURED_PROJECT_ID)!;
const GRID_PROJECTS = PROJECTS.filter((p) => p.id !== FEATURED_PROJECT_ID);

/** Grid projects for one group, in declaration order. */
export const projectsInGroup = (group: ProjectGroup) =>
  GRID_PROJECTS.filter((p) => p.group === group);
