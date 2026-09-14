import { useState } from 'react'
import type { GuidePropertyKey, SpecimenKind } from './curriculum.ts'
import { DemoFrame } from './DemoFrame.tsx'
import { PropertyControl } from './PropertyControl.tsx'
import { type GuidePropertyValue, guidePropertyValue, specimenFor, withGuideProperty } from './specimens.ts'

type Comparison = { id: string; label: string; propertyKey: GuidePropertyKey; value: GuidePropertyValue }

export function InteractiveSpecimen({
  kind,
  propertyKeys,
  title,
  comparisons
}: {
  kind: SpecimenKind
  propertyKeys: readonly GuidePropertyKey[]
  title: string
  comparisons?: readonly Comparison[]
}) {
  const [config, setConfig] = useState(() => specimenFor(kind))
  const changeProperty = (key: GuidePropertyKey, value: GuidePropertyValue) =>
    setConfig((current) => withGuideProperty(current, key, value))
  const controls = (
    <fieldset className="interactive-specimen__controls">
      <legend>Properties</legend>
      {propertyKeys
        .filter((key) => !comparisons?.some((comparison) => comparison.propertyKey === key))
        .map((key) => (
          <PropertyControl
            key={key}
            onChange={(value) => changeProperty(key, value)}
            propertyKey={key}
            value={guidePropertyValue(config, key)}
          />
        ))}
    </fieldset>
  )
  const variants = comparisons?.map((comparison) => ({
    config: withGuideProperty(config, comparison.propertyKey, comparison.value),
    id: comparison.id,
    label: comparison.label
  }))
  return (
    <div className="interactive-specimen-layout">
      <DemoFrame
        config={config}
        description="Adjust properties to see the serialisable definition update."
        kind={kind}
        propertyControls={controls}
        reset={() => setConfig(specimenFor(kind))}
        title={title}
        variants={variants}
      />
    </div>
  )
}
