import { describe, expect, it } from "vitest";
import type { ArtefactIdentity } from "@infoschematics/model/artefact";
import type { CardConfig } from "@infoschematics/model/card";
import type {
  InfoschematicConfig,
  InfoschematicConfigInput,
} from "@infoschematics/model/config";
import type { FabricConfig } from "@infoschematics/model/fabric";
import type { FlowConfig } from "@infoschematics/model/flow";
import type { FlowFamilyConfig } from "@infoschematics/model/flow-family";
import type { GraphicConfig } from "@infoschematics/model/graphic";
import type { InfoschematicDefinition } from "@infoschematics/model/infoschematic";
import type { InterfaceConfig } from "@infoschematics/model/interface";
import type { LaneConfig } from "@infoschematics/model/lane";
import type { InfoschematicMetadata } from "@infoschematics/model/metadata";
import type { PointConfig } from "@infoschematics/model/point";
import type {
  CalloutConfig,
  FocusConfig,
  StandaloneSceneConfig,
} from "@infoschematics/model/scene";
import type { ScopeConfig } from "@infoschematics/model/scope";
import type { SpecificationGroupConfig } from "@infoschematics/model/specification-group";
import type { StoryConfig, StorySceneConfig } from "@infoschematics/model/story";
import type { ThematicSceneConfig, ThemeConfig } from "@infoschematics/model/theme";
import type { ZoneConfig } from "@infoschematics/model/zone";

type PublicContracts = [
  InfoschematicMetadata,
  ScopeConfig,
  FlowFamilyConfig,
  ZoneConfig,
  LaneConfig,
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
];

describe("public model modules", () => {
  it("resolves every explicit contract subpath", () => {
    const contractCount: PublicContracts["length"] = 23;
    expect(contractCount).toBe(23);
  });
});
