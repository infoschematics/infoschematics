/** A serialisable request for one host-provided renderer property schema. */
export type RendererReference = Readonly<{
  key: string
  version: number
}>

/** Compatibility input: scalar renderer keys always request schema version 1. */
export type RendererReferenceInput = string | RendererReference

/** Normalise compatibility input before renderer lookup or canonical adaptation. */
export const rendererReferenceOf = (reference: RendererReferenceInput): RendererReference =>
  typeof reference === 'string' ? { key: reference, version: 1 } : reference
