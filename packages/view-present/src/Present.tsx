import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { InfoschematicConfig } from "@infoschematics/domain-model";
import { Canvas, type CanvasProps } from "@infoschematics/view-canvas";
import { createInfoschematicRuntime } from "@infoschematics/view-model/runtime";
import { PresentationControls } from "./PresentationControls.tsx";
import { PresentationDetails } from "./PresentationDetails.tsx";
import { SceneCallout } from "./SceneCallout.tsx";
import { usePresentation } from "./use-presentation.ts";

export type PresentProps = Readonly<{
  className?: string;
  config: InfoschematicConfig;
  renderers?: CanvasProps["renderers"];
}>;

export function Present({ className, config, renderers }: PresentProps) {
  const runtime = useMemo(() => createInfoschematicRuntime(config), [config]);
  const presentation = usePresentation(runtime);
  const { derived, dispatch, state } = presentation;
  const storyCallout = state.playing
    ? config.stories.find((story) => story.id === state.playing?.id)?.scenes[
        state.playing.step
      ]?.callout
    : undefined;
  const thematicCallout = derived.thematicScene
    ? config.themes
        .flatMap((theme) => theme.scenes)
        .find((scene) => scene.id === derived.thematicScene?.id)?.callout
    : undefined;
  const [detailsVisible, setDetailsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const root = useRef<HTMLElement>(null);

  const stepStory = useCallback(
    (delta: number) =>
      dispatch({ type: "step-story", stories: runtime.stories, delta }),
    [dispatch, runtime.stories],
  );
  const stepTheme = useCallback(
    (delta: number) =>
      dispatch({ type: "step-theme", scenes: runtime.thematicScenes, delta }),
    [dispatch, runtime.thematicScenes],
  );

  useEffect(() => {
    const { playing } = state;
    const { runningStory, runningStoryScene } = derived;
    if (!playing || !runningStory || !runningStoryScene || !state.autoAdvance)
      return;
    const timer = window.setTimeout(
      () => {
        dispatch({ type: "step-story", stories: runtime.stories, delta: 1 });
      },
      Math.max(0, runningStoryScene.hold),
    );
    return () => window.clearTimeout(timer);
  }, [
    derived.runningStory,
    derived.runningStoryScene,
    dispatch,
    runtime.stories,
    state.autoAdvance,
    state.playing,
  ]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [role="tablist"]')) return;
      if (!state.playing && state.thematicSceneId) {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          stepTheme(event.key === "ArrowRight" ? 1 : -1);
        } else if (event.key === "Escape") {
          event.preventDefault();
          dispatch({ type: "clear-focus" });
        }
        return;
      }
      if (!state.playing) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        stepStory(event.key === "ArrowRight" ? 1 : -1);
      } else if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        dispatch({ type: "set-auto-advance", value: !state.autoAdvance });
      } else if (event.key === "Escape") {
        event.preventDefault();
        dispatch({ type: "stop-story" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    dispatch,
    state.autoAdvance,
    state.playing,
    state.thematicSceneId,
    stepStory,
    stepTheme,
  ]);

  useEffect(() => {
    const sync = () =>
      setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void root.current?.requestFullscreen().catch(() => undefined);
    }
  };

  const playStory = (story: (typeof runtime.stories)[number]) => {
    dispatch(
      state.playing?.id === story.id
        ? { type: "stop-story" }
        : { type: "start-story", story },
    );
  };

  return (
    <section
      className={`infoschematic-present${className ? ` ${className}` : ""}`}
      ref={root}
    >
      <header className="isp-title-bar">
        <hgroup>
          <h1>{config.title}</h1>
          {config.subtitle ? <p>{config.subtitle}</p> : null}
        </hgroup>
        <div className="isp-title-actions">
          <button
            aria-label="Annotate"
            aria-pressed={state.annotated}
            onClick={() =>
              dispatch({ type: "set-annotated", value: !state.annotated })
            }
            type="button"
          >
            Labels
          </button>
          <button
            aria-label="Key takeaways"
            aria-pressed={state.takeaways}
            onClick={() =>
              dispatch({ type: "set-takeaways", value: !state.takeaways })
            }
            type="button"
          >
            Takeaways
          </button>
          <button
            aria-label="Toggle full screen"
            aria-pressed={fullscreen}
            onClick={toggleFullscreen}
            type="button"
          >
            {fullscreen ? "Exit full screen" : "Full screen"}
          </button>
          <button
            aria-label="Toggle details"
            aria-pressed={detailsVisible}
            onClick={() => setDetailsVisible((value) => !value)}
            type="button"
          >
            Details
          </button>
        </div>
      </header>

      <div className={`isp-room${detailsVisible ? "" : " isp-room-wide"}`}>
        <div className="isp-stage">
          <Canvas
            annotated={state.annotated}
            className="isp-canvas"
            config={config}
            flows={derived.visibleFlows}
            graphic={derived.runningStoryScene?.graphic}
            highlight={derived.highlight}
            renderers={renderers}
            visibleScopes={state.visibleScopes}
          >
            {derived.runningStoryScene && derived.runningStory ? (
              <SceneCallout
                autoAdvance={state.autoAdvance}
                body={derived.runningStoryScene.caption}
                calloutConfig={storyCallout}
                eyebrow={derived.runningStory.label}
                onExit={() => dispatch({ type: "stop-story" })}
                onStep={stepStory}
                onToggleAuto={() =>
                  dispatch({
                    type: "set-auto-advance",
                    value: !state.autoAdvance,
                  })
                }
                runtime={runtime}
                scene={derived.runningStoryScene}
                stepNumber={(state.playing?.step ?? 0) + 1}
                stepTotal={derived.runningStory.steps.length}
                takeaways={
                  state.takeaways
                    ? derived.runningStoryScene.takeaways
                    : undefined
                }
                title={derived.runningStoryScene.title}
              />
            ) : derived.thematicScene ? (
              <SceneCallout
                body={derived.thematicScene.description}
                calloutConfig={thematicCallout}
                eyebrow={derived.thematicScene.label}
                logo={runtime.themeLogos[derived.thematicScene.id]}
                onExit={() => dispatch({ type: "clear-focus" })}
                onStep={stepTheme}
                profile={derived.thematicScene.profile}
                runtime={runtime}
                scene={derived.thematicScene}
                stepNumber={
                  runtime.thematicScenes.findIndex(
                    (scene) => scene.id === derived.thematicScene?.id,
                  ) + 1
                }
                stepTotal={runtime.thematicScenes.length}
                takeaways={
                  state.takeaways ? derived.thematicScene.takeaways : undefined
                }
                title={derived.thematicScene.headline}
                wide={derived.thematicScene.cover}
              />
            ) : null}
          </Canvas>
          <PresentationControls
            onPlay={playStory}
            presentation={presentation}
            runtime={runtime}
          />
        </div>
        {detailsVisible ? (
          <PresentationDetails presentation={presentation} runtime={runtime} />
        ) : null}
      </div>
    </section>
  );
}
