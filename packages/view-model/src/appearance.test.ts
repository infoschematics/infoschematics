import type { DomainConfig } from '@infoschematics/domain-model/domain'
import { describe, expect, it } from 'vitest'
import {
  drawsOwnCode,
  resolveCardDomain,
  resolveReadableInk,
  resolveRegionTreatment,
  resolveResponsiveCardTreatment,
  resolveVisualTreatment
} from './appearance.ts'

describe('visual treatment resolution', () => {
  it('preserves the label-only legacy treatment when appearance is absent', () => {
    expect(resolveVisualTreatment()).toEqual({
      card: { compact: false, description: false, identity: false, stereotype: false },
      grid: 'none',
      identity: false,
      surface: 'neutral'
    })
  })

  it('lets output detail visibility override authored defaults without changing compact layout', () => {
    expect(
      resolveVisualTreatment(
        {
          card: { compact: true, description: true, identity: true, stereotype: false },
          grid: 'major-plus-minor',
          surface: 'blueprint'
        },
        { description: false, identity: false, stereotype: true }
      )
    ).toEqual({
      card: { compact: true, description: false, identity: false, stereotype: true },
      grid: 'major-plus-minor',
      identity: false,
      surface: 'blueprint'
    })
  })

  it.each([
    [
      { height: 800, width: 1200 },
      { compact: true, description: true, identity: true, stereotype: true }
    ],
    [
      { height: 600, width: 900 },
      { compact: true, description: false, identity: true, stereotype: true }
    ],
    [
      { height: 400, width: 600 },
      { compact: true, description: false, identity: false, stereotype: true }
    ],
    [
      { height: 300, width: 450 },
      { compact: true, description: false, identity: false, stereotype: false }
    ]
  ] as const)('reduces optional Card rows deterministically at rendered size %o', (target, expected) => {
    expect(
      resolveResponsiveCardTreatment({ height: 800, width: 1200 }, target, {
        compact: true,
        description: true,
        identity: true,
        stereotype: true
      })
    ).toEqual(expected)
  })

  it('treats explicit detail settings as an upper bound and rejects unusable dimensions', () => {
    expect(
      resolveResponsiveCardTreatment(
        { height: 800, width: 1200 },
        { height: 800, width: 1200 },
        { compact: false, description: false, identity: true, stereotype: false }
      )
    ).toEqual({ compact: false, description: false, identity: true, stereotype: false })

    expect(() =>
      resolveResponsiveCardTreatment(
        { height: 800, width: 1200 },
        { height: 0, width: 1200 },
        { compact: false, description: true, identity: true, stereotype: true }
      )
    ).toThrow('finite positive numbers')
  })

  it('answers for Cards from the narrower statement first and for every kind from the Diagram default', () => {
    expect(resolveVisualTreatment({ identity: true })).toEqual({
      card: { compact: false, description: false, identity: true, stereotype: false },
      grid: 'none',
      identity: true,
      surface: 'neutral'
    })
    // `card.identity` is the older and narrower statement, so it decides for Cards where both are authored.
    expect(resolveVisualTreatment({ card: { identity: false }, identity: true }).card.identity).toBe(false)
    expect(resolveVisualTreatment({ card: { identity: true } }).identity).toBe(false)
  })
})

describe('permanent code resolution', () => {
  it("lets an element's own statement outrank the Diagram's default in both directions", () => {
    expect(drawsOwnCode({ identity: true }, false)).toBe(true)
    expect(drawsOwnCode({ identity: false }, true)).toBe(false)
    expect(drawsOwnCode({}, true)).toBe(true)
    expect(drawsOwnCode(undefined, false)).toBe(false)
  })

  it('leaves an element that carries its code carrying it at a reduced rendered size', () => {
    // The responsive reduction describes the rendering; an element saying it carries its code describes the element,
    // and the second survives being drawn small because the first never reaches it.
    const reduced = resolveResponsiveCardTreatment(
      { height: 800, width: 1200 },
      { height: 240, width: 360 },
      { compact: true, description: true, identity: true, stereotype: true }
    )

    expect(reduced.identity).toBe(false)
    expect(drawsOwnCode({ identity: true }, reduced.identity)).toBe(true)
  })
})

describe('region treatment resolution', () => {
  it('defaults to a north-west internal label with no frame', () => {
    expect(resolveRegionTreatment({ label: 'Region' })).toEqual({
      frame: 'none',
      frameOpacity: 1,
      label: 'north-west',
      labelOffset: null,
      labelTreatment: 'plain'
    })
  })

  it('suppresses both hidden labels and their requested notch', () => {
    expect(
      resolveRegionTreatment({
        frame: { style: 'dashed' },
        label: 'Region',
        labelMount: 'boundary',
        labelPlacement: 'none'
      })
    ).toEqual({ frame: 'dashed', frameOpacity: 1, label: null, labelOffset: null, labelTreatment: 'plain' })
    expect(
      resolveRegionTreatment({
        frame: { style: 'dotted' },
        label: '',
        labelMount: 'boundary',
        labelPlacement: 'north'
      })
    ).toEqual({ frame: 'dotted', frameOpacity: 1, label: null, labelOffset: null, labelTreatment: 'plain' })
  })

  it('notches only where a boundary mount meets a visible frame and label', () => {
    expect(
      resolveRegionTreatment({
        frame: { opacity: 0.4, style: 'dotted' },
        label: 'Region',
        labelMount: 'boundary',
        labelOffset: 32,
        labelPlacement: 'south'
      })
    ).toEqual({ frame: 'dotted', frameOpacity: 0.4, label: 'south', labelOffset: 32, labelTreatment: 'notched' })
    expect(resolveRegionTreatment({ label: 'Region', labelMount: 'boundary', labelPlacement: 'east' })).toEqual({
      frame: 'none',
      frameOpacity: 1,
      label: 'east',
      labelOffset: null,
      labelTreatment: 'plain'
    })
    expect(resolveRegionTreatment({ frame: { style: 'solid' }, label: 'Region', labelPlacement: 'east' })).toEqual({
      frame: 'solid',
      frameOpacity: 1,
      label: 'east',
      labelOffset: null,
      labelTreatment: 'plain'
    })
  })
})

describe('readable ink resolution', () => {
  it.each([
    ['#0d1b2a', 'light'],
    ['#063b35', 'light'],
    ['#18212a', 'light'],
    ['#e8f0ff', 'dark'],
    ['#f2f5f7', 'dark'],
    ['#ffffff', 'dark'],
    ['#000000', 'light']
  ] as const)('resolves %s to %s ink by relative luminance', (fill, ink) => {
    expect(resolveReadableInk(fill)).toBe(ink)
  })

  it('reads short and alpha hex forms and ignores surrounding space', () => {
    expect(resolveReadableInk('#fff')).toBe('dark')
    expect(resolveReadableInk('#012')).toBe('light')
    expect(resolveReadableInk('#0D1B2Ae8')).toBe('light')
    expect(resolveReadableInk('  #e8f0ff  ')).toBe('dark')
  })

  it('falls back to dark ink for non-hex fills', () => {
    expect(resolveReadableInk('transparent')).toBe('dark')
    expect(resolveReadableInk('rgb(4, 8, 12)')).toBe('dark')
    expect(resolveReadableInk('')).toBe('dark')
    expect(resolveReadableInk('#12345')).toBe('dark')
  })
})

describe('Domain resolution', () => {
  const domains: readonly DomainConfig[] = [{ color: '#123456', fill: '#abcdef', id: 'platform', label: 'Platform' }]

  it('resolves Domain independently of Scope and tolerates an absent classification', () => {
    expect(resolveCardDomain({ domain: 'platform' }, domains)?.id).toBe('platform')
    expect(resolveCardDomain({ domain: undefined }, domains)).toBeUndefined()
    expect(resolveCardDomain({ domain: 'missing' }, domains)).toBeUndefined()
  })
})
