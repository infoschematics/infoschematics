import type { Box } from "@infoschematics/core/geometry";
import type { PortCounts } from "@infoschematics/core/ports";
import type { ArtefactIdentity } from "./artefact.ts";

export type FabricConfig = ArtefactIdentity & {
  scope: string;
  placement: { box: Box; ports?: PortCounts };
  appearance?: {
    renderer: string;
    caption?: string;
    detail?: string;
    properties?: Readonly<Record<string, boolean | number | string>>;
  };
};
