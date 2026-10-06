// What the tracer reads off each reference sheet, and which module each drawing is written to.
// Boxes, masks and picks are in the sheet's own pixels; see `trace` in trace-sketch.mjs for the options.
import { goldenGate } from './sketch-bridge.mjs';

/** The first sketch: one home screen, 1536 × 1024. The map, the tools and the mouse come from it. */
const HOME = 'home-sketch.png';
/** The landscape grid of five screens, 1536 × 1024. The person at the desk and the window come from it. */
const GRID = 'sketchbook-grid.png';
/** The portrait collage of six screens, 1214 × 1295. The paper plane and the hand marks come from it. */
const MONO = 'monochrome-collage.png';

/** Lettering on the home map that the page types itself, the plane, and the desk the old sketch had under the map. */
const MAP_MASKS = [
  [525, 365, 650, 440],
  [1405, 415, 1490, 455],
  [955, 335, 1035, 385],
  [895, 655, 1230, 720],
  [1150, 700, 1300, 720],
];

/**
 * The person at the desk sits under the map's south-east corner, as the grid's home screen has it.
 * The grid's home is about half the size of the first sketch, so its strokes are scaled up to the
 * first sketch's coordinates: the grid's map starts near (300, 115) and the first sketch's near (620, 220).
 */
const DESK_SCALE = 1.99;
const deskTo = (x, y) => ({ x: 620 + (x - 300) * DESK_SCALE, y: 220 + (y - 115) * DESK_SCALE, scale: DESK_SCALE });

const TOOL_BOX = [80, 695, 440, 755];
const tool = (name, about, from, to) => ({
  name,
  about,
  origin: true,
  regions: [{ src: HOME, box: TOOL_BOX, thr: 150, k: 3, weight: 0.8, pick: (b) => b.x0 >= from && b.x1 <= to }],
});

/** A hand mark the pages place themselves: traced where it is, then moved to its own origin. */
const mark = (name, about, region) => ({ name, about, origin: true, regions: [{ k: 5, thr: 185, weight: 0.8, tol: 0.45, ...region }] });

/** In the window, the low buildings west of Taipei 101 make room for the bridge. */
const BRIDGE_PLOT = [1376, 208, 1426, 262];

export const OUTPUTS = [
  {
    file: 'src/pages/home/sketch.ts',
    about: "the home screen. Coordinates are the first sketch's own, a 1536 × 1024 sheet.",
    drawings: [
      {
        name: 'MAP',
        about: 'The world in pencil, coast by coast from west to east, with the dashes of the flight across it.',
        regions: [{ src: HOME, box: [500, 210, 1500, 720], thr: 228, k: 2, mask: MAP_MASKS, minLen: 3, tol: 0.45, weight: 0.85, order: 'west' }],
      },
      {
        name: 'PLANE',
        about: 'The plane on the flight, where the sketch has it over the Atlantic.',
        regions: [{ src: HOME, box: [955, 335, 1035, 385], thr: 150, k: 4, fills: 2.5, minLen: 99 }],
      },
      {
        name: 'DESK',
        about: 'The person at the desk: the chair, the hoodie, the laptop, the mug and the book.',
        regions: [
          {
            src: GRID,
            box: [492, 326, 748, 446],
            thr: 208,
            k: 4,
            fills: 11,
            mask: [[636, 300, 760, 349]],
            to: deskTo(492, 326),
            weight: 0.6,
            maxW: 3,
            order: 'west',
          },
        ],
      },
      {
        name: 'ROLE_LINE',
        about: 'The stroke under the role.',
        origin: true,
        regions: [{ src: HOME, box: [82, 474, 472, 500], thr: 170, k: 3, weight: 0.85 }],
      },
      tool('TOOL_TYPESCRIPT', 'The tools under the blurb, left to right: TypeScript.', 80, 135),
      tool('TOOL_REACT', 'React.', 145, 205),
      tool('TOOL_NODE', 'Node.', 220, 280),
      tool('TOOL_CODE', 'Code.', 295, 360),
      tool('TOOL_CLOUD', 'Cloud.', 375, 440),
      {
        name: 'MOUSE',
        about: 'The mouse over `Scroll to explore`.',
        origin: true,
        regions: [{ src: HOME, box: [740, 875, 800, 925], thr: 150, k: 3, weight: 0.8 }],
      },
    ],
  },
  {
    file: 'src/pages/about/sketch.ts',
    about: "the About page. Coordinates are the grid sheet's own.",
    drawings: [
      {
        name: 'WINDOW',
        about:
          'The desk by the window: the frame, Taipei 101 over the skyline with the Golden Gate in front of it, the plant, the laptop, the cups and the book.',
        regions: [
          {
            src: GRID,
            box: [1168, 96, 1512, 388],
            thr: 226,
            k: 4,
            fills: 7,
            weight: 0.62,
            maxW: 1.9,
            // The note is typed by the page (its underline stays), and the bridge takes the low buildings' plot.
            mask: [[[1200, 136], [1296, 136], [1296, 200], [1205, 224]], BRIDGE_PLOT],
            order: 'north',
          },
          {
            make: () => goldenGate({ left: 1369.5, west: 1385, east: 1414, shore: 1430, deck: 249, top: 220, water: 257.5, rise: 1.2 }),
            order: 'made',
          },
        ],
      },
    ],
  },
  {
    file: 'src/pages/contact/sketch.ts',
    about: "the Contact page. Coordinates are the collage sheet's own.",
    drawings: [
      {
        name: 'TRAIL',
        about: 'The dashes the paper plane leaves behind it, from where it set off to where it is.',
        regions: [
          {
            src: MONO,
            box: [1078, 812, 1200, 945],
            thr: 205,
            k: 4,
            weight: 0.8,
            order: 'trail',
            from: [1196, 932],
            pick: (b) => !(b.x0 > 1100 && b.x1 < 1136 && b.y1 < 846),
          },
        ],
      },
      {
        name: 'PAPER_PLANE',
        about: 'The paper plane itself.',
        regions: [{ src: MONO, box: [1078, 812, 1200, 945], thr: 205, k: 5, weight: 0.8, pick: (b) => b.x0 > 1100 && b.x1 < 1136 && b.y1 < 846 }],
      },
    ],
  },
  {
    file: 'src/components/sketch/marks.ts',
    about: 'the hand marks every page shares: arrows, underlines, a squiggle, a smile. Each sits at its own origin.',
    drawings: [
      mark('UNDERLINE', 'The stroke under a page title.', { src: GRID, box: [812, 117, 944, 135], mask: [[[808, 100], [946, 100], [946, 117.5], [808, 126.5]]] }),
      mark('UNDERSCORE', 'The shorter, steeper stroke under a note.', { src: GRID, box: [1444, 924, 1504, 948] }),
      mark('ARROW_RIGHT', 'A small arrow, pointing on.', { src: GRID, box: [1482, 908, 1502, 924] }),
      mark('ARROW_LONG', 'The longer arrow under `Code, Build, Ship`, drawn with a flick.', { src: MONO, box: [41, 539, 70, 556] }),
      mark('ARROW_DOWN', 'The arrow beside `Scroll`.', { src: GRID, box: [48, 392, 66, 434] }),
      mark('SQUIGGLE', 'The wavy line that closes a page.', { src: MONO, box: [436, 554, 728, 582], thr: 212 }),
      mark('SMILE', 'The smile after `Thanks for stopping by!`.', { src: MONO, box: [1142, 1138, 1161, 1157] }),
    ],
  },
];
