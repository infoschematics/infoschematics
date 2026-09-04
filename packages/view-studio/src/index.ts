/**
 * The public surface: a host application imports the App and mounts it
 * wherever its page lives. Nothing here assumes ownership of the origin.
 *
 * readSpec is exported for hosts that publish a contract pack: the host owns
 * the published documents, so the host's tests verify the reader against them.
 */

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
} from '@infoschematics/view-canvas'
export { defineInfoschematicRenderers, resolveInfoschematicRenderer } from '@infoschematics/view-canvas'
export type { PresentProps } from '@infoschematics/view-present'
export { Present } from '@infoschematics/view-present'
export { App, Studio } from './app/App.tsx'
export { readSpec } from './app/panels/contracts.ts'
