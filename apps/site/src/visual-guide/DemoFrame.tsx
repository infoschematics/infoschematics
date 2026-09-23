import type { InfoschematicConfig } from '@infoschematics/domain-core'
import { Canvas } from '@infoschematics/view-canvas'
import '@infoschematics/view-canvas/styles.css'
import { type ReactNode, useId, useState } from 'react'
import { StaticInfoschematic } from '../StaticInfoschematic.tsx'
import type { SpecimenKind } from './curriculum.ts'
import { SpecimenSnippet } from './SpecimenSnippet.tsx'
import './DemoFrame.css'

/* Flow codes only, because the Design half of this frame is a live view with its tags off: a still that named
   every component beside a live view that named none would be the two halves disagreeing again. */
const previewOptions = { annotations: { flows: true }, visibility: { graphics: 'all' } } as const

export interface DemoVariant {
  config: InfoschematicConfig
  id: string
  label: string
}

export function DemoFrame({
  config,
  kind,
  title,
  description,
  propertyControls,
  reset,
  variants
}: {
  config: InfoschematicConfig
  kind: SpecimenKind
  title: string
  description?: string
  propertyControls: ReactNode
  reset: () => void
  variants?: readonly DemoVariant[]
}) {
  const [mode, setMode] = useState<'rendered' | 'design'>('rendered')
  const [expanded, setExpanded] = useState(false)
  // Every rendering inlined into the page owns its markers and patterns by name, and SVG resolves a reference to the
  // first match in document order rather than the nearest. One frame can hold several drawings and a page several
  // frames, so the prefix has to be unique per mount as well as per variant.
  const frameId = useId()
  const resetFrame = () => {
    reset()
    setMode('rendered')
    setExpanded(false)
  }
  const previews = variants?.length ? variants : [{ config, id: kind, label: '' }]

  return (
    <section className="demo-frame" aria-label={`${title} live example`}>
      <header className="demo-frame__heading">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        <fieldset className="demo-frame__modes">
          <legend className="sr-only">Preview mode</legend>
          {(['rendered', 'design'] as const).map((candidate) => (
            <button key={candidate} aria-pressed={mode === candidate} onClick={() => setMode(candidate)} type="button">
              {candidate === 'rendered' ? 'Rendered' : 'Design'}
            </button>
          ))}
        </fieldset>
      </header>
      <div className={`demo-frame__preview${previews.length > 1 ? ' demo-frame__preview--variants' : ''}`}>
        {previews.map((variant) => (
          <figure key={variant.id}>
            {mode === 'design' ? (
              <Canvas config={variant.config} editor="design" />
            ) : (
              <StaticInfoschematic
                className="demo-frame__rendered"
                input={variant.config}
                label={`${variant.label || title} rendered preview`}
                options={previewOptions}
                resourceIdPrefix={`${frameId}-${variant.id}`}
              />
            )}
            {variant.label ? <figcaption>{variant.label}</figcaption> : null}
          </figure>
        ))}
      </div>
      <div className="demo-frame__controls">{propertyControls}</div>
      <SpecimenSnippet
        config={config}
        expanded={expanded}
        kind={kind}
        onReset={resetFrame}
        onToggleExpand={() => setExpanded((value) => !value)}
      />
    </section>
  )
}
