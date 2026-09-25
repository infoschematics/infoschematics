import { defineInfoschematicModel } from '@infoschematics/domain-core'

/**
 * A small document with enough named parts to be linked into.
 *
 * Authored here rather than borrowed from the visual guide because the demonstration needs two things that specimen
 * has no reason to carry: Architectural Scopes, so an address can name a group as well as a part, and an authored
 * Dynamic over the part the guide links to, so a reader can see for themselves that arriving does not start it.
 */
export const destinationSpecimen = defineInfoschematicModel({
  id: 'destination-example',
  title: 'Intake pipeline',
  subtitle: 'Every part of it has a name you can link to.',
  diagram: {
    bounds: { height: 320, width: 760, x: 0, y: 0 },
    gridSize: 10,
    appearance: {
      style: 'blueprint',
      grid: 'major-plus-minor',
      card: { compact: false, description: true, identity: true, stereotype: false }
    },
    regions: [{ id: 'PIPELINE', label: 'Pipeline', bounds: { height: 180, width: 520, x: 180, y: 70 } }],
    collections: [
      {
        id: 'stage',
        label: 'Pipeline stage',
        description: 'A place records stop on their way through.',
        appearance: { color: '#58a6ff', fill: '#0d1b2a' }
      }
    ],
    families: [{ id: 'records', label: 'Records', description: 'Records moving through the pipeline' }],
    cards: [
      {
        id: 'INTAKE',
        collection: 'stage',
        label: 'Intake',
        description: 'Accepts what arrives',
        bounds: { height: 100, width: 180, x: 210, y: 110 },
        ports: { east: 1, west: 1 }
      },
      {
        id: 'STORE',
        collection: 'stage',
        label: 'Store',
        description: 'Keeps what was accepted',
        bounds: { height: 100, width: 180, x: 470, y: 110 },
        ports: { west: 1 }
      }
    ],
    points: [{ id: 'CLIENT', label: 'Client', at: { x: 80, y: 160 }, ports: { east: 1 } }],
    flows: [
      {
        id: 'SUBMIT',
        family: 'records',
        source: { element: 'CLIENT', port: 'E1' },
        target: { element: 'INTAKE', port: 'W1' }
      },
      {
        id: 'KEEP',
        family: 'records',
        source: { element: 'INTAKE', port: 'E1' },
        target: { element: 'STORE', port: 'W1' }
      }
    ],
    dynamics: [{ id: 'store-is-live', label: 'The store is live', kind: 'emphasise-elements', elements: ['STORE'] }]
  },
  scopes: [
    { id: 'edge', label: 'Edge', description: 'What the outside world touches', elements: ['CLIENT', 'INTAKE'] },
    { id: 'inside', label: 'Inside', description: 'What the pipeline keeps', elements: ['INTAKE', 'STORE'] }
  ]
})
