import type { Point } from "@infoschematics/core/geometry";
import type { PortCounts } from "@infoschematics/core/ports";

export type PointConfig = {
  id: string;
  code: string;
  label: string;
  scopes: readonly string[];
  point: Point;
  ports?: PortCounts;
};
