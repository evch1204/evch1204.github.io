import type { Tab } from '@/layout/nav';

/** Where a doodle takes the reader: a tab, or a project page on the projects tab. */
export type Destination = { tab: Tab; project?: string };

type DoodlePath = {
  /** A `<path>` in the drawing's 120 × 120 box. */
  d: string;
  /** Names the piece the hover animation moves; see home-doodles.css. */
  part?: string;
};

type Doodle = {
  id: string;
  /** Spoken name, and the caption under it on hover. */
  label: string;
  to: Destination;
  paths: DoodlePath[];
  /** Where its centre sits, as a percentage of the hero. */
  at: { x: number; y: number };
  /** Width in px at desktop; phones draw it at about two thirds. */
  size: number;
  /** The few that fit a phone screen, and where their centres sit there, clear of the name and the actions. */
  phone?: { x: number; y: number };
};

/**
 * Line drawings of the school, the company and the things built: the Mission
 * Church, DeepSpace's four-point star in its orbit, and one scene per project.
 * Each is data: a few paths in the pen of the hello, a place on the page, and
 * where a tap goes. The order is the pen's route: clockwise round the name
 * from the tail of the hello, so it never doubles back.
 */
export const DOODLES: Doodle[] = [
  {
    id: 'deepspace',
    label: 'DeepSpace',
    to: { tab: 'experience' },
    paths: [
      { d: 'M 60 16 C 62 46, 74 58, 104 60 C 74 62, 62 74, 60 104 C 58 74, 46 62, 16 60 C 46 58, 58 46, 60 16 Z' },
      { d: 'M 36 36 L 45 45 M 84 36 L 75 45 M 36 84 L 45 75 M 84 84 L 75 75', part: 'rays' },
      { d: 'M 108.9 42.2 A 52 22 -20 1 0 11.1 77.8 A 52 22 -20 1 0 108.9 42.2 M 108.9 42.2 m -3.2 0 a 3.2 3.2 0 1 0 6.4 0 a 3.2 3.2 0 1 0 -6.4 0', part: 'orbit' },
      { d: 'M 100 14 v 10 M 95 19 h 10 M 18 100 m -2.4 0 a 2.4 2.4 0 1 0 4.8 0 a 2.4 2.4 0 1 0 -4.8 0 M 106 104 m -1.6 0 a 1.6 1.6 0 1 0 3.2 0 a 1.6 1.6 0 1 0 -3.2 0', part: 'sparkle' },
    ],
    at: { x: 80.6, y: 28 }, size: 120, phone: { x: 82, y: 17 },
  },
  {
    id: 'bookwithme',
    label: 'BookWithMe',
    to: { tab: 'projects', project: 'bookwithme' },
    paths: [
      { d: 'M 26 26 H 94 A 8 8 0 0 1 102 34 V 94 A 8 8 0 0 1 94 102 H 26 A 8 8 0 0 1 18 94 V 34 A 8 8 0 0 1 26 26 Z M 18 46 H 102 M 38 18 V 34 M 82 18 V 34' },
      { d: 'M 32 58 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 46 58 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 60 58 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 74 58 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 88 58 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 32 70 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 46 70 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 60 70 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 74 70 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 88 70 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 32 82 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 46 82 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 60 82 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 74 82 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 88 82 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 32 94 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 46 94 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 60 94 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 74 94 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0 M 88 94 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0' },
      { d: 'M 60 82 m -7 0 a 7 7 0 1 0 14 0 a 7 7 0 1 0 -14 0', part: 'day' },
      { d: 'M 100 100 m -13 0 a 13 13 0 1 0 26 0 a 13 13 0 1 0 -26 0 M 100 100 V 91 M 100 100 H 107', part: 'clock' },
    ],
    at: { x: 90, y: 48 }, size: 108,
  },
  {
    id: 'hand-tracker',
    label: 'Hand tracker',
    to: { tab: 'projects', project: 'hand-tracker' },
    paths: [
      { d: 'M 53 104 L 41 94 L 33 85 L 28 76 L 24 68 M 53 104 L 45 73 L 42 59 L 40 49 L 39 40 M 45 73 L 54 70 L 53 55 L 53 43 L 53 34 M 54 70 L 62 73 L 64 58 L 65 48 L 66 39 M 62 73 L 70 78 L 75 67 L 78 59 L 81 52 M 53 104 L 70 78' },
      { d: 'M 53 104 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 41 94 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 33 85 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 28 76 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 24 68 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 45 73 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 42 59 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 40 49 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 39 40 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 54 70 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 53 55 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 53 43 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 53 34 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 62 73 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 64 58 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 65 48 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 66 39 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 70 78 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 75 67 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 78 59 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0 M 81 52 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0', part: 'joints' },
      { d: 'M 82 30 H 102 V 50 H 82 Z M 90 22 H 110 V 42 H 90 Z M 82 30 L 90 22 M 102 30 L 110 22 M 102 50 L 110 42 M 82 50 L 90 42', part: 'cube' },
    ],
    at: { x: 80.6, y: 68 }, size: 120,
  },
  {
    id: 'mow',
    label: 'mow your commits',
    to: { tab: 'projects', project: 'mow-your-commits' },
    paths: [
      { d: 'M 10 62 h 10 v 9 h -10 Z M 24 62 h 10 v 9 h -10 Z M 38 62 h 10 v 9 h -10 Z M 52 62 h 10 v 9 h -10 Z M 66 62 h 10 v 9 h -10 Z M 80 62 h 10 v 9 h -10 Z M 94 62 h 10 v 9 h -10 Z M 10 75 h 10 v 9 h -10 Z M 24 75 h 10 v 9 h -10 Z M 38 75 h 10 v 9 h -10 Z M 52 75 h 10 v 9 h -10 Z M 66 75 h 10 v 9 h -10 Z M 80 75 h 10 v 9 h -10 Z M 94 75 h 10 v 9 h -10 Z M 10 88 h 10 v 9 h -10 Z M 24 88 h 10 v 9 h -10 Z M 38 88 h 10 v 9 h -10 Z M 52 88 h 10 v 9 h -10 Z M 66 88 h 10 v 9 h -10 Z M 80 88 h 10 v 9 h -10 Z M 94 88 h 10 v 9 h -10 Z M 10 101 h 10 v 9 h -10 Z M 24 101 h 10 v 9 h -10 Z M 38 101 h 10 v 9 h -10 Z M 52 101 h 10 v 9 h -10 Z M 66 101 h 10 v 9 h -10 Z M 80 101 h 10 v 9 h -10 Z M 94 101 h 10 v 9 h -10 Z' },
      { d: 'M 26.5 69 l 1.3 -3.5 l 1.3 3.5 M 30 69 l 1.3 -3.5 l 1.3 3.5 M 68.5 69 l 1.3 -3.5 l 1.3 3.5 M 72 69 l 1.3 -3.5 l 1.3 3.5 M 12.5 82 l 1.3 -3.5 l 1.3 3.5 M 16 82 l 1.3 -3.5 l 1.3 3.5 M 54.5 82 l 1.3 -3.5 l 1.3 3.5 M 58 82 l 1.3 -3.5 l 1.3 3.5 M 96.5 82 l 1.3 -3.5 l 1.3 3.5 M 100 82 l 1.3 -3.5 l 1.3 3.5 M 26.5 95 l 1.3 -3.5 l 1.3 3.5 M 30 95 l 1.3 -3.5 l 1.3 3.5 M 54.5 95 l 1.3 -3.5 l 1.3 3.5 M 58 95 l 1.3 -3.5 l 1.3 3.5 M 82.5 95 l 1.3 -3.5 l 1.3 3.5 M 86 95 l 1.3 -3.5 l 1.3 3.5 M 40.5 108 l 1.3 -3.5 l 1.3 3.5 M 44 108 l 1.3 -3.5 l 1.3 3.5 M 82.5 108 l 1.3 -3.5 l 1.3 3.5 M 86 108 l 1.3 -3.5 l 1.3 3.5', part: 'grass' },
      { d: 'M 30 54 h 26 v -9 h -26 Z M 35 56 m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 M 52 56 m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 M 56 46 L 72 26 M 70 28 L 76 32 M 44 45 V 40 H 50', part: 'mower' },
      { d: 'M 24 44 m -1.2 0 a 1.2 1.2 0 1 0 2.4 0 a 1.2 1.2 0 1 0 -2.4 0 M 20 50 m -1 0 a 1 1 0 1 0 2 0 a 1 1 0 1 0 -2 0 M 27 50 m -0.9 0 a 0.9 0.9 0 1 0 1.8 0 a 0.9 0.9 0 1 0 -1.8 0', part: 'clippings' },
    ],
    at: { x: 57, y: 76 }, size: 112,
  },
  {
    id: 'nba',
    label: 'NBA analytics',
    to: { tab: 'projects', project: 'nba-analytics' },
    paths: [
      { d: 'M 40 50 A 26 26 0 1 0 40 102 A 26 26 0 1 0 40 50 Z M 40 50 V 102 M 14 76 H 66 M 22 58 C 34 68, 34 84, 22 94 M 58 58 C 46 68, 46 84, 58 94', part: 'ball' },
      { d: 'M 66 12 V 60 H 112' },
      { d: 'M 71 60 V 44 H 77 V 60 M 81 60 V 34 H 87 V 60 M 91 60 V 40 H 97 V 60 M 101 60 V 20 H 107 V 60', part: 'bars' },
    ],
    at: { x: 30, y: 75 }, size: 116, phone: { x: 82, y: 78 },
  },
  {
    id: 'runningmap',
    label: 'RunningMap',
    to: { tab: 'projects', project: 'runningmap' },
    paths: [
      { d: 'M 22 16 H 98 A 8 8 0 0 1 106 24 V 100 A 8 8 0 0 1 98 108 H 22 A 8 8 0 0 1 14 100 V 24 A 8 8 0 0 1 22 16 Z' },
      { d: 'M 14 46 H 106 M 14 80 H 106 M 50 16 V 108 M 82 16 V 108 M 28 60 C 36 60, 36 70, 28 70' },
      { d: 'M 92 94 m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 M 96 86 m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0 M 92 98 v 6' },
      { d: 'M 26 96 C 32 80, 44 90, 50 70 C 56 50, 70 66, 82 50 C 88 42, 92 36, 96 30', part: 'route' },
      { d: 'M 26 96 m -3.5 0 a 3.5 3.5 0 1 0 7 0 a 3.5 3.5 0 1 0 -7 0' },
      { d: 'M 96 32 C 90 26, 86 22, 86 14 A 10 10 0 0 1 106 14 C 106 22, 102 26, 96 32 Z M 96 14 m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0', part: 'pin' },
    ],
    at: { x: 12.4, y: 58.6 }, size: 118, phone: { x: 16, y: 80 },
  },
  {
    id: 'scu',
    label: 'Santa Clara University',
    to: { tab: 'experience' },
    paths: [
      { d: 'M 4 104 H 116 M 16 104 V 46 M 40 104 V 46 M 13 46 H 43 M 16 46 L 28 32 L 40 46 M 28 32 V 23 M 24 27 H 32' },
      { d: 'M 23 66 V 58 A 5 5 0 0 1 33 58 V 66 Z M 23 88 V 80 A 5 5 0 0 1 33 80 V 88 Z' },
      { d: 'M 25.5 64 C 25.5 60, 27 58.5, 28 58.5 C 29 58.5, 30.5 60, 30.5 64 Z M 28 65.5 m -0.9 0 a 0.9 0.9 0 1 0 1.8 0 a 0.9 0.9 0 1 0 -1.8 0', part: 'bell' },
      { d: 'M 110 104 V 56 M 40 56 H 110 M 40 56 C 48 36, 72 30, 75 30 C 78 30, 102 36, 110 56 M 75 30 V 18 M 70 23 H 80 M 75 46 m -5 0 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0' },
      { d: 'M 52 104 V 62 M 49 62 H 55 M 98 104 V 62 M 95 62 H 101 M 64 104 V 82 A 11 11 0 0 1 86 82 V 104 M 75 104 V 74 M 58 104 V 100 H 92 V 104' },
      { d: 'M 6 104 C 6 97, 14 97, 14 104 M 102 104 C 102 98, 110 98, 110 104' },
    ],
    at: { x: 12.4, y: 37.4 }, size: 128, phone: { x: 16, y: 19 },
  },
  {
    id: 'gaming',
    label: 'Gaming scraping',
    to: { tab: 'projects', project: 'gaming-scraping' },
    paths: [
      { d: 'M 32 66 H 68 C 80 66, 86 80, 84 94 C 83 102, 76 104, 70 98 L 65 90 H 35 L 30 98 C 24 104, 17 102, 16 94 C 14 80, 20 66, 32 66 Z M 34 74 V 86 M 28 80 H 40 M 64 76 m -2.5 0 a 2.5 2.5 0 1 0 5 0 a 2.5 2.5 0 1 0 -5 0 M 72 82 m -2.5 0 a 2.5 2.5 0 1 0 5 0 a 2.5 2.5 0 1 0 -5 0', part: 'pad' },
      { d: 'M 66 10 V 52 H 112' },
      { d: 'M 74 44 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0 M 80 36 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0 M 88 40 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0 M 94 28 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0 M 102 30 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0 M 108 18 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0', part: 'dots' },
      { d: 'M 72 47 L 110 16', part: 'trend' },
    ],
    at: { x: 30, y: 21.2 }, size: 112,
  },
  {
    id: 'ergonomic',
    label: 'Ergonomic risk',
    to: { tab: 'projects', project: 'ergonomic-risk' },
    paths: [
      { d: 'M 26 22 m -6 0 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0 M 29 30 C 40 36, 50 48, 55 62 M 36 35 C 44 44, 54 54, 63 66 M 55 62 C 50 76, 46 90, 46 104 M 55 62 C 60 74, 66 88, 68 104 M 40 104 H 52 M 64 104 H 76' },
      { d: 'M 62 68 h 24 v 20 h -24 Z M 62 74 H 86', part: 'box' },
      { d: 'M 44 46 l 7 5 l -4 5 l -7 -5 Z M 50 50 C 62 50, 64 24, 72 24', part: 'electrode' },
      { d: 'M 72 24 H 78 L 82 12 L 88 36 L 94 6 L 100 42 L 106 18 L 110 28 H 118', part: 'wave' },
    ],
    at: { x: 57, y: 20 }, size: 116,
  },
];
