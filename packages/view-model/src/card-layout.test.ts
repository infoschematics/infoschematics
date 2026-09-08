import { describe, expect, it } from 'vitest'
import { type CardLayoutRequest, resolveCardLayout } from './card-layout.ts'

const nothing = { description: false, identity: false, stereotype: false } as const

const reference = (overrides: Partial<CardLayoutRequest> = {}): CardLayoutRequest => ({
  box: { height: 80, width: 160 },
  code: 'ONE-001',
  compact: true,
  detail: { description: true, identity: true, stereotype: true },
  stereotype: 'service',
  ...overrides
})

describe('card layout', () => {
  it('places a compact Card from the top left, under its metadata band', () => {
    const layout = resolveCardLayout(reference())

    expect(layout.stereotype).toEqual({ anchor: 'start', x: 10, y: 18 })
    expect(layout.identity).toEqual({ height: 20, textX: 122.25, textY: 18, width: 59.5, x: 92.5, y: 8 })
    expect(layout.label).toEqual({ anchor: 'start', lineHeight: 13, x: 10, y: 38 })
    expect(layout.description).toEqual({ anchor: 'start', x: 10, y: 56 })
  })

  it('centres a legacy Card on its own box at any proportion', () => {
    const short = resolveCardLayout(reference({ compact: false, detail: nothing }))
    const tall = resolveCardLayout(reference({ box: { height: 240, width: 160 }, compact: false, detail: nothing }))

    expect(short.label).toEqual({ anchor: 'middle', lineHeight: 13, x: 80, y: 40 })
    expect(tall.label).toEqual({ anchor: 'middle', lineHeight: 13, x: 80, y: 120 })
  })

  it('centres a wrapped label as one block rather than from a fixed first line', () => {
    const layout = resolveCardLayout(reference({ compact: false, detail: nothing, labelLines: 2 }))

    expect(layout.label.y).toBe(33.5)
    expect(layout.label.y + layout.label.lineHeight).toBe(46.5)
  })

  it('lifts a legacy label to make room for the description it carries', () => {
    const layout = resolveCardLayout(
      reference({ compact: false, detail: { description: true, identity: false, stereotype: false } })
    )

    expect(layout.label.y).toBe(34)
    expect(layout.description).toEqual({ anchor: 'middle', x: 80, y: 54 })
  })

  it('keeps a square Card legible with everything it carries', () => {
    const layout = resolveCardLayout(reference({ box: { height: 120, width: 120 } }))

    expect(layout.identity).toEqual({ height: 20, textX: 82.25, textY: 18, width: 59.5, x: 52.5, y: 8 })
    expect(layout.label.y).toBe(38)
    expect(layout.description?.y).toBe(56)
  })

  it('drops the metadata band a short Card has no room for, and keeps the label', () => {
    const layout = resolveCardLayout(reference({ box: { height: 40, width: 160 } }))

    expect(layout.identity).toBeNull()
    expect(layout.stereotype).toBeNull()
    expect(layout.description).toBeNull()
    expect(layout.label).toEqual({ anchor: 'start', lineHeight: 13, x: 10, y: 28 })
  })

  it('drops the identity chip a narrow Card cannot hold, and the one it would sit on', () => {
    const narrow = resolveCardLayout(reference({ box: { height: 120, width: 60 } }))
    const crowded = resolveCardLayout(reference({ box: { height: 120, width: 96 } }))

    expect(narrow.identity).toBeNull()
    expect(narrow.stereotype).toBeNull()
    expect(crowded.stereotype).toEqual({ anchor: 'start', x: 10, y: 18 })
    expect(crowded.identity).toBeNull()
  })

  it('offers nothing the treatment withholds or the Card does not author', () => {
    expect(resolveCardLayout(reference({ detail: nothing })).identity).toBeNull()
    expect(resolveCardLayout(reference({ detail: nothing })).stereotype).toBeNull()
    expect(resolveCardLayout(reference({ detail: nothing })).description).toBeNull()
    expect(resolveCardLayout(reference({ stereotype: '  ' })).stereotype).toBeNull()
    expect(resolveCardLayout(reference({ code: '' })).identity).toBeNull()
  })

  it('centres what it can show in a box too small even for the bare stack', () => {
    const layout = resolveCardLayout(reference({ box: { height: 30, width: 160 } }))

    expect(layout.label).toEqual({ anchor: 'start', lineHeight: 13, x: 10, y: 15 })
    expect(layout.description).toBeNull()
  })
})
