import {
  formatInfoschematicIssue,
  type InfoschematicParseResult,
  parseInfoschematic,
  serialiseInfoschematicYaml
} from '@infoschematics/domain-core'
import { blankInfoschematic } from '@infoschematics/is-blank'
import { homepageInfoschematic } from '@infoschematics/is-infoschematics'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { useEffect, useMemo, useState } from 'react'
import yamlSeed from './playground/seeds/format-parity.yaml?raw'
import mediaPipelineSeed from './playground/seeds/media-pipeline.yaml?raw'
import { SiteNav } from './SiteNav.tsx'
import './styles.css'

export type PlaygroundPreset = 'blank' | 'explained' | 'media-pipeline' | 'source-to-sink'

/** A preset replaces the YAML document while its own page remains a curated view. */
export const presets: readonly {
  key: PlaygroundPreset
  label: string
  document: string
}[] = [
  {
    key: 'source-to-sink',
    label: 'Source to sink',
    document: yamlSeed
  },
  {
    key: 'media-pipeline',
    label: 'Live media pipeline',
    document: mediaPipelineSeed
  },
  {
    key: 'explained',
    label: 'An Infoschematic explained',
    document: serialiseInfoschematicYaml(homepageInfoschematic)
  },
  { key: 'blank', label: 'Blank Infoschematic', document: serialiseInfoschematicYaml(blankInfoschematic) }
]

const legacyPresetAliases: Readonly<Record<string, PlaygroundPreset>> = {
  'format-parity': 'source-to-sink',
  infoschematics: 'explained',
  system: 'explained'
}

/** The preset a `?preset=` query names, or `undefined` for anything it does not. */
export const presetFromSearch = (search: string): PlaygroundPreset | undefined => {
  const wanted = new URLSearchParams(search).get('preset')
  return presets.find(({ key }) => key === wanted)?.key ?? (wanted ? legacyPresetAliases[wanted] : undefined)
}

export const documentForPreset = (key: PlaygroundPreset) =>
  presets.find((entry) => entry.key === key)?.document ?? yamlSeed

export async function copyPlaygroundDocument(
  text: string,
  clipboard: Pick<Clipboard, 'writeText'> | undefined = typeof navigator === 'undefined'
    ? undefined
    : navigator.clipboard
) {
  if (!clipboard?.writeText) throw new Error('Clipboard access is unavailable.')
  await clipboard.writeText(text)
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
  (typeof window === 'undefined' ? undefined : presetFromSearch(window.location.search)) ?? 'source-to-sink'

/** One inert Infoschematic document, validated and rendered live through the same loader the CLI uses. */
export function Playground({ preset = initialPreset() }: { preset?: PlaygroundPreset }) {
  const [selectedPreset, setSelectedPreset] = useState(preset)
  const [text, setText] = useState(() => documentForPreset(preset))
  const [copyFeedback, setCopyFeedback] = useState('')
  const parsed = usePlaygroundParse(text)
  const presetDocument = documentForPreset(selectedPreset)
  const dirty = text !== presetDocument

  const loadPreset = (key: PlaygroundPreset) => {
    setSelectedPreset(key)
    setText(documentForPreset(key))
    setCopyFeedback('')

    if (typeof window !== 'undefined') {
      const location = new URL(window.location.href)
      location.searchParams.set('preset', key)
      window.history.replaceState(null, '', `${location.pathname}${location.search}${location.hash}`)
    }
  }

  const editDocument = (value: string) => {
    setText(value)
    setCopyFeedback('')
  }

  const resetDocument = () => {
    setText(presetDocument)
    setCopyFeedback('Preset restored.')
  }

  const copyDocument = async () => {
    try {
      await copyPlaygroundDocument(text)
      setCopyFeedback('YAML copied.')
    } catch {
      setCopyFeedback('Could not copy YAML. Select the document and copy it manually.')
    }
  }

  return (
    <div className="document-shell document-shell--wide playground-shell">
      <SiteNav section="playground" />
      <main className="playground-main" id="document-content">
        <h1 className="sr-only">Playground</h1>
        <div className="playground-panels">
          <Preview parsed={parsed} />
          <div className="playground-editor-pane">
            <div className="playground-toolbar">
              <label className="playground-preset">
                Preset
                <select onChange={(event) => loadPreset(event.target.value as PlaygroundPreset)} value={selectedPreset}>
                  {presets.map(({ key, label }) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <span className="playground-document-state" data-state={dirty ? 'edited' : 'preset'}>
                {dirty ? 'Edited' : 'Preset loaded'}
              </span>
              <div className="playground-actions">
                <button disabled={!dirty} onClick={resetDocument} type="button">
                  Reset preset
                </button>
                <button onClick={copyDocument} type="button">
                  Copy YAML
                </button>
              </div>
            </div>
            <textarea
              aria-label="Infoschematic document"
              className="playground-editor"
              onChange={(event) => editDocument(event.target.value)}
              spellCheck={false}
              value={text}
            />
            <p aria-live="polite" className="playground-action-feedback">
              {copyFeedback}
            </p>
            <Issues parsed={parsed} />
          </div>
        </div>
      </main>
    </div>
  )
}
