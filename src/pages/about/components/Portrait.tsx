import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import Frame from '@/components/sketch/Frame';
import { NAME } from '@/content/site';
import photo from '@/assets/images/profile.jpg';
import drawing from '@/assets/images/portrait-ink.webp';
import './portrait.css';

/** The photograph, laid so that its face is under the drawing's: its top, as a share of the frame's height. */
const PHOTO_TOP = -0.0343;
/** The brush: its radius as a share of the frame's width, how far apart its dabs are, and how long a dab lasts. */
const BRUSH = 0.15;
const SPACING = 0.22;
const HOLD_MS = 1400;
const FADE_MS = 1800;

type Dab = { x: number; y: number; r: number; born: number };

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
 * dabs the brush has left: each dab is a soft disc with its own age, so a
 * stroke fades from where it began.
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
        const a = age < HOLD_MS ? 1 : Math.max(0, 1 - (age - HOLD_MS) / FADE_MS);
        if (a <= 0) {
          dabs.splice(i, 1);
          continue;
        }
        wet = true;
        const g = mctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
        g.addColorStop(0, `rgba(0,0,0,${a})`);
        g.addColorStop(0.62, `rgba(0,0,0,${a})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        mctx.fillStyle = g;
        mctx.fillRect(d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
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

    const dab = (x: number, y: number) => {
      const r = w * BRUSH * (0.92 + Math.random() * 0.16);
      dabs.push({ x, y, r, born: performance.now() });
      if (dabs.length > 400) dabs.shift();
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const box = frame.getBoundingClientRect();
      const p: [number, number] = [e.clientX - box.left, e.clientY - box.top];
      // A fast sweep leaves a line of dabs, not a trail of separate ones.
      const step = w * BRUSH * SPACING;
      if (last) {
        const dist = Math.hypot(p[0] - last[0], p[1] - last[1]);
        const n = Math.floor(dist / step);
        for (let i = 1; i <= n; i++) dab(last[0] + ((p[0] - last[0]) * i) / n, last[1] + ((p[1] - last[1]) * i) / n);
        if (n > 0) last = p;
      } else {
        dab(p[0], p[1]);
        last = p;
      }
      wake();
    };
    const leave = () => {
      last = null;
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
