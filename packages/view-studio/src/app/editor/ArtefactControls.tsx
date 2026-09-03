import { useEffect, useState } from 'react'
import type {
  ArtefactCapabilities,
  ArtefactGeometry,
  ArtefactKind,
  ArtefactSelection,
  ArtefactValueByKind,
} from '@infoschematics/view-model/editable'
import {
  createDefaultArtefact,
  type ArtefactFactoryContext,
  type FactoryCreateOperation,
  type FactoryKind,
} from './artefact-factories.ts'
import { LibraryPanel } from './LibraryPanel.tsx'
import type { LibraryContext, LibraryCreateOperation } from './library.ts'

type Serialisable = boolean | number | string | null | readonly Serialisable[] | { readonly [key: string]: Serialisable }
export type ArtefactPropertyPatch = Readonly<Record<string, Serialisable>>

export type ArtefactControlsEditor = Readonly<{
  artefactCapabilities?: ArtefactCapabilities
  artefactGeometry?: ArtefactGeometry
  artefactIssue?: string | null
  createArtefact: <K extends ArtefactKind>(
    kind: K,
    value: ArtefactValueByKind[K],
    index: number,
    ownerId?: string,
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
    case 'lane':
      return `Lane at y ${geometry.y}, height ${geometry.height}`
    case 'zone':
      return `Zone at x ${geometry.x}, width ${geometry.width}, in Lane ${geometry.laneId}`
    case 'box':
      return `Box at ${geometry.box.x}, ${geometry.box.y}; ${geometry.box.width} × ${geometry.box.height}`
    case 'route':
      return `Orthogonal route with ${geometry.points.length} points`
  }
}

const submitOperation = (
  editor: ArtefactControlsEditor,
  operation: FactoryCreateOperation | LibraryCreateOperation | undefined,
) => {
  if (!operation) return
  switch (operation.target.kind) {
    case 'lane':
      editor.createArtefact('lane', operation.value as ArtefactValueByKind['lane'], operation.at)
      break
    case 'zone':
      editor.createArtefact('zone', operation.value as ArtefactValueByKind['zone'], operation.at, operation.target.laneId)
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
      <div aria-label="Create structural artefact" role="group">
        <button aria-label="Create Lane" onClick={() => create('lane')} type="button">
          Lane
        </button>
        <button
          aria-label="Create Zone"
          disabled={!factoryContext.lane}
          onClick={() => create('zone')}
          title={factoryContext.lane ? 'Create Zone in the current Lane' : 'Select a Lane before creating a Zone'}
          type="button"
        >
          Zone
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
            <div aria-label={`Reorder ${selected.kind}`} role="group">
              <button aria-label={`Move ${selected.kind} earlier`} onClick={() => editor.reorderArtefact(-1)} type="button">
                Earlier
              </button>
              <button aria-label={`Move ${selected.kind} later`} onClick={() => editor.reorderArtefact(1)} type="button">
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
        <p>Select a Lane, Zone, Fabric, Card, Flow, or Graphic to edit it.</p>
      )}

      {editor.artefactIssue ? <p role="alert">{editor.artefactIssue}</p> : null}
      {propertyIssue ? <p role="alert">{propertyIssue}</p> : null}
    </section>
  )
}
