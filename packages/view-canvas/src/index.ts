export type { CardDetailOverrides } from '@infoschematics/view-model/appearance'
/* A host spells a destination and reads back what it meant, so both halves of the address contract are public from
   the package it hands the destination to rather than from a second import a consumer has to discover. */
export {
  arrivalAnnouncement,
  artefactDestination,
  type DestinationRefusal,
  type DestinationResolution,
  type InfoschematicDestination,
  type RefusedDestination,
  type ResolvedDestination,
  resolveDestination,
  scopeDestination
} from '@infoschematics/view-model/destination'
export type { DynamicOccurrence, ElementEmphasis } from '@infoschematics/view-model/dynamics'
export type {
  InfoschematicRuntime,
  RuntimeCard,
  RuntimeDrafts,
  RuntimeExpandedScene,
  RuntimeFabric,
  RuntimeFlow,
  RuntimeIdentity,
  RuntimeInterface,
  RuntimeScope,
  RuntimeStandaloneScene,
  RuntimeStory,
  RuntimeStoryScene
} from '@infoschematics/view-model/runtime'
export type { FlowSignal } from '@infoschematics/view-model/signals'
/* The catalogue's keys are public so a host can enumerate what it may override, rather than restate a list
   that would then drift from the one the product draws. */
export {
  type StandardArtworkKey,
  type StandardFabricKey,
  type StandardGraphicKey,
  standardArtworkSchemaVersion,
  standardFabricKeys,
  standardGraphicKeys
} from '@infoschematics/view-model/standard-artwork'
export {
  DiagramAnnouncements,
  type DiagramAnnouncementsProps,
  useDiagramAnnouncements
} from './announcements.tsx'
export { Canvas, type CanvasProps } from './Canvas.tsx'
export { ColourSchemeButton } from './ColourSchemeButton.tsx'
export {
  applyColourScheme,
  type ColourScheme,
  colourSchemeAttribute,
  colourSchemeStorageKey,
  otherColourScheme,
  preferredColourScheme,
  resolveColourScheme,
  storedColourScheme,
  useColourScheme
} from './colour-scheme.ts'
export { drawnElementIds } from './drawn-elements.ts'
export { elementEmphasisDuration } from './element-emphasis.ts'
export { flowSignalDuration } from './flow-signals.ts'
export {
  type CanvasEditor,
  type DiagramMinimapPosition,
  type DiagramViewportController,
  type GraphicVisibility,
  InfoschematicDiagram
} from './InfoschematicDiagram.tsx'
export type {
  CalloutRendererDefinition,
  CalloutRendererProps,
  FabricRendererDefinition,
  FabricRendererProps,
  GraphicRendererDefinition,
  GraphicRendererProps,
  InfoschematicRenderers,
  RendererDefinition,
  RendererDiagnostic,
  RendererDiagnosticCode,
  RendererDiagnosticHandler,
  RendererKind,
  RendererProperties,
  RendererValidationResult,
  ResolvedRenderer,
  ScopeIconRenderer
} from './renderer-contract.ts'
export {
  defineInfoschematicRenderers,
  InfoschematicRenderersContext,
  resolveInfoschematicRenderer,
  useInfoschematicRenderers
} from './renderers.tsx'
export {
  InfoschematicContext,
  useInfoschematic
} from './runtime-context.tsx'
