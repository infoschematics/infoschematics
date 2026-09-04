import { describe, expect, it } from "vitest";
import type {
  CardDetailDefaults,
  GridTreatment,
  InfoschematicAppearanceConfig,
  RegionLabelFrameTreatment,
  RegionLabelPlacement,
  RegionLabelTreatment,
  SurfaceTreatment,
} from '@infoschematics/domain-model/appearance'
import type { ArtefactIdentity } from "@infoschematics/domain-model/artefact";
import type { CardConfig } from "@infoschematics/domain-model/card";
import type { DomainConfig } from '@infoschematics/domain-model/domain'
import type {
  InfoschematicConfig,
  InfoschematicConfigInput,
} from "@infoschematics/domain-model";
import type { FabricConfig } from "@infoschematics/domain-model/fabric";
import type { FlowConfig } from "@infoschematics/domain-model/flow";
import type { FlowFamilyConfig } from "@infoschematics/domain-model/flow-family";
import type { GraphicConfig } from "@infoschematics/domain-model/graphic";
import type { Box, Point } from "@infoschematics/domain-model/geometry";
import type { InfoschematicDefinition } from "@infoschematics/domain-model/infoschematic";
import type { InterfaceConfig } from "@infoschematics/domain-model/interface";
import type { InfoschematicMetadata } from "@infoschematics/domain-model/metadata";
import type { PointConfig } from "@infoschematics/domain-model/point";
import type {
	PortCounts,
	PortId,
	Side,
} from "@infoschematics/domain-model/ports";
import type {
  RegionConfig,
  RegionFrameConfig,
  RegionFrameStyle,
  RegionLabelMount,
} from "@infoschematics/domain-model/region";
import type {
  CalloutConfig,
  FocusConfig,
  StandaloneSceneConfig,
} from "@infoschematics/domain-model/scene";
import type { ScopeConfig } from "@infoschematics/domain-model/scope";
import type { SpecificationGroupConfig } from "@infoschematics/domain-model/specification-group";
import type { StoryConfig, StorySceneConfig } from "@infoschematics/domain-model/story";
import type { ThematicSceneConfig, ThemeConfig } from "@infoschematics/domain-model/theme";

type PublicContracts = [
  SurfaceTreatment,
  GridTreatment,
  RegionFrameStyle,
  RegionLabelFrameTreatment,
  RegionLabelPlacement,
  RegionLabelTreatment,
  RegionFrameConfig,
  CardDetailDefaults,
  InfoschematicAppearanceConfig,
  DomainConfig,
  InfoschematicMetadata,
  ScopeConfig,
  FlowFamilyConfig,
  RegionLabelMount,
  RegionConfig,
  InterfaceConfig,
  SpecificationGroupConfig,
  ArtefactIdentity,
  CardConfig,
  FabricConfig,
  PointConfig,
  GraphicConfig,
  FlowConfig,
  FocusConfig,
  StandaloneSceneConfig,
  CalloutConfig,
  ThematicSceneConfig,
  ThemeConfig,
  StorySceneConfig,
  StoryConfig,
  InfoschematicDefinition,
  InfoschematicConfig,
	InfoschematicConfigInput,
	Box,
	Point,
	PortCounts,
	PortId,
	Side,
];

describe("public model modules", () => {
  it("resolves every explicit contract subpath", () => {
    const contractCount: PublicContracts["length"] = 38;
    expect(contractCount).toBe(38);
  });
});
