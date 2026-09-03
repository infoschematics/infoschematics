import { describe, expect, expectTypeOf, it } from 'vitest'

import type {
  GridTreatment,
  InfoschematicAppearanceConfig,
  RegionAppearanceConfig,
  RegionFrameTreatment,
  RegionLabelFrameTreatment,
  RegionLabelPlacement,
  RegionLabelTreatment,
  SurfaceTreatment,
} from '@infoschematics/domain-model/appearance'
import type { CardConfig } from '@infoschematics/domain-model/card'
import type { DomainConfig } from '@infoschematics/domain-model/domain'
import type { LaneConfig } from '@infoschematics/domain-model/lane'
import type { ZoneConfig } from '@infoschematics/domain-model/zone'

describe('authored appearance contracts', () => {
  it('keeps every treatment a closed serialisable value', () => {
    expectTypeOf<GridTreatment>().toEqualTypeOf<'none' | 'major' | 'major-plus-minor'>()
    expectTypeOf<SurfaceTreatment>().toEqualTypeOf<'neutral' | 'blueprint'>()
    expectTypeOf<RegionFrameTreatment>().toEqualTypeOf<'none' | 'solid' | 'dashed' | 'dotted'>()
    expectTypeOf<RegionLabelFrameTreatment>().toEqualTypeOf<'plain' | 'notched'>()
    expectTypeOf<RegionLabelPlacement>().toEqualTypeOf<
      | 'north-west'
      | 'north'
      | 'north-east'
      | 'west'
      | 'center'
      | 'east'
      | 'south-west'
      | 'south'
      | 'south-east'
    >()
    expectTypeOf<RegionLabelTreatment>().toEqualTypeOf<'none' | RegionLabelPlacement>()

    const appearance = {
      surface: 'blueprint',
      grid: 'major-plus-minor',
      card: { compact: true, identity: false, stereotype: true, description: false },
    } satisfies InfoschematicAppearanceConfig
    const region = {
      frame: 'dashed',
      label: 'north-east',
      labelTreatment: 'notched',
    } satisfies RegionAppearanceConfig

    expect(JSON.parse(JSON.stringify({ appearance, region }))).toEqual({ appearance, region })
  })

  it('keeps region, Card, Domain, and Scope meanings distinct', () => {
    const zone = {
      id: 'application',
      label: 'Application',
      x: 0,
      width: 320,
      fill: '#eef',
      appearance: { frame: 'dotted', label: 'south', labelTreatment: 'plain' },
    } satisfies ZoneConfig
    const lane = {
      id: 'software',
      label: 'Software',
      y: 0,
      height: 180,
      labelY: 20,
      panel: { x: 0, y: 0, width: 320, height: 180, radius: 12 },
      zones: [zone],
      appearance: { frame: 'solid', label: 'north-west', labelTreatment: 'notched' },
    } satisfies LaneConfig
    const domain = {
      id: 'platform',
      label: 'Platform',
      color: '#123456',
      fill: '#abcdef',
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
      placement: { box: { x: 40, y: 40, width: 160, height: 90 } },
    } satisfies CardConfig

    expect(JSON.parse(JSON.stringify({ card, domain, lane }))).toEqual({ card, domain, lane })
  })
})
