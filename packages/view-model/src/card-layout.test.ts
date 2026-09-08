import { describe, expect, it } from 'vitest'
import { type CardLayoutRequest, resolveCardLayout } from './card-layout.ts'

const nothing = { description: false, identity: false, stereotype: false } as const

const reference = (overrides: Partial<CardLayoutRequest> = {}): CardLayoutRequest => ({
  box: { height: 80, width: 160 },
  code: 'ONE-001',
  compact: true,
  description: 'Card payments',
  detail: { description: true, identity: true, stereotype: true },
  label: 'Payments',
  stereotype: 'service',
  ...overrides
})

describe('card layout', () => {
  it('places a compact Card from the top left, under its metadata band', () => {
    const layout = resolveCardLayout(reference())

    expect(layout.stereotype).toEqual({ anchor: 'start', text: 'service', x: 10, y: 18 })
    expect(layout.identity).toEqual({ height: 20, textX: 122.25, textY: 18, width: 59.5, x: 92.5, y: 8 })
    expect(layout.label).toEqual({ anchor: 'start', lineHeight: 13, lines: ['Payments'], x: 10, y: 38 })
    expect(layout.description).toEqual({ anchor: 'start', text: 'Card payments', x: 10, y: 56 })
  })

  it('centres a legacy Card on its own box at any proportion', () => {
    const short = resolveCardLayout(reference({ compact: false, detail: nothing }))
    const tall = resolveCardLayout(reference({ box: { height: 240, width: 160 }, compact: false, detail: nothing }))

    expect(short.label).toEqual({ anchor: 'middle', lineHeight: 13, lines: ['Payments'], x: 80, y: 40 })
    expect(tall.label).toEqual({ anchor: 'middle', lineHeight: 13, lines: ['Payments'], x: 80, y: 120 })
  })

  it('centres a wrapped label as one block rather than from a fixed first line', () => {
    const layout = resolveCardLayout(
      reference({ compact: false, detail: nothing, label: 'Payments and settlement ledger' })
    )

    expect(layout.label.lines).toEqual(['Payments and', 'settlement ledger'])
    expect(layout.label.y).toBe(33.5)
    expect(layout.label.y + layout.label.lineHeight).toBe(46.5)
  })

  it('wraps a label against the width it has, not a character count', () => {
    const wide = resolveCardLayout(
      reference({
        box: { height: 80, width: 320 },
        compact: false,
        detail: nothing,
        label: 'Payments and settlement ledger'
      })
    )
    const narrow = resolveCardLayout(
      reference({
        box: { height: 80, width: 120 },
        compact: false,
        detail: nothing,
        label: 'Payments and settlement ledger'
      })
    )

    expect(wide.label.lines).toEqual(['Payments and settlement ledger'])
    expect(narrow.label.lines).toEqual(['Payments and', 'settlement l\u2026'])
  })

  it('ends a label it cannot fit with an ellipsis rather than drawing through the border', () => {
    const compact = resolveCardLayout(reference({ label: 'Payments and settlement ledger' }))
    const word = resolveCardLayout(
      reference({ box: { height: 80, width: 60 }, compact: false, detail: nothing, label: 'Reconciliation' })
    )
    const airless = resolveCardLayout(
      reference({ box: { height: 80, width: 14 }, compact: false, detail: nothing, label: 'Reconciliation' })
    )

    expect(compact.label.lines).toEqual(['Payments and settle\u2026'])
    expect(word.label.lines).toEqual(['Reco\u2026'])
    expect(airless.label.lines).toEqual([''])
  })

  it('fits the stereotype and the description to their own bands', () => {
    const layout = resolveCardLayout(
      reference({
        box: { height: 120, width: 120 },
        description: 'Settles card payments across the ledger',
        stereotype: 'orchestration service'
      })
    )

    expect(layout.stereotype?.text).toBe('orchestration se\u2026')
    expect(layout.description?.text).toBe('Settles card paymen\u2026')
  })

  it('lifts a legacy label to make room for the description it carries', () => {
    const layout = resolveCardLayout(
      reference({ compact: false, detail: { description: true, identity: false, stereotype: false } })
    )

    expect(layout.label.y).toBe(34)
    expect(layout.description).toEqual({ anchor: 'middle', text: 'Card payments', x: 80, y: 54 })
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
    expect(layout.label).toEqual({ anchor: 'start', lineHeight: 13, lines: ['Payments'], x: 10, y: 28 })
  })

  it('drops the identity chip a narrow Card cannot hold, and the one it would sit on', () => {
    const narrow = resolveCardLayout(reference({ box: { height: 120, width: 60 } }))
    const crowded = resolveCardLayout(reference({ box: { height: 120, width: 96 } }))

    expect(narrow.identity).toBeNull()
    expect(narrow.stereotype?.text).toBe('servi\u2026')
    expect(crowded.stereotype).toEqual({ anchor: 'start', text: 'service', x: 10, y: 18 })
    expect(crowded.identity).toBeNull()
  })

  it('offers nothing the treatment withholds or the Card does not author', () => {
    expect(resolveCardLayout(reference({ detail: nothing })).identity).toBeNull()
    expect(resolveCardLayout(reference({ detail: nothing })).stereotype).toBeNull()
    expect(resolveCardLayout(reference({ detail: nothing })).description).toBeNull()
    expect(resolveCardLayout(reference({ stereotype: '  ' })).stereotype).toBeNull()
    expect(resolveCardLayout(reference({ description: '  ' })).description).toBeNull()
    expect(resolveCardLayout(reference({ code: '' })).identity).toBeNull()
  })

  it('centres what it can show in a box too small even for the bare stack', () => {
    const layout = resolveCardLayout(reference({ box: { height: 30, width: 160 } }))

    expect(layout.label).toEqual({ anchor: 'start', lineHeight: 13, lines: ['Payments'], x: 10, y: 15 })
    expect(layout.description).toBeNull()
  })
})
