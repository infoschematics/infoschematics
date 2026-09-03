import type { InfoschematicAppearanceConfig } from './appearance.ts'
import type { CardConfig } from "./card.ts";
import type { DomainConfig } from './domain.ts'
import type { FabricConfig } from "./fabric.ts";
import type { FlowFamilyConfig } from "./flow-family.ts";
import type { FlowConfig } from "./flow.ts";
import type { Box } from "./geometry.ts";
import type { GraphicConfig } from "./graphic.ts";
import type { InterfaceConfig } from "./interface.ts";
import type { LaneConfig } from "./lane.ts";
import type { PointConfig } from "./point.ts";
import type { ScopeConfig } from "./scope.ts";
import type { SpecificationGroupConfig } from "./specification-group.ts";

export type InfoschematicDefinition = {
  viewBox: Box;
  appearance?: InfoschematicAppearanceConfig;
  scopes: readonly ScopeConfig[];
  domains?: readonly DomainConfig[];
  flowFamilies: readonly FlowFamilyConfig[];
  lanes: readonly LaneConfig[];
  cards: readonly CardConfig[];
  fabrics: readonly FabricConfig[];
  points: readonly PointConfig[];
  flows: readonly FlowConfig[];
  graphics: readonly GraphicConfig[];
  interfaces: readonly InterfaceConfig[];
  specificationGroups: readonly SpecificationGroupConfig[];
};
