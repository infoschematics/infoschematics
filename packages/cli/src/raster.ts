import { Resvg } from '@resvg/resvg-js'

export type RasteriseOptions = Readonly<{
  /** Font files pinned for text. Empty uses the host font stack. */
  fonts?: readonly string[]
  /** Multiplier applied to the document's own pixel size. */
  scale?: number
}>

/**
 * Rasterise rendered SVG with resvg, which resolves the document itself rather than running a browser engine.
 *
 * The renderer always paints its own opaque backdrop across the whole viewBox, so there is deliberately no background
 * option here: a colour behind that rectangle could never be seen.
 *
 * Text is the only part of the conversion that depends on the machine. With no `fonts`, the host font stack is used and
 * the result is correct but host-specific; with `fonts`, only those files are consulted, which is what makes output
 * reproducible across machines. Geometry, colour, and scale never depend on the host either way.
 */
export function rasteriseInfoschematicSvg(svg: string, options: RasteriseOptions = {}): Uint8Array {
  const { fonts = [], scale = 1 } = options
  const pinned = fonts.length > 0

  const image = new Resvg(svg, {
    font: { fontFiles: [...fonts], loadSystemFonts: !pinned },
    ...(scale === 1 ? {} : { fitTo: { mode: 'zoom', value: scale } })
  })

  return new Uint8Array(image.render().asPng())
}
