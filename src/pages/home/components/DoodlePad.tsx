import { useEffect, useRef, type RefObject } from 'react';
import { useLatest } from '@/hooks/useLatest';

type Point = [number, number];

type DoodlePadProps = {
  /** The sheet that is drawn on: strokes are placed within it, and a press anywhere on it starts one. */
  sheet: RefObject<HTMLDivElement | null>;
  /** The sheet is the reader's to draw on. */
  enabled: boolean;
  /** What has been drawn so far, a path each. */
  strokes: string[];
  /** A stroke has been finished. */
  onStroke: (d: string) => void;
};

const n1 = (v: number) => Math.round(v * 10) / 10;

/** A line through the points that turns at each one the way a pencil does: curves from midpoint to midpoint. */
function through(pts: Point[]) {
  if (pts.length < 3) return pts.map((p, i) => `${i ? 'L' : 'M'}${n1(p[0])} ${n1(p[1])}`).join('');
  let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], q = pts[i + 1];
    d += `Q${n1(p[0])} ${n1(p[1])} ${n1((p[0] + q[0]) / 2)} ${n1((p[1] + q[1]) / 2)}`;
  }
  const last = pts[pts.length - 1];
  return `${d}L${n1(last[0])} ${n1(last[1])}`;
}

/** The mouse's tremor taken out of a finished stroke: each point eased towards its neighbours, once; the ends stay. */
function steadied(pts: Point[]) {
  let out = pts;
  for (let pass = 0; pass < 1; pass++) {
    out = out.map((p, i) =>
      i === 0 || i === out.length - 1
        ? p
        : [(out[i - 1][0] + 2 * p[0] + out[i + 1][0]) / 4, (out[i - 1][1] + 2 * p[1] + out[i + 1][1]) / 4],
    );
  }
  return out;
}

/**
 * The pencil. On the home the pointer is one, and it works: press and drag
 * anywhere on the sheet that is not a control and a line is left where the
 * pencil went, in the same graphite as the sketch. The stroke in hand is
 * written straight to the DOM as the pointer moves; a finished one is handed
 * up to be kept. Fingers are left to scroll: this is for a mouse or a pen.
 */
export default function DoodlePad({ sheet, enabled, strokes, onStroke }: DoodlePadProps) {
  const liveRef = useRef<SVGPathElement>(null);
  const finish = useLatest(onStroke);

  useEffect(() => {
    const el = sheet.current;
    const live = liveRef.current;
    if (!el || !live || !enabled) return;
    let pts: Point[] = [];
    const at = (e: PointerEvent): Point => {
      const box = el.getBoundingClientRect();
      return [e.clientX - box.left, e.clientY - box.top];
    };
    const move = (e: PointerEvent) => {
      const p = at(e);
      const last = pts[pts.length - 1];
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 2.5) return;
      pts.push(p);
      live.setAttribute('d', through(pts));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      el.classList.remove('is-drawing');
      live.setAttribute('d', '');
      // A click is not a drawing: a stroke has to have gone somewhere.
      if (pts.length > 3) finish.current(through(steadied(pts)));
      pts = [];
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      if (e.target instanceof Element && e.target.closest('a, button, [data-no-draw]')) return;
      // The press is the pencil's: it must not start a text selection or a drag.
      e.preventDefault();
      pts = [at(e)];
      el.classList.add('is-drawing');
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    };
    el.addEventListener('pointerdown', down);
    return () => {
      el.removeEventListener('pointerdown', down);
      up();
    };
  }, [sheet, enabled, finish]);

  return (
    <svg className="home-doodles" aria-hidden>
      {strokes.map((d, i) => (
        <path key={i} d={d} />
      ))}
      <path ref={liveRef} />
    </svg>
  );
}
