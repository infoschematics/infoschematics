import type { Box } from '@infoschematics/view-model/geometry'
import { describe, expect, it } from 'vitest'
import {
  centerViewportAt,
  fitViewportToWidth,
  panViewport,
  sameViewport,
  viewportMaximumScale,
  viewportZoomStep,
  zoomViewport
} from './viewport.ts'

const fitted: Box = { x: 0, y: 0, width: 1200, height: 800 }

describe('diagram viewport', () => {
  it('fits the authored width to a wider surface and centres the vertical crop', () => {
    expect(fitViewportToWidth(fitted, 2)).toEqual({ x: 0, y: 100, width: 1200, height: 600 })
    expect(fitViewportToWidth(fitted, 1)).toBe(fitted)
  })

  it('zooms around the pointer coordinate', () => {
    expect(zoomViewport(fitted, fitted, viewportZoomStep, { x: 900, y: 200 })).toEqual({
      x: 180,
      y: 40,
      width: 960,
      height: 640
    })
  })

  it('zooms around the centre when there is no pointer anchor', () => {
    expect(zoomViewport(fitted, fitted, viewportZoomStep)).toEqual({
      x: 120,
      y: 80,
      width: 960,
      height: 640
    })
  })

  it('stops zooming out at fit and zooming in at the maximum scale', () => {
    expect(zoomViewport(fitted, fitted, 1 / viewportZoomStep)).toBe(fitted)

    const closest: Box = {
      x: 525,
      y: 350,
      width: fitted.width / viewportMaximumScale,
      height: fitted.height / viewportMaximumScale
    }
    expect(zoomViewport(fitted, closest, viewportZoomStep)).toBe(closest)
  })

  it('uses a width-fitted viewport as the zoom boundary', () => {
    const widthFitted = fitViewportToWidth(fitted, 2)
    const zoomed = zoomViewport(fitted, widthFitted, viewportZoomStep, undefined, widthFitted)

    expect(zoomed).toEqual({ x: 120, y: 160, width: 960, height: 480 })
    expect(zoomViewport(fitted, widthFitted, 1 / viewportZoomStep, undefined, widthFitted)).toBe(widthFitted)
  })

  it('keeps an edge-anchored zoom inside the authored diagram', () => {
    expect(zoomViewport(fitted, fitted, viewportZoomStep, { x: 1200, y: 800 })).toEqual({
      x: 240,
      y: 160,
      width: 960,
      height: 640
    })
  })

  it('pans a zoomed viewport without leaving the authored diagram', () => {
    const zoomed: Box = { x: 120, y: 80, width: 960, height: 640 }

    expect(panViewport(fitted, zoomed, { x: 60, y: -100 })).toEqual({
      x: 180,
      y: 0,
      width: 960,
      height: 640
    })
    expect(panViewport(fitted, zoomed, { x: 1000, y: 1000 })).toEqual({
      x: 240,
      y: 160,
      width: 960,
      height: 640
    })
  })

  it('centres a zoomed viewport from a minimap selection and clamps it at the edges', () => {
    const zoomed: Box = { x: 120, y: 80, width: 480, height: 320 }

    expect(centerViewportAt(fitted, zoomed, { x: 900, y: 600 })).toEqual({
      x: 660,
      y: 440,
      width: 480,
      height: 320
    })
    expect(centerViewportAt(fitted, zoomed, { x: 0, y: 0 })).toEqual({ x: 0, y: 0, width: 480, height: 320 })
  })

  it('recognises the fitted viewport', () => {
    expect(sameViewport(fitted, { ...fitted })).toBe(true)
    expect(sameViewport(fitted, { ...fitted, width: 960 })).toBe(false)
  })
})
