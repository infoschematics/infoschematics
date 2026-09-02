import { cornerRadius } from '@infoschematics/core/tokens'

/** The telemetry fabric's own artwork: a shell rectangle spanning the plane,
 * a pulse glyph and its caption. `top` is the plane's y-coordinate, the one
 * piece of this realisation's layout the shape still needs from outside. */
export function TelemetryPlane({
  className,
  title,
  caption,
  detail,
  top,
  onPointerDown,
  onPointerEnter,
  onPointerLeave
}: {
  className: string
  title: string
  caption: string
  detail: string
  top: number
  onPointerDown?: (event: React.PointerEvent<SVGGElement>) => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}) {
  return (
    <g
      aria-label="Telemetry plane"
      className={className}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <title>{title}</title>
      <rect className="fabric-shell" height="40" rx={cornerRadius} width="1640" x="40" y={top} />
      <rect
        className="fabric-grid"
        fill="url(#telemetry-grid)"
        height="40"
        rx={cornerRadius}
        width="1640"
        x="40"
        y={top}
      />
      <path
        className="telemetry-pulse"
        d="M1180 1060H1220L1228 1046L1240 1072L1250 1060H1300L1308 1050L1318 1068L1326 1060H1400"
      />
      <text className="fabric-title" x="58" y="1065">
        {caption}
      </text>
      <text className="fabric-detail" x="170" y="1065">
        {detail}
      </text>
    </g>
  )
}
