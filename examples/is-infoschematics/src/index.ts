import { defineInfoschematic } from '@infoschematics/domain-core'

const packagePorts = {
  east: 2,
  north: 6,
  south: 6,
  west: 2
} as const

const packageCard = (
  code: string,
  id: string,
  label: string,
  detail: string,
  scope: string,
  domain: string,
  stereotype: string,
  x: number,
  y: number,
  width = 280
) => ({
  code,
  detail,
  domain,
  id,
  label,
  placement: {
    box: { height: 90, width, x, y },
    ports: packagePorts
  },
  scope,
  scopes: [scope],
  stereotype
})

const dependency = (
  code: string,
  id: string,
  source: string,
  sourcePort: `N${number}` | `E${number}` | `S${number}` | `W${number}`,
  target: string,
  targetPort: `N${number}` | `E${number}` | `S${number}` | `W${number}`,
  points: readonly { x: number; y: number }[]
) => ({
  code,
  family: 'dependency',
  id,
  points,
  source,
  sourcePort,
  target,
  targetPort
})

export const infoschematicsInfoschematic = defineInfoschematic({
  id: 'infoschematics-architecture',
  title: 'An Infoschematic of Infoschematics',
  subtitle: 'One serialisable product from authored data to public host',
  synopsis:
    'The repository separates its authored contract, framework-neutral behaviour, interactive Views, renderers, examples, and hosts with dependencies pointing toward lower-level packages.',
  takeaways: [
    'Domain Model is the dependency root.',
    'Interactive Views add capability without reversing package ownership.',
    'Examples contain authored data; hosts choose how to present it.'
  ],
  infoschematic: {
    viewBox: { height: 920, width: 1400, x: 0, y: 0 },
    appearance: {
      surface: 'blueprint',
      grid: 'major-plus-minor',
      card: {
        compact: true,
        identity: true,
        stereotype: true,
        description: false
      }
    },
    domains: [
      {
        color: '#2456a6',
        description: 'Reusable contracts and framework-neutral behaviour.',
        fill: '#e8f0ff',
        id: 'product-foundation',
        label: 'Product foundation'
      },
      {
        color: '#087f5b',
        description: 'Interactive capability for Producers and Audiences.',
        fill: '#e4f7ef',
        id: 'interactive-experience',
        label: 'Interactive experience'
      },
      {
        color: '#a23b72',
        description: 'Authored and rendered outlets for sharing Infoschematics.',
        fill: '#fdebf5',
        id: 'publication',
        label: 'Publication'
      }
    ],
    scopes: [
      {
        color: '#2456a6',
        description: 'Dependency-free authored product types.',
        fill: '#e8f0ff',
        id: 'domain-contract',
        label: 'Domain contract',
        prefix: 'DM'
      },
      {
        color: '#5b4aa8',
        description: 'Framework-neutral domain and visual calculations.',
        fill: '#f0edff',
        id: 'neutral-behaviour',
        label: 'Framework-neutral behaviour',
        prefix: 'FN'
      },
      {
        color: '#087f5b',
        description: 'Additive interactive Views.',
        fill: '#e4f7ef',
        id: 'interactive-views',
        label: 'Interactive Views',
        prefix: 'VW'
      },
      {
        color: '#9a6700',
        description: 'Framework-neutral rendering output.',
        fill: '#fff4d6',
        id: 'renderer-output',
        label: 'Renderer output',
        prefix: 'RO'
      },
      {
        color: '#a23b72',
        description: 'Independently authored Infoschematic definitions.',
        fill: '#fdebf5',
        id: 'authored-examples',
        label: 'Authored examples',
        prefix: 'EX'
      },
      {
        color: '#b54708',
        description: 'Deployable composition and publication hosts.',
        fill: '#fff0e5',
        id: 'application-hosts',
        label: 'Application hosts',
        prefix: 'HOST'
      }
    ],
    flowFamilies: [
      {
        color: '#52606d',
        description: 'A package or host consumes a lower-level package.',
        id: 'dependency',
        label: 'Depends on',
        prefix: 'DEP'
      }
    ],
    // Authored order is paint order. Each band is a framed row whose boundary-mounted
    // title reads against the backdrop, holding filled panels inset inside it.
    regions: [
      {
        box: { height: 150, radius: 12, width: 1360, x: 20, y: 20 },
        frame: { style: 'solid' },
        id: 'row-domain-contract',
        label: 'Authored contract',
        labelMount: 'boundary',
        labelPlacement: 'north-west'
      },
      {
        box: { height: 122, width: 1332, x: 34, y: 34 },
        fill: '#e8f0ff',
        id: 'panel-domain-model',
        label: 'Dependency root',
        labelPlacement: 'south-east'
      },
      {
        box: { height: 160, radius: 12, width: 1360, x: 20, y: 230 },
        frame: { style: 'dashed' },
        id: 'row-neutral-behaviour',
        label: 'Framework-neutral behaviour',
        labelMount: 'boundary',
        labelPlacement: 'north-east'
      },
      {
        box: { height: 132, width: 666, x: 34, y: 244 },
        fill: '#f4f0ff',
        id: 'panel-domain-behaviour',
        label: 'Domain behaviour',
        labelPlacement: 'west'
      },
      {
        box: { height: 132, width: 660, x: 706, y: 244 },
        fill: '#ece9ff',
        id: 'panel-view-calculations',
        label: 'View calculations',
        labelPlacement: 'east'
      },
      {
        box: { height: 170, radius: 12, width: 1360, x: 20, y: 500 },
        frame: { style: 'dotted' },
        id: 'row-output-packages',
        label: 'View and renderer packages',
        labelMount: 'boundary',
        labelPlacement: 'north-east'
      },
      {
        box: { height: 142, width: 986, x: 34, y: 514 },
        fill: '#e4f7ef',
        id: 'panel-interactive-views',
        label: 'Additive interactive Views',
        labelPlacement: 'south-west'
      },
      {
        box: { height: 142, width: 332, x: 1034, y: 514 },
        fill: '#fff4d6',
        id: 'panel-static-output',
        label: 'Static output',
        labelPlacement: 'south-east'
      },
      {
        box: { height: 150, radius: 12, width: 1360, x: 20, y: 740 },
        frame: { style: 'solid' },
        id: 'row-composition',
        label: 'Authored composition',
        labelMount: 'boundary',
        labelPlacement: 'south'
      },
      {
        box: { height: 122, width: 666, x: 34, y: 754 },
        fill: '#fdebf5',
        id: 'panel-authored-examples',
        label: 'Authored examples',
        labelPlacement: 'north-west'
      },
      {
        box: { height: 122, width: 660, x: 706, y: 754 },
        fill: '#fff0e5',
        id: 'panel-application-hosts',
        label: 'Application hosts',
        labelPlacement: 'north-east'
      }
    ],
    cards: [
      packageCard(
        'PKG-DM',
        'package-domain-model',
        'Domain Model',
        'Serialisable authored product types with no package dependencies.',
        'domain-contract',
        'product-foundation',
        'package',
        560,
        60,
        280
      ),
      packageCard(
        'PKG-DC',
        'package-domain-core',
        'Domain Core',
        'Framework-neutral defaults and domain behaviour.',
        'neutral-behaviour',
        'product-foundation',
        'package',
        180,
        265,
        280
      ),
      packageCard(
        'PKG-VM',
        'package-view-model',
        'View Model',
        'Framework-neutral geometry, routing, presentation, and editing calculations.',
        'neutral-behaviour',
        'product-foundation',
        'package',
        900,
        265,
        280
      ),
      packageCard(
        'PKG-VC',
        'package-view-canvas',
        'Canvas View',
        'Reusable interactive Infoschematic surface.',
        'interactive-views',
        'interactive-experience',
        'package',
        60,
        535
      ),
      packageCard(
        'PKG-VP',
        'package-view-present',
        'Present View',
        'Audience focus, navigation, Callouts, and Story playback over Canvas.',
        'interactive-views',
        'interactive-experience',
        'package',
        380,
        535
      ),
      packageCard(
        'PKG-VS',
        'package-view-studio',
        'Studio View',
        'Producer-facing Design and Direct capability over Present.',
        'interactive-views',
        'interactive-experience',
        'package',
        700,
        535
      ),
      packageCard(
        'PKG-SVG',
        'package-render-svg',
        'SVG Renderer',
        'Deterministic static SVG from the same authored definition.',
        'renderer-output',
        'publication',
        'package',
        1080,
        535
      ),
      packageCard(
        'EX-IS',
        'example-infoschematics',
        'Authored examples',
        'Independent serialisable products depending only on Domain Core.',
        'authored-examples',
        'publication',
        'Infoschematic',
        220,
        765,
        280
      ),
      packageCard(
        'HOST-SITE',
        'host-site',
        'Public Site',
        'Host-owned routing, metadata, composition, and deployment.',
        'application-hosts',
        'publication',
        'application',
        900,
        765,
        280
      )
    ],
    // Every long route travels in one of three horizontal corridors between the bands,
    // each dependency on its own lane, so no two routes share a segment.
    flows: [
      dependency(
        'DEP-001',
        'dependency-domain-core-domain-model',
        'package-domain-core',
        'N1',
        'package-domain-model',
        'S2',
        [
          { x: 220, y: 265 },
          { x: 220, y: 212 },
          { x: 640, y: 212 },
          { x: 640, y: 150 }
        ]
      ),
      dependency(
        'DEP-002',
        'dependency-view-model-domain-model',
        'package-view-model',
        'N1',
        'package-domain-model',
        'S5',
        [
          { x: 940, y: 265 },
          { x: 940, y: 188 },
          { x: 760, y: 188 },
          { x: 760, y: 150 }
        ]
      ),
      dependency(
        'DEP-003',
        'dependency-canvas-domain-model',
        'package-view-canvas',
        'N1',
        'package-domain-model',
        'S1',
        [
          { x: 100, y: 535 },
          { x: 100, y: 496 },
          { x: 600, y: 496 },
          { x: 600, y: 150 }
        ]
      ),
      dependency('DEP-004', 'dependency-canvas-view-model', 'package-view-canvas', 'N2', 'package-view-model', 'S1', [
        { x: 140, y: 535 },
        { x: 140, y: 436 },
        { x: 940, y: 436 },
        { x: 940, y: 355 }
      ]),
      dependency(
        'DEP-005',
        'dependency-present-domain-model',
        'package-view-present',
        'N1',
        'package-domain-model',
        'S3',
        [
          { x: 420, y: 535 },
          { x: 420, y: 484 },
          { x: 680, y: 484 },
          { x: 680, y: 150 }
        ]
      ),
      dependency('DEP-006', 'dependency-present-view-model', 'package-view-present', 'N2', 'package-view-model', 'S2', [
        { x: 460, y: 535 },
        { x: 460, y: 424 },
        { x: 980, y: 424 },
        { x: 980, y: 355 }
      ]),
      dependency('DEP-007', 'dependency-present-canvas', 'package-view-present', 'W1', 'package-view-canvas', 'E1', [
        { x: 380, y: 565 },
        { x: 340, y: 565 }
      ]),
      dependency('DEP-008', 'dependency-studio-domain-core', 'package-view-studio', 'N2', 'package-domain-core', 'S1', [
        { x: 780, y: 535 },
        { x: 780, y: 448 },
        { x: 220, y: 448 },
        { x: 220, y: 355 }
      ]),
      dependency(
        'DEP-009',
        'dependency-studio-domain-model',
        'package-view-studio',
        'N1',
        'package-domain-model',
        'S4',
        [
          { x: 740, y: 535 },
          { x: 740, y: 472 },
          { x: 720, y: 472 },
          { x: 720, y: 150 }
        ]
      ),
      dependency('DEP-010', 'dependency-studio-view-model', 'package-view-studio', 'N3', 'package-view-model', 'S3', [
        { x: 820, y: 535 },
        { x: 820, y: 412 },
        { x: 1020, y: 412 },
        { x: 1020, y: 355 }
      ]),
      dependency('DEP-011', 'dependency-studio-canvas', 'package-view-studio', 'S1', 'package-view-canvas', 'S6', [
        { x: 740, y: 625 },
        { x: 740, y: 643 },
        { x: 300, y: 643 },
        { x: 300, y: 625 }
      ]),
      dependency('DEP-012', 'dependency-studio-present', 'package-view-studio', 'W1', 'package-view-present', 'E1', [
        { x: 700, y: 565 },
        { x: 660, y: 565 }
      ]),
      dependency(
        'DEP-013',
        'dependency-render-svg-domain-model',
        'package-render-svg',
        'N1',
        'package-domain-model',
        'S6',
        [
          { x: 1120, y: 535 },
          { x: 1120, y: 460 },
          { x: 800, y: 460 },
          { x: 800, y: 150 }
        ]
      ),
      dependency(
        'DEP-014',
        'dependency-render-svg-view-model',
        'package-render-svg',
        'N2',
        'package-view-model',
        'S4',
        [
          { x: 1160, y: 535 },
          { x: 1160, y: 400 },
          { x: 1060, y: 400 },
          { x: 1060, y: 355 }
        ]
      ),
      dependency(
        'DEP-015',
        'dependency-example-domain-core',
        'example-infoschematics',
        'N1',
        'package-domain-core',
        'S2',
        [
          { x: 260, y: 765 },
          { x: 260, y: 700 },
          { x: 360, y: 700 },
          { x: 360, y: 380 },
          { x: 260, y: 380 },
          { x: 260, y: 355 }
        ]
      ),
      dependency('DEP-016', 'dependency-site-studio', 'host-site', 'N1', 'package-view-studio', 'S2', [
        { x: 940, y: 765 },
        { x: 940, y: 712 },
        { x: 780, y: 712 },
        { x: 780, y: 625 }
      ]),
      dependency('DEP-017', 'dependency-site-example', 'host-site', 'W1', 'example-infoschematics', 'E1', [
        { x: 900, y: 795 },
        { x: 500, y: 795 }
      ])
    ]
  },
  standaloneScenes: [
    {
      code: 'SCN-01',
      description: 'The dependency-free contract supports two independent framework-neutral behaviour packages.',
      focus: {
        artefacts: ['package-domain-model', 'package-domain-core', 'package-view-model'],
        flows: ['dependency-domain-core-domain-model', 'dependency-view-model-domain-model']
      },
      id: 'scene-foundations',
      label: 'Start with the foundations',
      short: 'Domain Model is the dependency root.'
    },
    {
      code: 'SCN-02',
      description:
        'Canvas, Present, and Studio add interactive capability in one direction while retaining the lower-level contracts.',
      focus: {
        artefacts: [
          'package-domain-model',
          'package-view-model',
          'package-view-canvas',
          'package-view-present',
          'package-view-studio'
        ],
        flows: [
          'dependency-canvas-domain-model',
          'dependency-canvas-view-model',
          'dependency-present-domain-model',
          'dependency-present-view-model',
          'dependency-present-canvas',
          'dependency-studio-domain-model',
          'dependency-studio-view-model',
          'dependency-studio-canvas',
          'dependency-studio-present'
        ]
      },
      id: 'scene-additive-views',
      label: 'Add interactive Views',
      short: 'Each View builds on narrower capability.'
    },
    {
      code: 'SCN-03',
      description:
        'Static rendering stays framework-neutral, authored examples contain only product data, and the Site owns publication.',
      focus: {
        artefacts: [
          'package-domain-core',
          'package-domain-model',
          'package-view-model',
          'package-view-studio',
          'package-render-svg',
          'example-infoschematics',
          'host-site'
        ],
        flows: [
          'dependency-render-svg-domain-model',
          'dependency-render-svg-view-model',
          'dependency-example-domain-core',
          'dependency-site-studio',
          'dependency-site-example'
        ]
      },
      id: 'scene-public-outlets',
      label: 'Compose examples and hosts',
      short: 'Authored data remains separate from its outlets.'
    },
    {
      code: 'SCN-04',
      description: 'The complete product graph keeps dependencies pointing toward lower-level packages.',
      focus: {
        artefacts: [
          'package-domain-model',
          'package-domain-core',
          'package-view-model',
          'package-view-canvas',
          'package-view-present',
          'package-view-studio',
          'package-render-svg',
          'example-infoschematics',
          'host-site'
        ],
        flows: [
          'dependency-domain-core-domain-model',
          'dependency-view-model-domain-model',
          'dependency-canvas-domain-model',
          'dependency-canvas-view-model',
          'dependency-present-domain-model',
          'dependency-present-view-model',
          'dependency-present-canvas',
          'dependency-studio-domain-core',
          'dependency-studio-domain-model',
          'dependency-studio-view-model',
          'dependency-studio-canvas',
          'dependency-studio-present',
          'dependency-render-svg-domain-model',
          'dependency-render-svg-view-model',
          'dependency-example-domain-core',
          'dependency-site-studio',
          'dependency-site-example'
        ]
      },
      id: 'scene-complete-architecture',
      label: 'See the complete architecture',
      short: 'One-way dependencies keep ownership clear.'
    }
  ],
  stories: [
    {
      code: 'STORY-01',
      id: 'story-from-contract-to-host',
      question: 'How does one authored Infoschematic reach its Audience?',
      scenes: [
        {
          anchor: 'package-domain-model',
          callout: {
            body: 'Begin with serialisable product data and a dependency-free contract.',
            takeaways: ['The Domain Model imports no package.']
          },
          duration: 5,
          id: 'story-scene-foundations',
          sourceScene: 'scene-foundations',
          title: 'Define the product'
        },
        {
          anchor: 'package-view-studio',
          callout: {
            body: 'Add Canvas, Present, and Studio capability without moving authored state into a View.',
            takeaways: ['Views depend downward; authored products do not depend on Views.']
          },
          duration: 6,
          id: 'story-scene-views',
          sourceScene: 'scene-additive-views',
          title: 'Choose the narrowest View'
        },
        {
          anchor: 'host-site',
          callout: {
            body: 'Let examples own reusable data and let the Site own routing, metadata, and deployment.',
            takeaways: ['The same definition can drive Studio and deterministic SVG.']
          },
          duration: 6,
          id: 'story-scene-outlets',
          sourceScene: 'scene-public-outlets',
          title: 'Publish through a host'
        }
      ],
      short: 'From serialisable contract to public outlet.',
      title: 'From contract to Audience'
    }
  ],
  calloutPositions: [
    { x: 70, y: 60 },
    { x: 1080, y: 250 },
    { x: 1080, y: 700 }
  ]
})

export const infoschematicsExample = infoschematicsInfoschematic
