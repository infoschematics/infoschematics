import { useState } from 'react'
import type { GuidePropertyKey, SpecimenKind } from './curriculum.ts'
import { DemoFrame } from './DemoFrame.tsx'
import { PropertyControl } from './PropertyControl.tsx'
import {
  type GuidePropertyValue,
  guidePropertyValue,
  specimenFor,
  withGuideProperty,
  withGuideTreatment
} from './specimens.ts'

/* A comparison is either one authored property set two ways, or one element drawn under two standard treatments:
   a treatment is a renderer key rather than a property, so it is applied by key instead of through a control. */
type Comparison =
  | { id: string; label: string; propertyKey: GuidePropertyKey; value: GuidePropertyValue }
  | { id: string; label: string; treatment: string }

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
        .filter(
          (key) => !comparisons?.some((comparison) => 'propertyKey' in comparison && comparison.propertyKey === key)
        )
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
    config:
      'treatment' in comparison
        ? withGuideTreatment(config, kind === 'graphic' ? 'graphic' : 'fabric', comparison.treatment)
        : withGuideProperty(config, comparison.propertyKey, comparison.value),
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
