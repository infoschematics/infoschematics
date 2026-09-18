import {
  formatInfoschematicIssue,
  type InfoschematicDocument,
  infoschematicDocumentSource,
  parseInfoschematicDocument,
  serialiseInfoschematicYaml
} from '@infoschematics/domain-core'
import { blankInfoschematic } from '@infoschematics/is-blank'
import { homepageInfoschematic } from '@infoschematics/is-infoschematics'
import { showcaseExample } from '@infoschematics/is-showcase'
import { Studio, type StudioDocumentChange, type StudioDocumentReplacement } from '@infoschematics/view-studio'
import '@infoschematics/view-studio/styles.css'
import { useState } from 'react'
import mediaPipelineSeed from './playground/seeds/media-pipeline.yaml?raw'
import { SiteNav } from './SiteNav.tsx'
import './styles.css'

export type PlaygroundPreset = 'blank' | 'explained' | 'media-pipeline' | 'showcase'

/*
 * A preset replaces the authored document while its route remains Site-owned. They are listed in the order they are
 * offered: the Benchmark first, because the document that carries every capability is the one worth opening first.
 */
export const presets: readonly {
  key: PlaygroundPreset
  label: string
  document: string
}[] = [
  {
    key: 'showcase',
    label: 'Benchmark',
    document: serialiseInfoschematicYaml(showcaseExample)
  },
  {
    key: 'blank',
    label: 'Blank',
    document: serialiseInfoschematicYaml(blankInfoschematic)
  },
  {
    key: 'explained',
    label: 'Explained',
    document: serialiseInfoschematicYaml(homepageInfoschematic)
  },
  {
    key: 'media-pipeline',
    label: 'Pipeline',
    document: mediaPipelineSeed
  }
]

/* Retired preset keys land on the Benchmark rather than on nothing, so a link written before this still opens a document. */
const legacyPresetAliases: Readonly<Record<string, PlaygroundPreset>> = {
  'format-parity': 'showcase',
  'source-to-sink': 'showcase',
  infoschematics: 'explained',
  system: 'explained'
}

/** The preset a `?preset=` query names, or `undefined` for anything it does not. */
export const presetFromSearch = (search: string): PlaygroundPreset | undefined => {
  const wanted = new URLSearchParams(search).get('preset')
  return presets.find(({ key }) => key === wanted)?.key ?? (wanted ? legacyPresetAliases[wanted] : undefined)
}

export const documentForPreset = (key: PlaygroundPreset) =>
  presets.find((entry) => entry.key === key)?.document ?? presets[0].document

/** Curated preset sources cross into Studio as validated, source-retaining documents. */
export function authoredDocumentForPreset(key: PlaygroundPreset): InfoschematicDocument {
  const parsed = parseInfoschematicDocument(documentForPreset(key), {
    pathname: `playground/${key}.yaml`
  })
  if (parsed.ok) return parsed.document

  throw new Error(parsed.issues.map(formatInfoschematicIssue).join('\n'))
}

const initialPreset = (): PlaygroundPreset =>
  (typeof window === 'undefined' ? undefined : presetFromSearch(window.location.search)) ?? 'showcase'

/** Site owns preset routing and reset; Studio owns every authoring interaction. */
export function Playground({ preset = initialPreset() }: { preset?: PlaygroundPreset }) {
  const [selectedPreset, setSelectedPreset] = useState(preset)
  const [document, setDocument] = useState(() => authoredDocumentForPreset(preset))
  const [studioSession, setStudioSession] = useState(0)
  const presetSource = documentForPreset(selectedPreset)
  const dirty = infoschematicDocumentSource(document) !== presetSource

  const loadPreset = (key: PlaygroundPreset) => {
    setSelectedPreset(key)
    setDocument(authoredDocumentForPreset(key))
    setStudioSession((current) => current + 1)

    if (typeof window !== 'undefined') {
      const location = new URL(window.location.href)
      location.searchParams.set('preset', key)
      window.history.replaceState(null, '', `${location.pathname}${location.search}${location.hash}`)
    }
  }

  const resetDocument = () => {
    setDocument(authoredDocumentForPreset(selectedPreset))
    setStudioSession((current) => current + 1)
  }

  const acceptDocument = (change: StudioDocumentChange | StudioDocumentReplacement) => {
    setDocument(change.document)
  }

  return (
    <div className="document-shell document-shell--wide playground-shell">
      <SiteNav section="playground" />
      <div className="playground-main" id="document-content">
        <fieldset className="playground-toolbar">
          <legend className="sr-only">Playground controls</legend>
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
          <p className="playground-guidance">
            Use Design to shape it and Source to edit, validate, undo, or copy YAML.
          </p>
          <div className="playground-actions">
            <button disabled={!dirty} onClick={resetDocument} type="button">
              Reset preset
            </button>
          </div>
        </fieldset>
        <div className="playground-studio">
          <Studio
            document={document}
            key={`${selectedPreset}-${studioSession}`}
            onDocumentChange={acceptDocument}
            onDocumentReplace={acceptDocument}
            responsiveCardDetails
          />
        </div>
      </div>
    </div>
  )
}
