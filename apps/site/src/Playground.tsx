import {
  formatInfoschematicIssue,
  type InfoschematicFormat,
  type InfoschematicParseResult,
  parseInfoschematic
} from '@infoschematics/domain-core'
import { blankInfoschematic } from '@infoschematics/is-blank'
import { infoschematicsExample } from '@infoschematics/is-infoschematics'
import { systemExample } from '@infoschematics/is-system'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { useEffect, useMemo, useState } from 'react'
import jsonSeed from './playground/seeds/format-parity.json?raw'
import typescriptSeed from './playground/seeds/format-parity.ts.txt?raw'
import yamlSeed from './playground/seeds/format-parity.yaml?raw'
import { SiteNav } from './SiteNav.tsx'
import './styles.css'

const formats: readonly { format: InfoschematicFormat; label: string }[] = [
  { format: 'typescript', label: 'TypeScript' },
  { format: 'json', label: 'JSON' },
  { format: 'yaml', label: 'YAML' }
]

export type PlaygroundPreset = 'blank' | 'format-parity' | 'infoschematics' | 'system'

const serialise = (config: unknown) => `${JSON.stringify(config, null, 2)}\n`

/**
 * A preset fills one or more buffers and focuses one tab. The format-parity seed is authored in all three forms; an
 * example's normalised config serialises to a JSON document, so the hosted examples become definitions to play with
 * while their own pages stay curated views.
 */
export const presets: readonly {
  key: PlaygroundPreset
  label: string
  buffers: Partial<Record<InfoschematicFormat, string>>
  focus: InfoschematicFormat
}[] = [
  {
    key: 'format-parity',
    label: 'Format parity seed',
    buffers: { json: jsonSeed, typescript: typescriptSeed, yaml: yamlSeed },
    focus: 'typescript'
  },
  {
    key: 'infoschematics',
    label: 'Infoschematics',
    buffers: { json: serialise(infoschematicsExample) },
    focus: 'json'
  },
  { key: 'system', label: 'A system, explained', buffers: { json: serialise(systemExample) }, focus: 'json' },
  { key: 'blank', label: 'Blank Infoschematic', buffers: { json: serialise(blankInfoschematic) }, focus: 'json' }
]

/** The preset a `?preset=` query names, or `undefined` for anything it does not. */
export const presetFromSearch = (search: string): PlaygroundPreset | undefined => {
  const wanted = new URLSearchParams(search).get('preset')
  return presets.find(({ key }) => key === wanted)?.key
}

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

const seedBuffers = (preset: PlaygroundPreset): Record<InfoschematicFormat, string> => ({
  json: jsonSeed,
  typescript: typescriptSeed,
  yaml: yamlSeed,
  ...presets.find(({ key }) => key === preset)?.buffers
})

/**
 * Three independent buffers, one per document format, each validated and rendered live through `parseInfoschematic` -
 * the same loader the CLI uses. The TypeScript tab reads the strict document subset as data; nothing is executed.
 */
export function Playground({ preset = initialPreset() }: { preset?: PlaygroundPreset }) {
  const [active, setActive] = useState<InfoschematicFormat>(
    presets.find(({ key }) => key === preset)?.focus ?? 'typescript'
  )
  const [buffers, setBuffers] = useState<Record<InfoschematicFormat, string>>(() => seedBuffers(preset))
  const text = buffers[active]
  const parsed = usePlaygroundParse(text, active)

  const loadPreset = (key: PlaygroundPreset) => {
    const wanted = presets.find((entry) => entry.key === key)
    if (!wanted) return
    setBuffers((previous) => ({ ...previous, ...wanted.buffers }))
    setActive(wanted.focus)
  }

  return (
    <div className="document-shell document-shell--wide playground-shell">
      <SiteNav section="playground" />
      <main className="playground-main" id="document-content">
        <h1 className="sr-only">Playground</h1>
        <div className="playground-toolbar">
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
            Validated and rendered live; TypeScript is a strict subset read as data, never executed. Loading a preset
            replaces the buffer contents.
          </p>
        </div>
        <div className="playground-panels">
          <div className="playground-editor-pane">
            <textarea
              aria-label={`${formats.find((entry) => entry.format === active)?.label} document`}
              className="playground-editor"
              onChange={(event) => setBuffers((previous) => ({ ...previous, [active]: event.target.value }))}
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
