import type { DomainConfig } from '@infoschematics/domain-model/domain'
import { describe, expect, it } from 'vitest'
import { resolveCardDomain, resolveRegionTreatment, resolveVisualTreatment } from './appearance.ts'

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
