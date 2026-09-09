import {
  formatInfoschematicIssue,
  type InfoschematicParseResult,
  parseInfoschematic,
  serialiseInfoschematicYaml
} from '@infoschematics/domain-core'
import { blankInfoschematic } from '@infoschematics/is-blank'
import { infoschematicsExample } from '@infoschematics/is-infoschematics'
import { systemExample } from '@infoschematics/is-system'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { useEffect, useMemo, useState } from 'react'
import yamlSeed from './playground/seeds/format-parity.yaml?raw'
import { SiteNav } from './SiteNav.tsx'
import './styles.css'

export type PlaygroundPreset = 'blank' | 'format-parity' | 'infoschematics' | 'system'

/** A preset replaces the YAML document while its own page remains a curated view. */
export const presets: readonly {
  key: PlaygroundPreset
  label: string
  document: string
}[] = [
  {
    key: 'format-parity',
    label: 'Source to sink',
    document: yamlSeed
  },
  {
    key: 'infoschematics',
    label: 'Infoschematics',
    document: serialiseInfoschematicYaml(infoschematicsExample)
  },
  { key: 'system', label: 'A system, explained', document: serialiseInfoschematicYaml(systemExample) },
  { key: 'blank', label: 'Blank Infoschematic', document: serialiseInfoschematicYaml(blankInfoschematic) }
]

/** The preset a `?preset=` query names, or `undefined` for anything it does not. */
export const presetFromSearch = (search: string): PlaygroundPreset | undefined => {
  const wanted = new URLSearchParams(search).get('preset')
  return presets.find(({ key }) => key === wanted)?.key
}

const parseDelay = 250

function usePlaygroundParse(text: string): InfoschematicParseResult {
  const [parsed, setParsed] = useState<InfoschematicParseResult>(() => parseInfoschematic(text))

  useEffect(() => {
    const timer = window.setTimeout(() => setParsed(parseInfoschematic(text)), parseDelay)
    return () => window.clearTimeout(timer)
  }, [text])

  return parsed
}

/** Exported for the component test; the page is its only production consumer. */
export function Preview({ parsed }: { parsed: InfoschematicParseResult }) {
  const [lastGood, setLastGood] = useState<string | undefined>(undefined)
  const svg = useMemo(() => (parsed.ok ? renderInfoschematicSvg(parsed.model) : undefined), [parsed])

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
    </div>
  )
}

/** Exported for the component test; the page is its only production consumer. */
export function Issues({ parsed }: { parsed: InfoschematicParseResult }) {
  if (parsed.ok) return null
  return (
    <ul aria-label="Document issues" className="playground-issues">
      {parsed.issues.map((issue) => (
        <li key={`${issue.path} ${issue.message}`}>{formatInfoschematicIssue(issue)}</li>
      ))}
    </ul>
  )
}

const initialPreset = (): PlaygroundPreset =>
  (typeof window === 'undefined' ? undefined : presetFromSearch(window.location.search)) ?? 'format-parity'

/** One inert YAML document, validated and rendered live through the same loader the CLI uses. */
export function Playground({ preset = initialPreset() }: { preset?: PlaygroundPreset }) {
  const [text, setText] = useState(() => presets.find(({ key }) => key === preset)?.document ?? yamlSeed)
  const parsed = usePlaygroundParse(text)

  const loadPreset = (key: PlaygroundPreset) => {
    const wanted = presets.find((entry) => entry.key === key)
    if (!wanted) return
    setText(wanted.document)
  }

  return (
    <div className="document-shell document-shell--wide playground-shell">
      <SiteNav section="playground" />
      <main className="playground-main" id="document-content">
        <h1 className="sr-only">Playground</h1>
        <div className="playground-toolbar">
          <p className="playground-format">YAML</p>
          <label className="playground-preset">
            Preset
            <select onChange={(event) => loadPreset(event.target.value as PlaygroundPreset)} value="">
              <option disabled value="">
                Load a definition…
              </option>
              {presets.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <p className="playground-hint">
            Validated and rendered live as inert data. JSON syntax is accepted too. Loading a preset replaces the
            document.
          </p>
        </div>
        <div className="playground-panels">
          <div className="playground-editor-pane">
            <textarea
              aria-label="YAML document"
              className="playground-editor"
              onChange={(event) => setText(event.target.value)}
              spellCheck={false}
              value={text}
            />
            <Issues parsed={parsed} />
          </div>
          <Preview parsed={parsed} />
        </div>
      </main>
    </div>
  )
}
