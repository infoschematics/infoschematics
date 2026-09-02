import type { ReactNode } from 'react'

/** A mobile fabric's artwork: an irregular cloud shape (its outline lives
 * in `FabricDefs`), a radio-mast glyph and its caption. */
export function MobileCloud({
  className,
  title,
  caption,
  detail,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  frame
}: {
  className: string
  title: string
  caption: string
  detail: string
  onPointerDown?: (event: React.PointerEvent<SVGGElement>) => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
  /** The editor's drag-frame, rendered where its own IIFE output used to sit. */
  frame?: ReactNode
}) {
  return (
    <g
      aria-label="Mobile consumer network"
      className={className}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <title>{title}</title>
      {frame}
      <use className="fabric-shell" href="#mobile-cloud-shape" />
      <rect
        className="fabric-grid"
        clipPath="url(#mobile-cloud-clip)"
        fill="url(#fabric-grid)"
        height="150"
        width="500"
        x="1065"
        y="477"
      />
      <g className="network-radio" transform="translate(1215 548)">
        <circle cx="0" cy="0" r="5" />
        <path d="M0 6 V52 M-14 52 H14 M-9 52 L0 6 L9 52 M-13 -9 Q0 -22 13 -9 M-25 -20 Q0 -44 25 -20" />
      </g>
      <text className="fabric-title" x="1400" y="552">
        {caption}
      </text>
      <text className="fabric-detail" x="1400" y="575">
        {detail}
      </text>
    </g>
  )
}
