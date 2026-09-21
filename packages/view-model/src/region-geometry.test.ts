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
    ['A', 9.4],
    ['Distribution', 112.8],
    ['North-East 2', 112.8],
    ['2026', 37.6],
    ['Média', 47]
  ] as const)('uses deterministic shared metrics for %s', (label, length) => {
    const geometry = regionGeometry({
      box,
      label,
      treatment: treatment({
        frame: 'solid',
        label: 'north',
        labelTreatment: 'notched'
      })
    })

    expect(geometry.label?.length).toBe(length)
    expect((geometry.notch?.end ?? 0) - (geometry.notch?.start ?? 0)).toBeCloseTo(
      length + regionGeometryDefaults.notchPadding * 2,
      9
    )
  })

  it('closes a narrow frame when the label and padding cannot fit', () => {
    const geometry = regionGeometry({
      box: { height: 100, width: 60, x: 10, y: 20 },
      label: 'Distribution',
      treatment: treatment({
        frame: 'solid',
        label: 'north',
        labelTreatment: 'notched'
      })
    })

    expect(geometry.notch).toBeNull()
    expect(geometry.outline?.endsWith(' Z')).toBe(true)
  })

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
      treatment: treatment({
        frame: 'solid',
        label: placement as RegionLabelPlacement
      })
    })
    expect(geometry.label).toEqual({
      dominantBaseline: 'middle',
      length: null,
      placement,
      textAnchor,
      x,
      y
    })
  })

  it('mounts a notched label on the frame line instead of setting it down inside', () => {
    const geometry = regionGeometry({
      box,
      label: 'Region',
      treatment: treatment({
        frame: 'solid',
        label: 'north-west',
        labelTreatment: 'notched'
      })
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

  it('uses no outline for an unframed Region and keeps center labels from cutting the frame', () => {
    expect(
      regionGeometry({
        box,
        label: 'Quiet',
        treatment: treatment({ label: 'north-west' })
      }).outline
    ).toBeNull()
    const centered = regionGeometry({
      box,
      label: 'Framed',
      treatment: treatment({
        frame: 'solid',
        label: 'center',
        labelTreatment: 'notched'
      })
    })
    expect(centered.notch).toBeNull()
    expect(centered.outline?.endsWith(' Z')).toBe(true)
  })

  /*
   * The band a crossing route is covered over - `ROUTE-019`.
   *
   * It is asserted against the label it belongs to rather than against fixed numbers, because the requirement is
   * that both renderers cover the same band as the glyphs they were given, not that the band has a chosen size.
   */
  it.each([
    ['north-west', 'plain'],
    ['north', 'notched'],
    ['north-east', 'plain'],
    ['west', 'notched'],
    ['center', 'plain']
  ] as const)('backs a %s label over the run of its own glyphs', (placement, labelTreatment) => {
    const label = 'Distribution'
    const geometry = regionGeometry({
      box,
      label,
      treatment: treatment({ frame: 'solid', label: placement as RegionLabelPlacement, labelTreatment })
    })
    const backing = geometry.labelBacking
    const resolved = geometry.label
    if (!backing || !resolved) throw new Error('a labelled Region resolves both a label and its backing')

    const extent = resolved.length ?? label.length * regionGeometryDefaults.characterWidth
    const padding = regionGeometryDefaults.notchPadding
    expect(backing.width).toBeCloseTo(extent + padding * 2, 9)
    expect(backing.height).toBe(regionGeometryDefaults.labelHeight)
    // Centred on the same point the glyphs are set from, whichever end they are anchored by.
    expect(backing.x + backing.width / 2).toBeCloseTo(
      resolved.textAnchor === 'start'
        ? resolved.x + extent / 2
        : resolved.textAnchor === 'end'
          ? resolved.x - extent / 2
          : resolved.x,
      9
    )
    expect(backing.y + backing.height / 2).toBeCloseTo(resolved.y, 9)
  })

  it('resolves no backing where there is no label to back', () => {
    expect(regionGeometry({ box, label: 'Quiet', treatment: treatment({ frame: 'solid' }) }).labelBacking).toBeNull()
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
