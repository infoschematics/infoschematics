import { useState } from 'react'
import type { GuidePropertyKey, SpecimenKind } from './curriculum.ts'
import { DemoFrame } from './DemoFrame.tsx'
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
  const changeProperty = (key: GuidePropertyKey, value: GuidePropertyValue) => {
    setConfig((current) => withGuideProperty(current, key, value))
  }

  return (
    <div className="interactive-specimen-layout">
      <DemoFrame
        config={config}
        description="Adjust the properties to see the serialisable definition update."
        kind={kind}
        propertyControls={
          <fieldset className="interactive-specimen__controls">
            <legend>Properties</legend>
            {propertyKeys.map((key) => (
              <PropertyControl
                key={key}
                onChange={(value) => changeProperty(key, value)}
                propertyKey={key}
                value={guidePropertyValue(config, key)}
              />
            ))}
          </fieldset>
        }
        reset={() => setConfig(specimenFor(kind))}
        title={title}
      />
    </div>
  )
}
