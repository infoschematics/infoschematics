/**
 * The public surface: a host application imports the App and mounts it
 * wherever its page lives. Nothing here assumes ownership of the origin.
 *
 * readSpec is exported for hosts that publish a contract pack: the host owns
 * the published documents, so the host's tests verify the reader against them.
 */
export { App } from './app/App.tsx'
export { readSpec } from './app/panels/contracts.ts'
export type {
  FabricRendererProps,
  GraphicRendererProps,
  InfoschematicRenderers,
  ScopeIconRenderer,
} from './app/renderers.tsx'
