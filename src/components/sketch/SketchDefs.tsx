/**
 * The one thing CSS cannot draw by hand, defined once for the whole site:
 * `sk-pencil` redraws a photograph or a screenshot as a pencil sketch of
 * itself. Grey it, dodge it against a blur of its own negative so that only
 * the edges are left, press harder on those, then shade the sheet with a
 * paler copy of the picture's own greys, the way the side of a pencil lead
 * fills in a tone. Pictures take it through the `sk-photo` class.
 */
export default function SketchDefs() {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <filter id="sk-pencil" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" result="grey" />
          <feComponentTransfer in="grey" result="negative">
            <feFuncR type="table" tableValues="1 0" />
            <feFuncG type="table" tableValues="1 0" />
            <feFuncB type="table" tableValues="1 0" />
          </feComponentTransfer>
          <feGaussianBlur in="negative" stdDeviation="1.6" result="soft" />
          <feBlend in="soft" in2="grey" mode="color-dodge" result="edges" />
          <feComponentTransfer in="edges" result="lines">
            <feFuncR type="gamma" exponent="4.5" />
            <feFuncG type="gamma" exponent="4.5" />
            <feFuncB type="gamma" exponent="4.5" />
          </feComponentTransfer>
          <feComponentTransfer in="grey" result="shade">
            <feFuncR type="linear" slope="0.42" intercept="0.58" />
            <feFuncG type="linear" slope="0.42" intercept="0.58" />
            <feFuncB type="linear" slope="0.42" intercept="0.58" />
          </feComponentTransfer>
          <feBlend in="lines" in2="shade" mode="multiply" />
        </filter>
      </defs>
    </svg>
  );
}
