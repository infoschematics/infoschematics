import type { Point } from './geometry.ts'
import type { InfoschematicDefinition } from './infoschematic.ts'
import type { InfoschematicMetadata } from './metadata.ts'
import type { DefinedInfoschematic } from './model.ts'
import type { StandaloneSceneConfig } from './scene.ts'
import type { SequenceConfig } from './sequence.ts'
import type { StoryConfig } from './story.ts'
import type { ThemeConfig } from './theme.ts'

export type * from './model.ts'
export type * from './renderer.ts'
export { rendererReferenceOf } from './renderer.ts'

export type InfoschematicConfig = InfoschematicMetadata & {
  infoschematic: InfoschematicDefinition
  standaloneScenes: readonly StandaloneSceneConfig[]
  themes: readonly ThemeConfig[]
  stories: readonly StoryConfig[]
  sequences?: readonly SequenceConfig[]
  calloutPositions: readonly Point[]
}

export type InfoschematicConfigInput = InfoschematicMetadata & {
  infoschematic?: Partial<InfoschematicDefinition>
  standaloneScenes?: readonly StandaloneSceneConfig[]
  themes?: readonly ThemeConfig[]
  stories?: readonly StoryConfig[]
  sequences?: readonly SequenceConfig[]
  calloutPositions?: readonly Point[]
}

/** Direct canonical data or the established serialisable configuration. */
export type InfoschematicInput = DefinedInfoschematic | InfoschematicConfig
