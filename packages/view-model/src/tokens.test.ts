import { describe, expect, it } from 'vitest'

import {
  annotationLabelWidth,
  artworkPaintVariable,
  artworkPaintVariables,
  cornerRadius,
  paintFor,
  paintVariable,
  readableInkFallback,
  visualTokens
} from './tokens.ts'

const schemes = ['blueprint', 'dark', 'light'] as const

describe('visual tokens', () => {
  it('keeps semantic names, representative values and the scalar compatibility export', () => {
    expect(visualTokens.canvas.geometry.gridSize).toBe(10)
    expect(visualTokens.canvas.geometry.gridMinorStrokeWidth).toBe(0.5)
    expect(visualTokens.canvas.geometry.gridMajorStrokeWidth).toBe(1)
    expect(visualTokens.canvas.geometry.regionLabelCharacterWidth).toBe(9.4)
    expect(visualTokens.canvas.geometry.regionLabelHeight).toBe(14)
    expect(visualTokens.canvas.geometry.regionLabelInset).toBe(16)
    expect(visualTokens.canvas.geometry.regionNotchPadding).toBe(10)
    expect(visualTokens.canvas.paint.blueprint.backdrop).toBe('#081725')
    expect(visualTokens.canvas.metrics.regionDash).toBe('8 6')
    expect(visualTokens.canvas.metrics.regionDot).toBe('1.5 5')
    expect(visualTokens.canvas.flows.routeWidth).toBe(4)
    expect(visualTokens.canvas.flows.signalStillWidth).toBe(7)
    expect(visualTokens.canvas.flows.lineCap).toBe('round')
    expect(visualTokens.canvas.flows.lineJoin).toBe('round')
    expect(visualTokens.canvas.focus.dimmedOpacity).toBe(0.14)
    expect(visualTokens.canvas.selection.selected).toBe('#82b366')
    expect(visualTokens.canvas.typography.staticBodyFamily).toBe('system-ui, sans-serif')
    expect(visualTokens.canvas.ink.dark).toBe('#18212a')
    expect(visualTokens.canvas.typography.componentFontSize).toBe(13)
    expect(visualTokens.canvas.typography.metadataFontSize).toBe(12)
    expect(visualTokens.canvas.metrics.unfocusedOpacity).toBe(0.2)
    expect(cornerRadius).toBe(visualTokens.canvas.geometry.cornerRadius)
  })

  it('sizes annotation badges deterministically from their labels', () => {
    expect(annotationLabelWidth('SRC')).toBe(visualTokens.canvas.metrics.annotationWidth)
    expect(annotationLabelWidth('MSF-SC-TM-ASSEMBLY')).toBeGreaterThan(visualTokens.canvas.metrics.annotationWidth)
    expect(annotationLabelWidth('MSF-SC-TM-ASSEMBLY')).toBe(annotationLabelWidth('MSF-SC-TM-ASSEMBLY'))
  })

  /*
   * The palettes are interchangeable or they are not palettes.
   *
   * Every role is declared under a name that says nothing about the scheme it came from, which is what lets one
   * stylesheet block redefine another — and what makes a role only one scheme answers resolve to whatever the
   * previous block left behind. A drawing half in one palette is the failure this pair of cases exists to catch,
   * and it is invisible in any single-scheme rendering.
   */
  it('answers every paint role in every scheme', () => {
    const roles = Object.keys(paintFor('blueprint')).sort()
    const artworkRoles = Object.keys(paintFor('blueprint').artwork).sort()

    for (const scheme of schemes) {
      const palette = paintFor(scheme)
      expect(Object.keys(palette).sort(), scheme).toEqual(roles)
      expect(Object.keys(palette.artwork).sort(), scheme).toEqual(artworkRoles)
      for (const [role, value] of Object.entries(palette)) {
        if (role === 'artwork') continue
        expect(value, `${scheme}.${role}`).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/)
      }
      for (const [role, value] of Object.entries(palette.artwork)) {
        expect(value, `${scheme}.artwork.${role}`).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/)
      }
    }
  })

  it('names each role as a custom property a surface can reference instead of resolving a scheme', () => {
    expect(paintVariable('backdrop')).toBe('var(--infoschematic-canvas-paint-backdrop)')
    expect(paintVariable('regionTextNotched')).toBe('var(--infoschematic-canvas-paint-region-text-notched)')
    expect(artworkPaintVariable('glyphFill')).toBe('var(--infoschematic-canvas-paint-artwork-glyph-fill)')
    expect(Object.keys(artworkPaintVariables).sort()).toEqual(Object.keys(paintFor('light').artwork).sort())
  })

  it('reads an unauthored fill in the ink the scheme makes legible', () => {
    expect(readableInkFallback('light')).toBe('dark')
    expect(readableInkFallback('dark')).toBe('light')
    expect(readableInkFallback('blueprint')).toBe('light')
  })
})
