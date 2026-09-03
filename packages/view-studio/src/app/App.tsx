import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  defineInfoschematicRenderers,
  InfoschematicContext,
  InfoschematicDiagram,
  InfoschematicRenderersContext,
  useInfoschematic,
} from '@infoschematics/view-canvas'
import type { PresentProps } from '@infoschematics/view-present'
import type { CreatedComponent, CreatedFlow } from '@infoschematics/view-model/editable'
import type { Box } from '@infoschematics/view-model/geometry'
import { portsForBox } from '@infoschematics/view-model/ports'
import { routeBetweenPorts } from '@infoschematics/view-model/routing'
import {
  createInfoschematicRuntime,
  type InfoschematicRuntime,
  type RuntimeStory,
} from '@infoschematics/view-model/runtime'
import { infoschematicEditable } from './editor/infoschematic-editable.ts'
import { FamilyChoice } from './editor/FamilyChoice.tsx'
import { type Attachment, useEditor } from './editor/use-editor.ts'
import { useSceneLibrary } from './editor/use-scene-library.ts'
import { useSceneList } from './editor/use-scene-list.ts'
import { usePersistentState } from './hooks/use-persistent-state.ts'
import { usePresentation } from './hooks/use-presentation.ts'
import { DetailsPanel } from './panels/DetailsPanel.tsx'
import { SceneCallout } from './panels/SceneCallout.tsx'
import { ProducerControls } from './panels/ProducerControls.tsx'
import { PanelRail } from './panels/PanelRail.tsx'
import { ShortcutOverlay } from './panels/ShortcutOverlay.tsx'
import { TitleBar } from './panels/TitleBar.tsx'

type InfoschematicScopeId = string

// Flow Families remain visible controls whether or not their Flows reference a
// published interface specification.

/*
 * Which lines meet a card, by code.
 *
 * The editor keys everything by code and knows nothing about the Infoschematic,
 * so the Infoschematic answers this rather than the editor guessing. A code that names
 * a flow meets nothing: a line has no lines of its own.
 */
function linesMeeting(
  code: string,
  flows: readonly { code: string; source: string; target: string }[],
  runtime: InfoschematicRuntime,
) {
  const card = runtime.infoschematicRegister.cardAt(code)
  if (!card) return []
  return flows.filter((flow) => flow.source === card.id || flow.target === card.id).map((flow) => flow.code)
}

/**
 * Where a port sits in the model, before any edit in hand.
 *
 * A created line is routed from these rather than from where its ports are on
 * screen, so that the move and attachment drafts can then be applied to it
 * exactly as they are to an authored line. Routing it from the drafted
 * positions and then moving it would apply the same offset twice.
 */
const authoredPortAt =
  (
    runtime: InfoschematicRuntime,
    visibleScopes: ReadonlySet<InfoschematicScopeId>,
    created: readonly CreatedComponent[] = [],
  ) =>
  (endpoint: string, port: string) => {
    // Created cards are included but their offsets are not, which is the same
    // rule authored cards get here: a created card's own box is what was
    // written down for it, and the drag on top of that is applied afterwards.
    const placeable = runtime
      .infoschematicPlaceables(visibleScopes, { created })
      .find((candidate) => candidate.id === endpoint)
    return placeable && portsForBox(placeable.box, placeable.ports).find((candidate) => candidate.id === port)?.at
  }

/**
 * The next code free in a family's series.
 *
 * Counted off the highest in use rather than off how many there are, because a
 * removal leaves a gap and ADR-INFOSCHEMATICS-003 keeps it: filling one would hand a
 * code back out that a decision record, a specification or a change set may
 * still be talking about. Offered rather than issued - the reader can write
 * something else over it before applying the set.
 */
function nextCodeIn(prefix: string, taken: readonly string[]): string {
  const serials = taken.flatMap((code) => new RegExp(`^${prefix}-(\\d+)$`).exec(code)?.slice(1) ?? [])
  const highest = serials.reduce((best, serial) => Math.max(best, Number(serial)), 0)
  // Follow the configured series width, with two digits as the minimum.
  const width = serials.reduce((widest, serial) => Math.max(widest, serial.length), 2)
  return `${prefix}-${String(highest + 1).padStart(width, '0')}`
}

/** Derives a stable identifier from the Card name using the authored naming rule. */
const identifierFrom = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Where a new card lands.
 *
 * The middle of the Infoschematic, stepped along for each card already made this
 * session so a second does not hide the first. It is put somewhere visible
 * rather than somewhere correct - a card belongs where its architecture puts
 * it, which is a judgment, and dragging it there is a gesture the editor
 * already has.
 */
const roomForCard = (viewBox: Box, made: number): Box => ({
  height: 80,
  width: 160,
  x: viewBox.x + viewBox.width / 2 - 80 + made * 20,
  y: viewBox.y + viewBox.height / 2 - 40 + made * 20,
})

export function Studio({ config, renderers }: PresentProps) {
  const runtime = useMemo(() => createInfoschematicRuntime(config), [config])
  const rendererRegistry = useMemo(() => defineInfoschematicRenderers(renderers ?? {}), [renderers])
  return (
    <InfoschematicRenderersContext value={rendererRegistry}>
      <InfoschematicContext value={runtime}>
        <AppContent />
      </InfoschematicContext>
    </InfoschematicRenderersContext>
  )
}

/** Compatibility name retained for existing hosts while the additive View names settle. */
export const App = Studio

function AppContent() {
  const runtime = useInfoschematic()
  const {
    flowsAfterCreations,
    flowsAfterEdits,
    infoschematicFamilies,
    infoschematicFlows,
    infoschematicPlaceables,
    infoschematicRegister,
    infoschematicRegisterWith,
    infoschematicScopes,
    thematicScenes,
    themeLogos,
  } = runtime
  const storage = runtime.config.id
  const [collapsed, setCollapsed] = usePersistentState(storage && `${storage}.panels.collapsed`, true)
  const [shortcuts, setShortcuts] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [diagramWidth, setDiagramWidth] = useState<number | null>(null)
  const [panelWidth, setPanelWidth] = usePersistentState<number | null>(storage && `${storage}.panels.width`, null)
  const infoschematicPanel = useRef<HTMLDivElement>(null)
  const infoschematicControls = useRef<HTMLDivElement>(null)
  const controlRoom = useRef<HTMLElement>(null)
  const [_connected, _setConnected] = useState(false)

  const presentation = usePresentation()
  // The diagram describes its own handles and constraints; the editor only holds
  // what has been dragged and what that should be written back as.
  const buildEditable = useCallback(
    (
      drafts: ReadonlyMap<string, { dx: number; dy: number }>,
      labels: ReadonlyMap<string, number>,
      attached: ReadonlyMap<string, Attachment>,
      created: readonly CreatedFlow[],
      createdCards: readonly CreatedComponent[],
    ) =>
      infoschematicEditable(
        runtime.editableModel,
        flowsAfterCreations(
          presentation.visibleFlows,
          created,
          authoredPortAt(runtime, presentation.visibleScopes, createdCards),
        ),
        presentation.visibleScopes,
        drafts,
        labels,
        attached,
        createdCards,
      ),
    [flowsAfterCreations, presentation.visibleFlows, presentation.visibleScopes, runtime],
  )
  const editor = useEditor(buildEditable)
  // Lifted here because two things read it: the panel that edits a scene, and
  // the Infoschematic that marks what the selected one lights.
  const sceneList = useSceneList(presentation.playing)
  const sceneLibrary = useSceneLibrary()
  const { highlight, playing, runningStory, runningStoryScene, visibleFlows, visibleScopes } = presentation
  const storyCallout = playing
    ? runtime.config.stories.find((story) => story.id === playing.id)?.scenes[playing.step]?.callout
    : undefined
  const thematicCallout = presentation.thematicScene
    ? runtime.config.themes
        .flatMap((theme) => theme.scenes)
        .find((scene) => scene.id === presentation.thematicScene?.id)?.callout
    : undefined
  // A dragged card's routes have to redraw with it, and a hand-edited route
  // has to draw as edited, so the Infoschematic draws flows folded with both
  // rather than the authored ones while an edit is live.
  // The register the app reads, which is the effective one: a card created a
  // moment ago has to answer what it is exactly as an authored one does.
  const register = infoschematicRegisterWith(editor.createdCards)

  /*
   * An adapter has no independent position, so it inherits the held Card's
   * offset. Placement, routing and drawing therefore share one model fact.
   */
  const movedComponents = useMemo(() => {
    const all = new Map(editor.drafts)
    for (const entry of register.all) {
      const held = entry.wraps ? register.byId(entry.wraps) : undefined
      const offset = held && all.get(held.code)
      if (offset) all.set(entry.code, offset)
    }
    return all
  }, [editor.drafts, register])

  // Where a port sits, after any component move, so a re-attached end lands on
  // the port as it is now rather than as it was authored.
  const portAt = useCallback(
    (endpoint: string, port: string) => {
      const drafts = { created: editor.createdCards, offsets: movedComponents, portCounts: editor.portCounts }
      const placeable = infoschematicPlaceables(visibleScopes, drafts).find((candidate) => candidate.id === endpoint)
      if (!placeable) return undefined
      return portsForBox(placeable.box, placeable.ports).find((candidate) => candidate.id === port)?.at
    },
    [editor.createdCards, editor.portCounts, infoschematicPlaceables, movedComponents, visibleScopes],
  )

  /*
   * Two ports a drag has joined, waiting on a family.
   *
   * Held here rather than in the editor because it is not an edit yet: nothing
   * has been created, nothing is undoable, and letting go without answering
   * leaves the model exactly as it was. It becomes a change only when the
   * family is chosen, which is also when there is a code to record it against.
   */
  const [proposed, setProposed] = useState<{
    at: { x: number; y: number }
    ends: { source: string; sourcePort: string; target: string; targetPort: string }
  } | null>(null)
  const proposeLine = useCallback(
    (ends: { source: string; sourcePort: string; target: string; targetPort: string }, at: { x: number; y: number }) =>
      setProposed({ at, ends }),
    [],
  )

  /*
   * The card an adapter would be drawn around: whatever is selected, if that is
   * a card and not already an adapter. An adapter clasping an adapter is not a
   * thing the model can express, and nor is one clasping nothing.
   */
  const wrappable = editor.selected ? register.cardAt(editor.selected) : undefined
  // A card holds one adapter. Offering a second would draw two clasps around
  // the same card, each deriving its box from it and neither aware of the
  // other.
  const wrapped = new Set(register.all.flatMap((entry) => (entry.wraps ? [entry.wraps] : [])))
  const canWrap = Boolean(wrappable && !wrappable.wraps && !wrapped.has(wrappable.id))

  /*
   * A new Card starts in the first configured Scope. An adapter inherits the
   * Scope of the Card it wraps because it has no independent ownership.
   */
  const createCard = useCallback(
    (kind: 'adapter' | 'card') => {
      const held = kind === 'adapter' ? wrappable : undefined
      if (kind === 'adapter' && !held) return
      const scope = held?.group ?? infoschematicScopes[0].id
      const prefix = infoschematicScopes.find((entry) => entry.id === scope)?.prefix
      if (!prefix) return

      const label = held ? `${held.label} adapter` : 'New card'
      const taken = [...infoschematicRegister.all.map((entry) => entry.code), ...Object.keys(editor.cards)]
      const code = nextCodeIn(prefix, taken)
      editor.createCard(code, {
        // An adapter has no box: it is placed from the card it clasps.
        box: held ? undefined : roomForCard(runtime.infoschematicViewBox, editor.createdCards.length),
        detail: '',
        group: scope,
        id: identifierFrom(held ? `${held.label} adapter` : code),
        label,
        ports: held ? { east: 0, north: 0, south: 3, west: 0 } : { east: 3, north: 3, south: 3, west: 3 },
        scopes: [scope],
        wraps: held?.id,
      })
    },
    [
      editor.cards,
      editor.createCard,
      editor.createdCards.length,
      infoschematicRegister,
      infoschematicScopes,
      wrappable,
    ],
  )

  // Created lines join the authored ones before the edit drafts are folded in,
  // so a line made and then dragged ends up where it was dragged to.
  const drawnFlows = flowsAfterEdits(
    flowsAfterCreations(visibleFlows, editor.created, authoredPortAt(runtime, visibleScopes, editor.createdCards)),
    // Each adapter's move carried over from the card it clasps, so a line
    // meeting an adapter travels with that card. Passing the raw drafts here
    // was the whole of why three connectors of four moved and one did not.
    movedComponents,
    editor.routes,
    editor.attachments instanceof Map ? editor.attachments : new Map(Object.entries(editor.attachments)),
    portAt,
  )

  /*
   * The two things the toolbar can do to a route.
   *
   * A waypoint is added to the middle of the longest run, because that is where
   * there is room for one and where a reader would put it by hand. Clearing
   * runs the line straight between the two ports it names, which is the same
   * first route a created line is given - a route with no waypoints is not an
   * empty list, it is the plain dog-leg the model would have drawn.
   */
  const selectedRoute = drawnFlows.find((flow) => flow.code === editor.selected)
  const addWaypoint = useCallback(() => {
    if (!selectedRoute) return
    const points = selectedRoute.points
    let longest = 0
    let at = 1
    for (let index = 1; index < points.length; index += 1) {
      const run = Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y)
      if (run > longest) {
        longest = run
        at = index
      }
    }
    editor.addWaypoint(selectedRoute.code, points, {
      x: (points[at].x + points[at - 1].x) / 2,
      y: (points[at].y + points[at - 1].y) / 2,
    })
  }, [editor.addWaypoint, selectedRoute])

  const resetRoute = useCallback(() => {
    if (!selectedRoute) return
    const from = portAt(selectedRoute.source, selectedRoute.sourcePort)
    const to = portAt(selectedRoute.target, selectedRoute.targetPort)
    if (!from || !to) return
    editor.setRoute(selectedRoute.code, routeBetweenPorts(from, selectedRoute.sourcePort, to, selectedRoute.targetPort))
  }, [editor.setRoute, portAt, selectedRoute])

  useEffect(() => {
    if (!playing || !runningStory || !presentation.autoAdvance) return
    const step = runningStory.steps[playing.step]
    if (!step) {
      presentation.stopStory()
      return
    }

    const timer = window.setTimeout(() => {
      presentation.setPlaying((current) => {
        if (!current || current.id !== playing.id || current.step !== playing.step) return current
        const count = runningStory.steps.length
        return { id: current.id, step: (current.step + 1) % count }
      })
    }, step.hold)

    return () => window.clearTimeout(timer)
  }, [playing, presentation.autoAdvance, presentation.setPlaying, presentation.stopStory, runningStory])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      // Leave these keys alone where they already mean something.
      if (target?.closest('input, textarea, select, [role="tablist"]')) return

      if (event.key === '?') {
        event.preventDefault()
        setShortcuts((current) => !current)
        return
      }

      if (event.key === 'Escape' && shortcuts) {
        event.preventDefault()
        setShortcuts(false)
        return
      }

      // Escape clears a selection before it can reach the branch below that
      // stops a Story - the two only compete because both bind the
      // same key, not because a presenter ever means both at once.
      if (event.key === 'Escape' && editor.editing && editor.selected) {
        event.preventDefault()
        editor.select('')
        return
      }

      /*
       * Delete marks the selection for removal rather than removing it.
       *
       * Nothing is destroyed here - the change set says what to take out of the
       * model, and the model is the file. So the same key lifts the mark again,
       * and a card takes the lines that meet it because a flow with one
       * end missing cannot be written down.
       */
      if (editor.editing && editor.selected && (event.key === 'Delete' || event.key === 'Backspace')) {
        event.preventDefault()
        editor.remove(editor.selected, linesMeeting(editor.selected, drawnFlows, runtime))
        return
      }

      // Undo is the platform's shortcut, so it has to be caught before the
      // arrows: nothing else in edit mode competes for it.
      if (editor.editing && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) editor.redo()
        else editor.undo()
        return
      }

      const arrow = { ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1] }[event.key]

      // While a handle is being edited the arrows nudge it; otherwise they step
      // whatever Story is running.
      if (arrow && editor.editing && editor.selected) {
        event.preventDefault()
        const step = event.shiftKey ? 10 : 1
        editor.nudge(arrow[0] * step, arrow[1] * step)
        return
      }

      // A chosen Thematic Scene steps the same way a Story does, minus the
      // hold: there is nothing running to pause. Stepping is by hand either way,
      // so the keys mean the same thing whichever card is open.
      if (!playing && presentation.thematicScene) {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          presentation.stepThematicScene(event.key === 'ArrowRight' ? 1 : -1)
        } else if (event.key === 'Escape') {
          event.preventDefault()
          presentation.lightNothing()
        }
        return
      }

      if (!playing) return

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        presentation.stepStory(event.key === 'ArrowRight' ? 1 : -1)
      } else if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault()
        presentation.toggleAutoAdvance()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        presentation.stopStory()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    editor.editing,
    editor.nudge,
    editor.remove,
    editor.select,
    editor.selected,
    playing,
    presentation.stepStory,
    presentation.stopStory,
    presentation.toggleAutoAdvance,
    editor.undo,
    editor.redo,
    shortcuts,
    presentation.lightNothing,
    presentation.stepThematicScene,
    presentation.thematicScene,
    drawnFlows,
    runtime,
  ])

  useEffect(() => {
    const syncFullscreen = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])

  // The diagram is 3:2, so the width it can use follows from the height left over
  // after the controls tray. Measuring it here keeps the panel free of dead space
  // below the diagram and hands the remaining width to the operations panel.
  useLayoutEffect(() => {
    const panel = infoschematicPanel.current
    // Collapsed mode lets the diagram take the whole column, so the measured
    // width is neither applied nor needed until the panels come back.
    if (!panel || collapsed) return

    const measure = () => {
      // The Infoschematic panel is the Infoschematic now, so its own height is what there is:
      // the column above it has already taken the controls and the seam out.
      const available = panel.clientHeight
      if (available <= 0) return
      const next = Math.round((available * 3) / 2)
      // Tolerance stops a width change that rewraps the controls tray from
      // oscillating between two heights.
      setDiagramWidth((current) => (current !== null && Math.abs(current - next) < 6 ? current : next))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(panel)
    if (infoschematicControls.current) observer.observe(infoschematicControls.current)
    return () => observer.disconnect()
  }, [collapsed])

  function playStory(story: RuntimeStory) {
    if (playing?.id === story.id) {
      presentation.stopStory()
      return
    }
    presentation.startStory(story)
  }

  // Dragging the splitter pins the panel width, which retires the aspect-derived
  // diagram width: from then on the diagram fits whatever column is left.
  function startPanelResize(event: React.PointerEvent<HTMLButtonElement>) {
    const room = controlRoom.current
    if (!room) return
    event.preventDefault()

    const bounds = room.getBoundingClientRect()
    const apply = (clientX: number) => {
      const next = Math.round(bounds.right - clientX)
      setPanelWidth(Math.min(Math.max(next, 320), Math.round(bounds.width * 0.6)))
    }

    apply(event.clientX)
    const move = (moved: PointerEvent) => apply(moved.clientX)
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined)
      return
    }
    void document.documentElement.requestFullscreen().catch(() => undefined)
  }

  return (
    <main>
      {shortcuts ? <ShortcutOverlay onClose={() => setShortcuts(false)} /> : null}
      <TitleBar
        collapsed={collapsed}
        fullscreen={fullscreen}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
        onToggleFullscreen={toggleFullscreen}
        presentation={presentation}
      />

      <section
        className={`${collapsed ? 'control-room collapsed' : 'control-room'}${panelWidth && !collapsed ? ' sized' : ''}`}
        ref={controlRoom}
        style={
          collapsed
            ? undefined
            : panelWidth
              ? ({ '--panel-width': `${panelWidth}px` } as React.CSSProperties)
              : diagramWidth
                ? ({ '--diagram-width': `${diagramWidth}px` } as React.CSSProperties)
                : undefined
        }
      >
        {/*
         * The Infoschematic and the controls are two panels in one column, not one
         * panel with a tray at the foot. They are different things - the Infoschematic
         * is what is being shown, the controls are how it is chosen - and the
         * seam between them is the same seam that runs everywhere else.
         */}
        <div className="presentation-column">
          <div className="infoschematic-panel" ref={infoschematicPanel}>
            <section className="infoschematic" aria-label={`${runtime.config.title} Infoschematic`}>
              <InfoschematicDiagram
                componentOffsets={movedComponents}
                removals={editor.removals}
                highlight={highlight}
                guides={editor.guides}
                labelAlong={editor.labelPositions}
                onAddWaypoint={editor.editing ? editor.addWaypoint : undefined}
                onAttach={editor.editing ? editor.attachTo : undefined}
                /*
                 * The Infoschematic is told which editor is open rather than inferring it
                 * from a callback. Everything below is still the Infoschematic editor's:
                 * in scene mode the diagram renders none of it, so passing them is
                 * harmless and removing them would mean two prop sets to keep in
                 * step.
                 */
                mode={editor.mode}
                litByScene={editor.mode === 'scenes' ? sceneLibrary.lit : sceneList.lit}
                onLight={editor.mode === 'scenes' ? sceneLibrary.toggle : sceneList.toggle}
                createdCards={editor.createdCards}
                onCreateLine={editor.editing ? proposeLine : undefined}
                onFreeEnd={editor.editing ? editor.moveFreeEnd : undefined}
                onComponentMove={editor.editing ? editor.moveTo : undefined}
                onComponentRelease={editor.releaseGuides}
                onDeleteWaypoint={editor.editing ? editor.deleteWaypoint : undefined}
                onLabelMove={editor.editing ? editor.moveTo : undefined}
                onLabelRelease={editor.releaseGuides}
                onMoveSegment={editor.editing ? editor.moveSegment : undefined}
                onMoveWaypoint={editor.editing ? editor.moveWaypoint : undefined}
                onRouteRelease={editor.releaseGuides}
                onHover={editor.hover}
                hovered={editor.hovered}
                onSelect={editor.select}
                portCounts={editor.portCounts}
                flows={drawnFlows}
                selected={editor.selected}
                annotated={presentation.annotated}
                grid={editor.view.grid}
                graphic={runningStoryScene?.graphic}
                visibleScopes={visibleScopes}
              />
              {proposed ? (
                <FamilyChoice
                  at={proposed.at}
                  onCancel={() => setProposed(null)}
                  onChoose={(family) => {
                    const prefix = infoschematicFamilies.find((entry) => entry.id === family)?.prefix
                    if (prefix) {
                      const taken = [...infoschematicFlows.map((line) => line.code), ...Object.keys(editor.creations)]
                      editor.create(nextCodeIn(prefix, taken), { family, ...proposed.ends })
                    }
                    setProposed(null)
                  }}
                />
              ) : null}
              {runningStoryScene ? (
                <SceneCallout
                  autoAdvance={presentation.autoAdvance}
                  body={runningStoryScene.caption}
                  calloutConfig={storyCallout}
                  eyebrow={runningStory?.label ?? ''}
                  onExit={presentation.stopStory}
                  onStep={presentation.stepStory}
                  onToggleAuto={presentation.toggleAutoAdvance}
                  step={runningStoryScene}
                  stepNumber={(playing?.step ?? 0) + 1}
                  stepTotal={runningStory?.steps.length ?? 0}
                  takeaways={presentation.takeaways ? runningStoryScene.takeaways : undefined}
                  title={runningStoryScene.title}
                />
              ) : presentation.thematicScene ? (
                /* The same card for a Thematic Scene, without the timer: its content is
                 read at the reader's pace, so it steps by hand and never on
                 its own. */
                <SceneCallout
                  body={presentation.thematicScene.description}
                  calloutConfig={thematicCallout}
                  eyebrow={presentation.thematicScene.label}
                  key={presentation.thematicScene.id}
                  logo={themeLogos[presentation.thematicScene.id]}
                  profile={presentation.thematicScene.profile}
                  onExit={presentation.lightNothing}
                  onStep={presentation.stepThematicScene}
                  step={presentation.thematicScene}
                  stepNumber={
                    thematicScenes.findIndex((entry) => entry.id === presentation.thematicScene?.id) + 1
                  }
                  stepTotal={thematicScenes.length}
                  takeaways={presentation.takeaways ? presentation.thematicScene.takeaways : undefined}
                  wide={presentation.thematicScene.cover}
                  title={presentation.thematicScene.headline}
                />
              ) : null}
            </section>
          </div>
          <ProducerControls onPlay={playStory} ref={infoschematicControls} presentation={presentation} />
        </div>

        {collapsed ? null : (
          <button
            aria-label="Resize the panel"
            className="panel-resizer"
            onDoubleClick={() => setPanelWidth(null)}
            onPointerDown={startPanelResize}
            title="Drag to resize · double-click to reset"
            type="button"
          />
        )}

        <aside className="details-panel">
          {collapsed ? <PanelRail onPlay={playStory} presentation={presentation} /> : null}

          <DetailsPanel
            scenes={sceneLibrary}
            stories={sceneList}
            editor={{
              ...editor,
              canRoute: Boolean(selectedRoute),
              canWrap,
              // Which of a Story Scene's two lists the selection belongs in. The
              // descriptors keep flows apart from components because their id
              // types are two unions, and that typecheck is what stops a Story Scene
              // naming something that does not exist.
              selectedIsFlow: Boolean(selectedRoute),
            }}
            onAddWaypoint={addWaypoint}
            onCreateCard={createCard}
            onResetRoute={resetRoute}
            presentation={presentation}
          />
        </aside>
      </section>
    </main>
  )
}
