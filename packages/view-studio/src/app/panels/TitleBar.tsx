import { Clapperboard, List, Maximize2, Minimize2, PanelRightClose, PanelRightOpen, PenTool, Presentation as PresentIcon, Tags } from 'lucide-react'
import { useInfoschematic } from '@infoschematics/view-canvas'
import type { ProductionMode } from '@infoschematics/view-present'
import type { Presentation } from '../hooks/use-presentation.ts'

const modes: readonly ProductionMode[] = ['present', 'design', 'direct']

const modeLabel = (mode: ProductionMode) =>
  `${mode[0]?.toUpperCase()}${mode.slice(1)}`

const modeIcons: Record<ProductionMode, typeof PresentIcon> = {
  design: PenTool,
  direct: Clapperboard,
  present: PresentIcon,
}

/* Product identity and production mode remain stable across panel layouts. */
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

  return (
    <header className="title-bar">
      <hgroup>
        <h1>{config.title}</h1>
        <p>{config.subtitle}</p>
      </hgroup>
      <div className="title-bar-actions">
        {presentation.mode === 'present' ? (
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
        ) : null}

        <div
          aria-label="Production mode"
          className="title-bar-actions"
          role="group"
        >
          {modes.map((mode) => {
            const label = modeLabel(mode)
            const Icon = modeIcons[mode]
            return (
              <button
                aria-label={`${label} mode`}
                aria-pressed={presentation.mode === mode}
                className="icon-button"
                key={mode}
                onClick={() => presentation.setMode(mode)}
                title={`${label} mode`}
                type="button"
              >
                <Icon aria-hidden="true" size={14} />
              </button>
            )
          })}
        </div>

        <button
          aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
          className="icon-button"
          onClick={onToggleFullscreen}
          title={fullscreen ? 'Exit full screen' : 'Full screen'}
          type="button"
        >
          {fullscreen ? (
            <Minimize2 aria-hidden="true" size={14} />
          ) : (
            <Maximize2 aria-hidden="true" size={14} />
          )}
        </button>

        <button
          aria-label={collapsed ? 'Show panels' : 'Collapse panels'}
          className="icon-button"
          onClick={onToggleCollapsed}
          title={collapsed ? 'Show panels' : 'Collapse panels'}
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
