import { useEffect, useMemo, useReducer } from "react";
import type { InfoschematicRuntime } from "@infoschematics/view-model/runtime";
import {
  createPresentationState,
  derivePresentation,
  reducePresentation,
  type SceneSignalPolicy,
} from "./presentation.ts";

const readPreference = (key: string | undefined, fallback: boolean) => {
  if (!key || typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? fallback : stored === "true";
  } catch {
    return fallback;
  }
};

export const usePresentation = (
  runtime: InfoschematicRuntime,
  signalPolicy: SceneSignalPolicy,
) => {
  const storage = runtime.config.id;
  const [state, dispatch] = useReducer(
    reducePresentation,
    runtime,
    (source) => ({
      ...createPresentationState(source),
      annotated: readPreference(storage && `${storage}.annotated`, false),
      autoAdvance: readPreference(
        storage && `${storage}.presentation.autoAdvance`,
        true,
      ),
      takeaways: readPreference(storage && `${storage}.takeaways`, true),
    }),
  );
  const derived = useMemo(
    () => derivePresentation(runtime, state, signalPolicy),
    [runtime, signalPolicy, state],
  );

  useEffect(() => {
    if (!storage) return;
    try {
      window.localStorage.setItem(
        `${storage}.annotated`,
        String(state.annotated),
      );
      window.localStorage.setItem(
        `${storage}.presentation.autoAdvance`,
        String(state.autoAdvance),
      );
      window.localStorage.setItem(
        `${storage}.takeaways`,
        String(state.takeaways),
      );
    } catch {
      // Storage is a convenience. A host that denies it still gets a usable Present view.
    }
  }, [state.annotated, state.autoAdvance, state.takeaways, storage]);

  return { derived, dispatch, state };
};

export type Presentation = ReturnType<typeof usePresentation>;
