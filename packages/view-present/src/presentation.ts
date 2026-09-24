import type { DynamicOccurrence } from '@infoschematics/view-model/dynamics'
import type {
  InfoschematicRuntime,
  RuntimeExpandedScene,
  RuntimeSceneCue,
  RuntimeSequence,
  RuntimeStandaloneScene,
  RuntimeStory
} from '@infoschematics/view-model/runtime'

export type PlayingSequence = Readonly<{ id: string; step: number }>
/** @deprecated Use PlayingSequence. */
export type PlayingStory = PlayingSequence

/**
 * Whether Presentation originates occurrences of its own on Scene entry.
 *
 * `focused-flows` signals the focused Scene's Flows and plays the Dynamics that Scene cues; `none` originates
 * nothing, leaving every occurrence to the host. A cue is an authored request, so it is suppressed by the same
 * policy that suppresses automatic signalling rather than by one of its own.
 */
export type SceneSignalPolicy = 'focused-flows' | 'none'

export type PresentationState = Readonly<{
  annotated: boolean
  autoAdvance: boolean
  /** Advances while a Scene holds, so a repeating cue plays again under a key a renderer reads as a new occurrence. */
  cueCycle: number
  /**
   * How far the focused Scene's cascade has played, as an index into that Scene's stages counting from zero.
   *
   * It sits here rather than in a timer because derivation must give one answer from one state: a stage index kept in
   * a ref or a renderer would make a second derivation disagree with the first. Every Scene change resets it, so a
   * cascade is never part-played into a Scene that did not start it.
   */
  cueStage: number
  playing: PlayingSequence | null
  sceneOccurrence: number
  standaloneSceneId: string | null
  takeaways: boolean
  expandedSceneId: string | null
  visibleFamilies: ReadonlySet<string>
  visibleScopes: ReadonlySet<string>
}>

export type PresentationAction =
  | Readonly<{ type: 'clear-focus' }>
  | Readonly<{ type: 'replay-cues' }>
  | Readonly<{ type: 'step-cues'; sequences: readonly RuntimeSequence[]; delta: number }>
  | Readonly<{ type: 'set-annotated'; value: boolean }>
  | Readonly<{ type: 'set-auto-advance'; value: boolean }>
  | Readonly<{ type: 'set-takeaways'; value: boolean }>
  | Readonly<{ type: 'show-all-families'; ids: readonly string[]; value: boolean }>
  | Readonly<{ type: 'show-all-scopes'; ids: readonly string[]; value: boolean }>
  | Readonly<{ type: 'start-sequence'; sequence: RuntimeSequence; step?: number }>
  | Readonly<{ type: 'start-story'; story: RuntimeStory }>
  | Readonly<{ type: 'toggle-sequence-scene'; sequence: RuntimeSequence; step: number }>
  | Readonly<{ type: 'step-sequence'; sequences: readonly RuntimeSequence[]; delta: number }>
  | Readonly<{ type: 'step-story'; stories: readonly RuntimeStory[]; delta: number }>
  | Readonly<{ type: 'step-expanded'; scenes: readonly RuntimeExpandedScene[]; delta: number }>
  | Readonly<{ type: 'stop-story' }>
  | Readonly<{ type: 'stop-sequence' }>
  | Readonly<{ type: 'toggle-family'; id: string }>
  | Readonly<{ type: 'toggle-scope'; id: string }>
  | Readonly<{ type: 'toggle-standalone-scene'; scene: RuntimeStandaloneScene }>
  | Readonly<{ type: 'toggle-expanded-scene'; scene: RuntimeExpandedScene }>

export const initialPresentationState = (runtime: InfoschematicRuntime): PresentationState => ({
  annotated: false,
  autoAdvance: true,
  cueCycle: 0,
  cueStage: 0,
  playing: null,
  sceneOccurrence: 0,
  standaloneSceneId: null,
  takeaways: false,
  expandedSceneId: null,
  visibleFamilies: new Set(runtime.infoschematicFamilies.map((family) => family.id)),
  visibleScopes: new Set(runtime.infoschematicScopes.map((scope) => scope.id))
})

/**
 * The distinct stages a Scene's cues declare, in ascending order.
 *
 * A Scene with no cues has no stages; one whose cues name none has a single stage, because the runtime resolves an
 * absent stage to the first. The authored numbers are read as an order rather than a count, so a Scene staging its
 * cues 1 and 5 has two stages and no empty beat between them.
 */
const sceneStages = (cues: readonly RuntimeSceneCue[]): readonly number[] =>
  [...new Set(cues.map((cue) => cue.stage))].sort((left, right) => left - right)

/** Entering a Scene: a new occurrence, and a cascade that has not started. */
const entering = (state: PresentationState) => ({ cueStage: 0, sceneOccurrence: state.sceneOccurrence + 1 })

const toggled = (current: ReadonlySet<string>, id: string): ReadonlySet<string> => {
  const next = new Set(current)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

export const presentationReducer = (state: PresentationState, action: PresentationAction): PresentationState => {
  switch (action.type) {
    case 'clear-focus':
      return { ...state, cueStage: 0, playing: null, standaloneSceneId: null, expandedSceneId: null }
    case 'replay-cues':
      // Every Scene change already changes `sceneOccurrence`, which is part of the key, so the cycle needs no reset.
      return { ...state, cueCycle: state.cueCycle + 1 }
    case 'step-cues': {
      /*
       * Move within the focused Scene's cascade and no further. This is the stage half of a presenter's step on its
       * own: it stops at either end rather than spilling into the neighbouring Scene, so a host that wants to play a
       * cascade out without risking a Scene change has an action that says exactly that.
       */
      if (!state.playing) return state
      const sequence = action.sequences.find((entry) => entry.id === state.playing?.id)
      const stages = sceneStages(sequence?.scenes[state.playing.step]?.cues ?? [])
      const cueStage = Math.min(Math.max(state.cueStage + action.delta, 0), Math.max(0, stages.length - 1))
      return cueStage === state.cueStage ? state : { ...state, cueStage }
    }
    case 'stop-story':
    case 'stop-sequence':
      return { ...state, cueStage: 0, playing: null }
    case 'set-annotated':
      return { ...state, annotated: action.value }
    case 'set-auto-advance':
      return { ...state, autoAdvance: action.value }
    case 'set-takeaways':
      return { ...state, takeaways: action.value }
    case 'show-all-families':
      return { ...state, visibleFamilies: action.value ? new Set(action.ids) : new Set() }
    case 'show-all-scopes':
      return { ...state, visibleScopes: action.value ? new Set(action.ids) : new Set() }
    case 'start-sequence':
      if (action.sequence.scenes.length === 0) return state
      return {
        ...state,
        ...entering(state),
        playing: { id: action.sequence.id, step: action.step ?? 0 }
      }
    case 'start-story':
      if (action.story.steps.length === 0) return state
      return {
        ...state,
        ...entering(state),
        playing: { id: action.story.id, step: 0 },
        standaloneSceneId: null,
        expandedSceneId: null
      }
    case 'toggle-sequence-scene':
      if (action.sequence.scenes.length === 0 || !action.sequence.scenes[action.step]) return state
      if (state.playing?.id === action.sequence.id && state.playing.step === action.step) {
        return { ...state, cueStage: 0, playing: null }
      }
      return {
        ...state,
        ...entering(state),
        playing: { id: action.sequence.id, step: action.step }
      }
    case 'step-sequence': {
      if (!state.playing) return state
      const sequence = action.sequences.find((entry) => entry.id === state.playing?.id)
      if (!sequence || sequence.scenes.length === 0) return { ...state, cueStage: 0, playing: null }
      /*
       * A cascade's stages are steps of the Sequence, per `ADR-INFOSCHEMATICS-035`. The step advances within the
       * Scene while stages remain and only then moves past it, and a single step of a Scene that stages nothing is
       * the step it has always been. A jump of more than one Scene skips the cascade rather than crawling it.
       */
      const stages = sceneStages(sequence.scenes[state.playing.step]?.cues ?? [])
      const staysInScene =
        (action.delta === 1 && state.cueStage < stages.length - 1) || (action.delta === -1 && state.cueStage > 0)
      if (staysInScene) return presentationReducer(state, { ...action, type: 'step-cues' })
      const step = (state.playing.step + action.delta + sequence.scenes.length) % sequence.scenes.length
      /*
       * Stepping backwards arrives at the Scene as it was left, with its cascade played out, so that back and forward
       * reverse each other instead of replaying the previous Scene from its first stage.
       */
      const arriving = sceneStages(sequence.scenes[step]?.cues ?? [])
      return {
        ...state,
        ...entering(state),
        cueStage: action.delta < 0 ? Math.max(0, arriving.length - 1) : 0,
        playing: { ...state.playing, step }
      }
    }
    case 'step-story': {
      if (!state.playing) return state
      const story = action.stories.find((entry) => entry.id === state.playing?.id)
      if (!story || story.steps.length === 0) return { ...state, cueStage: 0, playing: null }
      const step = (state.playing.step + action.delta + story.steps.length) % story.steps.length
      return { ...state, ...entering(state), playing: { ...state.playing, step } }
    }
    case 'step-expanded': {
      if (!state.expandedSceneId || action.scenes.length === 0) return state
      const current = action.scenes.findIndex((entry) => entry.id === state.expandedSceneId)
      const scene = action.scenes[(current + action.delta + action.scenes.length) % action.scenes.length]
      return scene ? { ...state, ...entering(state), expandedSceneId: scene.id } : state
    }
    case 'toggle-family':
      return { ...state, visibleFamilies: toggled(state.visibleFamilies, action.id) }
    case 'toggle-scope':
      return { ...state, visibleScopes: toggled(state.visibleScopes, action.id) }
    case 'toggle-standalone-scene':
      return {
        ...state,
        ...entering(state),
        playing: null,
        standaloneSceneId: state.standaloneSceneId === action.scene.id ? null : action.scene.id,
        expandedSceneId: null
      }
    case 'toggle-expanded-scene':
      return {
        ...state,
        ...entering(state),
        playing: null,
        standaloneSceneId: null,
        expandedSceneId: state.expandedSceneId === action.scene.id ? null : action.scene.id
      }
  }
}

export const derivePresentation = (
  runtime: InfoschematicRuntime,
  state: PresentationState,
  signalPolicy: SceneSignalPolicy = 'focused-flows'
) => {
  const visibleCards = runtime.infoschematicCards.filter((card) =>
    runtime.infoschematicCardIsVisible(card, state.visibleScopes)
  )
  const visibleFabrics = runtime.infoschematicFabrics.filter((fabric) =>
    runtime.infoschematicFabricIsVisible(fabric, state.visibleScopes)
  )
  const visibleFlows = runtime.infoschematicFlows.filter((flow) =>
    runtime.infoschematicFlowIsVisible(flow, state.visibleFamilies, state.visibleScopes)
  )
  const activeSequence = state.playing ? runtime.sequences.find((entry) => entry.id === state.playing?.id) : undefined
  const activeSequenceScene = state.playing ? activeSequence?.scenes[state.playing.step] : undefined
  const runningStory = state.playing ? runtime.stories.find((entry) => entry.id === state.playing?.id) : undefined
  const runningStoryScene = state.playing ? runningStory?.steps[state.playing.step] : undefined
  const expandedScene = state.expandedSceneId
    ? runtime.expandedScenes.find((entry) => entry.id === state.expandedSceneId)
    : undefined
  const standaloneScene = state.standaloneSceneId
    ? runtime.standaloneScenes.find((entry) => entry.id === state.standaloneSceneId)
    : undefined
  const focusedScene = activeSequenceScene ?? runningStoryScene ?? expandedScene ?? standaloneScene
  const focusedFlows = focusedScene
    ? [...new Set(focusedScene.flows)].filter((flowId) => runtime.infoschematicFlows.some(({ id }) => id === flowId))
    : []
  const signals =
    signalPolicy === 'focused-flows'
      ? focusedFlows.map((flowId) => ({
          flowId,
          occurrenceKey: `present-scene-${state.sceneOccurrence}`
        }))
      : []
  const declared = signalPolicy === 'focused-flows' ? (focusedScene?.cues ?? []) : []
  /*
   * A Sequence paces a cascade, and nothing else does, per `ADR-INFOSCHEMATICS-035`. A Scene taken up on its own — a
   * Standalone Scene, or one expanded beside its Sequence — has no step to divide between stages, so its cues all
   * play on entry as they always have; a Scene playing inside a Sequence shows the stages up to the one reached.
   */
  const stages = focusedScene !== undefined && focusedScene === activeSequenceScene ? sceneStages(declared) : []
  const reached = stages[Math.min(state.cueStage, stages.length - 1)]
  const cues = reached === undefined ? declared : declared.filter((cue) => cue.stage <= reached)
  /** Whether a forward step advances within this Scene's cascade rather than past the Scene. */
  const stepStaysInScene = state.cueStage < stages.length - 1
  /*
   * A cue becomes an occurrence, and nothing here becomes a timer.
   *
   * `once` is keyed by the Scene occurrence alone, so a re-render of the same Scene is the same occurrence and a
   * return to it is a new one. `repeat` adds the cycle the View advances while the Scene holds, which is what lets a
   * renderer replay it — the key is the only thing that says so, per `DYNAMIC-002`.
   */
  const dynamics: readonly DynamicOccurrence[] = cues.map((cue) => ({
    dynamicId: cue.dynamic,
    occurrenceKey:
      cue.playback === 'repeat'
        ? `present-cue-${state.sceneOccurrence}-${state.cueCycle}`
        : `present-cue-${state.sceneOccurrence}`
  }))
  const repeatingCues = cues.some((cue) => cue.playback === 'repeat')
  const highlight =
    focusedScene && (focusedScene.components.length > 0 || focusedScene.flows.length > 0)
      ? {
          endpoints: new Set(focusedScene.components),
          flows: new Set(focusedScene.flows)
        }
      : undefined

  return {
    activeSequence,
    activeSequenceScene,
    /** How many stages the focused Scene's cascade has, which is what a timed Sequence divides its hold between. */
    cueStages: stages.length,
    dynamics,
    focusedScene,
    highlight,
    repeatingCues,
    signals,
    stepStaysInScene,
    runningStory,
    runningStoryScene,
    standaloneScene,
    expandedScene,
    visibleCards,
    visibleFabrics,
    visibleFlows
  }
}

export type DerivedPresentation = ReturnType<typeof derivePresentation>

/** @deprecated Use initialPresentationState. */
export const createPresentationState = initialPresentationState
/** @deprecated Use presentationReducer. */
export const reducePresentation = presentationReducer
