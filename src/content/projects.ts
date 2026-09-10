import type { GlyphName } from '@/ProjectGlyph';
import shotRunningMap from '@/assets/images/shot-runningmap.jpg';
import shotDrawSpace from '@/assets/images/shot-drawspace.jpg';
import shotBookWithMe from '@/assets/images/shot-bookwithme.jpg';
import shotDocs from '@/assets/images/shot-docs.jpg';
import { GITHUB_URL } from './site';

export type ProjectGroup = 'apps' | 'data';

export type Project = {
  id: string;
  cardTitle: string;
  cardDescription: string;
  cardTags: string[];
  modalTitle: string;
  overview: string;
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
  /** Screenshot for the card panel. Falls back to `glyph` when absent. */
  screenshot?: string;
  /** Line-art mark used when there is no screenshot. */
  glyph: GlyphName;
};

export const FEATURED_PROJECT_ID = 'ergonomic-risk' as const;

export const PROJECT_GROUPS: { id: ProjectGroup; label: string }[] = [
  { id: 'apps', label: 'Apps & interfaces' },
  { id: 'data', label: 'Data & systems' },
];

export const PROJECTS: Project[] = [
  {
    id: 'ergonomic-risk',
    cardTitle: 'Ergonomic Risk Detection',
    kind: 'Research',
    group: 'data',
    glyph: 'chart',
    cardDescription:
      'Wearable EMG and IMU data from controlled repetitive-lifting trials, trained with logistic and random forest models to classify high- vs low-risk biomechanical conditions.',
    cardTags: ['Python', 'EMG', 'IMU', 'Random Forest'],
    modalTitle: 'Ergonomic Risk Detection Research',
    overview:
      'This project investigates binary risk classification during repetitive lifting using surface EMG (biceps and deltoids) and IMU signals. After preprocessing and feature extraction, models including logistic regression and random forest were trained and evaluated for EMG-only and IMU-only pipelines, toward later multimodal fusion for stronger prediction.',
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
  },
  {
    id: 'runningmap',
    cardTitle: 'RunningMap',
    kind: 'Route planner',
    group: 'apps',
    glyph: 'route',
    liveUrl: 'https://runningmap.app.space',
    screenshot: shotRunningMap,
    cardDescription:
      'Plot a running route leg by leg on an interactive map — drag a point to fine-tune the line, shift-click to remove it — with live distance and walk, bike or drive pacing as the route grows.',
    cardTags: ['React', 'Mapping', 'Geolocation'],
    modalTitle: 'RunningMap — Route Planner',
    overview:
      'A browser route planner for runners. Tap the map to drop a start point and keep tapping to extend the line; each point stays draggable so a route can be nudged onto the right side of a street after the fact. Distance updates continuously, and the pace model switches between walk, bike, drive and manual.',
    keyFeatures: [
      'Tap-to-draw routing with draggable waypoints and shift-click removal',
      'Live distance readout and walk / bike / drive / manual pacing modes',
      'Place search to jump the map to an address or landmark',
      'Parks-nearby lookup and freehand shape drawing for area planning',
      'Accounts for saving routes, with an anonymous mode for one-off planning',
    ],
    technologies: ['React', 'TypeScript', 'MapLibre', 'OpenFreeMap', 'Geolocation API'],
  },
  {
    id: 'drawspace',
    cardTitle: 'DrawSpace',
    kind: 'Diagram canvas',
    group: 'apps',
    glyph: 'draw',
    liveUrl: 'https://drawspace.app.space',
    screenshot: shotDrawSpace,
    cardDescription:
      'An infinite diagramming canvas with pen, shape, arrow and text tools that render in a hand-drawn style, organised into files and folders with zoom and full undo history.',
    cardTags: ['React', 'Canvas', 'Diagramming'],
    modalTitle: 'DrawSpace — Diagram Canvas',
    overview:
      'A sketching and diagramming tool built around a hand-drawn rendering style, so a flowchart looks like something worked out on paper rather than generated. Shapes snap to connectors, arrows follow their endpoints, and everything lives on a pannable infinite canvas.',
    keyFeatures: [
      'Pen, rectangle, diamond, ellipse, arrow, line and text tools',
      'Hand-drawn rendering style for shapes, connectors and labels',
      'Infinite pannable canvas with zoom controls and full undo / redo',
      'File and folder organisation across multiple canvases, plus a trash bin',
      'Search across saved canvases and account sync between devices',
    ],
    technologies: ['React', 'TypeScript', 'Canvas API', 'SVG'],
  },
  {
    id: 'bookwithme',
    cardTitle: 'BookWithMe',
    kind: 'Scheduling',
    group: 'apps',
    glyph: 'calendar',
    liveUrl: 'https://bookwithme.app.space',
    screenshot: shotBookWithMe,
    cardDescription:
      'Publishes a booking page for a meeting type — duration, description and live availability — so a guest picks a slot in their own time zone and it lands on the host schedule.',
    cardTags: ['React', 'Scheduling', 'Calendar'],
    modalTitle: 'BookWithMe — Scheduling Links',
    overview:
      'A scheduling tool that turns open calendar availability into a shareable link. The host defines a meeting type — name, duration and description — and guests land on a clean booking page showing only the slots that are genuinely free, rendered in whichever time zone the guest is in.',
    keyFeatures: [
      'Per-meeting-type booking pages with duration and description',
      'Month calendar that greys out days with no remaining availability',
      'Guest-side time-zone selection, defaulting to the visitor’s own zone',
      'Host schedule view showing what is already booked for a given day',
      'Shareable public link, no account required for the guest',
    ],
    technologies: ['React', 'TypeScript', 'Calendar API', 'Date-fns'],
  },
  {
    id: 'docs',
    cardTitle: 'Docs',
    kind: 'Document workspace',
    group: 'apps',
    glyph: 'doc',
    liveUrl: 'https://docs.app.space',
    screenshot: shotDocs,
    cardDescription:
      'A document workspace with a searchable library, folders, templates and sharing — documents open into a block editor with live formatting and autosave.',
    cardTags: ['React', 'Rich Text', 'Editor'],
    modalTitle: 'Docs — Document Workspace',
    overview:
      'A writing workspace rather than a single editor: documents are organised into folders, favourited, shared, and found again through search. Opening one drops into a block-based editor with live formatting and autosave, so there is no explicit save step.',
    keyFeatures: [
      'Searchable document library with folders, favourites and an uncategorised bin',
      'Templates for starting a document from a known structure',
      'Block-based editor with live formatting and autosave',
      'Shared-with-me view for documents other people have sent over',
      'Grid and list layouts, sorted by last edited',
    ],
    technologies: ['React', 'TypeScript', 'Rich Text Editor', 'Autosave'],
  },
  {
    id: 'hand-tracker',
    cardTitle: 'Hand Tracking 3D Cube',
    kind: 'Computer vision',
    group: 'apps',
    glyph: 'hand',
    cardDescription:
      'Maps 21 MediaPipe hand landmarks onto a 3D cube in real time: an open right palm rotates it, a two-finger pinch scales it, with smoothing to kill jitter.',
    cardTags: ['Python', 'MediaPipe', 'OpenCV', 'NumPy'],
    modalTitle: 'Hand Tracking 3D Cube Controller',
    overview:
      'An interactive Python application that controls a 3D cube with hand gestures alone. MediaPipe tracks 21 landmarks per hand from a webcam feed; the app reads hand orientation and finger state from those landmarks and maps them onto rotation and scale, with smoothing applied so the cube does not judder on noisy frames.',
    keyFeatures: [
      'Right-palm rotation: hand pitch and yaw drive cube rotation around X and Y',
      'Two-finger pinch scaling using one index finger from each hand',
      'Smoothing algorithms to suppress jitter from frame-to-frame landmark noise',
      'Colour-coded cube edges and live hand-landmark visualisation',
      'Real-time processing straight from the webcam via OpenCV',
    ],
    technologies: ['Python', 'MediaPipe', 'OpenCV', 'NumPy'],
    githubUrl: `${GITHUB_URL}/hand_tracker`,
  },
  {
    id: 'nba-analytics',
    cardTitle: 'NBA Analytics Engine',
    kind: 'Data science',
    group: 'data',
    glyph: 'chart',
    cardDescription:
      'Predictive modeling for basketball performance. Processes massive datasets to uncover hidden player efficiency trends.',
    cardTags: ['Python', 'Pandas', 'Scikit-learn', 'NumPy'],
    modalTitle: 'NBA Statistic Analysis',
    overview:
      'A comprehensive data analysis project that processes NBA player and team statistics to identify performance trends and predictive insights. Utilizes Python data science libraries to create visualizations and statistical models for understanding basketball analytics and player performance patterns.',
    keyFeatures: [
      'Statistical analysis of player performance',
      'Team performance trend analysis',
      'Predictive modeling for game outcomes',
      'Interactive data visualizations',
      'Comprehensive statistical reports',
    ],
    technologies: ['Python', 'Data Analysis', 'Matplotlib', 'Pandas', 'NumPy'],
    githubUrl: `${GITHUB_URL}/NBA-Statistic-Analysis---184-Proj`,
  },
  {
    id: 'gaming-scraping',
    cardTitle: 'Gaming Statistics & Web Scraping',
    kind: 'Data science',
    group: 'data',
    glyph: 'scrape',
    cardDescription:
      'Scrapes gaming statistics from online platforms to study player behavior, trends, and competitive patterns.',
    cardTags: ['Python', 'Web Scraping', 'Data Analysis'],
    modalTitle: 'Gaming Statistic/Web Scraping Analysis',
    overview:
      'A data collection and analysis project that scrapes gaming statistics from various online platforms to study player behavior and game performance metrics. Combines web scraping techniques with data analysis to uncover insights about gaming trends, player preferences, and competitive gaming patterns.',
    keyFeatures: [
      'Automated web scraping from gaming platforms',
      'Player behavior analysis',
      'Game performance metrics tracking',
      'Trend analysis and pattern recognition',
      'Competitive gaming insights',
    ],
    technologies: ['Python', 'Web Scraping', 'Data Analysis', 'Data Extraction'],
    githubUrl: `${GITHUB_URL}/Gaming-Statistic-Web-Scrapping-Analysis`,
  },
];

export const FEATURED_PROJECT = PROJECTS.find((p) => p.id === FEATURED_PROJECT_ID)!;
export const GRID_PROJECTS = PROJECTS.filter((p) => p.id !== FEATURED_PROJECT_ID);

/** Grid projects for one group, in declaration order. */
export const projectsInGroup = (group: ProjectGroup) =>
  GRID_PROJECTS.filter((p) => p.group === group);

