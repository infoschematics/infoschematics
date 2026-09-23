import type { InfoschematicConfig } from '@infoschematics/domain-model'
import { useInfoschematic } from '@infoschematics/view-canvas'
import type { ArtefactDraftOperation } from '@infoschematics/view-model/artefact-draft'
import {
  type AlignEdge,
  type ArtefactCapabilities,
  type ArtefactGeometry,
  type ArtefactKind,
  type ArtefactSelection,
  type ArtefactValueByKind,
  type DistributeAxis,
  type InteractionLayers,
  movableBox,
  type Placement
} from '@infoschematics/view-model/editable'
import { type PortCounts, portsForBox, type Side } from '@infoschematics/view-model/ports'
import type { RuntimeInterface } from '@infoschematics/view-model/runtime'
import type { DirectTarget } from '@infoschematics/view-present'
import { type SetStateAction, useEffect, useMemo, useState } from 'react'
import { type DirectOption, directOptionsFor, directTargetKey } from '../direct-targets.ts'
import { ArtefactControls, type ArtefactControlsEditor } from '../editor/ArtefactControls.tsx'
import { type ArtefactFactoryContext, createFactoryIdentityAllocator } from '../editor/artefact-factories.ts'
import { type ArtefactPropertiesPatch, nextArtefactIndex } from '../editor/artefact-operations.ts'
import { ChangePane } from '../editor/ChangePane.tsx'
import type { StudioSourcePanelController } from '../editor/document-history.ts'
import { EditorPanel } from '../editor/EditorPanel.tsx'
import { EditorTools } from '../editor/EditorTools.tsx'
import {
  createLibraryIdentityAllocator,
  isValidLibraryFlowContext,
  type LibraryContext,
  type LibraryFlowContext
} from '../editor/library.ts'
import { SceneLibraryPanel } from '../editor/SceneLibraryPanel.tsx'
import { SceneListPanel } from '../editor/SceneListPanel.tsx'
import { SequenceCompositionPanel } from '../editor/SequenceCompositionPanel.tsx'
import type {
  EditorMode,
  PendingChange,
  PendingOrigin,
  TextDraft,
  TextField,
  WrittenChange
} from '../editor/use-editor.ts'
import type { SceneLibraryEditor } from '../editor/use-scene-library.ts'
import type { SceneList } from '../editor/use-scene-list.ts'
import type { SequenceComposition } from '../editor/use-sequence-composition.ts'
import { useSessionState } from '../hooks/use-persistent-state.ts'
import type { Presentation } from '../hooks/use-presentation.ts'
import { useContractDetail } from './contracts.ts'
import { InterfaceLines } from './InterfaceLines.tsx'
import { ModelRegister } from './ModelRegister.tsx'
import { SourcePanel } from './SourcePanel.tsx'
import { SpecificationOverlay } from './SpecificationOverlay.tsx'
import { SpecificationTree } from './SpecificationTree.tsx'
import { SplitPane } from './SplitPane.tsx'

type DirectKind = DirectTarget['kind']

const directKinds = [
  ['standalone-scene', 'Scenes'],
  ['sequence', 'Sequences'],
  ['story', 'Stories'],
  ['callout', 'Callouts'],
  ['storyboard', 'Storyboard']
] as const satisfies readonly (readonly [DirectKind, string])[]

const resolveStateAction = <Value,>(action: SetStateAction<Value>, current: Value): Value =>
  typeof action === 'function' ? (action as (value: Value) => Value)(current) : action

type EffectiveArtefactValue = ArtefactValueByKind[ArtefactKind]
type EditablePlaceable =
  | InfoschematicConfig['infoschematic']['cards'][number]
  | InfoschematicConfig['infoschematic']['fabrics'][number]

export type DetailsPanelEditor = {
  /** Bring every held element onto one edge or centre of the anchor. */
  alignArtefacts: (edge: AlignEdge) => void
  artefactCapabilities?: ArtefactCapabilities
  artefactGeometry?: ArtefactGeometry
  artefactIssue: string | null
  artefactOperation?: ArtefactDraftOperation
  artefactOperations: readonly ArtefactDraftOperation[]
  artefactValue?: EffectiveArtefactValue
  canRedo: boolean
  canRoute: boolean
  canUndo: boolean
  canWrap: boolean
  changeCount: number
  createArtefact: <K extends ArtefactKind>(
    kind: K,
    value: ArtefactValueByKind[K],
    index: number,
    ownerId?: string
  ) => ArtefactSelection | undefined
  discard: () => void
  discardOne: (origin: PendingOrigin) => void
  /** Space the held elements evenly between the two outermost of them. */
  distributeArtefacts: (axis: DistributeAxis) => void
  /** How many held elements a group operation would actually move, which is what enables its controls. */
  groupCount: number
  hover: (code: string | null) => void
  hovered: string | null
  identity: Readonly<Partial<Record<string, string>>> | undefined
  mode: EditorMode
  pending: readonly PendingChange[]
  placeAt: (code: string, axis: 'x' | 'y', value: number) => void
  placement: Placement | undefined
  redo: () => void
  removeArtefact: () => string | undefined
  reorderArtefact: (direction: -1 | 1) => void
  replaceArtefactProperties: (patch: ArtefactPropertiesPatch) => string | undefined
  retext: (code: string, field: TextField, value: string) => void
  select: (code: string) => void
  selected: string | null
  selectedArtefact: ArtefactSelection | null
  selectedComponent: string | null
  selectedCounts: PortCounts
  /** Whether the Infoschematic selection is a Flow, so a Scene gets the right list. */
  selectedIsFlow?: boolean
  setEditing: (editing: boolean) => void
  setMode: (next: EditorMode) => void
  setPortCount: (code: string, side: Side, count: number) => void
  source: string
  text: Readonly<Record<string, TextDraft>>
  /** Change lines the host has already taken into the authored document this session. */
  written: readonly WrittenChange[]
  /** Which kinds a Design session lets the Producer reach. */
  layers?: InteractionLayers
  toggleLayer: (kind: ArtefactKind) => void
  undo: () => void
}

type ArtefactContexts = Readonly<{
  factory: ArtefactFactoryContext
  library: LibraryContext
}>

const effectivePlaceable = (
  config: InfoschematicConfig,
  selection: ArtefactSelection | null,
  value: EffectiveArtefactValue | undefined
): EditablePlaceable | undefined => {
  if (selection?.kind !== 'card' && selection?.kind !== 'fabric') return undefined
  const effective = value as EditablePlaceable | undefined
  if (effective?.placement?.box) return effective
  return selection.kind === 'card'
    ? config.infoschematic.cards.find((candidate) => candidate.id === selection.id)
    : config.infoschematic.fabrics.find((candidate) => candidate.id === selection.id)
}

/*
 * Which group a new element belongs to, and which sittings show it. They are two questions, and a creation that
 * answered the first with the second named a Collection the document had never declared - a document that cannot be
 * read back, so the projection refused the whole batch and nothing was written at all.
 */
const collectionBeside = (
  definition: InfoschematicConfig['infoschematic'],
  beside: EditablePlaceable | undefined
): string | undefined =>
  // Absent where the document declares none: a Collection is a thing the document names.
  beside && 'domain' in beside && beside.domain ? beside.domain : definition.domains?.[0]?.id

const scopeBeside = (
  definition: InfoschematicConfig['infoschematic'],
  beside: EditablePlaceable | undefined
): string => (beside && 'scope' in beside ? beside.scope : (definition.scopes[0]?.id ?? ''))

const flowContextFor = (
  config: InfoschematicConfig,
  selection: ArtefactSelection | null,
  value: EffectiveArtefactValue | undefined,
  selectedCounts: PortCounts
): LibraryFlowContext | undefined => {
  const source = effectivePlaceable(config, selection, value)
  const family = config.infoschematic.flowFamilies[0]?.id
  if (!source || !family) return undefined
  const candidates = [...config.infoschematic.cards, ...config.infoschematic.fabrics].filter(
    (candidate) => candidate.id !== source.id
  )

  for (const sourcePort of portsForBox(source.placement.box, { ...source.placement.ports, ...selectedCounts })) {
    for (const candidate of candidates) {
      for (const targetPort of portsForBox(candidate.placement.box, candidate.placement.ports)) {
        const context: LibraryFlowContext = {
          family,
          source: {
            component: source.id,
            point: sourcePort.at,
            port: sourcePort.id
          },
          target: {
            component: candidate.id,
            point: targetPort.at,
            port: targetPort.id
          }
        }
        if (isValidLibraryFlowContext(context)) return context
      }
    }
  }
  return undefined
}

export const detailsArtefactContexts = (
  config: InfoschematicConfig,
  editor: Pick<
    DetailsPanelEditor,
    'artefactGeometry' | 'artefactOperations' | 'artefactValue' | 'selectedArtefact' | 'selectedCounts'
  >
): ArtefactContexts => {
  const definition = config.infoschematic
  const allAuthored = [
    ...definition.cards,
    ...definition.fabrics,
    ...definition.flows,
    ...definition.graphics,
    ...definition.points,
    ...definition.regions
  ]
  const usedIds = [
    ...allAuthored.map((value) => value.id),
    ...editor.artefactOperations.map((operation) => operation.target.id)
  ]
  const usedCodes = [
    ...allAuthored.flatMap((value) => ('code' in value ? [value.code] : [])),
    ...editor.artefactOperations.flatMap((operation) => (operation.target.code ? [operation.target.code] : []))
  ]
  const view = definition.viewBox
  const width = Math.min(240, view.width)
  const height = Math.min(120, view.height)
  /* A new artefact is placed clear of whatever is selected, and a selected Point is a place with no extent to
     clear, so it is measured as the zero-extent box `movableBox` gives it rather than ignored. */
  const selectedBox =
    editor.artefactGeometry && editor.artefactGeometry.role !== 'route'
      ? movableBox(editor.artefactGeometry)
      : undefined
  const box = {
    height,
    width,
    x: Math.max(view.x, Math.min(view.x + view.width - width, (selectedBox?.x ?? view.x + 16) + 24)),
    y: Math.max(view.y, Math.min(view.y + view.height - height, (selectedBox?.y ?? view.y + 16) + 24))
  }
  const at = nextArtefactIndex(config, editor.artefactOperations)
  const selectedPlaceable = effectivePlaceable(config, editor.selectedArtefact, editor.artefactValue)

  return {
    factory: {
      allocate: createFactoryIdentityAllocator(usedIds),
      at,
      box
    },
    library: {
      allocate: createLibraryIdentityAllocator({ codes: usedCodes, ids: usedIds }),
      at,
      // Beside what is selected, so a new element joins the group it was made next to.
      collection: collectionBeside(definition, selectedPlaceable),
      flow: flowContextFor(config, editor.selectedArtefact, editor.artefactValue, editor.selectedCounts),
      // Only where it goes: a template brings its own size, and handing over the whole rectangle is what took it away.
      origin: { x: box.x, y: box.y },
      scope: scopeBeside(definition, selectedPlaceable)
    }
  }
}

export const artefactControlsEditorFor = (
  editor: DetailsPanelEditor,
  onCreateCard?: (kind: 'adapter' | 'card') => void
): ArtefactControlsEditor => ({
  artefactCapabilities: editor.artefactCapabilities,
  artefactGeometry: editor.artefactGeometry,
  artefactIssue: editor.artefactIssue,
  artefactValue: editor.artefactValue,
  canWrap: editor.canWrap,
  createArtefact: editor.createArtefact,
  createCard: onCreateCard,
  removeArtefact: editor.removeArtefact,
  reorderArtefact: editor.reorderArtefact,
  replaceArtefactProperties: (properties) => {
    const selected = editor.selectedArtefact
    if (!selected) return
    editor.replaceArtefactProperties({
      kind: selected.kind,
      value: properties
    } as ArtefactPropertiesPatch)
  },
  selectedArtefact: editor.selectedArtefact
})

export function DesignDetails({
  contexts,
  editor,
  onCreateCard
}: Readonly<{
  contexts: ArtefactContexts
  editor: DetailsPanelEditor
  onCreateCard?: (kind: 'adapter' | 'card') => void
}>) {
  return (
    <>
      <ArtefactControls
        editor={artefactControlsEditorFor(editor, onCreateCard)}
        factoryContext={contexts.factory}
        libraryContext={contexts.library}
      />
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
    </>
  )
}

// What is currently showing, and what the published pack says about it.
export function DetailsPanel({
  editor,
  scenes,
  stories,
  sequences,
  onAddWaypoint,
  onCreateCard,
  onGridSizeChange,
  onResetRoute,
  onSpecificationHover,
  presentation,
  sourcePanel
}: {
  /** Supplied by the app, which is the only place that can issue a code and find room for a card. Absent where the
      document declares no Scope, which is a Card's starting place and the source of its code. */
  onCreateCard?: (kind: 'adapter' | 'card') => void
  onGridSizeChange?: (gridSize: number) => void
  /** Lifted to the app, because the Infoschematic marks what the selected scene lights. */
  /** The scene library, lifted for the same reason the stories are. */
  scenes: SceneLibraryEditor
  stories: SceneList
  sequences: SequenceComposition
  /** Both need the Infoschematic: where there is room on a route, and where its ports are. */
  onAddWaypoint: () => void
  onResetRoute: () => void
  onSpecificationHover: (elements: readonly string[] | null) => void
  sourcePanel?: StudioSourcePanelController
  editor: DetailsPanelEditor & {
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
    written: readonly WrittenChange[]
    layers?: InteractionLayers
    toggleLayer: (kind: ArtefactKind) => void
  }
  presentation: Presentation
}) {
  const {
    config: canonicalConfig,
    compatibilityConfig: config,
    infoschematicSpecificationSections
  } = useInfoschematic()
  // biome-ignore lint/correctness/useExhaustiveDependencies: pre-existing dependency shape kept as-is; TOOL-015 is toolchain-only and does not change effect/callback behaviour.
  const artefactContexts = useMemo(
    () => detailsArtefactContexts(config, editor),
    [
      config,
      editor.artefactGeometry,
      editor.artefactOperations,
      editor.artefactValue,
      editor.selectedArtefact,
      editor.selectedCounts
    ]
  )
  // Present remembers reading state; Producer modes are selected explicitly by
  // the transient production state rather than masquerading as panel tabs.
  const [presentTab, setPresentTab] = useSessionState<'showing' | 'specifications'>(
    config.id && `${config.id}.panel.tab.present`,
    'showing'
  )
  const [sourceOpen, setSourceOpen] = useState(false)
  /*
   * Source is the one tab that outlives its mode, and it took priority over the mode's own panel below, so leaving
   * Present with the YAML open and entering Design showed the YAML instead of the Design tools. A mode change is a
   * request to work on something, so it lands on that mode's own panel; the tab strip alone never showed this.
   */
  const [sourceMode, setSourceMode] = useState(presentation.mode)
  if (sourceMode !== presentation.mode) {
    setSourceMode(presentation.mode)
    setSourceOpen(false)
  }
  const [directKind, setDirectKind] = useState<DirectKind>('standalone-scene')
  const directOptions = useMemo<readonly DirectOption[]>(
    () => directOptionsFor(scenes.library, sequences.sequences, stories.stories),
    [scenes.library, stories.stories, sequences.sequences]
  )
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
        : 'sequence'
  const [selectedContract, setSelectedContract] = useState<RuntimeInterface | null>(null)
  /* Reading opens the document overlay; selecting a tree node keeps detail in the panel. */
  const [reading, setReading] = useState<RuntimeInterface | null>(null)
  const { detail: contractDetail, failed: contractError } = useContractDetail(selectedContract)
  const selectedDocumentVersion = selectedContract?.version ?? contractDetail?.version
  const selectedDocuments =
    selectedContract?.documents ??
    (selectedContract?.contract || selectedContract?.href || selectedContract?.version
      ? [{ code: selectedContract.contract, href: selectedContract.href, version: selectedContract.version }]
      : [])
  const selectedDocumentSummary = selectedDocuments
    ?.map(({ code, version }) => [code, version && `Version ${version}`].filter(Boolean).join(' · '))
    .filter(Boolean)
    .join(' · ')
  const selectedDocumentMeta = selectedDocuments.length === 1 ? selectedDocumentSummary : undefined
  const { activeSequence, activeSequenceScene, runningStory, standaloneScene, expandedScene } = presentation

  const { mode, setMode } = editor
  const directUsesStories =
    directKind === 'story' ||
    directKind === 'storyboard' ||
    (directKind === 'callout' && activeCalloutOwner === 'story')
  const directUsesSequences =
    directKind === 'sequence' || (directKind === 'callout' && activeCalloutOwner === 'sequence')
  const directUsesStandaloneScenes = directKind === 'standalone-scene'

  const chooseDirectTarget = (target: DirectTarget) => {
    switch (target.kind) {
      case 'standalone-scene':
        scenes.choose(target.sceneId)
        break
      case 'sequence':
        sequences.chooseSequence(target.sequenceId)
        break
      case 'story':
      case 'storyboard':
        stories.choose(target.storyId)
        break
      case 'callout':
        if (target.owner === 'sequence') {
          sequences.chooseSequence(target.ownerId)
          const sequence = sequences.sequences.find((candidate) => candidate.id === target.ownerId)
          const at = sequence?.scenes.findIndex((scene) => scene.id === target.sceneId) ?? -1
          if (at >= 0) sequences.chooseScene(at)
        } else {
          stories.choose(target.ownerId)
          const story = stories.stories.find((candidate) => candidate.id === target.ownerId)
          const at =
            story?.steps.findIndex(
              (scene, index) =>
                (scene.authored.id ?? scene.scene ?? `${story.id}-scene-${index + 1}`) === target.sceneId
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
    }
  }
  const sequenceEditor: SequenceComposition = {
    ...sequences,
    chooseScene: (action) => {
      const at = resolveStateAction(action, sequences.at)
      sequences.chooseScene(at)
      if (directKind !== 'callout') return
      const sequence = sequences.sequences.find((candidate) => candidate.id === sequences.chosenSequence)
      const scene = sequence?.scenes[at]
      if (sequence && scene) {
        presentation.setDirectTarget({
          kind: 'callout',
          owner: 'sequence',
          ownerId: sequence.id,
          sceneId: scene.id
        })
      }
    },
    chooseSequence: (action) => {
      const id = resolveStateAction(action, sequences.chosenSequence)
      sequences.chooseSequence(id)
      const sequence = sequences.sequences.find((candidate) => candidate.id === id)
      if (directKind === 'sequence') {
        presentation.setDirectTarget({ kind: 'sequence', sequenceId: id })
      } else if (directKind === 'callout' && sequence?.scenes[0]) {
        presentation.setDirectTarget({
          kind: 'callout',
          owner: 'sequence',
          ownerId: id,
          sceneId: sequence.scenes[0].id
        })
      } else if (directKind === 'callout') {
        presentation.setDirectTarget(null)
      }
    }
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
            sceneId: scene.authored.id ?? scene.scene ?? `${story.id}-scene-1`
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
          sceneId: scene.authored.id ?? scene.scene ?? `${story.id}-scene-${at + 1}`
        })
      }
    }
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
  // The key names the authored field the change lands in, which `ADR-INFOSCHEMATICS-019` retains as `themes`.
  const sequenceChanges = sequences.edited
    ? [{ field: 'points' as const, key: 'themes', source: sequences.source }]
    : []
  const layerChanges =
    presentation.mode !== 'direct'
      ? []
      : directUsesStories
        ? storyChanges
        : directUsesSequences
          ? sequenceChanges
          : directUsesStandaloneScenes
            ? libraryChanges
            : []
  const layerSource =
    presentation.mode !== 'direct'
      ? editor.source
      : directUsesStories
        ? stories.source
        : directUsesSequences
          ? sequences.source
          : directUsesStandaloneScenes
            ? scenes.source
            : ''
  const layerDiscard =
    presentation.mode !== 'direct'
      ? editor.discard
      : directUsesStories
        ? stories.revert
        : directUsesSequences
          ? sequences.revert
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

  /*
   * Which kind tab a target belongs to, and no more. Clearing a target that has left the document is the production
   * reducer's, dispatched by `App` from the same option list this panel reads: a panel is one place a target can be
   * chosen and not the only place the document can change under it.
   */
  useEffect(() => {
    if (presentation.mode !== 'direct' || !selectedDirectTarget || !activeDirectOption) return
    if (selectedDirectTarget.kind !== directKind) setDirectKind(selectedDirectTarget.kind)
  }, [activeDirectOption, directKind, presentation.mode, selectedDirectTarget])

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
              ...(sourcePanel ? ([['source', 'Source']] as const) : [])
            ] as const)
          : presentation.mode === 'design'
            ? ([['design', 'Design'], ...(sourcePanel ? ([['source', 'Source']] as const) : [])] as const)
            : ([...directKinds, ...(sourcePanel ? ([['source', 'Source']] as const) : [])] as const)
        ).map(([id, label]) => (
          <button
            aria-selected={
              id === 'source'
                ? sourceOpen
                : sourceOpen
                  ? false
                  : presentation.mode === 'present'
                    ? presentTab === id
                    : presentation.mode === 'design'
                      ? id === 'design'
                      : directKind === id
            }
            className={
              id === 'source'
                ? sourceOpen
                  ? 'active'
                  : ''
                : sourceOpen
                  ? ''
                  : presentation.mode === 'present'
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
              if (id === 'source') setSourceOpen(true)
              else {
                setSourceOpen(false)
                if (id === 'showing' || id === 'specifications') setPresentTab(id)
                else if (id !== 'design') chooseDirectKind(id)
              }
            }}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {sourceOpen && sourcePanel ? (
        <SourcePanel controller={sourcePanel} />
      ) : presentation.mode !== 'present' ? (
        <div className="editor-tab">
          {/* The tab is a two-row grid. Direct mode adds a target chooser, so it
              joins the tools in one header row rather than claiming an implicit
              third that the split pane's bounded track would come out of. */}
          <div className="editor-tab-header">
            {presentation.mode === 'direct' ? (
              <label className="text-row">
                <span>{directKinds.find(([kind]) => kind === directKind)?.[1] ?? 'Target'}</span>
                <select
                  disabled={directOptionsForKind.length === 0}
                  onChange={(event) => {
                    const option = directOptionsForKind.find(
                      (candidate) => directTargetKey(candidate.target) === event.target.value
                    )
                    if (option) chooseDirectTarget(option.target)
                    else presentation.setDirectTarget(null)
                  }}
                  value={
                    activeDirectOption?.target.kind === directKind ? directTargetKey(activeDirectOption.target) : ''
                  }
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
              gridSize={canonicalConfig.diagram.gridSize}
              groupCount={editor.groupCount}
              onAlign={editor.alignArtefacts}
              onDistribute={editor.distributeArtefacts}
              onAddWaypoint={onAddWaypoint}
              onGridSizeChange={onGridSizeChange}
              onResetRoute={onResetRoute}
              layers={editor.layers}
              onToggleLayer={editor.toggleLayer}
            />
          </div>
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
                <DesignDetails contexts={artefactContexts} editor={editor} onCreateCard={onCreateCard} />
              ) : directUsesSequences ? (
                <>
                  <p className="eyebrow pane-heading">SEQUENCES</p>
                  <SequenceCompositionPanel
                    editor={sequenceEditor}
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
              written={presentation.mode === 'design' ? editor.written : []}
            />
          </SplitPane>
        </div>
      ) : presentTab === 'showing' ? (
        <div className="contract-body">
          {activeSequence ? (
            <>
              <p className="sequence-headline">{activeSequenceScene?.headline ?? activeSequence.label}</p>
              <p>{activeSequence.description || activeSequenceScene?.description}</p>
            </>
          ) : runningStory ? (
            <p>{runningStory.question}</p>
          ) : expandedScene ? (
            <>
              <p className="sequence-headline">{expandedScene.headline}</p>
              <p>{expandedScene.description}</p>
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
        <div className="contract-body specifications-body">
          <div className="specifications-selection">
            <p className="register-note specification-lead">
              Specifications are grouped by expanded area. Expand the tree to inspect conformance points and operations.
            </p>
            <SpecificationTree
              onHover={onSpecificationHover}
              onSelect={(entry) => setSelectedContract((current) => (current?.id === entry.id ? null : entry))}
              sections={infoschematicSpecificationSections}
              selected={selectedContract}
            />
          </div>

          <div className="specifications-detail">
            {selectedContract ? (
              <>
                <div className="compact-heading state-contract-heading">
                  <div>
                    <p className="eyebrow">{selectedContract.kind ?? 'group'}</p>
                    <h2>{selectedContract.label}</h2>
                  </div>
                  {selectedDocuments.length === 1 && selectedContract.href ? (
                    <button className="link-button" onClick={() => setReading(selectedContract)} type="button">
                      Read specification
                    </button>
                  ) : null}
                </div>

                {selectedContract.owner ||
                selectedDocumentMeta ||
                selectedContract.contract ||
                selectedDocumentVersion ? (
                  <p className="contract-meta">
                    {[
                      selectedContract.owner,
                      selectedDocumentMeta || (selectedDocuments.length === 0 && selectedContract.contract),
                      !selectedDocumentMeta &&
                        selectedDocuments.length === 0 &&
                        selectedDocumentVersion &&
                        `Version ${selectedDocumentVersion}`
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                ) : null}
                {selectedContract.description || contractDetail?.description ? (
                  <p>{selectedContract.description || contractDetail?.description}</p>
                ) : null}
                {contractError ? <p className="contract-empty">Specification document could not be loaded.</p> : null}

                {selectedDocuments.length > 1 ? (
                  <>
                    <p className="eyebrow specification-detail-heading">Documents</p>
                    <ul className="contract-operations">
                      {selectedDocuments.map((document) => (
                        <li key={`${document.code ?? ''}:${document.href ?? ''}:${document.version ?? ''}`}>
                          <code>{document.code ?? 'Document'}</code>
                          <span>{document.version ? `Version ${document.version}` : 'Published binding'}</span>
                          {document.href ? (
                            <button
                              className="link-button"
                              onClick={() =>
                                setReading({
                                  ...selectedContract,
                                  contract: document.code,
                                  href: document.href,
                                  version: document.version
                                })
                              }
                              type="button"
                            >
                              Read
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {(selectedContract.operations?.length ?? 0) > 0 ? (
                  <>
                    <p className="eyebrow specification-detail-heading">Operations</p>
                    <ul className="contract-operations">
                      {selectedContract.operations?.map((operation) => (
                        <li key={operation.id}>
                          <code>{operation.id.split('/').at(-1)}</code>
                          <span>{operation.label}</span>
                          {operation.description ? <em>{operation.description}</em> : null}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : contractDetail && contractDetail.operations.length > 0 ? (
                  <>
                    <p className="eyebrow specification-detail-heading">Operations</p>
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
                ) : null}

                <InterfaceLines realisedBy={selectedContract.realisedBy ?? []} />
              </>
            ) : (
              <p className="contract-empty specifications-empty">
                Choose any node to see its document, description, operations and realising diagram elements.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Fixed, so it covers the Infoschematic rather than the panel it was opened from. */}
      {reading?.href ? (
        <SpecificationOverlay href={reading.href} name={reading.label} onClose={() => setReading(null)} />
      ) : null}
    </section>
  )
}
