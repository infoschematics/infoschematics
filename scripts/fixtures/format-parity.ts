import type { InfoschematicConfigInput } from '@infoschematics/domain-model'

/**
 * One definition small enough to author three times by hand, and wide enough to exercise the parts a document format
 * can get wrong: nested boxes, port counts, enumerations, optional fields, and an empty array.
 *
 * `format-parity.json` and `format-parity.yaml` beside it hold the same definition. They are authored, not generated,
 * so the parity test compares three independent documents rather than a serialiser against itself.
 */
export const formatParityDefinition: InfoschematicConfigInput = {
  id: 'format-parity',
  title: 'Format parity',
  subtitle: 'One definition, three documents',
  infoschematic: {
    viewBox: { x: 0, y: 0, width: 800, height: 500 },
    appearance: { surface: 'blueprint', grid: 'major', card: { compact: true, identity: true } },
    scopes: [
      { id: 'core', prefix: 'C', label: 'Core', description: 'The core scope.', color: '#1f6feb', fill: '#0d1117' }
    ],
    domains: [{ id: 'product', label: 'Product', color: '#1f6feb', fill: '#0d1117' }],
    flowFamilies: [{ id: 'data', prefix: 'D', label: 'Data', description: 'Data movement.', color: '#3fb950' }],
    regions: [
      {
        id: 'band',
        label: 'Band',
        box: { x: 40, y: 40, width: 720, height: 400, radius: 8 },
        frame: { style: 'dashed', opacity: 0.6 },
        labelPlacement: 'north-west',
        labelMount: 'boundary'
      }
    ],
    cards: [
      {
        id: 'source',
        code: 'C-001',
        label: 'Source',
        detail: 'Emits records.',
        scopes: ['core'],
        scope: 'core',
        domain: 'product',
        stereotype: 'service',
        placement: { box: { x: 100, y: 160, width: 200, height: 120 }, ports: { east: 1, west: 1 } }
      },
      {
        id: 'sink',
        code: 'C-002',
        label: 'Sink',
        detail: 'Stores records.',
        scopes: ['core'],
        scope: 'core',
        domain: 'product',
        stereotype: 'store',
        placement: { box: { x: 500, y: 160, width: 200, height: 120 }, ports: { east: 1, west: 1 } }
      }
    ],
    flows: [
      {
        id: 'load',
        code: 'D-001',
        family: 'data',
        source: 'source',
        target: 'sink',
        sourcePort: 'E1',
        targetPort: 'W1',
        operation: 'load',
        points: [
          { x: 300, y: 220 },
          { x: 500, y: 220 }
        ]
      }
    ]
  },
  standaloneScenes: [
    {
      id: 'overview',
      code: 'S-001',
      label: 'Overview',
      description: 'Everything at once.',
      focus: { artefacts: ['source', 'sink'], flows: ['load'] }
    }
  ]
}
