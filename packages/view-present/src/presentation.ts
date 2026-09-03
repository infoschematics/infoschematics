import type {
  InfoschematicRuntime,
  RuntimeStandaloneScene,
  RuntimeStory,
  RuntimeThemeScene,
} from "@infoschematics/view-model/runtime";

export type PlayingStory = Readonly<{ id: string; step: number }>;

export type PresentationState = Readonly<{
  annotated: boolean;
  autoAdvance: boolean;
  playing: PlayingStory | null;
  standaloneSceneId: string | null;
  takeaways: boolean;
  thematicSceneId: string | null;
  visibleFamilies: ReadonlySet<string>;
  visibleScopes: ReadonlySet<string>;
}>;

export type PresentationAction =
  | Readonly<{ type: "clear-focus" }>
  | Readonly<{ type: "set-annotated"; value: boolean }>
  | Readonly<{ type: "set-auto-advance"; value: boolean }>
  | Readonly<{ type: "set-takeaways"; value: boolean }>
  | Readonly<{
      type: "show-all-families";
      ids: readonly string[];
      value: boolean;
    }>
  | Readonly<{
      type: "show-all-scopes";
      ids: readonly string[];
      value: boolean;
    }>
  | Readonly<{ type: "start-story"; story: RuntimeStory }>
  | Readonly<{
      type: "step-story";
      stories: readonly RuntimeStory[];
      delta: number;
    }>
  | Readonly<{
      type: "step-theme";
      scenes: readonly RuntimeThemeScene[];
      delta: number;
    }>
  | Readonly<{ type: "stop-story" }>
  | Readonly<{ type: "toggle-family"; id: string }>
  | Readonly<{ type: "toggle-scope"; id: string }>
  | Readonly<{ type: "toggle-standalone-scene"; scene: RuntimeStandaloneScene }>
  | Readonly<{ type: "toggle-theme-scene"; scene: RuntimeThemeScene }>;

export const createPresentationState = (
  runtime: InfoschematicRuntime,
): PresentationState => ({
  annotated: false,
  autoAdvance: true,
  playing: null,
  standaloneSceneId: null,
  takeaways: true,
  thematicSceneId: null,
  visibleFamilies: new Set(
    runtime.infoschematicFamilies.map((family) => family.id),
  ),
  visibleScopes: new Set(runtime.infoschematicScopes.map((scope) => scope.id)),
});

const toggled = (current: ReadonlySet<string>, id: string) => {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

export const reducePresentation = (
  state: PresentationState,
  action: PresentationAction,
): PresentationState => {
  switch (action.type) {
    case "clear-focus":
      return {
        ...state,
        playing: null,
        standaloneSceneId: null,
        thematicSceneId: null,
      };
    case "set-annotated":
      return { ...state, annotated: action.value };
    case "set-auto-advance":
      return { ...state, autoAdvance: action.value };
    case "set-takeaways":
      return { ...state, takeaways: action.value };
    case "show-all-families":
      return {
        ...state,
        visibleFamilies: action.value ? new Set(action.ids) : new Set(),
      };
    case "show-all-scopes":
      return {
        ...state,
        visibleScopes: action.value ? new Set(action.ids) : new Set(),
      };
    case "start-story":
      if (action.story.steps.length === 0) return state;
      return {
        ...state,
        playing: { id: action.story.id, step: 0 },
        standaloneSceneId: null,
        thematicSceneId: null,
      };
    case "step-story": {
      if (!state.playing) return state;
      const story = action.stories.find(
        (entry) => entry.id === state.playing?.id,
      );
      if (!story || story.steps.length === 0)
        return { ...state, playing: null };
      const step =
        (state.playing.step + action.delta + story.steps.length) %
        story.steps.length;
      return { ...state, playing: { ...state.playing, step } };
    }
    case "step-theme": {
      if (!state.thematicSceneId || action.scenes.length === 0) return state;
      const current = action.scenes.findIndex(
        (entry) => entry.id === state.thematicSceneId,
      );
      if (current === -1) return { ...state, thematicSceneId: null };
      const scene =
        action.scenes[
          (current + action.delta + action.scenes.length) % action.scenes.length
        ];
      return scene ? { ...state, thematicSceneId: scene.id } : state;
    }
    case "stop-story":
      return { ...state, playing: null };
    case "toggle-family":
      return {
        ...state,
        visibleFamilies: toggled(state.visibleFamilies, action.id),
      };
    case "toggle-scope":
      return {
        ...state,
        visibleScopes: toggled(state.visibleScopes, action.id),
      };
    case "toggle-standalone-scene":
      return {
        ...state,
        playing: null,
        standaloneSceneId:
          state.standaloneSceneId === action.scene.id ? null : action.scene.id,
        thematicSceneId: null,
      };
    case "toggle-theme-scene":
      return {
        ...state,
        playing: null,
        standaloneSceneId: null,
        thematicSceneId:
          state.thematicSceneId === action.scene.id ? null : action.scene.id,
      };
  }
};

export const derivePresentation = (
  runtime: InfoschematicRuntime,
  state: PresentationState,
) => {
  const visibleCards = runtime.infoschematicCards.filter((card) =>
    runtime.infoschematicCardIsVisible(card, state.visibleScopes),
  );
  const visibleFabrics = runtime.infoschematicFabrics.filter((fabric) =>
    runtime.infoschematicFabricIsVisible(fabric, state.visibleScopes),
  );
  const visibleFlows = runtime.infoschematicFlows.filter((flow) =>
    runtime.infoschematicFlowIsVisible(
      flow,
      state.visibleFamilies,
      state.visibleScopes,
    ),
  );
  const runningStory = state.playing
    ? runtime.stories.find((entry) => entry.id === state.playing?.id)
    : undefined;
  const runningStoryScene = state.playing
    ? runningStory?.steps[state.playing.step]
    : undefined;
  const thematicScene = state.thematicSceneId
    ? runtime.thematicScenes.find((entry) => entry.id === state.thematicSceneId)
    : undefined;
  const standaloneScene = state.standaloneSceneId
    ? runtime.standaloneScenes.find(
        (entry) => entry.id === state.standaloneSceneId,
      )
    : undefined;
  const focusedScene = runningStoryScene ?? thematicScene ?? standaloneScene;
  const focusedFlows = focusedScene
    ? visibleFlows
        .filter((flow) => focusedScene.flows.includes(flow.id))
        .map((flow) => flow.id)
    : [];
  const highlight =
    focusedScene &&
    (focusedFlows.length > 0 || focusedScene.components.length > 0)
      ? {
          endpoints: new Set(focusedScene.components),
          flows: new Set(focusedFlows),
        }
      : undefined;

  return {
    focusedScene,
    highlight,
    runningStory,
    runningStoryScene,
    standaloneScene,
    thematicScene,
    visibleCards,
    visibleFabrics,
    visibleFlows,
  };
};

export type DerivedPresentation = ReturnType<typeof derivePresentation>;
