import type { Box } from "@infoschematics/core/geometry";

export type GraphicConfig = {
  id: string;
  label?: string;
  renderer: string;
  placement?: Box;
  scopes?: readonly string[];
  properties?: Readonly<Record<string, boolean | number | string>>;
};
