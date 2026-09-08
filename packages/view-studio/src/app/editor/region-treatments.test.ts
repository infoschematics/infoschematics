import type { RegionConfig } from '@infoschematics/domain-model/region'
import { describe, expect, it } from 'vitest'
import {
  type RegionTreatmentField,
  regionTreatmentOptions,
  regionTreatmentPatch,
  regionTreatmentValue
} from './region-treatments.ts'

const box = { height: 120, radius: 8, width: 400, x: 0, y: 0 }

const treated: RegionConfig = {
  box,
  fill: '#0d1b2acc',
  frame: { opacity: 0.6, style: 'dashed' },
  id: 'region-one',
  label: 'Region',
  labelMount: 'boundary',
  labelOffset: 24,
  labelPlacement: 'north'
}

const bare: RegionConfig = { box, id: 'region-two', label: 'Bare region' }

const fields: readonly RegionTreatmentField[] = [
  'fill',
  'frameOpacity',
  'frameStyle',
  'labelMount',
  'labelOffset',
  'labelPlacement'
]

describe('region treatment controls', () => {
  it('shows every treatment the Region carries, and nothing for one that carries none', () => {
    expect(fields.map((field) => regionTreatmentValue(treated, field))).toEqual([
      '#0d1b2acc',
      '0.6',
      'dashed',
      'boundary',
      '24',
      'north'
    ])
    expect(fields.map((field) => regionTreatmentValue(bare, field))).toEqual(['', '', '', '', '', ''])
  })

  it('offers each choice in domain order behind the choice that clears it', () => {
    expect(regionTreatmentOptions.frameStyle.map((option) => option.value)).toEqual(['', 'solid', 'dashed', 'dotted'])
    expect(regionTreatmentOptions.labelMount).toEqual([
      { label: 'Default', value: '' },
      { label: 'Boundary', value: 'boundary' },
      { label: 'Internal', value: 'internal' }
    ])
    expect(regionTreatmentOptions.labelPlacement.map((option) => option.value)).toEqual([
      '',
      'none',
      'north-west',
      'north',
      'north-east',
      'west',
      'center',
      'east',
      'south-west',
      'south',
      'south-east'
    ])
    expect(regionTreatmentOptions.labelPlacement.map((option) => option.label)).toContain('North west')
  })

  it('states each treatment as its own patch, leaving the rest of the frame alone', () => {
    expect(regionTreatmentPatch(treated, 'fill', ' #123456 ')).toEqual({ fill: '#123456' })
    expect(regionTreatmentPatch(treated, 'frameStyle', 'dotted')).toEqual({ frame: { style: 'dotted' } })
    expect(regionTreatmentPatch(treated, 'frameOpacity', '0.25')).toEqual({ frame: { opacity: 0.25 } })
    expect(regionTreatmentPatch(treated, 'labelMount', 'internal')).toEqual({ labelMount: 'internal' })
    expect(regionTreatmentPatch(treated, 'labelOffset', '-12')).toEqual({ labelOffset: -12 })
    expect(regionTreatmentPatch(treated, 'labelPlacement', 'none')).toEqual({ labelPlacement: 'none' })
  })

  it('clears every optional treatment with null, dropping the whole frame with its style', () => {
    expect(fields.map((field) => regionTreatmentPatch(treated, field, ''))).toEqual([
      { fill: null },
      { frame: { opacity: null } },
      { frame: null },
      { labelMount: null },
      { labelOffset: null },
      { labelPlacement: null }
    ])
  })

  it('keeps an opacity inside its range', () => {
    expect(regionTreatmentPatch(treated, 'frameOpacity', '4')).toEqual({ frame: { opacity: 1 } })
    expect(regionTreatmentPatch(treated, 'frameOpacity', '-1')).toEqual({ frame: { opacity: 0 } })
  })

  it('withholds a patch it cannot state rather than writing a fault', () => {
    expect(regionTreatmentPatch(bare, 'frameOpacity', '0.5')).toBeUndefined()
    expect(regionTreatmentPatch(treated, 'frameOpacity', 'faint')).toBeUndefined()
    expect(regionTreatmentPatch(treated, 'frameStyle', 'hairline')).toBeUndefined()
    expect(regionTreatmentPatch(treated, 'labelMount', 'floating')).toBeUndefined()
    expect(regionTreatmentPatch(treated, 'labelOffset', 'far')).toBeUndefined()
    expect(regionTreatmentPatch(treated, 'labelPlacement', 'north-north-west')).toBeUndefined()
  })
})
