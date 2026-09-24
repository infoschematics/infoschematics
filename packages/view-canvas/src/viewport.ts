import { type DetailBand, detailBandFloors, detailBandRank, resolveDetailBand } from '@infoschematics/view-model/detail'
import type { Box, Point } from '@infoschematics/view-model/geometry'

export const viewportZoomStep = 1.25
export const viewportMaximumScale = 8

export type SurfaceSize = Readonly<{ height: number; width: number }>

const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum)

export const sameViewport = (left: Box, right: Box): boolean =>
  left.x === right.x && left.y === right.y && left.width === right.width && left.height === right.height

/** Fit all authored content inside a live surface without cropping or stretching it. */
export const containSurface = (surface: SurfaceSize, content: SurfaceSize): SurfaceSize => {
  if (
    !Number.isFinite(surface.width) ||
    !Number.isFinite(surface.height) ||
    !Number.isFinite(content.width) ||
    !Number.isFinite(content.height) ||
    surface.width <= 0 ||
    surface.height <= 0 ||
    content.width <= 0 ||
    content.height <= 0
  ) {
    return { height: Math.max(0, surface.height), width: Math.max(0, surface.width) }
  }

  const scale = Math.min(surface.width / content.width, surface.height / content.height)
  return { height: content.height * scale, width: content.width * scale }
}

/**
 * The scale at which a viewport's contents are actually drawn on a surface.
 *
 * Fitted, the viewport is the authored view box and this is the same number `resolveResponsiveCardTreatment` reads
 * from the frame. Magnified, the viewport is a smaller box drawn into the same frame, so the number rises — which is
 * the whole of "detail follows magnification": the drawing is bigger, so more of it is legible, so more is shown.
 */
export const renderedViewportScale = (frame: SurfaceSize, viewport: Pick<Box, 'height' | 'width'>): number =>
  Math.min(frame.width / viewport.width, frame.height / viewport.height)

/**
 * How far back across a threshold a reader has to come before the band that threshold opened is given up.
 *
 * A pinch or a trackpad scroll does not arrive at one scale, it arrives at a sequence of them, and a boundary crossed
 * without a margin is crossed several times in a single gesture. A drawing that flickers while a reader's hand moves
 * is worse than one that never changes, so the margin is what buys the reveal its stability. It is a fraction of the
 * threshold rather than a fixed step, because the thresholds are an order of magnitude apart in what they cost.
 */
export const detailBandMargin = 0.06

/**
 * The band this Canvas is in, given the band it was in and the scale it is now drawn at.
 *
 * The memory lives here rather than in the View Model, and deliberately: `APPEAR-017` forbids the resolver inspecting
 * ambient viewport state, and a resolver that remembers its last answer is holding exactly that state under another
 * name. So `resolveDetailBand` stays a pure mapping that a still can be handed, and the one thing only an interactive
 * view needs — not giving a band up the instant a gesture wobbles back over the line — is the interactive view's.
 *
 * Revealing is immediate and withdrawing is reluctant. A reader who magnifies past a threshold has asked for more and
 * gets it at once; a reader drifting back gets to keep what they were reading until they are clear of the line.
 */
export const settleDetailBand = (previous: DetailBand | null, scale: number): DetailBand => {
  const resolved = resolveDetailBand(scale)
  if (previous === null || detailBandRank(resolved) >= detailBandRank(previous)) return resolved
  return scale < detailBandFloors[previous] * (1 - detailBandMargin) ? resolved : previous
}

export const panViewport = (bounds: Box, current: Box, delta: Point): Box => ({
  ...current,
  x: clamp(current.x + delta.x, bounds.x, bounds.x + bounds.width - current.width),
  y: clamp(current.y + delta.y, bounds.y, bounds.y + bounds.height - current.height)
})

/** Centre a zoomed viewport on a point selected from an overview map. */
export const centerViewportAt = (bounds: Box, current: Box, point: Point): Box =>
  panViewport(bounds, current, {
    x: point.x - current.x - current.width / 2,
    y: point.y - current.y - current.height / 2
  })

/**
 * Zoom around a diagram coordinate while keeping the viewport inside the
 * authored bounds. Magnification above one zooms in; below one zooms out.
 */
export const zoomViewport = (bounds: Box, current: Box, magnification: number, anchor?: Point): Box => {
  const minimumWidth = bounds.width / viewportMaximumScale
  const minimumHeight = bounds.height / viewportMaximumScale
  const width = clamp(current.width / magnification, minimumWidth, bounds.width)
  const height = clamp(current.height / magnification, minimumHeight, bounds.height)
  if (width === current.width && height === current.height) return current

  const at = anchor ?? {
    x: current.x + current.width / 2,
    y: current.y + current.height / 2
  }
  const horizontal = (at.x - current.x) / current.width
  const vertical = (at.y - current.y) / current.height

  return {
    x: clamp(at.x - horizontal * width, bounds.x, bounds.x + bounds.width - width),
    y: clamp(at.y - vertical * height, bounds.y, bounds.y + bounds.height - height),
    width,
    height
  }
}
