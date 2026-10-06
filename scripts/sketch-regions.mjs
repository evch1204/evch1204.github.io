// What the tracer reads off each reference sheet, and which module each drawing is written to.
// Boxes, masks and picks are in the sheet's own pixels; see `trace` in trace-sketch.mjs for the options.
import { goldenGate } from './sketch-bridge.mjs';

/** The first sketch: one home screen, 1536 × 1024. The map, the tools, the mug and the mouse come from it. */
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
/** The map and everything drawn over it. Coasts are meant to wander, so the hand evens them out less than a ruled line. */
const MAP_REGION = { src: HOME, box: [500, 210, 1500, 720], thr: 227, k: 3, mask: MAP_MASKS, minLen: 9, smooth: 1.0, fit: 0.45, straight: 0.3, cornerAngle: 58, weight: 0.9, minW: 1.2, maxW: 2.2, tone: 1, hatchBelow: 1.35, dedupe: 1.9 };

/**
 * The flight between Taiwan and Santa Clara, as the page flies it: a curve fitted to the sketch's
 * dashes (the same one SketchScene moves the plane along). A short stroke that lies along it is a
 * dash of the flight; everything else in the region is the map.
 */
const ROUTE = Array.from({ length: 240 }, (_, i) => {
  const t = i / 239, u = 1 - t;
  return [u * u * 706 + 2 * u * t * 1036.5 + t * t * 1367, u * u * 403 + 2 * u * t * 288.5 + t * t * 476];
});
const fromRoute = ([x, y]) => ROUTE.reduce((min, [rx, ry]) => Math.min(min, Math.hypot(rx - x, ry - y)), Infinity);
const isDash = (stroke) => stroke.len < 36 && stroke.pts.every((p) => fromRoute(p) < 7);

// ---- The person at the desk --------------------------------------------------------------------
/**
 * The desk sits under the map's south-east corner, as the grid's home screen has it. The grid's
 * home is about half the size of the first sketch, so its strokes are scaled up to the first
 * sketch's coordinates: the grid's map starts near (300, 115) and the first sketch's near (620, 220).
 */
const DESK_SCALE = 1.99;
const onDesk = (x, y) => [620 + (x - 300) * DESK_SCALE, 220 + (y - 115) * DESK_SCALE];
const deskTo = (x, y) => ({ x: onDesk(x, y)[0], y: onDesk(x, y)[1], scale: DESK_SCALE });
/** A box of the grid sheet, as it lies on the desk: for sorting the traced strokes into things. */
const deskBox = ([x0, y0, x1, y1]) => [...onDesk(x0, y0), ...onDesk(x1, y1)];
const within = (b, [x0, y0, x1, y1]) => b.x0 >= x0 && b.x1 <= x1 && b.y0 >= y0 && b.y1 <= y1;
const centred = (b, [x0, y0, x1, y1]) => (b.x0 + b.x1) / 2 >= x0 && (b.x0 + b.x1) / 2 <= x1 && (b.y0 + b.y1) / 2 >= y0 && (b.y0 + b.y1) / 2 <= y1;

const DESK_BOX = [492, 326, 748, 446];
/** The head is traced on its own, so the hair, curls and all, is lifted out as one solid shape. */
const HEAD = [566, 327, 609, 361];
/** The grid's own mug is small and smudged; the first sketch's mug, drawn large, stands in its place. */
const GRID_MUG = [664, 389, 693, 419];
const DESK_MASKS = [[636, 300, 760, 349], HEAD, GRID_MUG];
/**
 * The desk is traced twice. The first pass takes only the dark ink, so lines that run close
 * together (a screen's bezel, a keyboard's edge) stay apart; the second takes the faint lines the
 * first left behind: the writing on the screen, the hatching, the edge of the desk.
 */
const DESK_INK = { src: GRID, box: DESK_BOX, thr: 150, k: 6, mask: DESK_MASKS, to: deskTo(DESK_BOX[0], DESK_BOX[1]), weight: 0.78, minW: 1.4, maxW: 2.8, smooth: 1.3, fit: 0.35, straight: 0.5, tone: 1, dedupe: 2.4 };
const DESK_PENCIL = { ...DESK_INK, thr: 208, clearOf: { thr: 150, by: 2.2 }, weight: 0.7, minW: 1.1, maxW: 1.6, minLen: 3, tone: 0.75, dedupe: 2.4 };
const DESK_HEAD = { src: GRID, box: [560, 324, 614, 364], thr: 208, k: 4, keep: [HEAD], fills: 3.2, to: deskTo(560, 324), weight: 0.6, minW: 1.4, maxW: 2.8, smooth: 1.3, fit: 0.4, tone: 1 };

const LAPTOP = deskBox([603, 357, 669, 421]);
const SCREEN = deskBox([611, 365, 661, 404]);
const BOOK = deskBox([677, 407, 730, 434]);
const PERSON = deskBox([520, 326, 634, 447]);
const isLaptop = (b) => within(b, LAPTOP);
const isBook = (b) => !isLaptop(b) && centred(b, BOOK);
const isPerson = (b) => !isLaptop(b) && !isBook(b) && centred(b, PERSON);
const isSurface = (b) => !isLaptop(b) && !isBook(b) && !isPerson(b);

/** The first sketch's mug, set down where the grid's mug stood, at half size. Its steam is its own drawing. */
const MUG_BOX = [1300, 708, 1390, 832];
const MUG_AT = { x: onDesk(668.5, 0)[0] - (1307 - MUG_BOX[0]) * 0.5, y: onDesk(0, 414.5)[1] - (822 - MUG_BOX[1]) * 0.5, scale: 0.5 };
const MUG_REGION = { src: HOME, box: MUG_BOX, thr: 150, k: 3, fills: 4, smooth: 1.4, fit: 0.35, to: MUG_AT, weight: 1.1, minW: 1.4, maxW: 2.6, tone: 1 };
const mugY = (y) => MUG_AT.y + (y - MUG_BOX[1]) * MUG_AT.scale;
const mugX = (x) => MUG_AT.x + (x - MUG_BOX[0]) * MUG_AT.scale;
const isSteam = (b) => b.y1 < mugY(747);
/** The shadow hatched on the old desk under the mug stays on the old desk: it runs out past the cup, or lies below it. */
const isHatch = (b) => b.y0 > mugY(811) && (b.x0 < mugX(1306) || b.x1 > mugX(1357) || b.y0 > mugY(823));

const TOOL_REGION = { src: HOME, box: [80, 695, 440, 755], thr: 150, k: 3, weight: 0.8, smooth: 1.2, fit: 0.35, tone: 1 };
const tool = (name, about, from, to) => ({
  name,
  about,
  origin: true,
  regions: [{ ...TOOL_REGION, pick: (b) => b.x0 >= from && b.x1 <= to }],
});

/** A hand mark the pages place themselves: traced where it is, then moved to its own origin. */
const mark = (name, about, region) => ({ name, about, origin: true, regions: [{ k: 5, thr: 185, weight: 0.8, smooth: 1.6, fit: 0.4, straight: 0.6, tone: 1, ...region }] });

/** In the window, the low buildings west of Taipei 101 make room for the bridge. */
const BRIDGE_PLOT = [1376, 208, 1426, 262];

/** The paper plane and its trail share a region; the plane is the knot of strokes at the top of it. */
const PLANE_REGION = { src: MONO, box: [1078, 812, 1200, 945], thr: 205, k: 5, weight: 0.8, smooth: 1.2, fit: 0.35, tone: 1 };
const isPlane = (b) => b.x0 > 1100 && b.x1 < 1136 && b.y1 < 846;

export const OUTPUTS = [
  {
    file: 'src/pages/home/sketch.ts',
    about: "the home screen. Coordinates are the first sketch's own, a 1536 × 1024 sheet.",
    drawings: [
      {
        name: 'MAP',
        about: 'The world in pencil, coast by coast.',
        regions: [{ ...MAP_REGION, order: 'west', pick: (b, stroke) => !stroke || !isDash(stroke) }],
      },
      {
        name: 'FLIGHT',
        about: 'The dashes of the flight across the map, from Taiwan to Santa Clara in the order they are flown.',
        regions: [{ ...MAP_REGION, minLen: 3, order: 'east', pick: (b, stroke) => !!stroke && isDash(stroke) }],
      },
      {
        name: 'PLANE',
        about: 'The plane on the flight, where the sketch has it over the Atlantic.',
        regions: [{ src: HOME, box: [955, 335, 1035, 385], thr: 150, k: 4, fills: 2.5, minLen: 99, smooth: 0.7, fit: 0.3 }],
      },
      {
        name: 'PERSON',
        about: 'The person at the desk, in a hoodie, on a chair.',
        regions: [
          { ...DESK_INK, order: 'west', pick: isPerson },
          { ...DESK_HEAD, order: 'longest' },
          { ...DESK_PENCIL, order: 'west', pick: isPerson },
        ],
      },
      {
        name: 'LAPTOP',
        about: 'The laptop they are typing on.',
        regions: [
          { ...DESK_INK, order: 'longest', pick: isLaptop },
          { ...DESK_PENCIL, order: 'north', pick: (b) => isLaptop(b) && !within(b, SCREEN) },
        ],
      },
      {
        name: 'SCREEN',
        about: 'What is on its screen: a few lines of writing, top to bottom.',
        regions: [{ ...DESK_PENCIL, order: 'north', pick: (b) => within(b, SCREEN) }],
      },
      {
        name: 'BOOK',
        about: 'The book lying on the desk.',
        regions: [
          { ...DESK_INK, order: 'longest', pick: isBook },
          { ...DESK_PENCIL, order: 'west', pick: isBook },
        ],
      },
      {
        name: 'SURFACE',
        about: 'The desk itself: its far edge and a few strokes of its top.',
        regions: [
          { ...DESK_INK, order: 'west', pick: isSurface },
          { ...DESK_PENCIL, order: 'west', pick: isSurface },
        ],
      },
      {
        name: 'MUG',
        about: 'The mug of coffee.',
        regions: [{ ...MUG_REGION, order: 'longest', pick: (b) => !isSteam(b) && !isHatch(b) }],
      },
      {
        name: 'STEAM',
        about: 'The steam off the coffee, each wisp from the cup upwards.',
        regions: [{ ...MUG_REGION, order: 'west', pick: (b) => isSteam(b) }],
      },
      {
        name: 'ROLE_LINE',
        about: 'The stroke under the role.',
        origin: true,
        regions: [{ src: HOME, box: [82, 474, 472, 500], thr: 170, k: 3, weight: 0.85, smooth: 3, fit: 0.5, straight: 0.2, tone: 1 }],
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
        regions: [{ src: HOME, box: [740, 875, 800, 925], thr: 150, k: 3, weight: 0.8, smooth: 1.4, fit: 0.35, tone: 1 }],
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
            smooth: 1.3,
            fit: 0.4,
            straight: 0.55,
            minW: 1.1,
            tone: 1,
            hatchBelow: 1.2,
            dedupe: 1.6,
            // The sheet's note and its underline are left out, and the bridge takes the low buildings' plot.
            mask: [[1196, 132, 1300, 240], BRIDGE_PLOT],
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
        regions: [{ ...PLANE_REGION, order: 'trail', from: [1196, 932], pick: (b) => !isPlane(b) }],
      },
      {
        name: 'PAPER_PLANE',
        about: 'The paper plane itself.',
        regions: [{ ...PLANE_REGION, pick: (b) => isPlane(b) }],
      },
    ],
  },
  {
    file: 'src/components/sketch/marks.ts',
    about: 'the hand marks every page shares: arrows, underlines, a squiggle, a smile. Each sits at its own origin.',
    drawings: [
      mark('UNDERLINE', 'The stroke under a page title.', { src: GRID, box: [812, 117, 944, 135], smooth: 4, mask: [[[808, 100], [946, 100], [946, 117.5], [808, 126.5]]] }),
      mark('UNDERSCORE', 'The shorter, steeper stroke under a note.', { src: GRID, box: [1444, 924, 1504, 948], smooth: 4 }),
      mark('ARROW_RIGHT', 'A small arrow, pointing on.', { src: GRID, box: [1482, 908, 1502, 924] }),
      mark('ARROW_LONG', 'The longer arrow under `Code, Build, Ship`, drawn with a flick.', { src: MONO, box: [41, 539, 70, 556] }),
      mark('ARROW_DOWN', 'The arrow beside `Scroll`.', { src: GRID, box: [48, 392, 66, 434] }),
      mark('SQUIGGLE', 'The wavy line that closes a page.', { src: MONO, box: [436, 554, 728, 582], thr: 212, smooth: 2.4 }),
      mark('SMILE', 'The smile after `Thanks for stopping by!`.', { src: MONO, box: [1142, 1138, 1161, 1157], smooth: 1 }),
    ],
  },
];
