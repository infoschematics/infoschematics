import { cornerRadius } from '@infoschematics/core/tokens'

/** The satcom fabric's own artwork: a rounded shell, an orbit and a beam, a
 * satellite glyph and two dishes. No frame of its own - the shell rectangle
 * already carries the corner radius an editable frame would, so there is
 * nothing extra to draw while dragging. */
export function SatcomBlock({
  className,
  title,
  caption,
  detail,
  onPointerDown,
  onPointerEnter,
  onPointerLeave
}: {
  className: string
  title: string
  caption: string
  detail: string
  onPointerDown?: (event: React.PointerEvent<SVGGElement>) => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}) {
  return (
    <g
      aria-label="Satellite transport"
      className={className}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <title>{title}</title>
      <rect className="satcom-shell" height="200" rx={cornerRadius} width="320" x="780" y="300" />
      <rect
        className="fabric-grid"
        fill="url(#fabric-grid)"
        height="200"
        rx={cornerRadius}
        width="320"
        x="880"
        y="300"
      />
      <path className="satcom-orbit" d="M825 372C875 342 1005 342 1055 372" />
      <path className="satcom-beam" d="M935 390L870 425M955 390L1025 425" />
      <text className="fabric-title" x="806" y="334">
        {caption}
      </text>
      <text className="fabric-detail" x="886" y="334">
        {detail}
      </text>
      <g className="topology-satellite" transform="translate(916 335)">
        <rect height="26" rx="4" width="38" x="13" y="12" />
        <rect height="30" width="32" x="-23" y="10" />
        <rect height="30" width="32" x="55" y="10" />
        <path d="M-13 10 V40 M-3 10 V40 M65 10 V40 M75 10 V40 M32 38 V54 M24 54 H40 M20 54 Q32 72 44 54" />
      </g>
      <g className="topology-dish" transform="translate(835 400)">
        <path d="M0 0 Q18 36 52 14 M4 2 L46 36 M26 24 L17 62 M26 24 L38 62 M13 62 H42" />
      </g>
      <g className="topology-dish" transform="translate(1000 400)">
        <path d="M52 0 Q34 36 0 14 M48 2 L6 36 M26 24 L17 62 M26 24 L38 62 M13 62 H42" />
      </g>
    </g>
  )
}
