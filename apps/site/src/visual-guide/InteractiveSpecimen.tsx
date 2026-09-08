import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { useState } from 'react'
import { AppearanceControl } from './AppearanceControl.tsx'
import type { AppearanceOptionKey } from './curriculum.ts'
import {
  type AppearanceOptionValue,
  appearanceOptionValue,
  treatmentSpecimen,
  withAppearanceOption
} from './specimens.ts'

export function InteractiveSpecimen({
  optionKeys,
  title
}: {
  optionKeys: readonly AppearanceOptionKey[]
  title: string
}) {
  const [config, setConfig] = useState(treatmentSpecimen)
  const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderInfoschematicSvg(config, { annotations: true, visibility: { graphics: 'all' } }))}`

  const changeOption = (key: AppearanceOptionKey, value: AppearanceOptionValue) => {
    setConfig((current) => withAppearanceOption(current, key, value))
  }

  return (
    <div className="interactive-specimen">
      <div className="interactive-specimen__output">
        <img alt={`${title} example`} src={source} />
      </div>
      <fieldset className="interactive-specimen__controls">
        <legend>Try the treatments</legend>
        {optionKeys.map((key) => (
          <AppearanceControl
            key={key}
            onChange={(value) => changeOption(key, value)}
            optionKey={key}
            value={appearanceOptionValue(config, key)}
          />
        ))}
        <button onClick={() => setConfig(treatmentSpecimen())} type="button">
          Reset example
        </button>
      </fieldset>
    </div>
  )
}
