import type {
  InfoschematicRuntime,
  RuntimeSequence,
  RuntimeStandaloneScene,
  RuntimeStory,
  RuntimeThemeScene
} from '@infoschematics/view-model/runtime'

export type PlayingSequence = Readonly<{ id: string; step: number }>
/** @deprecated Use PlayingSequence. */
export type PlayingStory = PlayingSequence

export type SceneSignalPolicy = 'focused-flows' | 'none'

export type PresentationState = Readonly<{
  annotated: boolean
  autoAdvance: boolean
  playing: PlayingSequence | null
  sceneOccurrence: number
  standaloneSceneId: string | null
  takeaways: boolean
  thematicSceneId: string | null
  visibleFamilies: ReadonlySet<string>
  visibleScopes: ReadonlySet<string>
}>

export type PresentationAction =
  | Readonly<{ type: 'clear-focus' }>
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
  | Readonly<{ type: 'step-theme'; scenes: readonly RuntimeThemeScene[]; delta: number }>
  | Readonly<{ type: 'stop-story' }>
  | Readonly<{ type: 'stop-sequence' }>
  | Readonly<{ type: 'toggle-family'; id: string }>
  | Readonly<{ type: 'toggle-scope'; id: string }>
  | Readonly<{ type: 'toggle-standalone-scene'; scene: RuntimeStandaloneScene }>
  | Readonly<{ type: 'toggle-theme-scene'; scene: RuntimeThemeScene }>

export const initialPresentationState = (runtime: InfoschematicRuntime): PresentationState => ({
  annotated: false,
  autoAdvance: true,
  playing: null,
  sceneOccurrence: 0,
  standaloneSceneId: null,
  takeaways: false,
  thematicSceneId: null,
  visibleFamilies: new Set(runtime.infoschematicFamilies.map((family) => family.id)),
  visibleScopes: new Set(runtime.infoschematicScopes.map((scope) => scope.id))
})

const toggled = (current: ReadonlySet<string>, id: string): ReadonlySet<string> => {
  const next = new Set(current)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

export const presentationReducer = (state: PresentationState, action: PresentationAction): PresentationState => {
  switch (action.type) {
    case 'clear-focus':
      return { ...state, playing: null, standaloneSceneId: null, thematicSceneId: null }
    case 'stop-story':
    case 'stop-sequence':
      return { ...state, playing: null }
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
        playing: { id: action.sequence.id, step: action.step ?? 0 },
        sceneOccurrence: state.sceneOccurrence + 1
      }
    case 'start-story':
      if (action.story.steps.length === 0) return state
      return {
        ...state,
        playing: { id: action.story.id, step: 0 },
        sceneOccurrence: state.sceneOccurrence + 1,
        standaloneSceneId: null,
        thematicSceneId: null
      }
    case 'toggle-sequence-scene':
      if (action.sequence.scenes.length === 0 || !action.sequence.scenes[action.step]) return state
      if (state.playing?.id === action.sequence.id && state.playing.step === action.step) {
        return { ...state, playing: null }
      }
      return {
        ...state,
        playing: { id: action.sequence.id, step: action.step },
        sceneOccurrence: state.sceneOccurrence + 1
      }
    case 'step-sequence': {
      if (!state.playing) return state
      const sequence = action.sequences.find((entry) => entry.id === state.playing?.id)
      if (!sequence || sequence.scenes.length === 0) return { ...state, playing: null }
      const step = (state.playing.step + action.delta + sequence.scenes.length) % sequence.scenes.length
      return {
        ...state,
        playing: { ...state.playing, step },
        sceneOccurrence: state.sceneOccurrence + 1
      }
    }
    case 'step-story': {
      if (!state.playing) return state
      const story = action.stories.find((entry) => entry.id === state.playing?.id)
      if (!story || story.steps.length === 0) return { ...state, playing: null }
      const step = (state.playing.step + action.delta + story.steps.length) % story.steps.length
      return { ...state, playing: { ...state.playing, step }, sceneOccurrence: state.sceneOccurrence + 1 }
    }
    case 'step-theme': {
      if (!state.thematicSceneId || action.scenes.length === 0) return state
      const current = action.scenes.findIndex((entry) => entry.id === state.thematicSceneId)
      const scene = action.scenes[(current + action.delta + action.scenes.length) % action.scenes.length]
      return scene ? { ...state, sceneOccurrence: state.sceneOccurrence + 1, thematicSceneId: scene.id } : state
    }
    case 'toggle-family':
      return { ...state, visibleFamilies: toggled(state.visibleFamilies, action.id) }
    case 'toggle-scope':
      return { ...state, visibleScopes: toggled(state.visibleScopes, action.id) }
    case 'toggle-standalone-scene':
      return {
        ...state,
        playing: null,
        sceneOccurrence: state.sceneOccurrence + 1,
        standaloneSceneId: state.standaloneSceneId === action.scene.id ? null : action.scene.id,
        thematicSceneId: null
      }
    case 'toggle-theme-scene':
      return {
        ...state,
        playing: null,
        sceneOccurrence: state.sceneOccurrence + 1,
        standaloneSceneId: null,
        thematicSceneId: state.thematicSceneId === action.scene.id ? null : action.scene.id
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
  const thematicScene = state.thematicSceneId
    ? runtime.thematicScenes.find((entry) => entry.id === state.thematicSceneId)
    : undefined
  const standaloneScene = state.standaloneSceneId
    ? runtime.standaloneScenes.find((entry) => entry.id === state.standaloneSceneId)
    : undefined
  const focusedScene = activeSequenceScene ?? runningStoryScene ?? thematicScene ?? standaloneScene
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
    focusedScene,
    highlight,
    signals,
    runningStory,
    runningStoryScene,
    standaloneScene,
    thematicScene,
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
