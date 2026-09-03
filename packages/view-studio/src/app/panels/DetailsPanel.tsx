import { type SetStateAction, useEffect, useMemo, useState } from 'react'
import type { DirectTarget } from '@infoschematics/view-present'
import type { Placement } from '@infoschematics/view-model/editable'
import type { PortCounts, Side } from '@infoschematics/view-model/ports'
import type { InterfaceConfig } from '@infoschematics/domain-model/interface'
import { ChangePane } from '../editor/ChangePane.tsx'
import { EditorPanel } from '../editor/EditorPanel.tsx'
import { EditorTools } from '../editor/EditorTools.tsx'
import { SceneLibraryPanel } from '../editor/SceneLibraryPanel.tsx'
import { SceneListPanel } from '../editor/SceneListPanel.tsx'
import { ThemeCompositionPanel } from '../editor/ThemeCompositionPanel.tsx'
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
import type { ThemeComposition } from '../editor/use-theme-composition.ts'
import { useSessionState } from '../hooks/use-persistent-state.ts'
import type { Presentation } from '../hooks/use-presentation.ts'
import { useInfoschematic } from '@infoschematics/view-canvas'
import { useContractDetail } from './contracts.ts'
import { InterfaceLines } from './InterfaceLines.tsx'
import { ModelRegister } from './ModelRegister.tsx'
import { SpecificationOverlay } from './SpecificationOverlay.tsx'
import { SplitPane } from './SplitPane.tsx'

type DirectKind = DirectTarget['kind']

type DirectOption = Readonly<{
  label: string
  target: DirectTarget
}>

const directKinds = [
  ['standalone-scene', 'Scenes'],
  ['theme', 'Themes'],
  ['story', 'Stories'],
  ['callout', 'Callouts'],
  ['storyboard', 'Storyboard'],
] as const satisfies readonly (readonly [DirectKind, string])[]

const directTargetKey = (target: DirectTarget): string => {
  switch (target.kind) {
    case 'standalone-scene':
      return `${target.kind}:${target.sceneId}`
    case 'theme':
      return `${target.kind}:${target.themeId}`
    case 'story':
    case 'storyboard':
      return `${target.kind}:${target.storyId}`
    case 'callout':
      return `${target.kind}:${target.owner}:${target.ownerId}:${target.sceneId}`
  }
}

const resolveStateAction = <Value,>(action: SetStateAction<Value>, current: Value): Value =>
  typeof action === 'function' ? (action as (value: Value) => Value)(current) : action

// What is currently showing, and what the published pack says about it.
export function DetailsPanel({
  editor,
  scenes,
  stories,
  themes,
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
  themes: ThemeComposition
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
  // Present remembers reading state; Producer modes are selected explicitly by
  // the transient production state rather than masquerading as panel tabs.
  const [presentTab, setPresentTab] = useSessionState<'showing' | 'specifications'>(
    config.id && `${config.id}.panel.tab.present`,
    'showing',
  )
  const [directKind, setDirectKind] = useState<DirectKind>('standalone-scene')
  const directOptions = useMemo<readonly DirectOption[]>(() => {
    const standaloneScenes = scenes.library.map((scene) => ({
      label: scene.label,
      target: { kind: 'standalone-scene', sceneId: scene.id } as const,
    }))
    const themeTargets = themes.themes.map((theme) => ({
      label: theme.title,
      target: { kind: 'theme', themeId: theme.id } as const,
    }))
    const storyTargets = stories.stories.map((story) => ({
      label: story.label,
      target: { kind: 'story', storyId: story.id } as const,
    }))
    const themeCallouts = themes.themes.flatMap((theme) =>
      theme.scenes.map((scene) => ({
        label: `${theme.title} — ${scene.label}`,
        target: {
          kind: 'callout',
          owner: 'theme',
          ownerId: theme.id,
          sceneId: scene.id,
        } as const,
      })),
    )
    const storyCallouts = stories.stories.flatMap((story) =>
      story.steps.map((scene, index) => ({
        label: `${story.label} — ${scene.title || `Scene ${index + 1}`}`,
        target: {
          kind: 'callout',
          owner: 'story',
          ownerId: story.id,
          sceneId: scene.authored.id ?? scene.scene ?? `${story.id}-scene-${index + 1}`,
        } as const,
      })),
    )
    const storyboards = stories.stories.map((story) => ({
      label: story.label,
      target: { kind: 'storyboard', storyId: story.id } as const,
    }))

    return [...standaloneScenes, ...themeTargets, ...storyTargets, ...themeCallouts, ...storyCallouts, ...storyboards]
  }, [scenes.library, stories.stories, themes.themes])
  const directOptionsForKind = directOptions.filter((option) => option.target.kind === directKind)
  const selectedDirectTarget = presentation.directTarget
  const activeDirectOption = selectedDirectTarget
    ? directOptions.find((option) => directTargetKey(option.target) === directTargetKey(selectedDirectTarget))
    : undefined
  const firstCalloutTarget = directOptions.find((option) => option.target.kind === 'callout')?.target
  const activeCalloutOwner =
    selectedDirectTarget?.kind === 'callout'
      ? selectedDirectTarget.owner
      : firstCalloutTarget?.kind === 'callout'
        ? firstCalloutTarget.owner
        : 'theme'
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

  const { mode, setMode } = editor
  const directUsesStories =
    directKind === 'story' || directKind === 'storyboard' || (directKind === 'callout' && activeCalloutOwner === 'story')
  const directUsesThemes = directKind === 'theme' || (directKind === 'callout' && activeCalloutOwner === 'theme')
  const directUsesStandaloneScenes = directKind === 'standalone-scene'

  const chooseDirectTarget = (target: DirectTarget) => {
    switch (target.kind) {
      case 'standalone-scene':
        scenes.choose(target.sceneId)
        break
      case 'theme':
        themes.chooseTheme(target.themeId)
        break
      case 'story':
      case 'storyboard':
        stories.choose(target.storyId)
        break
      case 'callout':
        if (target.owner === 'theme') {
          themes.chooseTheme(target.ownerId)
          const theme = themes.themes.find((candidate) => candidate.id === target.ownerId)
          const at = theme?.scenes.findIndex((scene) => scene.id === target.sceneId) ?? -1
          if (at >= 0) themes.chooseScene(at)
        } else {
          stories.choose(target.ownerId)
          const story = stories.stories.find((candidate) => candidate.id === target.ownerId)
          const at =
            story?.steps.findIndex(
              (scene, index) =>
                (scene.authored.id ?? scene.scene ?? `${story.id}-scene-${index + 1}`) === target.sceneId,
            ) ?? -1
          if (at >= 0) stories.select(at)
        }
        break
    }
    presentation.setDirectTarget(target)
  }

  const chooseDirectKind = (kind: DirectKind) => {
    setDirectKind(kind)
    const first = directOptions.find((option) => option.target.kind === kind)
    if (first) chooseDirectTarget(first.target)
    else presentation.setDirectTarget(null)
  }

  const sceneEditor: SceneLibraryEditor = {
    ...scenes,
    choose: (action) => {
      const id = resolveStateAction(action, scenes.chosen)
      chooseDirectTarget({ kind: 'standalone-scene', sceneId: id })
    },
  }
  const themeEditor: ThemeComposition = {
    ...themes,
    chooseScene: (action) => {
      const at = resolveStateAction(action, themes.at)
      themes.chooseScene(at)
      if (directKind !== 'callout') return
      const theme = themes.themes.find((candidate) => candidate.id === themes.chosenTheme)
      const scene = theme?.scenes[at]
      if (theme && scene) {
        presentation.setDirectTarget({
          kind: 'callout',
          owner: 'theme',
          ownerId: theme.id,
          sceneId: scene.id,
        })
      }
    },
    chooseTheme: (action) => {
      const id = resolveStateAction(action, themes.chosenTheme)
      themes.chooseTheme(id)
      const theme = themes.themes.find((candidate) => candidate.id === id)
      if (directKind === 'theme') {
        presentation.setDirectTarget({ kind: 'theme', themeId: id })
      } else if (directKind === 'callout' && theme?.scenes[0]) {
        presentation.setDirectTarget({
          kind: 'callout',
          owner: 'theme',
          ownerId: id,
          sceneId: theme.scenes[0].id,
        })
      } else if (directKind === 'callout') {
        presentation.setDirectTarget(null)
      }
    },
  }
  const storyEditor: SceneList = {
    ...stories,
    choose: (action) => {
      const id = resolveStateAction(action, stories.chosen)
      stories.choose(id)
      const target =
        directKind === 'storyboard'
          ? ({ kind: 'storyboard', storyId: id } as const)
          : ({ kind: 'story', storyId: id } as const)
      if (directKind !== 'callout') presentation.setDirectTarget(target)
      else {
        const story = stories.stories.find((candidate) => candidate.id === id)
        const scene = story?.steps[0]
        if (story && scene) {
          presentation.setDirectTarget({
            kind: 'callout',
            owner: 'story',
            ownerId: story.id,
            sceneId: scene.authored.id ?? scene.scene ?? `${story.id}-scene-1`,
          })
        } else presentation.setDirectTarget(null)
      }
    },
    select: (action) => {
      const at = resolveStateAction(action, stories.at)
      stories.select(at)
      if (directKind !== 'callout') return
      const story = stories.stories.find((candidate) => candidate.id === stories.chosen)
      const scene = story?.steps[at]
      if (story && scene) {
        presentation.setDirectTarget({
          kind: 'callout',
          owner: 'story',
          ownerId: story.id,
          sceneId: scene.authored.id ?? scene.scene ?? `${story.id}-scene-${at + 1}`,
        })
      }
    },
  }
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
  const themeChanges = themes.edited ? [{ field: 'points' as const, key: 'themes', source: themes.source }] : []
  const layerChanges =
    presentation.mode !== 'direct'
      ? []
      : directUsesStories
        ? storyChanges
        : directUsesThemes
          ? themeChanges
          : directUsesStandaloneScenes
            ? libraryChanges
            : []
  const layerSource =
    presentation.mode !== 'direct'
      ? editor.source
      : directUsesStories
        ? stories.source
        : directUsesThemes
          ? themes.source
          : directUsesStandaloneScenes
            ? scenes.source
            : ''
  const layerDiscard =
    presentation.mode !== 'direct'
      ? editor.discard
      : directUsesStories
        ? stories.revert
        : directUsesThemes
          ? themes.revert
          : directUsesStandaloneScenes
            ? scenes.revert
            : () => undefined
  useEffect(() => {
    const wanted =
      presentation.mode === 'design'
        ? 'design'
        : presentation.mode === 'direct'
          ? directUsesStories
            ? 'stories'
            : 'scenes'
          : null
    if (wanted !== mode) setMode(wanted)
  }, [directUsesStories, mode, presentation.mode, setMode])

  useEffect(() => {
    if (presentation.mode !== 'direct' || !selectedDirectTarget) return
    if (!activeDirectOption) presentation.setDirectTarget(null)
    else if (selectedDirectTarget.kind !== directKind) setDirectKind(selectedDirectTarget.kind)
  }, [activeDirectOption, directKind, presentation, selectedDirectTarget])

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
        {(presentation.mode === 'present'
          ? ([
              ['showing', 'Info'],
              ['specifications', 'Specifications'],
            ] as const)
          : presentation.mode === 'design'
            ? ([['design', 'Design']] as const)
            : directKinds
        ).map(([id, label]) => (
          <button
            aria-selected={
              presentation.mode === 'present'
                ? presentTab === id
                : presentation.mode === 'design'
                  ? id === 'design'
                  : directKind === id
            }
            className={
              presentation.mode === 'present'
                ? presentTab === id
                  ? 'active'
                  : ''
                : presentation.mode === 'design'
                  ? 'active'
                  : directKind === id
                    ? 'active'
                    : ''
            }
            key={id}
            onClick={() => {
              if (id === 'showing' || id === 'specifications') setPresentTab(id)
              else if (id !== 'design') chooseDirectKind(id)
            }}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {presentation.mode !== 'present' ? (
        <div className="editor-tab">
          {presentation.mode === 'direct' ? (
            <label className="text-row">
              <span>{directKinds.find(([kind]) => kind === directKind)?.[1] ?? 'Target'}</span>
              <select
                disabled={directOptionsForKind.length === 0}
                onChange={(event) => {
                  const option = directOptionsForKind.find(
                    (candidate) => directTargetKey(candidate.target) === event.target.value,
                  )
                  if (option) chooseDirectTarget(option.target)
                  else presentation.setDirectTarget(null)
                }}
                value={activeDirectOption?.target.kind === directKind ? directTargetKey(activeDirectOption.target) : ''}
              >
                {directOptionsForKind.length === 0 ? <option value="">No targets yet</option> : null}
                {directOptionsForKind.length > 0 && activeDirectOption?.target.kind !== directKind ? (
                  <option value="">Choose a target</option>
                ) : null}
                {directOptionsForKind.map((option) => (
                  <option key={directTargetKey(option.target)} value={directTargetKey(option.target)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
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
              {presentation.mode === 'design' ? (
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
              ) : directUsesThemes ? (
                <>
                  <p className="eyebrow pane-heading">THEMES</p>
                  <ThemeCompositionPanel
                    editor={themeEditor}
                    selected={editor.selected}
                    selectedIsFlow={editor.selectedIsFlow ?? false}
                  />
                </>
              ) : directUsesStandaloneScenes ? (
                <>
                  {/* Every editor leads with a heading in the same voice, so the
                      tabs read as a set rather than as one panel that was
                      labelled and the others that simply started. */}
                  <p className="eyebrow pane-heading">SCENES</p>
                  <SceneLibraryPanel
                    editor={sceneEditor}
                    selected={editor.selected}
                    selectedIsFlow={editor.selectedIsFlow ?? false}
                  />
                </>
              ) : (
                <>
                  <p className="eyebrow pane-heading">STORIES</p>
                  <SceneListPanel
                    editor={storyEditor}
                    selected={editor.selected}
                    selectedIsFlow={editor.selectedIsFlow ?? false}
                  />
                </>
              )}
            </div>
            <ChangePane
              canRedo={editor.canRedo}
              canUndo={editor.canUndo}
              count={presentation.mode === 'design' ? editor.changeCount : layerChanges.length}
              hovered={editor.hovered}
              onDiscard={layerDiscard}
              onDiscardOne={editor.discardOne}
              onHover={editor.hover}
              onSelect={editor.select}
              pending={presentation.mode === 'design' ? editor.pending : layerChanges}
              onRedo={editor.redo}
              onUndo={editor.undo}
              source={layerSource}
            />
          </SplitPane>
        </div>
      ) : presentTab === 'showing' ? (
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
              apportioned them between one deployment's groups, which
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
