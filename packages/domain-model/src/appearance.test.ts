import type {
  GridTreatment,
  InfoschematicAppearanceConfig,
  RegionLabelFrameTreatment,
  RegionLabelPlacement,
  RegionLabelTreatment,
  SurfaceTreatment
} from '@infoschematics/domain-model/appearance'
import type { CardConfig } from '@infoschematics/domain-model/card'
import type { DomainConfig } from '@infoschematics/domain-model/domain'
import type { RegionConfig, RegionFrameStyle, RegionLabelMount } from '@infoschematics/domain-model/region'
import { describe, expect, expectTypeOf, it } from 'vitest'

describe('authored appearance contracts', () => {
  it('keeps every treatment a closed serialisable value', () => {
    expectTypeOf<GridTreatment>().toEqualTypeOf<'none' | 'major' | 'major-plus-minor' | 'dots'>()
    expectTypeOf<SurfaceTreatment>().toEqualTypeOf<'neutral' | 'blueprint'>()
    expectTypeOf<RegionFrameStyle>().toEqualTypeOf<'solid' | 'dashed' | 'dotted'>()
    expectTypeOf<RegionLabelMount>().toEqualTypeOf<'boundary' | 'internal'>()
    expectTypeOf<RegionLabelFrameTreatment>().toEqualTypeOf<'plain' | 'notched'>()
    expectTypeOf<RegionLabelPlacement>().toEqualTypeOf<
      'north-west' | 'north' | 'north-east' | 'west' | 'center' | 'east' | 'south-west' | 'south' | 'south-east'
    >()
    expectTypeOf<RegionLabelTreatment>().toEqualTypeOf<'none' | RegionLabelPlacement>()

    const appearance = {
      surface: 'blueprint',
      grid: 'major-plus-minor',
      card: { compact: true, identity: false, stereotype: true, description: false }
    } satisfies InfoschematicAppearanceConfig
    const region = {
      id: 'application',
      label: 'Application',
      box: { x: 0, y: 0, width: 320, height: 180, radius: 12 },
      frame: { style: 'dashed', opacity: 0.6 },
      fill: '#eef',
      labelPlacement: 'north-east',
      labelMount: 'boundary',
      labelOffset: 8
    } satisfies RegionConfig

    expect(JSON.parse(JSON.stringify({ appearance, region }))).toEqual({ appearance, region })
  })

  it('keeps region, Card, Domain, and Scope meanings distinct', () => {
    const region = {
      id: 'software',
      label: 'Software',
      box: { x: 0, y: 0, width: 320, height: 180, radius: 12 },
      frame: { style: 'solid' },
      labelPlacement: 'north-west',
      labelMount: 'boundary'
    } satisfies RegionConfig
    const domain = {
      id: 'platform',
      label: 'Platform',
      color: '#123456',
      fill: '#abcdef'
    } satisfies DomainConfig
    const card = {
      id: 'runtime',
      code: 'RUN',
      label: 'Runtime',
      detail: 'Runtime package',
      scopes: ['internal'],
      scope: 'internal',
      domain: domain.id,
      stereotype: 'package',
      placement: { box: { x: 40, y: 40, width: 160, height: 90 } }
    } satisfies CardConfig

    expect(JSON.parse(JSON.stringify({ card, domain, region }))).toEqual({ card, domain, region })
  })
})
