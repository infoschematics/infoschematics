import type { CSSProperties } from "react";
import type {
  InfoschematicRuntime,
  RuntimeStory,
} from "@infoschematics/view-model/runtime";
import type { Presentation } from "./use-presentation.ts";

export function PresentationControls({
  onPlay,
  presentation,
  runtime,
}: {
  onPlay: (story: RuntimeStory) => void;
  presentation: Presentation;
  runtime: InfoschematicRuntime;
}) {
  const { dispatch, state } = presentation;
  const control = (
    label: string,
    pressed: boolean,
    onClick: () => void,
    detail?: string,
  ) => (
    <button
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      title={detail}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <section
      className="isp-controls"
      aria-label="Infoschematic presentation controls"
    >
      <section className="isp-control-bank" aria-label="Scopes">
        <span>Scopes</span>
        {runtime.infoschematicScopes.map((scope) => (
          <span
            key={scope.id}
            style={{ "--isp-accent": scope.color } as CSSProperties}
          >
            {control(
              scope.label,
              state.visibleScopes.has(scope.id),
              () => dispatch({ type: "toggle-scope", id: scope.id }),
              scope.description,
            )}
          </span>
        ))}
        <button
          onClick={() =>
            dispatch({
              type: "show-all-scopes",
              ids: runtime.infoschematicScopes.map((scope) => scope.id),
              value: state.visibleScopes.size === 0,
            })
          }
          type="button"
        >
          {state.visibleScopes.size > 0 ? "Hide all" : "Show all"}
        </button>
      </section>

      <section className="isp-control-bank" aria-label="Families">
        <span>Families</span>
        {runtime.infoschematicFamilies.map((family) => (
          <span
            key={family.id}
            style={{ "--isp-accent": family.color } as CSSProperties}
          >
            {control(
              family.label,
              state.visibleFamilies.has(family.id),
              () => dispatch({ type: "toggle-family", id: family.id }),
              family.description,
            )}
          </span>
        ))}
        <button
          onClick={() =>
            dispatch({
              type: "show-all-families",
              ids: runtime.infoschematicFamilies.map((family) => family.id),
              value: state.visibleFamilies.size === 0,
            })
          }
          type="button"
        >
          {state.visibleFamilies.size > 0 ? "Hide all" : "Show all"}
        </button>
      </section>

      {runtime.stories.length ? (
        <section className="isp-control-bank" aria-label="Stories">
          <span>Stories</span>
          {runtime.stories.map((story) => (
            <span key={story.id}>
              {control(
                story.label,
                state.playing?.id === story.id,
                () => onPlay(story),
                story.question,
              )}
            </span>
          ))}
          <button
            disabled={!state.playing}
            onClick={() => dispatch({ type: "stop-story" })}
            type="button"
          >
            Clear
          </button>
        </section>
      ) : null}

      {runtime.standaloneScenes.length ? (
        <section className="isp-control-bank" aria-label="Scenes">
          <span>Scenes</span>
          {runtime.standaloneScenes.map((scene) => (
            <span key={scene.id}>
              {control(
                scene.label,
                state.standaloneSceneId === scene.id,
                () => dispatch({ type: "toggle-standalone-scene", scene }),
                scene.description,
              )}
            </span>
          ))}
          <button
            disabled={!state.standaloneSceneId}
            onClick={() => dispatch({ type: "clear-focus" })}
            type="button"
          >
            Clear
          </button>
        </section>
      ) : null}

      {runtime.thematicScenes.length ? (
        <section className="isp-control-bank" aria-label="Themes">
          <span>Themes</span>
          {runtime.thematicScenes.map((scene) => (
            <span key={scene.id}>
              {control(
                scene.label,
                state.thematicSceneId === scene.id,
                () => dispatch({ type: "toggle-theme-scene", scene }),
                scene.headline,
              )}
            </span>
          ))}
          <button
            disabled={!state.thematicSceneId}
            onClick={() => dispatch({ type: "clear-focus" })}
            type="button"
          >
            Clear
          </button>
        </section>
      ) : null}
    </section>
  );
}
