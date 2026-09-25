import { defineInfoschematicModel, serialiseInfoschematicYaml } from '@infoschematics/domain-core'

/*
 * The Dynamics specimen is authored in the canonical model rather than the legacy specimen shape the property
 * specimens use: `diagram.dynamics` and a Scene cue exist only there. It carries one Dynamic of each kind and a
 * Sequence that cues them the three ways the guide shows — once, on a repeat, and as a statement that lasts.
 */
export const dynamicsSpecimen = defineInfoschematicModel({
  id: 'dynamics-example',
  title: 'Diagram Dynamics example',
  subtitle: 'One named change, cued three ways.',
  diagram: {
    bounds: { x: 0, y: 0, width: 720, height: 300 },
    gridSize: 10,
    appearance: {
      style: 'blueprint',
      grid: 'major-plus-minor',
      card: { compact: false, description: true, identity: true, stereotype: false }
    },
    families: [
      {
        id: 'telemetry',
        label: 'Telemetry',
        description: 'Readings leaving the sensor',
        appearance: { color: '#79c9ff' }
      }
    ],
    cards: [
      {
        id: 'SENSOR',
        label: 'Sensor',
        description: 'Reports readings',
        bounds: { x: 70, y: 90, width: 220, height: 120 },
        ports: { east: 1 }
      },
      {
        id: 'CONTROL',
        label: 'Control',
        description: 'Acts on what arrives',
        bounds: { x: 430, y: 90, width: 220, height: 120 },
        ports: { west: 1 }
      }
    ],
    flows: [
      {
        id: 'READING',
        family: 'telemetry',
        source: { element: 'SENSOR', port: 'E1' },
        target: { element: 'CONTROL', port: 'W1' }
      }
    ],
    dynamics: [
      { id: 'reading-arrives', label: 'A reading arrives', kind: 'signal-flow', flows: ['READING'] },
      {
        id: 'sensor-is-live',
        label: 'The sensor is live',
        kind: 'emphasise-elements',
        elements: ['SENSOR'],
        depicts: 'state'
      }
    ]
  },
  sequences: [
    {
      id: 'dynamics',
      label: 'Dynamics',
      presentation: { display: 'expanded', timed: false, callouts: true },
      scenes: [
        {
          id: 'arrival',
          label: 'A reading arrives',
          cues: [{ dynamic: 'reading-arrives' }],
          callout: { title: 'Once', body: 'The cue plays on entry to the Scene and is finished.' }
        },
        {
          id: 'cadence',
          label: 'Readings keep arriving',
          cues: [{ dynamic: 'reading-arrives', playback: 'repeat' }],
          callout: { title: 'Repeat', body: 'The same Dynamic plays again while the Scene holds.' }
        },
        {
          id: 'live',
          label: 'The sensor is live',
          cues: [{ dynamic: 'sensor-is-live' }],
          callout: { title: 'A statement that lasts', body: 'Authored as depicts: state, so the emphasis is held.' }
        }
      ]
    }
  ]
})

export const dynamicsSpecimenSource = serialiseInfoschematicYaml(dynamicsSpecimen)
