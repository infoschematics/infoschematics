import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import {
  artefactCapabilities,
  defineArtefactSelection,
  type ArtefactGeometry,
  type ArtefactSelection,
} from '@infoschematics/view-model/editable'
import { ArtefactControls, describeArtefactGeometry, type ArtefactControlsEditor } from './ArtefactControls.tsx'
import { createFactoryIdentityAllocator, type ArtefactFactoryContext } from './artefact-factories.ts'

const factoryContext: ArtefactFactoryContext = {
  allocate: createFactoryIdentityAllocator(),
  at: 0,
  box: { height: 120, width: 240, x: 40, y: 60 },
  lane: { height: 120, id: 'lane-one', y: 60 },
}

const editor = (
  selectedArtefact: ArtefactSelection | null,
  artefactGeometry?: ArtefactGeometry,
  overrides: Partial<ArtefactControlsEditor> = {},
): ArtefactControlsEditor => ({
  artefactCapabilities: selectedArtefact ? artefactCapabilities[selectedArtefact.kind] : undefined,
  artefactGeometry,
  artefactIssue: null,
  createArtefact: vi.fn() as unknown as ArtefactControlsEditor['createArtefact'],
  removeArtefact: vi.fn(),
  reorderArtefact: vi.fn(),
  replaceArtefactProperties: vi.fn(),
  selectedArtefact,
  ...overrides,
})

const matrix: readonly [ArtefactSelection, ArtefactGeometry, string][] = [
  [
    defineArtefactSelection({ code: null, geometry: 'lane', id: 'lane-one', kind: 'lane' }),
    { height: 120, role: 'lane', y: 60 },
    'Lane at y 60, height 120',
  ],
  [
    defineArtefactSelection({ code: null, geometry: 'zone', id: 'zone-one', kind: 'zone', laneId: 'lane-one' }),
    { laneId: 'lane-one', role: 'zone', width: 220, x: 50 },
    'Zone at x 50, width 220, in Lane lane-one',
  ],
  [
    defineArtefactSelection({ code: 'FAB-01', geometry: 'box', id: 'fabric-one', kind: 'fabric' }),
    { box: { height: 100, width: 180, x: 80, y: 90 }, role: 'box' },
    'Box at 80, 90; 180 × 100',
  ],
  [
    defineArtefactSelection({ code: 'CRD-01', geometry: 'box', id: 'card-one', kind: 'card' }),
    { box: { height: 80, width: 140, x: 120, y: 110 }, role: 'box' },
    'Box at 120, 110; 140 × 80',
  ],
  [
    defineArtefactSelection({ code: 'FLW-01', geometry: 'route', id: 'flow-one', kind: 'flow' }),
    { points: [{ x: 0, y: 0 }, { x: 100, y: 0 }], role: 'route' },
    'Orthogonal route with 2 points',
  ],
  [
    defineArtefactSelection({ code: null, geometry: 'box', id: 'graphic-one', kind: 'graphic' }),
    { box: { height: 60, width: 100, x: 200, y: 150 }, role: 'box' },
    'Box at 200, 150; 100 × 60',
  ],
]

describe('ArtefactControls', () => {
  it.each(matrix)('renders capability controls and type-appropriate geometry for $0.kind', (selection, geometry, summary) => {
    const html = renderToStaticMarkup(
      <ArtefactControls editor={editor(selection, geometry)} factoryContext={factoryContext} />,
    )

    expect(html).toContain(summary)
    expect(html).toContain(`aria-label="Edit ${selection.kind} properties"`)
    expect(html).toContain(`aria-label="Move ${selection.kind} earlier"`)
    expect(html).toContain(`aria-label="Move ${selection.kind} later"`)
    expect(html).toContain(`aria-label="Remove ${selection.kind}"`)
  })

  it('hides unsupported controls and reports a clear issue', () => {
    const selection = matrix[3]![0]
    const html = renderToStaticMarkup(
      <ArtefactControls
        editor={editor(selection, matrix[3]![1], {
          artefactCapabilities: {
            create: true,
            'edit-properties': false,
            move: false,
            remove: false,
            reorder: false,
            resize: false,
            select: true,
          },
          artefactIssue: 'Card is still referenced by a Flow.',
        })}
        factoryContext={factoryContext}
      />,
    )

    expect(html).not.toContain('Apply properties')
    expect(html).not.toContain('Move card earlier')
    expect(html).not.toContain('Remove card')
    expect(html).toContain('role="alert"')
    expect(html).toContain('Card is still referenced by a Flow.')
  })

  it('makes Zone creation unavailable without a Lane owner', () => {
    const html = renderToStaticMarkup(
      <ArtefactControls
        editor={editor(null)}
        factoryContext={{ ...factoryContext, lane: undefined }}
      />,
    )

    expect(html).toContain('aria-label="Create Zone" disabled=""')
    expect(html).toContain('Select a Lane, Zone, Fabric, Card, Flow, or Graphic')
  })
})

describe('geometry summaries', () => {
  it('states missing geometry without guessing', () => {
    expect(describeArtefactGeometry(undefined)).toBe('Geometry unavailable')
  })
})
