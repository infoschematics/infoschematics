import { type Box, roundedOutline } from './geometry.ts'

const adapterGrip = 20
export const adapterFloor = 40
const adapterReach = 0.5

/** Derive the visible Adapter box from the Card it wraps. */
export const adapterBoundsFor = (held: Box): Box => ({
  height: held.height * (1 - adapterReach) + adapterFloor,
  width: held.width + adapterGrip * 2,
  x: held.x - adapterGrip,
  y: held.y + held.height * adapterReach
})

/**
 * The clasp an Adapter Card is drawn as, traced as one outline: out along the left arm, down into the notch the held
 * Card sits in, up the right arm and round the bottom.
 *
 * Stated here rather than in a renderer because both renderers draw it, and until this existed only one did — a still
 * rendering painted an opaque rectangle over the lower half of the Card the adapter holds. Every corner takes the
 * Card's own radius, the notch curving inward where the outside curves away, which `roundedOutline` decides from the
 * way each corner turns.
 *
 * The box comes from the held Card, never from the adapter's own authored `bounds`: an adapter is a grip on the thing
 * it holds rather than a thing with a position of its own, as `ADR-INFOSCHEMATICS-032` records.
 */
export const adapterClaspOutline = (held: Box, cornerRadius: number): string => {
  const box = adapterBoundsFor(held)
  return roundedOutline(
    [
      { x: box.x, y: box.y },
      { x: held.x, y: box.y },
      { x: held.x, y: held.y + held.height },
      { x: held.x + held.width, y: held.y + held.height },
      { x: held.x + held.width, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x + box.width, y: box.y + box.height },
      { x: box.x, y: box.y + box.height }
    ],
    cornerRadius
  )
}

/**
 * Where an Adapter Card's own label sits: centred in the footer band below the notch.
 *
 * A non-compact Card centres its label at very nearly the y the clasp's top sits on, so an adapter label centred in
 * the clasp box lands on the held Card's label instead of in its own footer.
 */
export const adapterLabelBaseline = (held: Box): number => held.y + held.height + adapterFloor / 2 + 5
