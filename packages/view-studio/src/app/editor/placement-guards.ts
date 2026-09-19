import type { Box, Point } from '@infoschematics/view-model/geometry'

/*
 * What a creation needs to be true of the geometry it is handed, in one place for both ways of creating.
 *
 * The Library instantiates a template and the factories build a Region or a Graphic; both refuse rather than write a
 * degenerate element, and both were saying so in their own words. A creation that cannot be drawn is worse than one
 * that never happened, because it reaches the authored document.
 */

export const finitePoint = (point: Point): boolean => Number.isFinite(point.x) && Number.isFinite(point.y)

/** A size something can be drawn at: both axes present, finite, and above zero. */
export const positiveExtent = (box: Readonly<Pick<Box, 'height' | 'width'>>): boolean =>
  Number.isFinite(box.width) && box.width > 0 && Number.isFinite(box.height) && box.height > 0

/** A rectangle a creation can be placed by: somewhere, at a size. */
export const placeableBox = (box: Box): boolean => finitePoint(box) && positiveExtent(box)
