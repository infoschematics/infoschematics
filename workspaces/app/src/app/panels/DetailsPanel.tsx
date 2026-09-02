import { useEffect, useMemo, useState } from 'react'
import type { Placement } from '@infoschematics/core/editable'
import type { PortCounts, Side } from '@infoschematics/core/ports'
import type { InterfaceConfig } from '@infoschematics/model'
import { ChangePane } from '../editor/ChangePane.tsx'
import { EditorPanel } from '../editor/EditorPanel.tsx'
import { EditorTools } from '../editor/EditorTools.tsx'
import { SceneLibraryPanel } from '../editor/SceneLibraryPanel.tsx'
import { SceneListPanel } from '../editor/SceneListPanel.tsx'
import type {
  EditorMode,
  EditorView,
  PendingChange,
  PendingOrigin,
  TextDraft,
  TextField,
} from '../editor/use-editor.ts'
import type { SceneLibraryEditor } from '../editor/use-scene-library.ts'
import type { SceneList } from '../editor/use-scene-list.ts'
import { useSessionState } from '../hooks/use-persistent-state.ts'
import type { Presentation } from '../hooks/use-presentation.ts'
import { useInfoschematic } from '../infoschematic-context.tsx'
import { useContractDetail } from './contracts.ts'
import { InterfaceLines } from './InterfaceLines.tsx'
import { ModelRegister } from './ModelRegister.tsx'
import { SpecificationOverlay } from './SpecificationOverlay.tsx'
import { SplitPane } from './SplitPane.tsx'

// What is currently showing, and what the published pack says about it.
export function DetailsPanel({
  editor,
  scenes,
  stories,
  onAddWaypoint,
  onCreateCard,
  onResetRoute,
  presentation,
}: {
  /** Supplied by the app, which is the only place that can issue a code and find room for a card. */
  onCreateCard: (kind: 'adapter' | 'card') => void
  /** Lifted to the app, because the Infoschematic marks what the selected scene lights. */
  /** The scene library, lifted for the same reason the stories are. */
  scenes: SceneLibraryEditor
  stories: SceneList
  /** Both need the Infoschematic: where there is room on a route, and where its ports are. */
  onAddWaypoint: () => void
  onResetRoute: () => void
  editor: {
    canRedo: boolean
    canUndo: boolean
    canRoute: boolean
    /** Whether the Infoschematic selection is a flow, so a scene is given the right list. */
    selectedIsFlow?: boolean
    canWrap: boolean
    changeCount: number
    discard: () => void
    discardOne: (origin: PendingOrigin) => void
    hover: (code: string | null) => void
    hovered: string | null
    identity: Readonly<Partial<Record<string, string>>> | undefined
    pending: readonly PendingChange[]
    select: (code: string) => void
    redo: () => void
    undo: () => void
    placement: Placement | undefined
    setEditing: (editing: boolean) => void
    /** Which editor is open, and the only way to change it. */
    mode: EditorMode
    setMode: (next: EditorMode) => void
    selected: string | null
    selectedComponent: string | null
    selectedCounts: PortCounts
    placeAt: (code: string, axis: 'x' | 'y', value: number) => void
    retext: (code: string, field: TextField, value: string) => void
    setPortCount: (code: string, side: Side, count: number) => void
    source: string
    text: Readonly<Record<string, TextDraft>>
    toggleView: (key: keyof EditorView) => void
    view: EditorView
  }
  presentation: Presentation
}) {
  const {
    config,
    infoschematicCardsOffering,
    infoschematicFlowsCarrying,
    infoschematicSpecificationSections,
    infoschematicUnroutedInterfaces,
  } = useInfoschematic()
  const unroutedInterfaceIds = new Set(infoschematicUnroutedInterfaces.map((entry) => entry.id))
  // Where you were, for as long as the tab is open. A reload mid-edit should
  // not lose the tab; a fresh session should still open on Info.
  /*
   * A tab per mode, remembered separately.
   *
   * Present and Design are different work, so returning to one should
   * return a reader to what they were doing there rather than to its first tab.
   * One remembered tab across both would have sent an author back to Info every
   * time they came out of the editors to check something.
   */
  const [frontTab, setFrontTab] = useSessionState<'showing' | 'specifications'>(
    config.id && `${config.id}.panel.tab`,
    'showing',
  )
  // Compatibility contract: this session key retains its former suffix until
  // an explicit persisted-state migration can preserve the selected Design tab.
  const [backTab, setBackTab] = useSessionState<'scenes' | 'design' | 'stories'>(
    config.id && `${config.id}.panel.tab.backstage`,
    'design',
  )
  const panelTab = presentation.designing ? backTab : frontTab
  // Dispatched by which side the tab belongs to rather than by which mode is
  // open, so choosing one cannot write it into the other mode's memory.
  const chooseTab = (id: 'scenes' | 'showing' | 'specifications' | 'design' | 'stories') =>
    id === 'showing' || id === 'specifications' ? setFrontTab(id) : setBackTab(id)
  const [selectedContract, setSelectedContract] = useState<InterfaceConfig | null>(null)
  /* Which specification is open for reading, which is not the same as which is
     selected: selecting one lists what conforms to it, reading one renders it. */
  const [reading, setReading] = useState<InterfaceConfig | null>(null)
  const { detail: contractDetail, failed: contractError } = useContractDetail(selectedContract)
  const contractFlows = useMemo(
    () => (selectedContract ? infoschematicFlowsCarrying(selectedContract.id) : []),
    [infoschematicFlowsCarrying, selectedContract],
  )
  // What a card offers, which is the other half of the same question and the
  // only answer there is for a specification no flow carries.
  const contractCards = useMemo(
    () => (selectedContract ? infoschematicCardsOffering(selectedContract.id) : []),
    [infoschematicCardsOffering, selectedContract],
  )
  const { runningStory, standaloneScene, thematicScene } = presentation

  // Restoring the tab has to restore the mode with it, since the Edit tab is
  // how edit mode is entered at all.
  /*
   * The tab decides whether an editor is open; the mode decides which one.
   *
   * Leaving the tab closes both. Entering it returns to the Infoschematic editor,
   * because that is what the tab has always been and a reader arriving at it
   * has not yet said they want the other.
   */
  /*
   * The tab is the mode. Two editors were one tab with a switch inside it,
   * which put the choice a level below where it belongs: a reader picks what
   * they are working on the same way they pick Info or Specifications, and the
   * tab strip is where that choice already lives.
   */
  const { mode, setMode } = editor
  /*
   * Each editor's own changes, as the one entry each is.
   *
   * A story hands back its whole scene list and the library hands back the
   * whole library, because both are sequences: an insertion or a reorder is not
   * a set of property changes whose order of application matters.
   */
  const storyChanges = stories.edited
    ? [{ field: 'points' as const, key: stories.story?.code ?? '', source: stories.source }]
    : []
  const libraryChanges = scenes.edited
    ? [{ field: 'points' as const, key: 'standaloneScenes', source: scenes.source }]
    : []
  const layerChanges = mode === 'stories' ? storyChanges : mode === 'scenes' ? libraryChanges : []
  const layerSource = mode === 'stories' ? stories.source : mode === 'scenes' ? scenes.source : editor.source
  const layerDiscard = mode === 'stories' ? stories.revert : mode === 'scenes' ? scenes.revert : editor.discard
  useEffect(() => {
    // Present mode closes every editor, whatever Design tab was left open:
    // the mode decides whether an editor is open, and the tab only which.
    const wanted = presentation.designing ? backTab : null
    if (wanted !== mode) setMode(wanted)
  }, [backTab, mode, presentation.designing, setMode])

  useEffect(() => {
    if (!reading) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setReading(null)
    }
    window.addEventListener('keydown', close, { capture: true })
    return () => window.removeEventListener('keydown', close, { capture: true })
  }, [reading])

  return (
    <section className="state-panel" aria-label="What is showing">
      <div className="panel-tabs" role="tablist" aria-label="Panel">
        {(presentation.designing
          ? ([
              ['design', 'Design'],
              ['scenes', 'Scenes'],
              ['stories', 'Stories'],
            ] as const)
          : ([
              ['showing', 'Info'],
              ['specifications', 'Specifications'],
            ] as const)
        ).map(([id, label]) => (
          <button
            aria-selected={panelTab === id}
            className={panelTab === id ? 'active' : ''}
            key={id}
            onClick={() => {
              chooseTab(id)
            }}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {panelTab === 'design' || panelTab === 'scenes' || panelTab === 'stories' ? (
        <div className="editor-tab">
          {/* Above the split, so it neither scrolls with the properties nor
              moves when the divider does. It acts on the editor rather than on
              the selection, and one of its controls works with nothing
              selected at all. */}
          <EditorTools
            mode={mode}
            canRoute={editor.canRoute}
            canWrap={editor.canWrap}
            onAddWaypoint={onAddWaypoint}
            onCreateCard={onCreateCard}
            onResetRoute={onResetRoute}
            onToggle={editor.toggleView}
            view={editor.view}
          />
          <SplitPane>
            {/* One pane, two things in it: what the selection is, and the story
                built on top of the Infoschematic. The split's top half is a single
                child, so they share it rather than each claiming a third of the
                tab. */}
            {/* One pane per editor. The Infoschematic editor describes a selection; the
                scene editor describes a scene. Neither has any use for the
                other's panel, and rendering both was the whole of why Infoschematic
                editing showed a story. */}
            <div className="editor-panes">
              {mode === 'design' ? (
                <EditorPanel
                  onPlace={editor.placeAt}
                  code={editor.selected}
                  identity={editor.identity}
                  onPortCount={editor.setPortCount}
                  onRetext={editor.retext}
                  placement={editor.placement}
                  selected={editor.selectedComponent}
                  selectedCounts={editor.selectedCounts}
                  textDraft={editor.selected ? editor.text[editor.selected] : undefined}
                />
              ) : mode === 'scenes' ? (
                <>
                  {/* Every editor leads with a heading in the same voice, so the
                      tabs read as a set rather than as one panel that was
                      labelled and the others that simply started. */}
                  <p className="eyebrow pane-heading">SCENES</p>
                  <SceneLibraryPanel
                    editor={scenes}
                    selected={editor.selected}
                    selectedIsFlow={editor.selectedIsFlow ?? false}
                  />
                </>
              ) : (
                <>
                  <p className="eyebrow pane-heading">STORIES</p>
                  <SceneListPanel
                    editor={stories}
                    selected={editor.selected}
                    selectedIsFlow={editor.selectedIsFlow ?? false}
                  />
                </>
              )}
            </div>
            <ChangePane
              canRedo={editor.canRedo}
              canUndo={editor.canUndo}
              count={mode === 'design' ? editor.changeCount : layerChanges.length}
              hovered={editor.hovered}
              onDiscard={layerDiscard}
              onDiscardOne={editor.discardOne}
              onHover={editor.hover}
              onSelect={editor.select}
              /*
               * An edited story joins the change set as one entry, where
               * every other change is a line. A scene is identified by where it
               * sits, so a reorder cannot be described as a set of property
               * changes whose order of application matters - the sequence says
               * the same thing with nothing to get wrong.
               */
              /*
               * Each editor's own changes, and only its own.
               *
               * Both were shown in both, so the pane read the same in Infoschematic
               * editing and scene editing and a reader could not tell which
               * work they were looking at. They land in different files and
               * are applied at different times, so showing them together says
               * they are one set when they are two.
               *
               * A story joins as one entry where every other change is a line.
               * A scene is identified by where it sits, so a reorder cannot be
               * a set of property changes whose order of application matters -
               * the sequence says the same thing with nothing to get wrong.
               */
              pending={mode === 'design' ? editor.pending : layerChanges}
              onRedo={editor.redo}
              onUndo={editor.undo}
              source={layerSource}
            />
          </SplitPane>
        </div>
      ) : panelTab === 'showing' ? (
        <div className="contract-body">
          {runningStory ? (
            <p>{runningStory.question}</p>
          ) : thematicScene ? (
            <>
              <p className="theme-headline">{thematicScene.headline}</p>
              <p>{thematicScene.description}</p>
            </>
          ) : standaloneScene ? (
            <p>{standaloneScene.description}</p>
          ) : (
            <p className="contract-empty">
              Nothing is in focus. Use the producer controls to focus content, or run a Story to move through the
              Infoschematic one Scene at a time.
            </p>
          )}

          <ModelRegister hovered={editor.hovered} onPoint={editor.hover} />
        </div>
      ) : (
        <div className="contract-body">
          {/* Says what the tab is for, and nothing about what this diagram
              happens to contain. The sentence here counted the interfaces and
              apportioned them between the federation and everybody else, which
              is a fact about one deployment's model rather than about the
              control, and was quoted to a visitor as though it were the point
              of the panel. */}
          <p className="register-note specification-lead">
            What the Infoschematic conforms to, grouped by whose specification it is and whether there is a document to read.
            Choose one to see what carries or offers it.
          </p>

          {/* A group per state rather than one flat list. The list was six
              entries authored in the panel; it is now every specification the
              model holds, which is why the grouping earns its place - twenty-six
              buttons in one run says nothing about which of them are ours. */}
          {infoschematicSpecificationSections.map(({ group, within }) => {
            return (
              <div className="specification-group" key={group.id}>
                <p className="contract-meta" title={group.note}>
                  {group.label}
                </p>
                <div className="api-links">
                  {within.map((entry) => {
                    const unrouted = unroutedInterfaceIds.has(entry.id)
                    return (
                      <button
                        aria-pressed={selectedContract?.id === entry.id}
                        disabled={unrouted}
                        key={entry.id}
                        onClick={() => setSelectedContract((current) => (current?.id === entry.id ? null : entry))}
                        title={unrouted ? 'Nothing on the diagram reaches this specification yet.' : entry.description}
                        type="button"
                      >
                        {entry.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {selectedContract ? (
            <>
              <div className="compact-heading state-contract-heading">
                <p className="eyebrow">{selectedContract.prefix}</p>
                {selectedContract.href ? (
                  <button className="link-button" onClick={() => setReading(selectedContract)} type="button">
                    Read specification
                  </button>
                ) : null}
              </div>

              {/* A document is fetched only where there is one to fetch. Most
                  specifications are somebody else's and are named here rather
                  than published here, so their own description is what there is
                  to say about them. */}
              {!selectedContract.href ? (
                <p>{selectedContract.description}</p>
              ) : contractError ? (
                <p className="contract-empty">Specification could not be loaded.</p>
              ) : contractDetail ? (
                <>
                  <p className="contract-meta">
                    {selectedContract.contract} · version {contractDetail.version}
                  </p>
                  {contractDetail.description ? <p>{contractDetail.description}</p> : null}
                  <ul className="contract-operations">
                    {contractDetail.operations.map((operation) => (
                      <li key={`${operation.detail}-${operation.name}`}>
                        <code>{operation.detail}</code>
                        <span>{operation.name}</span>
                        {operation.summary ? <em>{operation.summary}</em> : null}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="contract-empty">Loading specification…</p>
              )}

              <InterfaceLines cards={contractCards} flows={contractFlows} interfaceEntry={selectedContract} />
            </>
          ) : (
            <p className="contract-empty specifications-empty">
              Choose a specification to see what it defines, and what on the Infoschematic carries or offers it.
            </p>
          )}
        </div>
      )}

      {/* Fixed, so it covers the Infoschematic rather than the panel it was opened from. */}
      {reading?.href ? (
        <SpecificationOverlay href={reading.href} name={reading.label} onClose={() => setReading(null)} />
      ) : null}
    </section>
  )
}
