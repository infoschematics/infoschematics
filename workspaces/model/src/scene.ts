import type { Point } from "@infoschematics/core/geometry";

export type FocusConfig = {
  artefacts?: readonly string[];
  flows?: readonly string[];
  graphics?: readonly string[];
};

export type StandaloneSceneConfig = {
  id: string;
  code: string;
  label: string;
  short?: string;
  description: string;
  focus: FocusConfig;
};

export type CalloutConfig = {
  title?: string;
  body: string;
  takeaways?: readonly string[];
  at?: Point;
  renderer?: string;
  properties?: Readonly<Record<string, boolean | number | string>>;
};
