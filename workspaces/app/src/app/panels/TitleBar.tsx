import { List, Maximize2, Minimize2, PanelRightClose, PanelRightOpen, PencilRuler, Tags } from 'lucide-react'
import type { Stage } from '../hooks/use-stage.ts'
import { useInfoschematic } from '../infoschematic-context.tsx'

/*
 * The programme's identity, at whatever height the mode can afford.
 *
 * Expanded, the panels are open and a row of chrome is not what is short, so it
 * takes two: the title over its strapline, with the consortium named in full
 * beside them and the controls to their right.
 *
 * Collapsed, the point is the diagram, so the bar reduces to one line - the
 * strapline beside the title rather than under it - and everything else goes to
 * the rail, which is already there and already vertical. The partners go with
 * them, as codes.
 */
export function TitleBar({
  collapsed,
  fullscreen,
  onToggleCollapsed,
  onToggleFullscreen,
  stage
}: {
  collapsed: boolean
  fullscreen: boolean
  onToggleCollapsed: () => void
  onToggleFullscreen: () => void
  stage: Stage
}) {
  const { programme } = useInfoschematic()
  /*
   * One header, whatever the panels are doing.
   *
   * Collapsing used to render a different header with no controls at all, and
   * the rail put its own copies of them down the side - so every icon jumped
   * from the top of the window to the right edge and back as the panels opened
   * and shut, and the control you had just used was never where you left it.
   *
   * The title also shrank, which bought a few pixels and cost the one thing a
   * maximised diagram still needs the header for.
   */
  return (
    <header className="title-bar">
      <hgroup>
        <h1>{programme.title}</h1>
        <p>{programme.subtitle}</p>
      </hgroup>

      <div className="title-bar-actions">
        {/*
         * Two groups, divided. Annotating and takeaways are options for
         * whatever view is up, so they sit apart from the three that apply
         * whatever anyone is doing - and they leave with the performance,
         * which is why the divider has to say which side it is on.
         */}
        {stage.backstage ? null : (
          <>
            <button
              aria-label="Annotate"
              aria-pressed={stage.annotated}
              className="icon-button"
              onClick={stage.toggleAnnotated}
              title="Annotate"
              type="button"
            >
              <Tags aria-hidden="true" size={14} />
            </button>
            <button
              aria-label="Key takeaways"
              aria-pressed={stage.takeaways}
              className="icon-button"
              onClick={stage.toggleTakeaways}
              title="Key takeaways"
              type="button"
            >
              <List aria-hidden="true" size={14} />
            </button>
            <span className="tool-divider" />
          </>
        )}
        <button
          aria-label={stage.backstage ? 'Leave the editors' : 'Open the editors'}
          aria-pressed={stage.backstage}
          className="icon-button"
          onClick={() => stage.setBackstage(!stage.backstage)}
          title={stage.backstage ? 'Front of house — what a visitor sees' : 'Backstage — the editors'}
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
        {/*
         * An action, drawn as what it will do - the same convention fullscreen
         * uses, and the reason that one reads without being explained.
         *
         * It was a pressed state with the arrows the other way round, which is
         * two mistakes agreeing: a button showing what *is* wants the opposite
         * icon from one showing what *will be*, so reversing only the arrows
         * would have made it read correctly for the wrong reason. Edit stays a
         * pressed toggle, because a mode is a state you are in rather than an
         * act you perform.
         */}
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
