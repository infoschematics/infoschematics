import type { RegionConfig } from '@infoschematics/domain-model/region'

import type { PropertyPatch } from './artefact-operations.ts'
import {
  type RegionTreatmentField,
  regionTreatmentOptions,
  regionTreatmentPatch,
  regionTreatmentValue
} from './region-treatments.ts'

export type RegionTreatmentsProps = Readonly<{
  onPatch: (patch: PropertyPatch<RegionConfig>) => void
  region: RegionConfig
}>

type ChoiceField = keyof typeof regionTreatmentOptions

/**
 * Every treatment a Region authors, offered as typed controls beside the general
 * serialisable-properties escape hatch. A choice applies as it is made; a typed
 * value applies when the field is left, and an emptied field clears the treatment.
 */
export function RegionTreatments({ onPatch, region }: RegionTreatmentsProps) {
  const commit = (field: RegionTreatmentField, value: string) => {
    const patch = regionTreatmentPatch(region, field, value)
    if (patch) onPatch(patch)
  }

  const choice = (field: ChoiceField, label: string) => (
    <label>
      {label}
      <select
        aria-label={`Region ${label.toLowerCase()}`}
        onChange={(event) => commit(field, event.target.value)}
        value={regionTreatmentValue(region, field)}
      >
        {regionTreatmentOptions[field].map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <fieldset className="artefact-properties">
      <legend>Region treatments</legend>
      {choice('frameStyle', 'Frame style')}
      {region.frame ? (
        <label>
          Frame opacity
          {/* Uncontrolled behind a value-derived key: typing keeps the caret, while an edit
              made elsewhere — an undo, or the JSON field — re-seeds it from the Region. */}
          <input
            aria-label="Region frame opacity"
            defaultValue={regionTreatmentValue(region, 'frameOpacity')}
            key={`frameOpacity:${regionTreatmentValue(region, 'frameOpacity')}`}
            max={1}
            min={0}
            onBlur={(event) => commit('frameOpacity', event.target.value)}
            step={0.05}
            type="number"
          />
        </label>
      ) : null}
      <label>
        Fill
        <input
          aria-label="Region fill"
          defaultValue={regionTreatmentValue(region, 'fill')}
          key={`fill:${regionTreatmentValue(region, 'fill')}`}
          onBlur={(event) => commit('fill', event.target.value)}
          type="text"
        />
      </label>
      {choice('labelPlacement', 'Label placement')}
      {choice('labelMount', 'Label mount')}
      <label>
        Label offset
        <input
          aria-label="Region label offset"
          defaultValue={regionTreatmentValue(region, 'labelOffset')}
          key={`labelOffset:${regionTreatmentValue(region, 'labelOffset')}`}
          onBlur={(event) => commit('labelOffset', event.target.value)}
          type="number"
        />
      </label>
    </fieldset>
  )
}
