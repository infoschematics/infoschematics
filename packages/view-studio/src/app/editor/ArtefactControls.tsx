import type { RegionConfig } from '@infoschematics/domain-model/region'
import type {
  ArtefactCapabilities,
  ArtefactGeometry,
  ArtefactKind,
  ArtefactSelection,
  ArtefactValueByKind
} from '@infoschematics/view-model/editable'
import { useEffect, useState } from 'react'
import {
  type ArtefactFactoryContext,
  createDefaultArtefact,
  type FactoryCreateOperation,
  type FactoryKind
} from './artefact-factories.ts'
import { LibraryPanel } from './LibraryPanel.tsx'
import type { LibraryContext, LibraryCreateOperation } from './library.ts'
import { RegionTreatments } from './RegionTreatments.tsx'

// A patch states members, so `undefined` belongs to its shape; parsed JSON never carries one.
type Serialisable =
  | boolean
  | number
  | string
  | null
  | undefined
  | readonly Serialisable[]
  | { readonly [key: string]: Serialisable }
export type ArtefactPropertyPatch = Readonly<Record<string, Serialisable>>

export type ArtefactControlsEditor = Readonly<{
  artefactCapabilities?: ArtefactCapabilities
  artefactGeometry?: ArtefactGeometry
  artefactIssue?: string | null
  /** The selected artefact as the draft currently states it, which the typed controls show. */
  artefactValue?: ArtefactValueByKind[ArtefactKind]
  createArtefact: <K extends ArtefactKind>(
    kind: K,
    value: ArtefactValueByKind[K],
    index: number
  ) => ArtefactSelection | undefined
  removeArtefact: () => string | undefined
  reorderArtefact: (direction: -1 | 1) => void
  replaceArtefactProperties: (properties: ArtefactPropertyPatch) => void
  selectedArtefact: ArtefactSelection | null
}>

export type ArtefactControlsProps = Readonly<{
  editor: ArtefactControlsEditor
  factoryContext: ArtefactFactoryContext
  libraryContext?: LibraryContext
}>

export const describeArtefactGeometry = (geometry: ArtefactGeometry | undefined): string => {
  if (!geometry) return 'Geometry unavailable'
  switch (geometry.role) {
    case 'box':
      return `Box at ${geometry.box.x}, ${geometry.box.y}; ${geometry.box.width} × ${geometry.box.height}`
    case 'route':
      return `Orthogonal route with ${geometry.points.length} points`
  }
}

const submitOperation = (
  editor: ArtefactControlsEditor,
  operation: FactoryCreateOperation | LibraryCreateOperation | undefined
) => {
  if (!operation) return
  switch (operation.target.kind) {
    case 'region':
      editor.createArtefact('region', operation.value as ArtefactValueByKind['region'], operation.at)
      break
    case 'graphic':
      editor.createArtefact('graphic', operation.value as ArtefactValueByKind['graphic'], operation.at)
      break
    case 'card':
      editor.createArtefact('card', operation.value as ArtefactValueByKind['card'], operation.at)
      break
    case 'fabric':
      editor.createArtefact('fabric', operation.value as ArtefactValueByKind['fabric'], operation.at)
      break
    case 'flow':
      editor.createArtefact('flow', operation.value as ArtefactValueByKind['flow'], operation.at)
      break
  }
}

export function ArtefactControls({ editor, factoryContext, libraryContext }: ArtefactControlsProps) {
  const [properties, setProperties] = useState('{}')
  const [propertyIssue, setPropertyIssue] = useState<string | null>(null)
  const selected = editor.selectedArtefact
  const capabilities = editor.artefactCapabilities
  // biome-ignore lint/correctness/useExhaustiveDependencies: pre-existing dependency shape kept as-is; TOOL-015 is toolchain-only and does not change effect/callback behaviour.
  useEffect(() => {
    setProperties('{}')
    setPropertyIssue(null)
  }, [selected?.id, selected?.kind])
  const region = selected?.kind === 'region' ? (editor.artefactValue as RegionConfig | undefined) : undefined
  const create = (kind: FactoryKind) => submitOperation(editor, createDefaultArtefact(kind, factoryContext))
  const applyProperties = () => {
    try {
      const parsed = JSON.parse(properties) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setPropertyIssue('Properties must be a JSON object.')
        return
      }
      editor.replaceArtefactProperties(parsed as ArtefactPropertyPatch)
      setPropertyIssue(null)
    } catch {
      setPropertyIssue('Properties must be valid JSON.')
    }
  }

  return (
    <section aria-label="Design controls" className="artefact-controls">
      <p className="eyebrow pane-heading">CREATE</p>
      {/* biome-ignore lint/a11y/useSemanticElements: a toolbar-style button group, not a form control group; fieldset default chrome does not fit. */}
      <div aria-label="Create structural artefact" className="artefact-actions" role="group">
        <button aria-label="Create Region" className="action-button" onClick={() => create('region')} type="button">
          Region
        </button>
        <button aria-label="Create Graphic" className="action-button" onClick={() => create('graphic')} type="button">
          Graphic
        </button>
      </div>

      {libraryContext ? (
        <LibraryPanel context={libraryContext} onInstantiate={(operation) => submitOperation(editor, operation)} />
      ) : null}

      <p className="eyebrow pane-heading">SELECTION</p>
      {selected ? (
        <div className="artefact-selection" key={`${selected.kind}:${selected.id}`}>
          <p className="artefact-identity">
            <strong>{selected.kind}</strong> {selected.code ?? selected.id}
          </p>
          {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: labels the summary for assistive tech; the visible text alone is ambiguous without it. */}
          <p aria-label="Geometry summary" className="artefact-geometry">
            {describeArtefactGeometry(editor.artefactGeometry)}
          </p>

          {capabilities?.['edit-properties'] && region ? (
            <RegionTreatments onPatch={editor.replaceArtefactProperties} region={region} />
          ) : null}

          {capabilities?.['edit-properties'] ? (
            <fieldset className="artefact-properties">
              <legend>Serialisable properties</legend>
              <label>
                JSON properties
                <textarea
                  aria-label={`Edit ${selected.kind} properties`}
                  onChange={(event) => setProperties(event.target.value)}
                  rows={4}
                  value={properties}
                />
              </label>
              <button className="action-button" onClick={applyProperties} type="button">
                Apply properties
              </button>
            </fieldset>
          ) : null}

          {capabilities?.reorder ? (
            // biome-ignore lint/a11y/useSemanticElements: a toolbar-style button group, not a form control group; fieldset default chrome does not fit.
            <div aria-label={`Reorder ${selected.kind}`} className="artefact-actions" role="group">
              <button
                aria-label={`Move ${selected.kind} earlier`}
                className="action-button"
                onClick={() => editor.reorderArtefact(-1)}
                type="button"
              >
                Earlier
              </button>
              <button
                aria-label={`Move ${selected.kind} later`}
                className="action-button"
                onClick={() => editor.reorderArtefact(1)}
                type="button"
              >
                Later
              </button>
            </div>
          ) : null}

          {capabilities?.remove ? (
            <button
              aria-label={`Remove ${selected.kind}`}
              className="action-button"
              onClick={() => editor.removeArtefact()}
              type="button"
            >
              Remove
            </button>
          ) : null}
        </div>
      ) : (
        <p className="contract-empty">Select a Region, Fabric, Card, Flow, or Graphic to edit it.</p>
      )}

      {editor.artefactIssue ? (
        <p className="artefact-alert" role="alert">
          {editor.artefactIssue}
        </p>
      ) : null}
      {propertyIssue ? (
        <p className="artefact-alert" role="alert">
          {propertyIssue}
        </p>
      ) : null}
    </section>
  )
}
