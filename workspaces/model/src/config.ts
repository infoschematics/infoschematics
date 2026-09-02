import type { Point } from "@infoschematics/core/geometry";
import type { InfoschematicDefinition } from "./infoschematic.ts";
import type { InfoschematicMetadata } from "./metadata.ts";
import type { StandaloneSceneConfig } from "./scene.ts";
import type { StoryConfig } from "./story.ts";
import type { ThemeConfig } from "./theme.ts";

export type InfoschematicConfig = InfoschematicMetadata & {
  infoschematic: InfoschematicDefinition;
  standaloneScenes: readonly StandaloneSceneConfig[];
  themes: readonly ThemeConfig[];
  stories: readonly StoryConfig[];
  calloutPositions: readonly Point[];
};

export type InfoschematicConfigInput = InfoschematicMetadata & {
  infoschematic?: Partial<InfoschematicDefinition>;
  standaloneScenes?: readonly StandaloneSceneConfig[];
  themes?: readonly ThemeConfig[];
  stories?: readonly StoryConfig[];
  calloutPositions?: readonly Point[];
};

const defaultViewBox = { x: 0, y: 0, width: 1200, height: 800 } as const;

export const defineInfoschematic = (
  input: InfoschematicConfigInput,
): InfoschematicConfig => ({
  ...input,
  infoschematic: {
    viewBox: input.infoschematic?.viewBox ?? defaultViewBox,
    scopes: input.infoschematic?.scopes ?? [],
    flowFamilies: input.infoschematic?.flowFamilies ?? [],
    lanes: input.infoschematic?.lanes ?? [],
    cards: input.infoschematic?.cards ?? [],
    fabrics: input.infoschematic?.fabrics ?? [],
    points: input.infoschematic?.points ?? [],
    flows: input.infoschematic?.flows ?? [],
    graphics: input.infoschematic?.graphics ?? [],
    interfaces: input.infoschematic?.interfaces ?? [],
    specificationGroups: input.infoschematic?.specificationGroups ?? [],
  },
  standaloneScenes: input.standaloneScenes ?? [],
  themes: input.themes ?? [],
  stories: input.stories ?? [],
  calloutPositions: input.calloutPositions ?? [],
});
