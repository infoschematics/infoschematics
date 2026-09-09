import type { Infoschematic } from '@infoschematics/domain-model/model'

/** Canonical typed form of the source-to-sink document fixtures. */
export const formatParityDefinition: Infoschematic = {
  id: 'FORMAT-PARITY',
  title: 'Format parity',
  subtitle: 'One model, portable data',
  diagram: {
    bounds: { x: 0, y: 0, width: 800, height: 500 },
    appearance: { surface: 'blueprint', grid: 'major', card: { compact: true, identity: true } },
    collections: [
      {
        id: 'CORE',
        label: 'Core',
        description: 'The core collection.',
        appearance: { color: '#1f6feb', fill: '#0d1117' }
      }
    ],
    families: [
      {
        id: 'DATA',
        label: 'Data',
        description: 'Data movement.',
        appearance: { color: '#3fb950' }
      }
    ],
    regions: [
      {
        id: 'BAND',
        label: 'Band',
        bounds: { x: 40, y: 40, width: 720, height: 400 },
        appearance: {
          cornerRadius: 8,
          frame: { style: 'dashed', opacity: 0.6 },
          label: { placement: 'north-west', mount: 'boundary' }
        }
      }
    ],
    cards: [
      {
        id: 'SRC',
        label: 'Source',
        description: 'Emits records.',
        stereotype: 'service',
        collection: 'CORE',
        bounds: { x: 100, y: 160, width: 200, height: 120 },
        ports: { east: 1, west: 1 }
      },
      {
        id: 'SNK',
        label: 'Sink',
        description: 'Stores records.',
        stereotype: 'store',
        collection: 'CORE',
        bounds: { x: 500, y: 160, width: 200, height: 120 },
        ports: { east: 1, west: 1 }
      }
    ],
    flows: [
      {
        id: 'LOAD',
        family: 'DATA',
        source: { element: 'SRC', port: 'E1' },
        target: { element: 'SNK', port: 'W1' },
        operation: 'load',
        route: { waypoints: [] }
      }
    ]
  },
  themes: [
    {
      id: 'OVERVIEW',
      label: 'Overview',
      scenes: [
        {
          id: 'ALL',
          label: 'Everything',
          description: 'Everything at once.',
          focus: { elements: ['SRC', 'SNK', 'LOAD'] }
        }
      ]
    }
  ]
}
