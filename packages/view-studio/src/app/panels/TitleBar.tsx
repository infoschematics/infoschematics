import { useInfoschematic } from '@infoschematics/view-canvas'
import type { ProductionMode } from '@infoschematics/view-present'
import {
  Clapperboard,
  Layers,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  PenTool,
  Presentation as PresentIcon,
  Scan,
  Tags,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import type { Presentation } from '../hooks/use-presentation.ts'

const modes: readonly ProductionMode[] = ['present', 'design', 'direct']
const modeLabel = (mode: ProductionMode) => `${mode[0]?.toUpperCase()}${mode.slice(1)}`
const modeIcons: Record<ProductionMode, typeof PresentIcon> = {
  design: PenTool,
  direct: Clapperboard,
  present: PresentIcon
}

/* Product identity and production mode remain stable across panel layouts. */
export function TitleBar({
  collapsed,
  fullscreen,
  onFitDiagram,
  onToggleCollapsed,
  onToggleFullscreen,
  onZoomIn,
  onZoomOut,
  presentation
}: {
  collapsed: boolean
  fullscreen: boolean
  onFitDiagram: () => void
  onToggleCollapsed: () => void
  onToggleFullscreen: () => void
  onZoomIn: () => void
  onZoomOut: () => void
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
        <fieldset aria-label="Diagram zoom" className="tool-bank">
          <button aria-label="Zoom in" className="icon-button" onClick={onZoomIn} title="Zoom in (+)" type="button">
            <ZoomIn aria-hidden="true" size={14} />
          </button>
          <button aria-label="Zoom out" className="icon-button" onClick={onZoomOut} title="Zoom out (−)" type="button">
            <ZoomOut aria-hidden="true" size={14} />
          </button>
          <button
            aria-label="Reset zoom to fit"
            className="icon-button"
            onClick={onFitDiagram}
            title="Reset zoom to fit (0)"
            type="button"
          >
            <Scan aria-hidden="true" size={14} />
          </button>
        </fieldset>

        <span aria-hidden="true" className="tool-divider" />

        {presentation.mode === 'present' ? (
          <>
            <fieldset aria-label="Display" className="tool-bank">
              <button
                aria-label="Show tags"
                aria-pressed={presentation.annotated}
                className="icon-button"
                onClick={presentation.toggleAnnotated}
                title="Show tags"
                type="button"
              >
                <Tags aria-hidden="true" size={14} />
              </button>
              <button
                aria-label="Show overlays"
                aria-pressed={presentation.overlays}
                className="icon-button"
                onClick={presentation.toggleOverlays}
                title="Show overlays"
                type="button"
              >
                <Layers aria-hidden="true" size={14} />
              </button>
            </fieldset>
            <span aria-hidden="true" className="tool-divider" />
          </>
        ) : null}

        <fieldset aria-label="Production mode" className="tool-bank">
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
        </fieldset>

        <span aria-hidden="true" className="tool-divider" />

        <fieldset aria-label="Window and panels" className="tool-bank">
          <button
            aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
            className="icon-button"
            onClick={onToggleFullscreen}
            title={fullscreen ? 'Exit full screen' : 'Full screen'}
            type="button"
          >
            {fullscreen ? <Minimize2 aria-hidden="true" size={14} /> : <Maximize2 aria-hidden="true" size={14} />}
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
        </fieldset>
      </div>
    </header>
  )
}
