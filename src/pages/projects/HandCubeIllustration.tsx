/**
 * What the hand tracker draws, as a still: the 21 MediaPipe landmarks joined
 * the way MediaPipe joins them, and the wireframe cube with its edges coloured
 * the way the program colours them — front face green, back face blue, the
 * four connectors red, white dots at the vertices. There are no screenshots
 * of the program, so this stands in for one wherever a picture is expected.
 *
 * Landmark order is MediaPipe's: 0 wrist; 1–4 thumb; 5–8 index; 9–12 middle;
 * 13–16 ring; 17–20 pinky, base to tip.
 */

const LANDMARKS: [number, number][] = [
  [150, 300], // 0 wrist
  [110, 268], [84, 236], [66, 206], [52, 180], // thumb
  [124, 196], [114, 150], [108, 116], [104, 88], // index
  [152, 188], [150, 136], [150, 98], [150, 66], // middle
  [180, 196], [186, 148], [190, 112], [194, 84], // ring
  [206, 214], [222, 178], [232, 150], [242, 126], // pinky
];

const BONES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

/*
 * The cube's eight corners after the program's own maths: rotate X then Y,
 * scale, and drop the depth (orthographic). Front face first, back face
 * second, so the edge groups below line up with the program's colour rule.
 */
const CUBE = (() => {
  const rx = 0.42;
  const ry = -0.62;
  const size = 96;
  const cx = 400;
  const cy = 200;
  const pts: { x: number; y: number; z: number }[] = [];
  for (const z of [1, -1]) {
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
      // rotate about X
      const y1 = y * Math.cos(rx) - z * Math.sin(rx);
      const z1 = y * Math.sin(rx) + z * Math.cos(rx);
      // rotate about Y
      const x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
      const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
      pts.push({ x: cx + x2 * size, y: cy + y1 * size, z: z2 });
    }
  }
  return pts;
})();

const FRONT: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0]];
const BACK: [number, number][] = [[4, 5], [5, 6], [6, 7], [7, 4]];
const CONNECT: [number, number][] = [[0, 4], [1, 5], [2, 6], [3, 7]];

const EDGE_GROUPS: { edges: [number, number][]; stroke: string }[] = [
  { edges: BACK, stroke: '#3b82f6' },
  { edges: CONNECT, stroke: '#ef4444' },
  { edges: FRONT, stroke: '#22c55e' },
];

const depth = ([a, b]: [number, number]) => (CUBE[a].z + CUBE[b].z) / 2;

/* Back to front, like the program's depth sort; nearer edges draw thicker. */
const EDGES = EDGE_GROUPS.flatMap(({ edges, stroke }) => edges.map((e) => ({ e, stroke, z: depth(e) }))).sort(
  (p, q) => p.z - q.z,
);

export default function HandCubeIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 400"
      width="560"
      height="400"
      role="img"
      aria-label="Illustration of the hand-tracker's output: the 21-point hand skeleton and the colour-coded wireframe cube"
      className={className}
    >
      <rect width="560" height="400" fill="#FAFAFA" />

      {/* Landmarks, joined the MediaPipe way. */}
      <g stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" fill="none">
        {BONES.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={LANDMARKS[a][0]} y1={LANDMARKS[a][1]} x2={LANDMARKS[b][0]} y2={LANDMARKS[b][1]} />
        ))}
      </g>
      <g fill="#52525b">
        {LANDMARKS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === 0 ? 5 : 4} />
        ))}
      </g>
      {/* The vector the program reads pitch and yaw from: wrist to middle MCP. */}
      <line
        x1={LANDMARKS[0][0]}
        y1={LANDMARKS[0][1]}
        x2={LANDMARKS[9][0]}
        y2={LANDMARKS[9][1]}
        stroke="#18181b"
        strokeWidth="2.5"
        strokeDasharray="4 5"
        strokeLinecap="round"
      />

      {/* The cube, depth-sorted; thickness 2–4 like the program. */}
      <g strokeLinecap="round" fill="none">
        {EDGES.map(({ e: [a, b], stroke, z }) => (
          <line
            key={`${a}-${b}`}
            x1={CUBE[a].x}
            y1={CUBE[a].y}
            x2={CUBE[b].x}
            y2={CUBE[b].y}
            stroke={stroke}
            strokeWidth={3 + z}
          />
        ))}
      </g>
      <g fill="#fff" stroke="#18181b" strokeWidth="1.5">
        {CUBE.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.z > 0 ? 5 : 3.5} />
        ))}
      </g>

      {/* Mono labels, like the program's UI overlay. */}
      <g fontFamily="'Space Mono', ui-monospace, monospace" fontSize="11" fill="#a1a1aa">
        <text x="40" y="360">Mode: ROTATE · palm open</text>
        <text x="300" y="360">Scale: 1.00 · pitch / yaw from 0→9</text>
      </g>
    </svg>
  );
}
