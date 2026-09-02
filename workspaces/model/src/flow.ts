import type { Point } from "@infoschematics/core/geometry";
import type { PortId } from "@infoschematics/core/ports";

export type FlowConfig = {
  id: string;
  code: string;
  family: string;
  source: string;
  target: string;
  sourcePort: PortId;
  targetPort: PortId;
  operation?: string;
  conformsTo?: readonly string[];
  over?: string;
  bidirectional?: boolean;
  dashed?: boolean;
  label?: { along: number };
  points: readonly Point[];
};
