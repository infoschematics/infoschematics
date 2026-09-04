import { defineInfoschematic } from '@infoschematics/domain-core'
import { InfoschematicContext } from '@infoschematics/view-canvas'
import { artefactCapabilities, defineArtefactSelection } from '@infoschematics/view-model/editable'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import {
  artefactControlsEditorFor,
  DesignDetails,
  type DetailsPanelEditor,
  detailsArtefactContexts
} from './DetailsPanel.tsx'

const config = defineInfoschematic({
  title: 'Details controls',
  infoschematic: {
    cards: [
      {
        code: 'CARD-01',
        detail: 'Card',
        id: 'card-one',
        label: 'Card',
        placement: {
          box: { height: 80, width: 140, x: 40, y: 60 },
          ports: { east: 1, north: 0, south: 0, west: 0 }
        },
        scope: 'inside',
        scopes: ['inside']
      }
    ],
    fabrics: [
      {
        code: 'FAB-01',
        detail: 'Fabric',
        id: 'fabric-one',
        label: 'Fabric',
        placement: {
          box: { height: 120, width: 220, x: 360, y: 60 },
          ports: { east: 0, north: 0, south: 0, west: 1 }
        },
        scope: 'inside',
        scopes: ['inside']
      }
    ],
    flowFamilies: [
      {
        color: '#123',
        description: 'Requests',
        id: 'request',
        label: 'Request',
        prefix: 'REQ'
      }
    ],
    regions: [
      {
        box: { height: 160, radius: 8, width: 640, x: 0, y: 0 },
        frame: { style: 'solid' },
        id: 'region-one',
        label: 'Region'
      }
    ],
    scopes: [
      {
        color: '#123',
        description: 'Inside',
        fill: '#eee',
        id: 'inside',
        label: 'Inside',
        prefix: 'IN'
      }
    ],
    viewBox: { height: 480, width: 720, x: 0, y: 0 }
  }
})

const card = defineArtefactSelection({
  code: 'CARD-01',
  geometry: 'box' as const,
  id: 'card-one',
  kind: 'card' as const
})
const region = defineArtefactSelection({
  code: null,
  geometry: 'box' as const,
  id: 'region-one',
  kind: 'region' as const
})
const graphic = defineArtefactSelection({
  code: null,
  geometry: 'box' as const,
  id: 'graphic-one',
  kind: 'graphic' as const
})

const editor = (overrides: Partial<DetailsPanelEditor> = {}): DetailsPanelEditor => ({
  artefactCapabilities: undefined,
  artefactGeometry: undefined,
  artefactIssue: null,
  artefactOperations: [],
  artefactValue: undefined,
  canRedo: false,
  canRoute: false,
  canUndo: false,
  canWrap: false,
  changeCount: 0,
  createArtefact: vi.fn() as unknown as DetailsPanelEditor['createArtefact'],
  discard: vi.fn(),
  discardOne: vi.fn(),
  hover: vi.fn(),
  hovered: null,
  identity: undefined,
  mode: 'design',
  pending: [],
  placeAt: vi.fn(),
  placement: undefined,
  redo: vi.fn(),
  removeArtefact: vi.fn(),
  reorderArtefact: vi.fn(),
  replaceArtefactProperties: vi.fn(),
  retext: vi.fn(),
  select: vi.fn(),
  selected: null,
  selectedArtefact: null,
  selectedComponent: null,
  selectedCounts: {},
  setEditing: vi.fn(),
  setMode: vi.fn(),
  setPortCount: vi.fn(),
  source: '',
  text: {},
  toggleView: vi.fn(),
  undo: vi.fn(),
  view: { grid: true, snapping: true },
  ...overrides
})

describe('DetailsPanel typed Design controls', () => {
  it('offers a Flow template only from a selected placeable with a valid counterpart port', () => {
    const selected = editor({
      artefactCapabilities: artefactCapabilities.card,
      artefactGeometry: {
        box: config.infoschematic.cards[0]!.placement.box,
        role: 'box'
      },
      artefactValue: config.infoschematic.cards[0],
      selectedArtefact: card
    })
    const contexts = detailsArtefactContexts(config, selected)

    expect(contexts.library.flow).toMatchObject({
      family: 'request',
      source: { component: 'card-one', port: 'E1' },
      target: { component: 'fabric-one', port: 'W1' }
    })
  })

  it('withholds Flow context when the available counterpart has no ports', () => {
    const withoutTargetPorts = {
      ...config,
      infoschematic: {
        ...config.infoschematic,
        fabrics: config.infoschematic.fabrics.map((fabric) => ({
          ...fabric,
          placement: {
            ...fabric.placement,
            ports: { east: 0, north: 0, south: 0, west: 0 }
          }
        }))
      }
    }
    const selected = editor({
      artefactCapabilities: artefactCapabilities.card,
      artefactValue: config.infoschematic.cards[0],
      selectedArtefact: card
    })

    expect(detailsArtefactContexts(withoutTargetPorts, selected).library.flow).toBeUndefined()
  })

  it('keeps structural and Card/Fabric creation reachable while invalid Flow creation is absent', () => {
    const selected = editor({
      artefactCapabilities: artefactCapabilities.graphic,
      artefactIssue: 'Graphic graphic-one is referenced by a Story',
      selectedArtefact: graphic
    })
    const contexts = detailsArtefactContexts(config, selected)
    const html = renderToStaticMarkup(
      <InfoschematicContext.Provider value={createInfoschematicRuntime(config)}>
        <DesignDetails contexts={contexts} editor={selected} />
      </InfoschematicContext.Provider>
    )

    expect(html).toContain('aria-label="Create Region"')
    expect(html).toContain('aria-label="Create Graphic"')
    expect(html).toContain('aria-label="Add Service card"')
    expect(html).toContain('aria-label="Add Platform fabric"')
    expect(html).not.toContain('aria-label="Add Directed flow"')
    expect(html).toContain('Graphic graphic-one is referenced by a Story')
    expect(html).toContain('PROPERTIES')
  })

  it('adapts property patches to the selected Region', () => {
    const replaceArtefactProperties = vi.fn()
    const selected = editor({
      artefactCapabilities: artefactCapabilities.region,
      artefactGeometry: { box: { height: 160, width: 640, x: 0, y: 0 }, role: 'box' },
      artefactValue: config.infoschematic.regions[0],
      replaceArtefactProperties,
      selectedArtefact: region
    })
    const contexts = detailsArtefactContexts(config, selected)
    const html = renderToStaticMarkup(
      <InfoschematicContext.Provider value={createInfoschematicRuntime(config)}>
        <DesignDetails contexts={contexts} editor={selected} />
      </InfoschematicContext.Provider>
    )

    expect(html).toContain('aria-label="Create Region"')
    artefactControlsEditorFor(selected).replaceArtefactProperties({
      label: 'Renamed region'
    })
    expect(replaceArtefactProperties).toHaveBeenCalledWith({
      kind: 'region',
      value: { label: 'Renamed region' }
    })
  })
})
