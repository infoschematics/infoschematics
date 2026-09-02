import { type ReactNode, useRef, useState } from 'react'

const minimumShare = 20
const maximumShare = 80

/**
 * Two stacked panes with a divider the user can drag. The split is a share of
 * the available height rather than a pixel count, so it survives the panel being
 * resized around it.
 */
export function SplitPane({ children }: { children: [ReactNode, ReactNode] }) {
  const [share, setShare] = useState(50)
  const frame = useRef<HTMLDivElement>(null)

  const drag = (event: React.PointerEvent<HTMLHRElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    const bounds = frame.current?.getBoundingClientRect()
    if (!bounds) return

    const move = (moved: PointerEvent) => {
      const next = ((moved.clientY - bounds.top) / bounds.height) * 100
      setShare(Math.min(maximumShare, Math.max(minimumShare, next)))
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  return (
    <div
      className="split-pane"
      ref={frame}
      style={{ gridTemplateRows: `minmax(0, ${share}fr) auto minmax(0, ${100 - share}fr)` }}
    >
      {children[0]}
      <hr
        aria-label="Resize"
        aria-orientation="horizontal"
        aria-valuenow={Math.round(share)}
        className="split-handle"
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp') setShare((current) => Math.max(minimumShare, current - 5))
          if (event.key === 'ArrowDown') setShare((current) => Math.min(maximumShare, current + 5))
        }}
        onPointerDown={drag}
        tabIndex={0}
      />
      {children[1]}
    </div>
  )
}
