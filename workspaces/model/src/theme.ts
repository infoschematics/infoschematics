import type { CalloutConfig, FocusConfig } from "./scene.ts";

export type ThematicSceneConfig = {
  id: string;
  code: string;
  label: string;
  short?: string;
  description?: string;
  focus: FocusConfig;
  callout?: CalloutConfig;
};

export type ThemeConfig = {
  id: string;
  title: string;
  description?: string;
  scenes: readonly ThematicSceneConfig[];
};
