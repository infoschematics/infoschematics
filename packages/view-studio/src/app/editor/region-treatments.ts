import type { RegionLabelPlacement, RegionLabelTreatment } from '@infoschematics/domain-model/appearance'
import type { RegionConfig, RegionFrameStyle, RegionLabelMount } from '@infoschematics/domain-model/region'

import type { PropertyPatch } from './artefact-operations.ts'

export type RegionTreatmentField =
  | 'fill'
  | 'frameOpacity'
  | 'frameStyle'
  | 'labelMount'
  | 'labelOffset'
  | 'labelPlacement'

export type RegionTreatmentOption = Readonly<{ label: string; value: string }>

/** The empty control value: the Region carries no such treatment and takes the rendered default. */
export const regionTreatmentUnset = ''

const frameStyles: readonly RegionFrameStyle[] = ['solid', 'dashed', 'dotted']
const labelMounts: readonly RegionLabelMount[] = ['boundary', 'internal']
const labelPlacements: readonly RegionLabelPlacement[] = [
  'north-west',
  'north',
  'north-east',
  'west',
  'center',
  'east',
  'south-west',
  'south',
  'south-east'
]
const labelTreatments: readonly RegionLabelTreatment[] = ['none', ...labelPlacements]

const describe = (value: string) => `${value.slice(0, 1).toUpperCase()}${value.slice(1).replaceAll('-', ' ')}`

const options = (values: readonly string[], empty: string): readonly RegionTreatmentOption[] =>
  Object.freeze([
    { label: empty, value: regionTreatmentUnset },
    ...values.map((value) => ({ label: describe(value), value }))
  ])

/** Each choice control's options, in the order the domain states them, led by its clearing choice. */
export const regionTreatmentOptions: Readonly<
  Record<
    Extract<RegionTreatmentField, 'frameStyle' | 'labelMount' | 'labelPlacement'>,
    readonly RegionTreatmentOption[]
  >
> = Object.freeze({
  frameStyle: options(frameStyles, 'None'),
  labelMount: options(labelMounts, 'Default'),
  labelPlacement: options(labelTreatments, 'Default')
})

/** What a control shows for the Region as it currently stands; an absent treatment shows empty. */
export const regionTreatmentValue = (region: RegionConfig, field: RegionTreatmentField): string => {
  switch (field) {
    case 'fill':
      return region.fill ?? regionTreatmentUnset
    case 'frameOpacity':
      return region.frame?.opacity === undefined ? regionTreatmentUnset : String(region.frame.opacity)
    case 'frameStyle':
      return region.frame?.style ?? regionTreatmentUnset
    case 'labelMount':
      return region.labelMount ?? regionTreatmentUnset
    case 'labelOffset':
      return region.labelOffset === undefined ? regionTreatmentUnset : String(region.labelOffset)
    case 'labelPlacement':
      return region.labelPlacement ?? regionTreatmentUnset
  }
}

const number = (value: string) => {
  const parsed = Number(value.trim())
  return value.trim() === '' || !Number.isFinite(parsed) ? undefined : parsed
}

const opacity = (value: string) => {
  const parsed = number(value)
  return parsed === undefined ? undefined : Math.min(1, Math.max(0, parsed))
}

const chosen = <Value extends string>(values: readonly Value[], value: string) =>
  values.find((candidate) => candidate === value)

/**
 * Maps one control value onto the patch that states it, clearing an optional treatment with `null`.
 * A value the field cannot carry — an opacity without a frame, or a number that is not one — produces
 * no patch, so an unusable entry leaves the Region as it stands.
 */
export const regionTreatmentPatch = (
  region: RegionConfig,
  field: RegionTreatmentField,
  value: string
): PropertyPatch<RegionConfig> | undefined => {
  const cleared = value.trim() === regionTreatmentUnset

  switch (field) {
    case 'fill':
      return cleared ? { fill: null } : { fill: value.trim() }
    case 'frameOpacity': {
      if (!region.frame) return undefined
      const parsed = cleared ? null : opacity(value)
      return parsed === undefined ? undefined : { frame: { opacity: parsed } }
    }
    case 'frameStyle': {
      if (cleared) return { frame: null }
      const style = chosen(frameStyles, value)
      return style === undefined ? undefined : { frame: { style } }
    }
    case 'labelMount': {
      if (cleared) return { labelMount: null }
      const mount = chosen(labelMounts, value)
      return mount === undefined ? undefined : { labelMount: mount }
    }
    case 'labelOffset': {
      const parsed = cleared ? null : number(value)
      return parsed === undefined ? undefined : { labelOffset: parsed }
    }
    case 'labelPlacement': {
      if (cleared) return { labelPlacement: null }
      const placement = chosen(labelTreatments, value)
      return placement === undefined ? undefined : { labelPlacement: placement }
    }
  }
}
