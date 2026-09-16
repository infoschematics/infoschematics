/**
 * Naming for the SVG resources a rendering defines for its own use.
 *
 * A renderer emits `marker` and `pattern` elements into a `defs` block and then
 * references them by identifier. SVG resolves such a reference to the first
 * matching element in *document* order rather than the nearest one, so two
 * renderings that share a page and an identifier both draw the first
 * definition — correct authored appearance, correct definitions, wrong output.
 * Prefixing every identifier a rendering owns is what keeps them apart.
 *
 * Both renderers need that rule and neither may depend on the other, so the
 * rule lives here. Only the fallback differs: the static renderer names itself
 * `infoschematic`, while Canvas derives a per-mount value from `useId`.
 */

/**
 * Validate a resource id prefix, falling back to the renderer's own default.
 *
 * The prefix has to survive being spliced into an SVG `id` and read back out of
 * a `url(#…)` fragment, so it starts with a letter or underscore and carries
 * only letters, digits, underscores, dots or hyphens. The fallback is checked
 * on the same terms as a supplied value: a generated default is a claim about
 * the generator, and an unchecked claim is the thing worth catching.
 */
export const svgResourcePrefix = (value: string | undefined, fallback = 'infoschematic') => {
  const prefix = value ?? fallback
  if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(prefix)) {
    throw new TypeError(
      `SVG resource id prefixes must start with a letter or underscore and contain only letters, digits, underscores, dots or hyphens; received ${prefix}`
    )
  }
  return prefix
}
