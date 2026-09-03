import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { defineInfoschematic } from '@infoschematics/domain-core'
import { InfoschematicContext } from '@infoschematics/view-canvas'
import {
  artefactCapabilities,
  defineArtefactSelection,
} from '@infoschematics/view-model/editable'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import {
  artefactControlsEditorFor,
  DesignDetails,
  type DetailsPanelEditor,
  detailsArtefactContexts,
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
          ports: { east: 1, north: 0, south: 0, west: 0 },
        },
        scope: 'inside',
        scopes: ['inside'],
      },
    ],
    fabrics: [
      {
        code: 'FAB-01',
        detail: 'Fabric',
        id: 'fabric-one',
        label: 'Fabric',
        placement: {
          box: { height: 120, width: 220, x: 360, y: 60 },
          ports: { east: 0, north: 0, south: 0, west: 1 },
        },
        scope: 'inside',
        scopes: ['inside'],
      },
    ],
    flowFamilies: [
      {
        color: '#123',
        description: 'Requests',
        id: 'request',
        label: 'Request',
        prefix: 'REQ',
      },
    ],
    lanes: [
      {
        height: 160,
        id: 'lane-one',
        label: 'Lane',
        labelY: 28,
        panel: { height: 160, radius: 8, width: 640, x: 0, y: 0 },
        y: 0,
        zones: [],
      },
    ],
    scopes: [
      {
        color: '#123',
        description: 'Inside',
        fill: '#eee',
        id: 'inside',
        label: 'Inside',
        prefix: 'IN',
      },
    ],
    viewBox: { height: 480, width: 720, x: 0, y: 0 },
  },
})

const card = defineArtefactSelection({
  code: 'CARD-01',
  geometry: 'box' as const,
  id: 'card-one',
  kind: 'card' as const,
})
const lane = defineArtefactSelection({
  code: null,
  geometry: 'lane' as const,
  id: 'lane-one',
  kind: 'lane' as const,
})
const graphic = defineArtefactSelection({
  code: null,
  geometry: 'box' as const,
  id: 'graphic-one',
  kind: 'graphic' as const,
})

const editor = (
  overrides: Partial<DetailsPanelEditor> = {},
): DetailsPanelEditor => ({
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
  ...overrides,
})

describe('DetailsPanel typed Design controls', () => {
  it('offers a Flow template only from a selected placeable with a valid counterpart port', () => {
    const selected = editor({
      artefactCapabilities: artefactCapabilities.card,
      artefactGeometry: {
        box: config.infoschematic.cards[0]!.placement.box,
        role: 'box',
      },
      artefactValue: config.infoschematic.cards[0],
      selectedArtefact: card,
    })
    const contexts = detailsArtefactContexts(config, selected)

    expect(contexts.library.flow).toMatchObject({
      family: 'request',
      source: { component: 'card-one', port: 'E1' },
      target: { component: 'fabric-one', port: 'W1' },
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
            ports: { east: 0, north: 0, south: 0, west: 0 },
          },
        })),
      },
    }
    const selected = editor({
      artefactCapabilities: artefactCapabilities.card,
      artefactValue: config.infoschematic.cards[0],
      selectedArtefact: card,
    })

    expect(detailsArtefactContexts(withoutTargetPorts, selected).library.flow).toBeUndefined()
  })

  it('keeps structural and Card/Fabric creation reachable while invalid Flow creation is absent', () => {
    const selected = editor({
      artefactCapabilities: artefactCapabilities.graphic,
      artefactIssue: 'Graphic graphic-one is referenced by a Story',
      selectedArtefact: graphic,
    })
    const contexts = detailsArtefactContexts(config, selected)
    const html = renderToStaticMarkup(
      <InfoschematicContext.Provider value={createInfoschematicRuntime(config)}>
        <DesignDetails contexts={contexts} editor={selected} />
      </InfoschematicContext.Provider>,
    )

    expect(html).toContain('aria-label="Create Lane"')
    expect(html).toContain('aria-label="Create Graphic"')
    expect(html).toContain('aria-label="Create Zone" disabled=""')
    expect(html).toContain('aria-label="Add Service card"')
    expect(html).toContain('aria-label="Add Platform fabric"')
    expect(html).not.toContain('aria-label="Add Directed flow"')
    expect(html).toContain('Graphic graphic-one is referenced by a Story')
    expect(html).toContain('PROPERTIES')
  })

  it('enables Zone creation for a selected Lane and adapts property patches by kind', () => {
    const replaceArtefactProperties = vi.fn()
    const selected = editor({
      artefactCapabilities: artefactCapabilities.lane,
      artefactGeometry: { height: 160, role: 'lane', y: 0 },
      artefactValue: config.infoschematic.lanes[0],
      replaceArtefactProperties,
      selectedArtefact: lane,
    })
    const contexts = detailsArtefactContexts(config, selected)
    const html = renderToStaticMarkup(
      <InfoschematicContext.Provider value={createInfoschematicRuntime(config)}>
        <DesignDetails contexts={contexts} editor={selected} />
      </InfoschematicContext.Provider>,
    )

    expect(contexts.factory.lane).toEqual({
      height: 160,
      id: 'lane-one',
      y: 0,
    })
    expect(html).toContain('aria-label="Create Zone"')
    expect(html).not.toContain('aria-label="Create Zone" disabled=""')
    artefactControlsEditorFor(selected).replaceArtefactProperties({
      label: 'Renamed lane',
    })
    expect(replaceArtefactProperties).toHaveBeenCalledWith({
      kind: 'lane',
      value: { label: 'Renamed lane' },
    })
  })
})
