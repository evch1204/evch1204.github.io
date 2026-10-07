/**
 * What CSS cannot draw by hand, defined once for the whole site.
 *
 * `sk-boil-a`, `-b` and `-c` are three slightly different nudges of a
 * drawing's lines; flipped between a few times a second (see `sk-alive`) they
 * are the boil of a hand-drawn film, a still drawing kept alive.
 */
export default function SketchDefs() {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {([
          ["sk-boil-a", 2],
          ["sk-boil-b", 9],
          ["sk-boil-c", 17],
        ] as const).map(([id, seed]) => (
          <filter key={id} id={id} x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="1" seed={seed} />
            <feDisplacementMap in="SourceGraphic" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
