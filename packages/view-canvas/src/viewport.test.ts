import { detailBandFloors } from '@infoschematics/view-model/detail'
import type { Box } from '@infoschematics/view-model/geometry'
import { describe, expect, it } from 'vitest'
import {
  centerViewportAt,
  containSurface,
  detailBandMargin,
  panViewport,
  renderedViewportScale,
  sameViewport,
  settleDetailBand,
  viewportMaximumScale,
  viewportZoomStep,
  zoomViewport
} from './viewport.ts'

const fitted: Box = { x: 0, y: 0, width: 1200, height: 800 }

describe('diagram viewport', () => {
  it('contains the authored aspect ratio in wide and tall surfaces', () => {
    expect(containSurface({ height: 900, width: 1600 }, fitted)).toEqual({ height: 900, width: 1350 })
    expect(containSurface({ height: 800, width: 900 }, fitted)).toEqual({ height: 600, width: 900 })
    expect(containSurface({ height: 800, width: 1200 }, fitted)).toEqual({ height: 800, width: 1200 })
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

  it('reads a magnified viewport as a larger rendered scale', () => {
    const frame = { height: 400, width: 600 }
    expect(renderedViewportScale(frame, fitted)).toBeCloseTo(0.5, 10)
    expect(renderedViewportScale(frame, { ...fitted, height: 400, width: 600 })).toBeCloseTo(1, 10)
    expect(renderedViewportScale(frame, { ...fitted, height: 100, width: 150 })).toBeCloseTo(4, 10)
  })
})

describe('detail band hysteresis', () => {
  it('takes the pure band when there is nothing to remember', () => {
    expect(settleDetailBand(null, 0.9)).toBe('full')
    expect(settleDetailBand(null, 0.5)).toBe('outline')
  })

  it('reveals the moment a threshold is crossed upward', () => {
    /* Revealing is immediate: a reader who magnified past the line asked for more and is not made to overshoot. */
    expect(settleDetailBand('outline', detailBandFloors.identified)).toBe('identified')
    expect(settleDetailBand('identified', detailBandFloors.full)).toBe('full')
    expect(settleDetailBand('minimal', 0.95)).toBe('full')
  })

  it('holds the band inside the margin and gives it up outside it', () => {
    for (const band of ['full', 'identified', 'outline'] as const) {
      const floor = detailBandFloors[band]
      const inside = floor * (1 - detailBandMargin / 2)
      const outside = floor * (1 - detailBandMargin * 2)
      expect(settleDetailBand(band, inside), `${band} flickered inside its margin`).toBe(band)
      expect(settleDetailBand(band, outside), `${band} was held beyond its margin`).not.toBe(band)
    }
  })

  it('holds the band at the far edge of the margin and drops it just past that edge', () => {
    const edge = detailBandFloors.full * (1 - detailBandMargin)
    expect(settleDetailBand('full', edge)).toBe('full')
    expect(settleDetailBand('full', edge - 1e-9)).toBe('identified')
  })

  it('settles rather than oscillating when the same scale is read twice', () => {
    const wobbling = detailBandFloors.full * (1 - detailBandMargin / 2)
    const once = settleDetailBand('full', wobbling)
    expect(settleDetailBand(once, wobbling)).toBe(once)
  })

  it('drops more than one band at once when a reader zooms right out', () => {
    expect(settleDetailBand('full', 0.1)).toBe('minimal')
  })
})
