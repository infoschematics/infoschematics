import { type RenderInfoschematicSvgOptions, renderInfoschematicSvg } from '@infoschematics/render-svg'
import { useMemo } from 'react'

export type StaticInfoschematicProps = Readonly<{
  className?: string
  input: Parameters<typeof renderInfoschematicSvg>[0]
  /**
   * How the drawing is named. A string is an accessible name for the whole host, which takes `role="img"` with it and
   * makes the renderer's own root presentational — assistive technology does not descend into an image. `null` marks
   * the drawing decorative, for a place where the surrounding text already says what it shows. Omitted, the
   * renderer's root keeps its authored name, which is the name the live Canvas gives the same specimen.
   */
  label?: string | null
  options?: Omit<RenderInfoschematicSvgOptions, 'resourceIdPrefix'>
  /** Unique within the document. Two inline renderings sharing a prefix resolve each other's markers and patterns. */
  resourceIdPrefix: string
}>

/**
 * Site's host for a static drawing, placed in the page rather than referenced through an `img`.
 *
 * An `img` gives the browser a drawing at the size the renderer chose and a box of some other size to put it in, so
 * what a reader sees is that drawing resampled. The same markup laid out in the page is measured at the size it is
 * shown, which is why a specimen in Rendered and the same specimen in Design now resolve to one scale rather than
 * two. Nothing about the drawing changes: this is the identical string `infoschematics render` writes to a file.
 */
export function StaticInfoschematic({ className, input, label, options, resourceIdPrefix }: StaticInfoschematicProps) {
  const svg = useMemo(
    () => renderInfoschematicSvg(input, { ...options, resourceIdPrefix }),
    [input, options, resourceIdPrefix]
  )

  /* The markup is produced locally by renderInfoschematicSvg, which XML-escapes authored values and emits no script
     or inline event attributes. Each naming case is its own element rather than one element with computed ARIA,
     because an `aria-label` is only meaningful on a role that supports it and a role is only correct for one of them. */

  if (label === null) {
    return (
      <div
        aria-hidden
        className={className}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: this accepts only local renderer output, never arbitrary HTML
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    )
  }

  if (label === undefined) {
    return (
      <div
        className={className}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: this accepts only local renderer output, never arbitrary HTML
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    )
  }

  return (
    <div
      aria-label={label}
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: this accepts only local renderer output, never arbitrary HTML
      dangerouslySetInnerHTML={{ __html: svg }}
      role="img"
    />
  )
}
