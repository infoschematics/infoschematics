import type { RegionLabelPlacement } from '@infoschematics/domain-model/appearance'
import { describe, expect, it } from 'vitest'
import { regionGeometry, regionGeometryDefaults } from './region-geometry.ts'

const box = { height: 100, width: 180, x: 10, y: 20 }

describe('region label geometry', () => {
  it.each([
    ['north-west', 26, 20, 'start'],
    ['north', 100, 20, 'middle'],
    ['north-east', 174, 20, 'end'],
    ['west', 10, 70, 'start'],
    ['center', 100, 70, 'middle'],
    ['east', 190, 70, 'end'],
    ['south-west', 26, 120, 'start'],
    ['south', 100, 120, 'middle'],
    ['south-east', 174, 120, 'end'],
  ] as const)('places %s deterministically', (placement, x, y, textAnchor) => {
    const geometry = regionGeometry({
      box,
      label: 'Region',
      treatment: { frame: 'solid', label: placement as RegionLabelPlacement, labelTreatment: 'plain' },
    })
    expect(geometry.label).toEqual({ dominantBaseline: 'middle', placement, textAnchor, x, y })
  })

  it('returns neither label nor notch for an absent label and closes the fallback frame', () => {
    const geometry = regionGeometry({
      box,
      label: '',
      treatment: { frame: 'solid', label: null, labelTreatment: 'notched' },
    })
    expect(geometry.label).toBeNull()
    expect(geometry.notch).toBeNull()
    expect(geometry.outline?.endsWith(' Z')).toBe(true)
  })
})

describe('region outline geometry', () => {
  it.each([
    ['north', 'north', 100, 32],
    ['north-west', 'north', 46, 32],
    ['north-east', 'north', 154, 32],
    ['south', 'south', 100, 32],
    ['south-west', 'south', 46, 32],
    ['south-east', 'south', 154, 32],
    ['west', 'west', 70, regionGeometryDefaults.labelHeight],
    ['east', 'east', 70, regionGeometryDefaults.labelHeight],
  ] as const)('keeps %s notch padding symmetric', (placement, edge, midpoint, labelExtent) => {
    const geometry = regionGeometry({
      box,
      label: 'ABCD',
        treatment: {
          frame: 'solid',
          label: placement as RegionLabelPlacement,
          labelTreatment: 'notched',
        },
    })
    expect(geometry.notch?.edge).toBe(edge)
    expect(((geometry.notch?.start ?? 0) + (geometry.notch?.end ?? 0)) / 2).toBe(midpoint)
    expect((geometry.notch?.end ?? 0) - (geometry.notch?.start ?? 0)).toBe(
      labelExtent + regionGeometryDefaults.notchPadding * 2,
    )
    expect(geometry.outline?.endsWith(' Z')).toBe(false)
  })

  it('uses no outline for an unframed Zone and keeps center labels from cutting the frame', () => {
    expect(
      regionGeometry({
        box,
        label: 'Zone',
        treatment: { frame: 'none', label: 'north-west', labelTreatment: 'plain' },
      }).outline,
    ).toBeNull()
    const centered = regionGeometry({
      box,
      label: 'Lane',
      treatment: { frame: 'solid', label: 'center', labelTreatment: 'notched' },
    })
    expect(centered.notch).toBeNull()
    expect(centered.outline?.endsWith(' Z')).toBe(true)
  })

  it('is byte-stable and clamps the invariant radius to the region bounds', () => {
    const input = {
      box: { height: 12, width: 20, x: 1, y: 2 },
      label: 'A',
      treatment: { frame: 'solid' as const, label: 'north' as const, labelTreatment: 'plain' as const },
    }
    expect(regionGeometry(input).outline).toBe(regionGeometry(input).outline)
    expect(regionGeometry(input).outline).toContain('A6 6')
  })
})
