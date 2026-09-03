/**
 * The public surface: a host application imports the App and mounts it
 * wherever its page lives. Nothing here assumes ownership of the origin.
 *
 * readSpec is exported for hosts that publish a contract pack: the host owns
 * the published documents, so the host's tests verify the reader against them.
 */
export { App, Studio } from './app/App.tsx'
export { Present } from '@infoschematics/view-present'
export type { PresentProps } from '@infoschematics/view-present'
export { readSpec } from './app/panels/contracts.ts'
export type {
  FabricRendererProps,
  GraphicRendererProps,
  InfoschematicRenderers,
  ScopeIconRenderer,
} from '@infoschematics/view-canvas'
