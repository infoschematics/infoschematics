import type { DomainConfig } from '@infoschematics/domain-model/domain'
import { describe, expect, it } from 'vitest'
import {
  resolveCardDomain,
  resolveReadableInk,
  resolveRegionTreatment,
  resolveVisualTreatment,
} from './appearance.ts'

describe('visual treatment resolution', () => {
  it('preserves the label-only legacy treatment when appearance is absent', () => {
    expect(resolveVisualTreatment()).toEqual({
      card: { compact: false, description: false, identity: false, stereotype: false },
      grid: 'none',
      surface: 'neutral',
    })
  })

  it('lets output detail visibility override authored defaults without changing compact layout', () => {
    expect(
      resolveVisualTreatment(
        {
          card: { compact: true, description: true, identity: true, stereotype: false },
          grid: 'major-plus-minor',
          surface: 'blueprint',
        },
        { description: false, identity: false, stereotype: true },
      ),
    ).toEqual({
      card: { compact: true, description: false, identity: false, stereotype: true },
      grid: 'major-plus-minor',
      surface: 'blueprint',
    })
  })
})

describe('region treatment resolution', () => {
  it.each([
    ['lane', 'top', { frame: 'solid', label: 'north-west', labelTreatment: 'plain' }],
    ['lane', 'bottom', { frame: 'solid', label: 'south-west', labelTreatment: 'plain' }],
    ['zone', 'top', { frame: 'none', label: 'north-east', labelTreatment: 'plain' }],
    ['zone', 'bottom', { frame: 'none', label: 'south-east', labelTreatment: 'plain' }],
  ] as const)('keeps the %s %s legacy default independent', (kind, legend, expected) => {
    expect(resolveRegionTreatment(kind, 'Region', undefined, legend)).toEqual(expected)
  })

  it('suppresses both hidden labels and their requested notch', () => {
    expect(
      resolveRegionTreatment('lane', 'Region', {
        frame: 'dashed',
        label: 'none',
        labelTreatment: 'notched',
      }),
    ).toEqual({ frame: 'dashed', label: null, labelTreatment: 'plain' })
    expect(
      resolveRegionTreatment('lane', '', {
        frame: 'dotted',
        label: 'north',
        labelTreatment: 'notched',
      }),
    ).toEqual({ frame: 'dotted', label: null, labelTreatment: 'plain' })
  })

  it('keeps authored Lane and Zone choices independent', () => {
    expect(resolveRegionTreatment('lane', 'Lane', { frame: 'none', label: 'east' })).toEqual({
      frame: 'none',
      label: 'east',
      labelTreatment: 'plain',
    })
    expect(
      resolveRegionTreatment('zone', 'Zone', {
        frame: 'dotted',
        label: 'south',
        labelTreatment: 'notched',
      }),
    ).toEqual({ frame: 'dotted', label: 'south', labelTreatment: 'notched' })
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
    ['#000000', 'light'],
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
  const domains: readonly DomainConfig[] = [
    { color: '#123456', fill: '#abcdef', id: 'platform', label: 'Platform' },
  ]

  it('resolves Domain independently of Scope and tolerates an absent classification', () => {
    expect(resolveCardDomain({ domain: 'platform' }, domains)?.id).toBe('platform')
    expect(resolveCardDomain({ domain: undefined }, domains)).toBeUndefined()
    expect(resolveCardDomain({ domain: 'missing' }, domains)).toBeUndefined()
  })
})
