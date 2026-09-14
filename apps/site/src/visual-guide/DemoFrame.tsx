import type { InfoschematicConfig } from '@infoschematics/domain-core'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { Canvas } from '@infoschematics/view-canvas'
import '@infoschematics/view-canvas/styles.css'
import { type ReactNode, useMemo, useState } from 'react'
import type { SpecimenKind } from './curriculum.ts'
import { SpecimenSnippet } from './SpecimenSnippet.tsx'
import './DemoFrame.css'

type IconName = 'copy' | 'expand' | 'reset'

export interface DemoVariant {
  config: InfoschematicConfig
  id: string
  label: string
}

function Icon({ name }: { name: IconName }) {
  const paths = {
    copy: (
      <>
        <rect height="10" rx="1" width="9" x="6" y="6" />
        <path d="M4 4h9v2M4 4v9h2" />
      </>
    ),
    expand: (
      <>
        <path d="M3 8V3h5M3 3l5 5M13 8v5H8M13 13l-5-5" />
      </>
    ),
    reset: (
      <>
        <path d="M3 7a5 5 0 1 1 1 5" />
        <path d="M3 3v4h4" />
      </>
    )
  } as const
  return (
    <svg aria-hidden="true" className="demo-frame__icon" viewBox="0 0 16 16">
      {paths[name]}
    </svg>
  )
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
      <div className="demo-frame__controls">
        {propertyControls}
        <div className="demo-frame__actions">
          <button aria-label="Reset example" onClick={resetFrame} title="Reset example" type="button">
            <Icon name="reset" />
          </button>
          <button
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse source' : 'Expand source'}
            onClick={() => setExpanded((value) => !value)}
            title={expanded ? 'Collapse source' : 'Expand source'}
            type="button"
          >
            <Icon name="expand" />
          </button>
        </div>
      </div>
      <SpecimenSnippet config={config} kind={kind} expanded={expanded} />
    </section>
  )
}
