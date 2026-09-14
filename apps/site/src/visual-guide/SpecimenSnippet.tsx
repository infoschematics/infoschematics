import type { InfoschematicConfig } from '@infoschematics/domain-core'
import { useState } from 'react'
import type { SpecimenKind } from './curriculum.ts'
import { type SpecimenSnippetFormat, specimenSnippet } from './specimens.ts'

export function SpecimenSnippet({ config, kind }: { config: InfoschematicConfig; kind: SpecimenKind }) {
  const [format, setFormat] = useState<SpecimenSnippetFormat>('yaml')
  const [feedback, setFeedback] = useState('')
  const source = specimenSnippet(config, kind, format)
  const panelId = `${kind}-snippet`

  const copySnippet = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(source)
      setFeedback(`${format === 'yaml' ? 'YAML' : 'TypeScript'} copied.`)
    } catch {
      setFeedback('Could not copy. Select the snippet and copy it manually.')
    }
  }

  const selectFormat = (next: SpecimenSnippetFormat) => {
    setFormat(next)
    setFeedback('')
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
        <button className="specimen-snippet__copy" onClick={copySnippet} type="button">
          Copy snippet
        </button>
      </header>
      <pre aria-label={`${format} source`} id={panelId} role="tabpanel">
        <code>{source}</code>
      </pre>
      <p aria-live="polite" className="specimen-snippet__feedback">
        {feedback}
      </p>
    </section>
  )
}
