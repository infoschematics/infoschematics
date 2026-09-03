import { List, Maximize2, Minimize2, PanelRightClose, PanelRightOpen, PencilRuler, Tags } from 'lucide-react'
import type { Presentation } from '../hooks/use-presentation.ts'
import { useInfoschematic } from '@infoschematics/view-canvas'

/* Product identity and controls remain stable across panel layouts. */
export function TitleBar({
  collapsed,
  fullscreen,
  onToggleCollapsed,
  onToggleFullscreen,
  presentation,
}: {
  collapsed: boolean
  fullscreen: boolean
  onToggleCollapsed: () => void
  onToggleFullscreen: () => void
  presentation: Presentation
}) {
  const { config } = useInfoschematic()
  // The same header remains available whether the panels are open or collapsed.
  return (
    <header className="title-bar">
      <hgroup>
        <h1>{config.title}</h1>
        <p>{config.subtitle}</p>
      </hgroup>

      <div className="title-bar-actions">
        {/*
         * Two groups, divided. Annotating and takeaways are options for
         * whatever view is up, so they sit apart from the three that apply
         * whatever anyone is doing - and they leave with the performance,
         * which is why the divider has to say which side it is on.
         */}
        {presentation.designing ? null : (
          <>
            <button
              aria-label="Annotate"
              aria-pressed={presentation.annotated}
              className="icon-button"
              onClick={presentation.toggleAnnotated}
              title="Annotate"
              type="button"
            >
              <Tags aria-hidden="true" size={14} />
            </button>
            <button
              aria-label="Key takeaways"
              aria-pressed={presentation.takeaways}
              className="icon-button"
              onClick={presentation.toggleTakeaways}
              title="Key takeaways"
              type="button"
            >
              <List aria-hidden="true" size={14} />
            </button>
            <span className="tool-divider" />
          </>
        )}
        <button
          aria-label={presentation.designing ? 'Leave the editors' : 'Open the editors'}
          aria-pressed={presentation.designing}
          className="icon-button"
          onClick={() => presentation.setDesigning(!presentation.designing)}
          title={presentation.designing ? 'Present — what an audience sees' : 'Design — the editors'}
          type="button"
        >
          <PencilRuler aria-hidden="true" size={14} />
        </button>
        <button
          className="icon-button"
          onClick={onToggleFullscreen}
          title={fullscreen ? 'Exit full screen' : 'Full screen'}
          type="button"
        >
          {fullscreen ? <Minimize2 aria-hidden="true" size={14} /> : <Maximize2 aria-hidden="true" size={14} />}
        </button>
        {/* The icon and label describe the panel action rather than its current state. */}
        <button
          aria-label={collapsed ? 'Show the panels' : 'Collapse the panels'}
          className="icon-button"
          onClick={onToggleCollapsed}
          title={collapsed ? 'Show the panels' : 'Collapse the panels'}
          type="button"
        >
          {collapsed ? (
            <PanelRightOpen aria-hidden="true" size={14} />
          ) : (
            <PanelRightClose aria-hidden="true" size={14} />
          )}
        </button>
      </div>
    </header>
  )
}
