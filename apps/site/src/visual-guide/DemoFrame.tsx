import type { InfoschematicConfig } from '@infoschematics/domain-core'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { Canvas } from '@infoschematics/view-canvas'
import '@infoschematics/view-canvas/styles.css'
import { type ReactNode, useMemo, useState } from 'react'
import type { SpecimenKind } from './curriculum.ts'
import { SpecimenSnippet } from './SpecimenSnippet.tsx'
import './DemoFrame.css'

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
  const renderedSource = useMemo(
    () =>
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderInfoschematicSvg(config, { annotations: true, visibility: { graphics: 'all' } }))}`,
    [config]
  )
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
        {previews.map((variant) => {
          const source =
            variant.config === config
              ? renderedSource
              : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                  renderInfoschematicSvg(variant.config, {
                    annotations: true,
                    visibility: { graphics: 'all' }
                  })
                )}`

          return (
            <figure key={variant.id}>
              {mode === 'design' ? (
                <Canvas config={variant.config} mode="design" />
              ) : (
                <img alt={`${variant.label || title} rendered preview`} src={source} />
              )}
              {variant.label ? <figcaption>{variant.label}</figcaption> : null}
            </figure>
          )
        })}
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
