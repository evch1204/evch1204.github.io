import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import Frame from '@/components/sketch/Frame';
import { NAME } from '@/content/site';
import photo from '@/assets/images/profile.jpg';
import drawing from '@/assets/images/portrait-ink.webp';
import './portrait.css';

/** The photograph, laid so that its face is under the drawing's: its top, as a share of the frame's height. */
const PHOTO_TOP = -0.0343;
/** The brush: its radius as a share of the frame's width, and how far apart its dabs are, as a share of that radius. */
const BRUSH = 0.15;
const SPACING = 0.12;
/** The water: a dab bleeds out a little after it is laid, holds wet, then dries from its edge in. Milliseconds. */
const BLEED_MS = 520;
const BLEED = 1.16;
const HOLD_MS = 1100;
const DRY_MS = 2600;
/** A fast sweep skims: the brush narrows as the pointer speeds up, in pixels per millisecond. */
const SKIM_SPEED = 2.4;

type Dab = { x: number; y: number; r: number; born: number };

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
/** Ease out, for the bleed: quick to spread, slow to settle. */
const easeOut = (t: number) => 1 - (1 - t) ** 3;
/** Ease in and out, for the drying: the stroke keeps its wet look, then is gone before it lingers. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * The portrait: the drawing of Tei in front of the Mission Church, with the
 * photograph it was drawn from underneath, laid so that the two faces
 * coincide. The pointer is a wet brush: wherever it is swept the drawing
 * opens in a soft stroke and the photograph shows through in that very
 * place; the stroke holds for a moment, then dries and the drawing is back.
 * A tap (there is no pointer to sweep on a phone) swaps the whole picture
 * over and back.
 *
 * The photograph is painted on a canvas over the drawing, masked by the
 * dabs the brush has left: each dab is a feathered disc with its own age,
 * so it bleeds a little as it lands, holds wet, and dries from its edge in,
 * and a stroke dries from where it began.
 */
export default function Portrait({ className = '' }: { className?: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [swapped, setSwapped] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas || reduced) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const mask = document.createElement('canvas');
    const mctx = mask.getContext('2d');
    if (!mctx) return;
    const img = new Image();
    img.src = photo;

    let w = 0, h = 0, dpr = 1;
    const dabs: Dab[] = [];
    let last: [number, number] | null = null;
    let raf = 0;

    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = frame.clientWidth;
      h = frame.clientHeight;
      canvas.width = mask.width = Math.round(w * dpr);
      canvas.height = mask.height = Math.round(h * dpr);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(frame);

    const draw = (now: number) => {
      // The mask: every dab still wet, at the alpha its age gives it.
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mctx.clearRect(0, 0, w, h);
      let wet = false;
      for (let i = dabs.length - 1; i >= 0; i--) {
        const d = dabs[i];
        const age = now - d.born;
        // The water spreads the dab out as it lands; drying takes it back in and thins it.
        const bleed = 1 + (BLEED - 1) * easeOut(clamp01(age / BLEED_MS));
        const dry = easeInOut(clamp01((age - BLEED_MS - HOLD_MS) / DRY_MS));
        if (dry >= 1) {
          dabs.splice(i, 1);
          continue;
        }
        wet = true;
        const a = 1 - dry;
        const r = d.r * bleed * (1 - 0.45 * dry);
        // Feathered: a wet core, and an edge that thins out long before the rim.
        const core = 0.3 * (1 - dry);
        const g = mctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r);
        g.addColorStop(0, `rgba(0,0,0,${a})`);
        g.addColorStop(core, `rgba(0,0,0,${a})`);
        g.addColorStop(core + (1 - core) * 0.45, `rgba(0,0,0,${a * 0.55})`);
        g.addColorStop(core + (1 - core) * 0.78, `rgba(0,0,0,${a * 0.14})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        mctx.fillStyle = g;
        mctx.fillRect(d.x - r, d.y - r, r * 2, r * 2);
      }
      // The photograph, where the mask lets it through.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (wet && img.complete && img.naturalWidth) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, 0, PHOTO_TOP * h, w, (w * img.naturalHeight) / img.naturalWidth);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(mask, 0, 0);
      }
      raf = wet ? requestAnimationFrame(draw) : 0;
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    let speed = 0;
    let lastAt = 0;
    const dab = (x: number, y: number, at: number) => {
      // The brush narrows as it skims, and no two dabs are quite the same size.
      const skim = 1 - 0.3 * clamp01(speed / SKIM_SPEED);
      const r = w * BRUSH * skim * (0.94 + Math.random() * 0.12);
      dabs.push({ x, y, r, born: at });
      if (dabs.length > 600) dabs.shift();
    };
    /** Lays dabs from the last one up to the point, evenly along the way, so a sweep is one stroke. */
    const sweep = (p: [number, number], at: number) => {
      if (!last) {
        dab(p[0], p[1], at);
        last = p;
        lastAt = at;
        return;
      }
      const dist = Math.hypot(p[0] - last[0], p[1] - last[1]);
      const dt = Math.max(1, at - lastAt);
      // The speed is settled over a few events, so the width does not flicker.
      speed += (dist / dt - speed) * 0.35;
      const step = w * BRUSH * SPACING;
      const n = Math.floor(dist / step);
      if (n === 0) return;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        dab(last[0] + (p[0] - last[0]) * t, last[1] + (p[1] - last[1]) * t, lastAt + (at - lastAt) * t);
      }
      // Carry on from the last dab laid, so the spacing is kept across events.
      last = [last[0] + ((p[0] - last[0]) * n * step) / dist, last[1] + ((p[1] - last[1]) * n * step) / dist];
      lastAt = at;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const box = frame.getBoundingClientRect();
      // Every position the pointer passed through since the last frame, not only the last of them.
      const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
      for (const ev of events.length ? events : [e]) sweep([ev.clientX - box.left, ev.clientY - box.top], ev.timeStamp || performance.now());
      wake();
    };
    const leave = () => {
      last = null;
      speed = 0;
    };
    frame.addEventListener('pointermove', move);
    frame.addEventListener('pointerleave', leave);
    return () => {
      frame.removeEventListener('pointermove', move);
      frame.removeEventListener('pointerleave', leave);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <div className={`portrait ${className}`}>
      <div
        ref={frameRef}
        className={`portrait-frame sk-frame${swapped ? ' is-swapped' : ''}`}
        onClick={(e) => {
          const type = (e.nativeEvent as { pointerType?: string }).pointerType;
          if (type && type !== 'touch') return;
          setSwapped((s) => !s);
        }}
      >
        <Frame r={22} weight={1.6} tone={0.9} double />
        <div className="portrait-crop">
          <img className="portrait-ink" src={drawing} alt="" aria-hidden decoding="async" />
          <img className="portrait-photo" src={photo} alt={`${NAME}, in front of the Mission Church at Santa Clara University`} decoding="async" />
          <canvas ref={canvasRef} className="portrait-brush" aria-hidden />
        </div>
      </div>
      <p className="portrait-note sk-note" aria-hidden>
        Psst, brush over
        <br />
        for the real me
      </p>
    </div>
  );
}
