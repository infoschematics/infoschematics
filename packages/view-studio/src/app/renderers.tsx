import { createContext, useContext } from 'react'
import type { ComponentType } from 'react'
import type { FabricConfig } from '@infoschematics/domain-model/fabric'
import type { GraphicConfig } from '@infoschematics/domain-model/graphic'
import type { Box } from '@infoschematics/view-model/geometry'

export type FabricRendererProps = {
  fabric: FabricConfig
  bounds: Box
}

export type GraphicRendererProps = {
  graphic: GraphicConfig
  viewBox: Box
}

export type ScopeIconRenderer = ComponentType<{
  'aria-hidden': true
  size: number
}>

export type InfoschematicRenderers = {
  definitions?: ComponentType
  fabrics?: Readonly<Record<string, ComponentType<FabricRendererProps>>>
  graphics?: Readonly<Record<string, ComponentType<GraphicRendererProps>>>
  scopeIcons?: Readonly<Record<string, ScopeIconRenderer>>
}

const noRenderers: InfoschematicRenderers = {}

export const InfoschematicRenderersContext = createContext<InfoschematicRenderers>(noRenderers)

export const useInfoschematicRenderers = () => useContext(InfoschematicRenderersContext)
