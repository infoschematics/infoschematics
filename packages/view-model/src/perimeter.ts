import type { Box } from '@infoschematics/domain-model/geometry'
import { visualTokens } from './tokens.ts'

/**
 * One rounded-rectangle perimeter, as a path.
 *
 * A renderer that only outlines a box does not need this: `rect` with `rx` states the same shape in four attributes.
 * A renderer that wants to send something *along* that outline does, because motion needs a path and a `rect` is not
 * one — and the moment the outline and the motion are two separate statements of the same shape they can disagree,
 * which shows up as a mark cutting a corner the outline rounds. So the path is the outline in both renderers and the
 * motion path in the interactive one, and there is one calculation rather than three.
 *
 * Not `roundedOutline` from `./geometry.ts`, which walks an arbitrary run of corners and can fold back into itself for
 * a shape clasping another. That generality costs it the two things a box wants: absolute `H` and `V` runs, which is
 * the form every other axis-aligned path in this package takes, and one corner radius fitted to the whole box rather
 * than to each run in turn.
 *
 * This is geometry and not treatment: it answers where the perimeter is, and says nothing about what is drawn on it,
 * which way round it is travelled, or where anything rests along it.
 */

const number = (value: number) => String(Number(value.toFixed(3)))
const point = (x: number, y: number) => `${number(x)} ${number(y)}`

/** The largest corner radius the box can carry, so arcs meet instead of overshooting and crossing. */
const fitted = (box: Box, radius: number) => Math.max(0, Math.min(radius, box.width / 2, box.height / 2))

/** A closed clockwise path round `box`, starting where the top-left corner's arc ends. */
export const roundedRectanglePath = (box: Box, radius: number) => {
  const corner = fitted(box, radius)
  const { x, y, width, height } = box
  const right = x + width
  const bottom = y + height
  const r = number(corner)
  return [
    `M${point(x + corner, y)}`,
    `H${number(right - corner)}`,
    `A${r} ${r} 0 0 1 ${point(right, y + corner)}`,
    `V${number(bottom - corner)}`,
    `A${r} ${r} 0 0 1 ${point(right - corner, bottom)}`,
    `H${number(x + corner)}`,
    `A${r} ${r} 0 0 1 ${point(x, bottom - corner)}`,
    `V${number(y + corner)}`,
    `A${r} ${r} 0 0 1 ${point(x + corner, y)}`,
    'Z'
  ].join(' ')
}

/**
 * Where an emphasis treatment for `box` runs.
 *
 * Outset from the element by the emphasis inset, so the treatment reads as being about the element rather than part
 * of it, and rounded at the emphasis radius rather than the element's own.
 */
export const emphasisPerimeterPath = (box: Box) => {
  const { inset, radius } = visualTokens.canvas.emphasis
  return roundedRectanglePath(
    { height: box.height + inset * 2, width: box.width + inset * 2, x: box.x - inset, y: box.y - inset },
    radius
  )
}
