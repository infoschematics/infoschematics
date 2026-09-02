import type { Box } from "@infoschematics/core/geometry";
import type { ZoneConfig } from "./zone.ts";

export type LaneConfig = {
  id: string;
  label: string;
  y: number;
  height: number;
  labelY: number;
  legend?: "top" | "bottom";
  panel: Box & { radius: number };
  zones: readonly ZoneConfig[];
};
