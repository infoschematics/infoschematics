import type { RegionAppearanceConfig } from './appearance.ts'
import type { Box } from "./geometry.ts";
import type { ZoneConfig } from "./zone.ts";

export type LaneConfig = {
  id: string;
  label: string;
  appearance?: RegionAppearanceConfig;
  y: number;
  height: number;
  labelY: number;
  legend?: "top" | "bottom";
  panel: Box & { radius: number };
  zones: readonly ZoneConfig[];
};
