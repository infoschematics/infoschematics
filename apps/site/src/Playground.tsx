import {
  formatInfoschematicIssue,
  type InfoschematicFormat,
  type InfoschematicParseResult,
  parseInfoschematic
} from '@infoschematics/domain-core'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { useEffect, useMemo, useState } from 'react'
import jsonSeed from './playground/seeds/format-parity.json?raw'
import typescriptSeed from './playground/seeds/format-parity.ts.txt?raw'
import yamlSeed from './playground/seeds/format-parity.yaml?raw'
import { SiteNav } from './SiteNav.tsx'
import './styles.css'

const formats: readonly { format: InfoschematicFormat; label: string; seed: string }[] = [
  { format: 'typescript', label: 'TypeScript', seed: typescriptSeed },
  { format: 'json', label: 'JSON', seed: jsonSeed },
  { format: 'yaml', label: 'YAML', seed: yamlSeed }
]

const parseDelay = 250

function usePlaygroundParse(text: string, format: InfoschematicFormat): InfoschematicParseResult {
  const [parsed, setParsed] = useState<InfoschematicParseResult>(() => parseInfoschematic(text, { format }))

  useEffect(() => {
    const timer = window.setTimeout(() => setParsed(parseInfoschematic(text, { format })), parseDelay)
    return () => window.clearTimeout(timer)
  }, [text, format])

  return parsed
}

/** Exported for the component test; the page is its only production consumer. */
export function Preview({ parsed }: { parsed: InfoschematicParseResult }) {
  const [lastGood, setLastGood] = useState<string | undefined>(undefined)
  const svg = useMemo(() => (parsed.ok ? renderInfoschematicSvg(parsed.config) : undefined), [parsed])

  useEffect(() => {
    if (svg) setLastGood(svg)
  }, [svg])

  const shown = svg ?? lastGood
  return (
    <div className="playground-preview">
      {shown ? (
        <img
          alt="Rendered Infoschematic preview"
          className={svg ? undefined : 'playground-preview--stale'}
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(shown)}`}
        />
      ) : (
        <p>Nothing rendered yet.</p>
      )}
      {parsed.ok ? null : (
        <ul aria-label="Document issues" className="playground-issues">
          {parsed.issues.map((issue) => (
            <li key={`${issue.path} ${issue.message}`}>{formatInfoschematicIssue(issue)}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Three independent buffers, one per document format, each validated and rendered live through `parseInfoschematic` -
 * the same loader the CLI uses. The TypeScript tab reads the strict document subset as data; nothing is executed.
 */
export function Playground() {
  const [active, setActive] = useState<InfoschematicFormat>('typescript')
  const [buffers, setBuffers] = useState<Record<InfoschematicFormat, string>>({
    json: jsonSeed,
    typescript: typescriptSeed,
    yaml: yamlSeed
  })
  const text = buffers[active]
  const parsed = usePlaygroundParse(text, active)

  return (
    <div className="document-shell">
      <SiteNav section="playground" />
      <main id="document-content">
        <h1>Playground</h1>
        <p>
          Edit the same definition in any of its three document forms. Input is validated and rendered live; the
          TypeScript form is a strict subset read as data, never executed.
        </p>
        <div aria-label="Document format" className="playground-tabs" role="tablist">
          {formats.map(({ format, label }) => (
            <button
              aria-selected={format === active}
              key={format}
              onClick={() => setActive(format)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="playground-panels">
          <textarea
            aria-label={`${formats.find((entry) => entry.format === active)?.label} document`}
            className="playground-editor"
            onChange={(event) => setBuffers((previous) => ({ ...previous, [active]: event.target.value }))}
            spellCheck={false}
            value={text}
          />
          <Preview parsed={parsed} />
        </div>
      </main>
    </div>
  )
}
