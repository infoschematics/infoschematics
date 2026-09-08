import { describe, expect, it } from 'vitest'

import { cornerRadius, visualTokens } from './tokens.ts'

describe('visual tokens', () => {
  it('keeps semantic names, representative values and the scalar compatibility export', () => {
    expect(visualTokens.canvas.geometry.gridSize).toBe(10)
    expect(visualTokens.canvas.geometry.gridMinorStrokeWidth).toBe(0.5)
    expect(visualTokens.canvas.geometry.gridMajorStrokeWidth).toBe(1)
    expect(visualTokens.canvas.surfaces.backdrop).toBe('#081725')
    expect(visualTokens.canvas.surfaces.regionDash).toBe('8 6')
    expect(visualTokens.canvas.surfaces.regionDot).toBe('1.5 5')
    expect(visualTokens.canvas.flows.routeWidth).toBe(4)
    expect(visualTokens.canvas.flows.signalStillWidth).toBe(7)
    expect(visualTokens.canvas.flows.lineCap).toBe('round')
    expect(visualTokens.canvas.flows.lineJoin).toBe('round')
    expect(visualTokens.canvas.focus.dimmedOpacity).toBe(0.14)
    expect(visualTokens.canvas.selection.selected).toBe('#82b366')
    expect(visualTokens.canvas.output.fontFamily).toBe('system-ui, sans-serif')
    expect(visualTokens.canvas.output.cardText).toBe('#18212a')
    expect(visualTokens.canvas.output.componentFontSize).toBe(13)
    expect(visualTokens.canvas.output.metadataFontSize).toBe(12)
    expect(visualTokens.canvas.output.unfocusedOpacity).toBe(0.2)
    expect(cornerRadius).toBe(visualTokens.canvas.geometry.cornerRadius)
  })
})
