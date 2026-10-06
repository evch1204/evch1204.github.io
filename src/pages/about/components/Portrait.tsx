import { useRef, useState, type PointerEvent } from 'react';
import Frame from '@/components/sketch/Frame';
import { NAME } from '@/content/site';
import photo from '@/assets/images/profile.jpg';
import drawing from '@/assets/images/portrait-ink.webp';
import './portrait.css';

/**
 * The portrait: the drawing of Tei in front of the Mission Church, with the
 * photograph it was drawn from underneath, laid so that the two faces
 * coincide. The pointer is a lens: where it rests the drawing opens and the
 * photograph shows through, and it closes again as the pointer leaves. A tap
 * (there is no pointer to rest on a phone) swaps the whole picture over and
 * back.
 *
 * The photograph is 734 × 1100 and the drawing was made at 1254 square; the
 * faces line up with the photograph at 1.28 times its size, 43 drawing-pixels
 * above the top, and the drawing cropped to the photograph's width. That
 * crop is the file itself; the offset is the photograph's `top` here.
 */
export default function Portrait({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [swapped, setSwapped] = useState(false);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const box = ref.current;
    if (!box || e.pointerType === 'touch') return;
    const r = box.getBoundingClientRect();
    box.style.setProperty('--x', `${((e.clientX - r.left) / r.width) * 100}%`);
    box.style.setProperty('--y', `${((e.clientY - r.top) / r.height) * 100}%`);
    box.style.setProperty('--lens', '1');
  };
  const leave = () => ref.current?.style.setProperty('--lens', '0');

  return (
    <div className={`portrait ${className}`}>
      <div
        ref={ref}
        className={`portrait-frame sk-frame${swapped ? ' is-swapped' : ''}`}
        onPointerMove={move}
        onPointerLeave={leave}
        onClick={(e) => {
          if (e.nativeEvent instanceof PointerEvent && (e.nativeEvent as unknown as { pointerType?: string }).pointerType !== 'touch') return;
          setSwapped((s) => !s);
        }}
      >
        <Frame r={22} weight={1.6} tone={0.9} double />
        <div className="portrait-crop">
          <img className="portrait-photo" src={photo} alt={`${NAME}, in front of the Mission Church at Santa Clara University`} decoding="async" />
          <img className="portrait-ink" src={drawing} alt="" aria-hidden decoding="async" />
        </div>
      </div>
      <p className="portrait-note sk-note" aria-hidden>
        Psst, hover for
        <br />
        the real me
      </p>
    </div>
  );
}
