import type { RegionLabelPlacement } from '@infoschematics/domain-model/appearance'
import { describe, expect, it } from 'vitest'
import type { ResolvedRegionTreatment } from './appearance.ts'
import { regionGeometry, regionGeometryDefaults } from './region-geometry.ts'

const box = { height: 100, width: 180, x: 10, y: 20 }

const treatment = (value: Partial<ResolvedRegionTreatment>): ResolvedRegionTreatment => ({
  frame: 'none',
  frameOpacity: 1,
  label: null,
  labelOffset: null,
  labelTreatment: 'plain',
  ...value
})

describe('region label geometry', () => {
  it.each([
    ['north-west', 26, 36, 'start'],
    ['north', 100, 36, 'middle'],
    ['north-east', 174, 36, 'end'],
    ['west', 26, 70, 'start'],
    ['center', 100, 70, 'middle'],
    ['east', 174, 70, 'end'],
    ['south-west', 26, 104, 'start'],
    ['south', 100, 104, 'middle'],
    ['south-east', 174, 104, 'end']
  ] as const)('places %s deterministically', (placement, x, y, textAnchor) => {
    const geometry = regionGeometry({
      box,
      label: 'Region',
      treatment: treatment({ frame: 'solid', label: placement as RegionLabelPlacement })
    })
    expect(geometry.label).toEqual({ dominantBaseline: 'middle', length: null, placement, textAnchor, x, y })
  })

  it('mounts a notched label on the frame line instead of setting it down inside', () => {
    const geometry = regionGeometry({
      box,
      label: 'Region',
      treatment: treatment({ frame: 'solid', label: 'north-west', labelTreatment: 'notched' })
    })
    expect(geometry.label?.y).toBe(20)
    expect(geometry.notch).not.toBeNull()
  })

  it('returns neither label nor notch for an absent label and closes the fallback frame', () => {
    const geometry = regionGeometry({
      box,
      label: '',
      treatment: treatment({ frame: 'solid', labelTreatment: 'notched' })
    })
    expect(geometry.label).toBeNull()
    expect(geometry.notch).toBeNull()
    expect(geometry.outline?.endsWith(' Z')).toBe(true)
  })
})

describe('region outline geometry', () => {
  it.each([
    ['north', 'north', 100, 37.6],
    ['north-west', 'north', 48.8, 37.6],
    ['north-east', 'north', 151.2, 37.6],
    ['south', 'south', 100, 37.6],
    ['south-west', 'south', 48.8, 37.6],
    ['south-east', 'south', 151.2, 37.6],
    ['west', 'west', 70, regionGeometryDefaults.labelHeight],
    ['east', 'east', 70, regionGeometryDefaults.labelHeight]
  ] as const)('keeps %s notch padding symmetric', (placement, edge, midpoint, labelExtent) => {
    const geometry = regionGeometry({
      box,
      label: 'ABCD',
      treatment: treatment({
        frame: 'solid',
        label: placement as RegionLabelPlacement,
        labelTreatment: 'notched'
      })
    })
    expect(geometry.notch?.edge).toBe(edge)
    expect(((geometry.notch?.start ?? 0) + (geometry.notch?.end ?? 0)) / 2).toBeCloseTo(midpoint, 9)
    expect((geometry.notch?.end ?? 0) - (geometry.notch?.start ?? 0)).toBeCloseTo(
      labelExtent + regionGeometryDefaults.notchPadding * 2,
      9
    )
    expect(geometry.outline?.endsWith(' Z')).toBe(false)
  })

  it('uses no outline for an unframed Zone and keeps center labels from cutting the frame', () => {
    expect(
      regionGeometry({
        box,
        label: 'Zone',
        treatment: treatment({ label: 'north-west' })
      }).outline
    ).toBeNull()
    const centered = regionGeometry({
      box,
      label: 'Lane',
      treatment: treatment({ frame: 'solid', label: 'center', labelTreatment: 'notched' })
    })
    expect(centered.notch).toBeNull()
    expect(centered.outline?.endsWith(' Z')).toBe(true)
  })

  it('is byte-stable and clamps the invariant radius to the region bounds', () => {
    const input = {
      box: { height: 12, width: 20, x: 1, y: 2 },
      label: 'A',
      treatment: treatment({ frame: 'solid', label: 'north' })
    }
    expect(regionGeometry(input).outline).toBe(regionGeometry(input).outline)
    expect(regionGeometry(input).outline).toContain('A6 6')
  })
})
