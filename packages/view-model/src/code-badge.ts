import { adapterFloor } from './assembly.ts'
import type { CardIdentityPlacement } from './card-layout.ts'
import type { Box, Point } from './geometry.ts'
import type { PointLabelSide } from './point-layout.ts'
import { annotationLabelWidth, visualTokens } from './tokens.ts'

/**
 * Where an element's code is drawn, resolved once for both renderers.
 *
 * A code reaches a drawing two ways — an author saying the element carries it permanently, and a reader turning
 * codes on — and they are the same code. `ROUTE-021` already requires the second to land where the first does, so
 * the placement cannot live in the layer that draws one of them: it belongs here, where a renderer drawing either
 * takes the same answer from the same element.
 */
const { annotationHeight, annotationRadius } = visualTokens.canvas.metrics
const { pointLabelGap, pointLabelHeight, pointRadius } = visualTokens.canvas.geometry

/** The inset from a box's top-right corner, which is the corner nothing else on an element claims. */
const boxInset = 4

/** Corner radius for every drawn code, so a chip and a tag are the same shape in both renderers. */
export const codeBadgeRadius = annotationRadius

/** The widest a badge is allowed to shrink to on an element that is not a Card. */
const componentMinimumWidth = 56

export type CodeBadgePlacement = Readonly<{
  height: number
  /** Centre of the badge, where its text is drawn on a middle dominant baseline. */
  textX: number
  textY: number
  width: number
  x: number
  y: number
}>

/**
 * What the code is being drawn on.
 *
 * `chip` is a Card's own identity slot, resolved by `resolveCardLayout`, so a code an author turned on and a code a
 * reader turned on occupy one rectangle rather than two that differ by a few pixels. `clasp` is an Adapter, whose
 * top corners are beside the Card it holds and whose rim along the bottom is where its name already is. `box` is
 * everything with a free top-right corner, `mark` is a Point, which has no box at all, and `route` is the
 * along-the-line placement a Flow's label already resolves to.
 */
export type CodeBadgeAnchor =
  | Readonly<{ box: Box; kind: 'box' }>
  | Readonly<{ box: Box; held: Box; kind: 'clasp' }>
  | Readonly<{ box: Box; kind: 'chip'; slot: CardIdentityPlacement }>
  | Readonly<{ at: Point; kind: 'mark'; labelSide?: PointLabelSide }>
  | Readonly<{ at: Point; kind: 'route' }>

const placed = (width: number, x: number, y: number): CodeBadgePlacement =>
  Object.freeze({
    height: annotationHeight,
    textX: x + width / 2,
    textY: y + annotationHeight - 6,
    width,
    x,
    y
  })

/** The width a code is drawn in, which a Card's own chip states and everything else estimates. */
const codeBadgeWidth = (anchor: CodeBadgeAnchor, code: string): number => {
  if (anchor.kind === 'chip') return anchor.slot.width
  /* A Flow's chip floats on its route with nothing to sit inside, so it keeps the narrower shared minimum; a code on
     an element is read against that element's own width and would look mean at the same size. */
  return annotationLabelWidth(code, anchor.kind === 'route' ? undefined : componentMinimumWidth)
}

/** Where this element's code is drawn, in authored coordinates. */
export const resolveCodeBadge = (anchor: CodeBadgeAnchor, code: string): CodeBadgePlacement => {
  const width = codeBadgeWidth(anchor, code)
  if (anchor.kind === 'chip') return placed(width, anchor.box.x + anchor.slot.x, anchor.box.y + anchor.slot.y)
  if (anchor.kind === 'clasp') {
    return placed(
      width,
      anchor.box.x + anchor.box.width - width - boxInset,
      anchor.held.y + anchor.held.height + (adapterFloor - annotationHeight) / 2
    )
  }
  if (anchor.kind === 'route') return placed(width, anchor.at.x - width / 2, anchor.at.y - annotationHeight / 2)
  if (anchor.kind === 'mark') {
    /* A Point's label takes the first side no Flow leaves by, so the code stacks above it rather than over it where
       that side is the one the code wants. */
    const clearance = pointRadius + pointLabelGap
    const lift = anchor.labelSide === 'above' ? clearance + pointLabelHeight + pointLabelGap : clearance
    return placed(width, anchor.at.x - width / 2, anchor.at.y - lift - annotationHeight)
  }
  return placed(width, anchor.box.x + anchor.box.width - width - boxInset, anchor.box.y + 5)
}
