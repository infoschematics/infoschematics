import type { Point } from './geometry.ts'
import type { InfoschematicDefinition } from './infoschematic.ts'
import type { InfoschematicMetadata } from './metadata.ts'
import type { StandaloneSceneConfig } from './scene.ts'
import type { StoryConfig } from './story.ts'
import type { ThemeConfig } from './theme.ts'

export type InfoschematicConfig = InfoschematicMetadata & {
  infoschematic: InfoschematicDefinition
  standaloneScenes: readonly StandaloneSceneConfig[]
  themes: readonly ThemeConfig[]
  stories: readonly StoryConfig[]
  calloutPositions: readonly Point[]
}

export type InfoschematicConfigInput = InfoschematicMetadata & {
  infoschematic?: Partial<InfoschematicDefinition>
  standaloneScenes?: readonly StandaloneSceneConfig[]
  themes?: readonly ThemeConfig[]
  stories?: readonly StoryConfig[]
  calloutPositions?: readonly Point[]
}
