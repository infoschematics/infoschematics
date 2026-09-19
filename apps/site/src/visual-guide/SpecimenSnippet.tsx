import type { InfoschematicConfig } from '@infoschematics/domain-core'
import { useEffect, useState } from 'react'
import type { SpecimenKind } from './curriculum.ts'
import { Icon } from './Icon.tsx'
import { type SpecimenSnippetFormat, specimenSnippet } from './specimens.ts'

/* A copy that worked has said all it has to say; one that failed carries an instruction the reader still needs. */
const successNoticeDuration = 2400

export function SpecimenSnippet({
  config,
  kind,
  expanded = false,
  onReset,
  onToggleExpand
}: {
  config: InfoschematicConfig
  kind: SpecimenKind
  expanded?: boolean
  onReset?: () => void
  onToggleExpand?: () => void
}) {
  const [format, setFormat] = useState<SpecimenSnippetFormat>('yaml')
  const [notice, setNotice] = useState<{ message: string; transient: boolean } | null>(null)
  const source = specimenSnippet(config, kind, format)
  const panelId = `${kind}-snippet`

  useEffect(() => {
    if (!notice?.transient) return
    const timer = setTimeout(() => setNotice(null), successNoticeDuration)
    return () => clearTimeout(timer)
  }, [notice])

  const copySnippet = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(source)
      setNotice({ message: `${format === 'yaml' ? 'YAML' : 'TypeScript'} copied.`, transient: true })
    } catch {
      setNotice({ message: 'Could not copy. Select the snippet to copy it manually.', transient: false })
    }
  }

  const selectFormat = (next: SpecimenSnippetFormat) => {
    setFormat(next)
    setNotice(null)
  }

  return (
    <section aria-label={`${kind} definition snippet`} className="specimen-snippet">
      <header className="specimen-snippet__toolbar">
        <div aria-label="Snippet format" className="specimen-snippet__tabs" role="tablist">
          {(['yaml', 'typescript'] as const).map((candidate) => (
            <button
              aria-controls={panelId}
              aria-selected={format === candidate}
              key={candidate}
              onClick={() => selectFormat(candidate)}
              role="tab"
              type="button"
            >
              {candidate === 'yaml' ? 'YAML' : 'TypeScript'}
            </button>
          ))}
        </div>
        <div className="specimen-snippet__actions">
          {/* The region is mounted whether or not it holds anything, so the first copy is an update to announce
              rather than a new region to discover. It reports its own emptiness rather than leaving that to
              `:empty`, which an empty text node quietly defeats. */}
          <p aria-live="polite" className="specimen-snippet__notice" data-empty={notice === null}>
            {notice?.message ?? null}
          </p>
          <button
            aria-label="Copy snippet"
            className="specimen-snippet__copy"
            onClick={copySnippet}
            title="Copy snippet"
            type="button"
          >
            <Icon name="copy" />
          </button>
          {onReset ? (
            <button aria-label="Reset example" onClick={onReset} title="Reset example" type="button">
              <Icon name="reset" />
            </button>
          ) : null}
          {onToggleExpand ? (
            <button
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse source' : 'Expand source'}
              onClick={onToggleExpand}
              title={expanded ? 'Collapse source' : 'Expand source'}
              type="button"
            >
              <Icon name="expand" />
            </button>
          ) : null}
        </div>
      </header>
      <pre
        aria-label={`${format} source`}
        className={
          expanded ? 'specimen-snippet__source specimen-snippet__source--expanded' : 'specimen-snippet__source'
        }
        id={panelId}
        role="tabpanel"
      >
        <code>{source}</code>
      </pre>
    </section>
  )
}
