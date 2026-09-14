import type { Box } from './geometry.ts'
import type { RendererReferenceInput } from './renderer.ts'

export type GraphicConfig = {
  id: string
  label?: string
  renderer: RendererReferenceInput
  placement?: Box
  scopes?: readonly string[]
  properties?: Readonly<Record<string, boolean | number | string>>
}
