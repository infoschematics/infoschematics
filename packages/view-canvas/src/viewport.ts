import type { Box, Point } from '@infoschematics/view-model/geometry'

export const viewportZoomStep = 1.25
export const viewportMaximumScale = 8

const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum)

export const sameViewport = (left: Box, right: Box): boolean =>
  left.x === right.x && left.y === right.y && left.width === right.width && left.height === right.height

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
