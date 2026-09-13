import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { useState } from 'react'
import type { GuidePropertyKey, SpecimenKind } from './curriculum.ts'
import { PropertyControl } from './PropertyControl.tsx'
import { type GuidePropertyValue, guidePropertyValue, specimenFor, withGuideProperty } from './specimens.ts'

export function InteractiveSpecimen({
  kind,
  propertyKeys,
  title
}: {
  kind: SpecimenKind
  propertyKeys: readonly GuidePropertyKey[]
  title: string
}) {
  const [config, setConfig] = useState(() => specimenFor(kind))
  const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderInfoschematicSvg(config, { annotations: true, visibility: { graphics: 'all' } }))}`

  const changeProperty = (key: GuidePropertyKey, value: GuidePropertyValue) => {
    setConfig((current) => withGuideProperty(current, key, value))
  }

  return (
    <div className="interactive-specimen">
      <div className="interactive-specimen__output">
        <img alt={`${title} example`} src={source} />
      </div>
      <fieldset className="interactive-specimen__controls">
        <legend>Change properties</legend>
        {propertyKeys.map((key) => (
          <PropertyControl
            key={key}
            onChange={(value) => changeProperty(key, value)}
            propertyKey={key}
            value={guidePropertyValue(config, key)}
          />
        ))}
        <button onClick={() => setConfig(specimenFor(kind))} type="button">
          Reset example
        </button>
      </fieldset>
    </div>
  )
}
