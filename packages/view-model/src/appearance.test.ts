import type { DomainConfig } from '@infoschematics/domain-model/domain'
import { describe, expect, it } from 'vitest'
import { resolveCardDomain, resolveReadableInk, resolveRegionTreatment, resolveVisualTreatment } from './appearance.ts'

describe('visual treatment resolution', () => {
  it('preserves the label-only legacy treatment when appearance is absent', () => {
    expect(resolveVisualTreatment()).toEqual({
      card: { compact: false, description: false, identity: false, stereotype: false },
      grid: 'none',
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
      surface: 'blueprint'
    })
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
