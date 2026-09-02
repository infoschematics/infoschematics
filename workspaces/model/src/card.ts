import type { Box } from "@infoschematics/core/geometry";
import type { PortCounts } from "@infoschematics/core/ports";
import type { ArtefactIdentity } from "./artefact.ts";

export type CardConfig = ArtefactIdentity & {
  scope: string;
  wraps?: string;
  placement: { box: Box; ports?: PortCounts };
};
