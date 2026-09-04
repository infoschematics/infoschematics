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

type Serialisable =
  | boolean
  | number
  | string
  | null
  | readonly Serialisable[]
  | { readonly [key: string]: Serialisable }
export type ArtefactPropertyPatch = Readonly<Record<string, Serialisable>>

export type ArtefactControlsEditor = Readonly<{
  artefactCapabilities?: ArtefactCapabilities
  artefactGeometry?: ArtefactGeometry
  artefactIssue?: string | null
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
      <h3>Create</h3>
      {/* biome-ignore lint/a11y/useSemanticElements: a toolbar-style button group, not a form control group; fieldset default chrome does not fit. */}
      <div aria-label="Create structural artefact" role="group">
        <button aria-label="Create Region" onClick={() => create('region')} type="button">
          Region
        </button>
        <button aria-label="Create Graphic" onClick={() => create('graphic')} type="button">
          Graphic
        </button>
      </div>

      {libraryContext ? (
        <LibraryPanel context={libraryContext} onInstantiate={(operation) => submitOperation(editor, operation)} />
      ) : null}

      <h3>Selection</h3>
      {selected ? (
        <div key={`${selected.kind}:${selected.id}`}>
          <p>
            <strong>{selected.kind}</strong> {selected.code ?? selected.id}
          </p>
          {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: labels the summary for assistive tech; the visible text alone is ambiguous without it. */}
          <p aria-label="Geometry summary">{describeArtefactGeometry(editor.artefactGeometry)}</p>

          {capabilities?.['edit-properties'] ? (
            <fieldset>
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
              <button onClick={applyProperties} type="button">
                Apply properties
              </button>
            </fieldset>
          ) : null}

          {capabilities?.reorder ? (
            // biome-ignore lint/a11y/useSemanticElements: a toolbar-style button group, not a form control group; fieldset default chrome does not fit.
            <div aria-label={`Reorder ${selected.kind}`} role="group">
              <button
                aria-label={`Move ${selected.kind} earlier`}
                onClick={() => editor.reorderArtefact(-1)}
                type="button"
              >
                Earlier
              </button>
              <button
                aria-label={`Move ${selected.kind} later`}
                onClick={() => editor.reorderArtefact(1)}
                type="button"
              >
                Later
              </button>
            </div>
          ) : null}

          {capabilities?.remove ? (
            <button aria-label={`Remove ${selected.kind}`} onClick={() => editor.removeArtefact()} type="button">
              Remove
            </button>
          ) : null}
        </div>
      ) : (
        <p>Select a Region, Fabric, Card, Flow, or Graphic to edit it.</p>
      )}

      {editor.artefactIssue ? <p role="alert">{editor.artefactIssue}</p> : null}
      {propertyIssue ? <p role="alert">{propertyIssue}</p> : null}
    </section>
  )
}
