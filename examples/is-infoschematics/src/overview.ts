import { defineInfoschematicModel } from '@infoschematics/domain-core'

export const homepageInfoschematic = defineInfoschematicModel({
  description:
    'Structure and presentation material combine in one Infoschematic, which can be rendered as static output or presented as a live, interactive view.',
  diagram: {
    appearance: {
      surface: 'blueprint',
      grid: 'major-plus-minor',
      card: { compact: false, identity: true, stereotype: true, description: true }
    },
    bounds: { height: 408, width: 1268, x: 0, y: 0 },
    cards: [
      {
        bounds: { height: 120, width: 240, x: 64, y: 64 },
        collection: 'structure',
        description: 'Diagram, scopes, specifications',
        id: 'STR-01',
        label: 'Structure',
        ports: { east: 1 },
        stereotype: 'Input'
      },
      {
        bounds: { height: 120, width: 240, x: 64, y: 224 },
        collection: 'presentation',
        description: 'Scenes, themes, stories',
        id: 'PRS-02',
        label: 'Presentation',
        ports: { east: 1 },
        stereotype: 'Input'
      },
      {
        bounds: { height: 120, width: 240, x: 514, y: 144 },
        collection: 'product',
        description: 'One serialisable product definition',
        id: 'INFO-03',
        label: 'Infoschematic',
        ports: { east: 2, west: 2 },
        stereotype: 'Product'
      },
      {
        bounds: { height: 120, width: 240, x: 964, y: 64 },
        collection: 'rendered',
        description: 'SVG, images and documents',
        id: 'OUT-04',
        label: 'Rendered',
        ports: { west: 1 },
        stereotype: 'Static output'
      },
      {
        bounds: { height: 120, width: 240, x: 964, y: 224 },
        collection: 'presented',
        description: 'Interactive, explorable view',
        id: 'OUT-05',
        label: 'Presented',
        ports: { west: 1 },
        stereotype: 'Live output'
      }
    ],
    collections: [
      { appearance: { color: '#9673a6', fill: '#0d1b2a' }, id: 'structure', label: 'Structure' },
      { appearance: { color: '#6c8ebf', fill: '#0d1b2a' }, id: 'presentation', label: 'Presentation' },
      { appearance: { color: '#79c9ff', fill: '#10283d' }, id: 'product', label: 'Product' },
      { appearance: { color: '#b85450', fill: '#0d1b2a' }, id: 'rendered', label: 'Rendered' },
      { appearance: { color: '#82b366', fill: '#0d1b2a' }, id: 'presented', label: 'Presented' }
    ],
    fabrics: [],
    families: [
      {
        appearance: { color: '#79c9ff' },
        description: 'Authored material combines into the product',
        id: 'composition',
        label: 'Composes'
      },
      {
        appearance: { color: '#82b366' },
        description: 'One product definition supports multiple outlets',
        id: 'output',
        label: 'Produces'
      }
    ],
    flows: [
      {
        direction: 'forward',
        family: 'composition',
        id: 'SHAPE',
        route: {
          labelAt: 0.5,
          waypoints: [
            { x: 409, y: 124 },
            { x: 409, y: 184 }
          ]
        },
        source: { element: 'STR-01', port: 'E1' },
        target: { element: 'INFO-03', port: 'W1' }
      },
      {
        direction: 'forward',
        family: 'composition',
        id: 'DIRECT',
        route: {
          labelAt: 0.5,
          waypoints: [
            { x: 409, y: 284 },
            { x: 409, y: 224 }
          ]
        },
        source: { element: 'PRS-02', port: 'E1' },
        target: { element: 'INFO-03', port: 'W2' }
      },
      {
        direction: 'forward',
        family: 'output',
        id: 'RENDER',
        route: {
          labelAt: 0.5,
          waypoints: [
            { x: 859, y: 184 },
            { x: 859, y: 124 }
          ]
        },
        source: { element: 'INFO-03', port: 'E1' },
        target: { element: 'OUT-04', port: 'W1' }
      },
      {
        direction: 'forward',
        family: 'output',
        id: 'PRESENT',
        route: {
          labelAt: 0.5,
          waypoints: [
            { x: 859, y: 224 },
            { x: 859, y: 284 }
          ]
        },
        source: { element: 'INFO-03', port: 'E2' },
        target: { element: 'OUT-05', port: 'W1' }
      }
    ],
    overlays: [],
    points: [],
    regions: [
      {
        appearance: {
          cornerRadius: 12,
          fill: '#12273b24',
          frame: { style: 'solid' },
          label: { mount: 'boundary', placement: 'north-west' }
        },
        bounds: { height: 360, width: 320, x: 24, y: 24 },
        id: 'inputs',
        label: 'Inputs'
      },
      {
        appearance: {
          cornerRadius: 12,
          fill: '#16345136',
          frame: { style: 'solid' },
          label: { mount: 'boundary', placement: 'north-west' }
        },
        bounds: { height: 200, width: 320, x: 474, y: 104 },
        id: 'product',
        label: 'Product'
      },
      {
        appearance: {
          cornerRadius: 12,
          fill: '#12273b24',
          frame: { style: 'solid' },
          label: { mount: 'boundary', placement: 'north-west' }
        },
        bounds: { height: 360, width: 320, x: 924, y: 24 },
        id: 'outputs',
        label: 'Outputs'
      }
    ]
  },
  id: 'infoschematic-overview',
  scopes: [
    {
      description: 'The complete product from authored inputs to audience-facing outputs',
      elements: ['STR-01', 'PRS-02', 'INFO-03', 'OUT-04', 'OUT-05', 'SHAPE', 'DIRECT', 'RENDER', 'PRESENT'],
      id: 'product',
      label: 'Product'
    }
  ],
  specifications: [],
  stories: [],
  subtitle: 'Structure and presentation, rendered or presented',
  themes: [],
  title: 'What makes an Infoschematic'
})
