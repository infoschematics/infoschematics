import { defineInfoschematicModel } from '@infoschematics/domain-core'

export const systemExample = defineInfoschematicModel({
  description:
    'Observation gathers signals, arrangement gives them structure, illumination draws out meaning, and the result is a view a whole team can share.',
  diagram: {
    appearance: {
      surface: 'blueprint',
      grid: 'major-plus-minor',
      card: {
        compact: false,
        identity: true,
        stereotype: true,
        description: true
      }
    },
    assemblies: [],
    bounds: {
      height: 248,
      width: 1268,
      x: 0,
      y: 0
    },
    cards: [
      {
        bounds: {
          height: 120,
          width: 240,
          x: 64,
          y: 64
        },
        collection: 'observe',
        description: 'Facts, events and relationships',
        id: 'OBS-01',
        label: 'Signals',
        ports: {
          east: 1,
          west: 1
        },
        stereotype: 'Observe'
      },
      {
        bounds: {
          height: 120,
          width: 240,
          x: 364,
          y: 64
        },
        collection: 'arrange',
        description: 'Systems, boundaries and flow',
        id: 'MAP-02',
        label: 'Structure',
        ports: {
          east: 1,
          west: 1
        },
        stereotype: 'Arrange'
      },
      {
        bounds: {
          height: 120,
          width: 240,
          x: 664,
          y: 64
        },
        collection: 'illuminate',
        description: 'Stories, scenes and evidence',
        id: 'LIT-03',
        label: 'Meaning',
        ports: {
          east: 1,
          west: 1
        },
        stereotype: 'Illuminate'
      },
      {
        bounds: {
          height: 120,
          width: 240,
          x: 964,
          y: 64
        },
        collection: 'understand',
        description: 'Complexity made comprehensible',
        id: 'SEE-04',
        label: 'Shared view',
        ports: {
          east: 1,
          west: 1
        },
        stereotype: 'Understand'
      }
    ],
    collections: [
      {
        appearance: {
          color: '#9673a6',
          fill: '#0d1b2a'
        },
        id: 'observe',
        label: 'Observe'
      },
      {
        appearance: {
          color: '#6c8ebf',
          fill: '#0d1b2a'
        },
        id: 'arrange',
        label: 'Arrange'
      },
      {
        appearance: {
          color: '#b85450',
          fill: '#0d1b2a'
        },
        id: 'illuminate',
        label: 'Illuminate'
      },
      {
        appearance: {
          color: '#82b366',
          fill: '#0d1b2a'
        },
        id: 'understand',
        label: 'Understand'
      }
    ],
    fabrics: [],
    families: [
      {
        appearance: {
          color: '#79c9ff'
        },
        description: 'Each stage hands its result to the next',
        id: 'progression',
        label: 'Progresses to'
      }
    ],
    flows: [
      {
        direction: 'forward',
        family: 'progression',
        id: 'SELECT',
        route: {
          labelAt: 0.5,
          waypoints: []
        },
        source: {
          element: 'OBS-01',
          port: 'E1'
        },
        target: {
          element: 'MAP-02',
          port: 'W1'
        }
      },
      {
        direction: 'forward',
        family: 'progression',
        id: 'CONNECT',
        route: {
          labelAt: 0.5,
          waypoints: []
        },
        source: {
          element: 'MAP-02',
          port: 'E1'
        },
        target: {
          element: 'LIT-03',
          port: 'W1'
        }
      },
      {
        direction: 'forward',
        family: 'progression',
        id: 'REVEAL',
        route: {
          labelAt: 0.5,
          waypoints: []
        },
        source: {
          element: 'LIT-03',
          port: 'E1'
        },
        target: {
          element: 'SEE-04',
          port: 'W1'
        }
      }
    ],
    overlays: [],
    points: [],
    regions: [
      {
        appearance: {
          cornerRadius: 12,
          fill: '#12273b24',
          frame: {
            style: 'solid'
          },
          label: {
            mount: 'boundary',
            placement: 'north-west'
          }
        },
        bounds: {
          height: 200,
          width: 1220,
          x: 24,
          y: 24
        },
        id: 'journey',
        label: 'Infoschematic'
      }
    ],
    sets: [
      {
        description: 'The system being explained',
        elements: ['OBS-01', 'MAP-02', 'LIT-03', 'SEE-04'],
        id: 'system',
        label: 'System'
      }
    ]
  },
  id: 'system-explained',
  specifications: [],
  stories: [],
  subtitle: 'From observed signals to a shared view',
  themes: [],
  title: 'A system, explained'
})
