import { ColourSchemeButton, useInfoschematic } from '@infoschematics/view-canvas'
import type { WorkspaceKind } from '@infoschematics/view-present'
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

const workspaces: readonly WorkspaceKind[] = ['design', 'direct']
const workspaceLabel = (kind: WorkspaceKind) => `${kind[0]?.toUpperCase()}${kind.slice(1)}`
const workspaceIcons: Record<WorkspaceKind, typeof PresentIcon> = {
  design: PenTool,
  direct: Clapperboard
}

/* Product identity and the two production axes remain stable across panel layouts. */
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

        {presentation.presenting ? (
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

        {/*
          Two banks for two questions. Whether the Producer's tools are out is a capability, so it is a toggle rather
          than a third tool: leaving Present returns to the workspace they were in instead of to a default one, which
          is what the single enum could not express.
        */}
        <fieldset aria-label="Presentation" className="tool-bank">
          <button
            aria-label="Present"
            aria-pressed={presentation.presenting}
            className="icon-button"
            onClick={() => presentation.setProducing(presentation.presenting)}
            title={presentation.presenting ? `Back to ${workspaceLabel(presentation.workspace)}` : 'Present'}
            type="button"
          >
            <PresentIcon aria-hidden="true" size={14} />
          </button>
        </fieldset>

        <fieldset aria-label="Workspace" className="tool-bank">
          {workspaces.map((kind) => {
            const label = `${workspaceLabel(kind)} workspace`
            const Icon = workspaceIcons[kind]
            return (
              <button
                aria-label={label}
                aria-pressed={presentation.producing && presentation.workspace === kind}
                className="icon-button"
                key={kind}
                onClick={() => presentation.produceIn(kind)}
                title={label}
                type="button"
              >
                <Icon aria-hidden="true" size={14} />
              </button>
            )
          })}
        </fieldset>

        <span aria-hidden="true" className="tool-divider" />

        {/* The reader's own preference, not the document's: it sits with the window controls rather than the tools. */}
        <fieldset aria-label="Appearance" className="tool-bank">
          <ColourSchemeButton />
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
