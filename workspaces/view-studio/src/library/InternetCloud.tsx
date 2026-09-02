import type { ReactNode } from 'react'

/** The internet fabric's own artwork: an irregular cloud shape (its outline
 * lives in `FabricDefs`), a constellation glyph and its caption. Everything
 * that names this realisation's data - which scope it is, what its title
 * says - is a prop, not a model import. */
export function InternetCloud({
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
      aria-label="Internet media transport"
      className={className}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <title>{title}</title>
      {frame}
      <use className="fabric-shell" href="#internet-cloud-shape" />
      <rect
        className="fabric-grid"
        clipPath="url(#internet-cloud-clip)"
        fill="url(#fabric-grid)"
        height="210"
        width="860"
        x="460"
        y="67"
      />
      <g className="network-constellation" clipPath="url(#internet-cloud-clip)">
        <path d="M497 197L595 147L700 200L810 138L951 192L1074 144" />
        <circle cx="497" cy="197" r="5" />
        <circle cx="595" cy="147" r="5" />
        <circle cx="700" cy="200" r="5" />
        <circle cx="810" cy="138" r="5" />
        <circle cx="951" cy="192" r="5" />
        <circle cx="1074" cy="144" r="5" />
      </g>
      <text className="fabric-title" x="779" y="164">
        {caption}
      </text>
      <text className="fabric-detail" x="779" y="187">
        {detail}
      </text>
    </g>
  )
}
