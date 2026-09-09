import { defineInfoschematicModel } from '@infoschematics/domain-core'

export const infoschematicsInfoschematic = defineInfoschematicModel({
  description:
    'The repository separates its authored contract, framework-neutral behaviour, interactive Views, renderers, examples, and hosts with dependencies pointing toward lower-level packages.',
  diagram: {
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
    bounds: {
      height: 920,
      width: 1400,
      x: 0,
      y: 0
    },
    cards: [
      {
        bounds: {
          height: 90,
          width: 280,
          x: 560,
          y: 60
        },
        collection: 'product-foundation',
        description: 'Serialisable authored product types with no package dependencies.',
        id: 'PKG-DM',
        label: 'Domain Model',
        ports: {
          east: 2,
          north: 6,
          south: 6,
          west: 2
        },
        stereotype: 'package'
      },
      {
        bounds: {
          height: 90,
          width: 280,
          x: 180,
          y: 265
        },
        collection: 'product-foundation',
        description: 'Framework-neutral defaults and domain behaviour.',
        id: 'PKG-DC',
        label: 'Domain Core',
        ports: {
          east: 2,
          north: 6,
          south: 6,
          west: 2
        },
        stereotype: 'package'
      },
      {
        bounds: {
          height: 90,
          width: 280,
          x: 900,
          y: 265
        },
        collection: 'product-foundation',
        description: 'Framework-neutral geometry, routing, presentation, and editing calculations.',
        id: 'PKG-VM',
        label: 'View Model',
        ports: {
          east: 2,
          north: 6,
          south: 6,
          west: 2
        },
        stereotype: 'package'
      },
      {
        bounds: {
          height: 90,
          width: 280,
          x: 60,
          y: 535
        },
        collection: 'interactive-experience',
        description: 'Reusable interactive Infoschematic surface.',
        id: 'PKG-VC',
        label: 'Canvas View',
        ports: {
          east: 2,
          north: 6,
          south: 6,
          west: 2
        },
        stereotype: 'package'
      },
      {
        bounds: {
          height: 90,
          width: 280,
          x: 380,
          y: 535
        },
        collection: 'interactive-experience',
        description: 'Audience focus, navigation, Callouts, and Story playback over Canvas.',
        id: 'PKG-VP',
        label: 'Present View',
        ports: {
          east: 2,
          north: 6,
          south: 6,
          west: 2
        },
        stereotype: 'package'
      },
      {
        bounds: {
          height: 90,
          width: 280,
          x: 700,
          y: 535
        },
        collection: 'interactive-experience',
        description: 'Producer-facing Design and Direct capability over Present.',
        id: 'PKG-VS',
        label: 'Studio View',
        ports: {
          east: 2,
          north: 6,
          south: 6,
          west: 2
        },
        stereotype: 'package'
      },
      {
        bounds: {
          height: 90,
          width: 280,
          x: 1080,
          y: 535
        },
        collection: 'publication',
        description: 'Deterministic static SVG from the same authored definition.',
        id: 'PKG-SVG',
        label: 'SVG Renderer',
        ports: {
          east: 2,
          north: 6,
          south: 6,
          west: 2
        },
        stereotype: 'package'
      },
      {
        bounds: {
          height: 90,
          width: 280,
          x: 220,
          y: 765
        },
        collection: 'publication',
        description: 'Independent serialisable products depending only on Domain Core.',
        id: 'EX-IS',
        label: 'Authored examples',
        ports: {
          east: 2,
          north: 6,
          south: 6,
          west: 2
        },
        stereotype: 'Infoschematic'
      },
      {
        bounds: {
          height: 90,
          width: 280,
          x: 900,
          y: 765
        },
        collection: 'publication',
        description: 'Host-owned routing, metadata, composition, and deployment.',
        id: 'HOST-SITE',
        label: 'Public Site',
        ports: {
          east: 2,
          north: 6,
          south: 6,
          west: 2
        },
        stereotype: 'application'
      }
    ],
    collections: [
      {
        appearance: {
          color: '#2456a6',
          fill: '#e8f0ff'
        },
        description: 'Reusable contracts and framework-neutral behaviour.',
        id: 'product-foundation',
        label: 'Product foundation'
      },
      {
        appearance: {
          color: '#087f5b',
          fill: '#e4f7ef'
        },
        description: 'Interactive capability for Producers and Audiences.',
        id: 'interactive-experience',
        label: 'Interactive experience'
      },
      {
        appearance: {
          color: '#a23b72',
          fill: '#fdebf5'
        },
        description: 'Authored and rendered outlets for sharing Infoschematics.',
        id: 'publication',
        label: 'Publication'
      }
    ],
    fabrics: [],
    families: [
      {
        appearance: {
          color: '#52606d'
        },
        description: 'A package or host consumes a lower-level package.',
        id: 'dependency',
        label: 'Depends on'
      }
    ],
    flows: [
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-001',
        route: {
          waypoints: [
            {
              x: 220,
              y: 212
            },
            {
              x: 640,
              y: 212
            }
          ]
        },
        source: {
          element: 'PKG-DC',
          port: 'N5'
        },
        target: {
          element: 'PKG-DM',
          port: 'S3'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-002',
        route: {
          waypoints: [
            {
              x: 940,
              y: 188
            },
            {
              x: 760,
              y: 188
            }
          ]
        },
        source: {
          element: 'PKG-VM',
          port: 'N5'
        },
        target: {
          element: 'PKG-DM',
          port: 'S4'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-003',
        route: {
          waypoints: [
            {
              x: 100,
              y: 496
            },
            {
              x: 600,
              y: 496
            }
          ]
        },
        source: {
          element: 'PKG-VC',
          port: 'N5'
        },
        target: {
          element: 'PKG-DM',
          port: 'S5'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-004',
        route: {
          waypoints: [
            {
              x: 140,
              y: 436
            },
            {
              x: 940,
              y: 436
            }
          ]
        },
        source: {
          element: 'PKG-VC',
          port: 'N3'
        },
        target: {
          element: 'PKG-VM',
          port: 'S5'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-005',
        route: {
          waypoints: [
            {
              x: 420,
              y: 484
            },
            {
              x: 680,
              y: 484
            }
          ]
        },
        source: {
          element: 'PKG-VP',
          port: 'N5'
        },
        target: {
          element: 'PKG-DM',
          port: 'S1'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-006',
        route: {
          waypoints: [
            {
              x: 460,
              y: 424
            },
            {
              x: 980,
              y: 424
            }
          ]
        },
        source: {
          element: 'PKG-VP',
          port: 'N3'
        },
        target: {
          element: 'PKG-VM',
          port: 'S3'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-007',
        route: {
          waypoints: []
        },
        source: {
          element: 'PKG-VP',
          port: 'W1'
        },
        target: {
          element: 'PKG-VC',
          port: 'E1'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-008',
        route: {
          waypoints: [
            {
              x: 780,
              y: 448
            },
            {
              x: 220,
              y: 448
            }
          ]
        },
        source: {
          element: 'PKG-VS',
          port: 'N3'
        },
        target: {
          element: 'PKG-DC',
          port: 'S5'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-009',
        route: {
          waypoints: [
            {
              x: 740,
              y: 472
            },
            {
              x: 720,
              y: 472
            }
          ]
        },
        source: {
          element: 'PKG-VS',
          port: 'N5'
        },
        target: {
          element: 'PKG-DM',
          port: 'S2'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-010',
        route: {
          waypoints: [
            {
              x: 820,
              y: 412
            },
            {
              x: 1020,
              y: 412
            }
          ]
        },
        source: {
          element: 'PKG-VS',
          port: 'N1'
        },
        target: {
          element: 'PKG-VM',
          port: 'S1'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-011',
        route: {
          waypoints: [
            {
              x: 740,
              y: 643
            },
            {
              x: 300,
              y: 643
            }
          ]
        },
        source: {
          element: 'PKG-VS',
          port: 'S5'
        },
        target: {
          element: 'PKG-VC',
          port: 'S6'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-012',
        route: {
          waypoints: []
        },
        source: {
          element: 'PKG-VS',
          port: 'W1'
        },
        target: {
          element: 'PKG-VP',
          port: 'E1'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-013',
        route: {
          waypoints: [
            {
              x: 1120,
              y: 460
            },
            {
              x: 800,
              y: 460
            }
          ]
        },
        source: {
          element: 'PKG-SVG',
          port: 'N5'
        },
        target: {
          element: 'PKG-DM',
          port: 'S6'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-014',
        route: {
          waypoints: [
            {
              x: 1160,
              y: 400
            },
            {
              x: 1060,
              y: 400
            }
          ]
        },
        source: {
          element: 'PKG-SVG',
          port: 'N3'
        },
        target: {
          element: 'PKG-VM',
          port: 'S2'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-015',
        route: {
          waypoints: [
            {
              x: 260,
              y: 700
            },
            {
              x: 360,
              y: 700
            },
            {
              x: 360,
              y: 380
            },
            {
              x: 260,
              y: 380
            }
          ]
        },
        source: {
          element: 'EX-IS',
          port: 'N5'
        },
        target: {
          element: 'PKG-DC',
          port: 'S3'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-016',
        route: {
          waypoints: [
            {
              x: 940,
              y: 712
            },
            {
              x: 780,
              y: 712
            }
          ]
        },
        source: {
          element: 'HOST-SITE',
          port: 'N5'
        },
        target: {
          element: 'PKG-VS',
          port: 'S3'
        }
      },
      {
        direction: 'forward',
        family: 'dependency',
        id: 'DEP-017',
        route: {
          waypoints: []
        },
        source: {
          element: 'HOST-SITE',
          port: 'W1'
        },
        target: {
          element: 'EX-IS',
          port: 'E1'
        }
      }
    ],
    overlays: [],
    points: [],
    regions: [
      {
        appearance: {
          cornerRadius: 12,
          frame: {
            style: 'solid'
          },
          label: {
            mount: 'boundary',
            placement: 'north-west'
          }
        },
        bounds: {
          height: 150,
          width: 1360,
          x: 20,
          y: 20
        },
        id: 'row-domain-contract',
        label: 'Authored contract'
      },
      {
        appearance: {
          fill: '#e8f0ff',
          label: {
            placement: 'south-east'
          }
        },
        bounds: {
          height: 122,
          width: 1332,
          x: 34,
          y: 34
        },
        id: 'panel-domain-model',
        label: 'Dependency root'
      },
      {
        appearance: {
          cornerRadius: 12,
          frame: {
            style: 'dashed'
          },
          label: {
            mount: 'boundary',
            placement: 'north-east'
          }
        },
        bounds: {
          height: 160,
          width: 1360,
          x: 20,
          y: 230
        },
        id: 'row-neutral-behaviour',
        label: 'Framework-neutral behaviour'
      },
      {
        appearance: {
          fill: '#f4f0ff',
          label: {
            placement: 'west'
          }
        },
        bounds: {
          height: 132,
          width: 666,
          x: 34,
          y: 244
        },
        id: 'panel-domain-behaviour',
        label: 'Domain behaviour'
      },
      {
        appearance: {
          fill: '#ece9ff',
          label: {
            placement: 'east'
          }
        },
        bounds: {
          height: 132,
          width: 660,
          x: 706,
          y: 244
        },
        id: 'panel-view-calculations',
        label: 'View calculations'
      },
      {
        appearance: {
          cornerRadius: 12,
          frame: {
            style: 'dotted'
          },
          label: {
            mount: 'boundary',
            placement: 'north-east'
          }
        },
        bounds: {
          height: 170,
          width: 1360,
          x: 20,
          y: 500
        },
        id: 'row-output-packages',
        label: 'View and renderer packages'
      },
      {
        appearance: {
          fill: '#e4f7ef',
          label: {
            placement: 'south-west'
          }
        },
        bounds: {
          height: 142,
          width: 986,
          x: 34,
          y: 514
        },
        id: 'panel-interactive-views',
        label: 'Additive interactive Views'
      },
      {
        appearance: {
          fill: '#fff4d6',
          label: {
            placement: 'south-east'
          }
        },
        bounds: {
          height: 142,
          width: 332,
          x: 1034,
          y: 514
        },
        id: 'panel-static-output',
        label: 'Static output'
      },
      {
        appearance: {
          cornerRadius: 12,
          frame: {
            style: 'solid'
          },
          label: {
            mount: 'boundary',
            placement: 'south'
          }
        },
        bounds: {
          height: 150,
          width: 1360,
          x: 20,
          y: 740
        },
        id: 'row-composition',
        label: 'Authored composition'
      },
      {
        appearance: {
          fill: '#fdebf5',
          label: {
            placement: 'north-west'
          }
        },
        bounds: {
          height: 122,
          width: 666,
          x: 34,
          y: 754
        },
        id: 'panel-authored-examples',
        label: 'Authored examples'
      },
      {
        appearance: {
          fill: '#fff0e5',
          label: {
            placement: 'north-east'
          }
        },
        bounds: {
          height: 122,
          width: 660,
          x: 706,
          y: 754
        },
        id: 'panel-application-hosts',
        label: 'Application hosts'
      }
    ],
    sets: [
      {
        description: 'Dependency-free authored product types.',
        elements: ['PKG-DM'],
        id: 'domain-contract',
        label: 'Domain contract'
      },
      {
        description: 'Framework-neutral domain and visual calculations.',
        elements: ['PKG-DC', 'PKG-VM'],
        id: 'neutral-behaviour',
        label: 'Framework-neutral behaviour'
      },
      {
        description: 'Additive interactive Views.',
        elements: ['PKG-VC', 'PKG-VP', 'PKG-VS'],
        id: 'interactive-views',
        label: 'Interactive Views'
      },
      {
        description: 'Framework-neutral rendering output.',
        elements: ['PKG-SVG'],
        id: 'renderer-output',
        label: 'Renderer output'
      },
      {
        description: 'Independently authored Infoschematic definitions.',
        elements: ['EX-IS'],
        id: 'authored-examples',
        label: 'Authored examples'
      },
      {
        description: 'Deployable composition and publication hosts.',
        elements: ['HOST-SITE'],
        id: 'application-hosts',
        label: 'Application hosts'
      }
    ]
  },
  id: 'infoschematics-architecture',
  specifications: [],
  stories: [
    {
      id: 'STORY-01',
      label: 'From contract to Audience',
      question: 'How does one authored Infoschematic reach its Audience?',
      scenes: [
        {
          callout: {
            body: 'Begin with serialisable product data and a dependency-free contract.',
            placement: {
              element: 'PKG-DM'
            },
            takeaways: ['The Domain Model imports no package.']
          },
          description: 'The dependency-free contract supports two independent framework-neutral behaviour packages.',
          duration: 5,
          focus: {
            elements: ['PKG-DM', 'PKG-DC', 'PKG-VM', 'DEP-001', 'DEP-002']
          },
          id: 'story-scene-foundations',
          label: 'Define the product'
        },
        {
          callout: {
            body: 'Add Canvas, Present, and Studio capability without moving authored state into a View.',
            placement: {
              element: 'PKG-VS'
            },
            takeaways: ['Views depend downward; authored products do not depend on Views.']
          },
          description:
            'Canvas, Present, and Studio add interactive capability in one direction while retaining the lower-level contracts.',
          duration: 6,
          focus: {
            elements: [
              'PKG-DM',
              'PKG-VM',
              'PKG-VC',
              'PKG-VP',
              'PKG-VS',
              'DEP-003',
              'DEP-004',
              'DEP-005',
              'DEP-006',
              'DEP-007',
              'DEP-009',
              'DEP-010',
              'DEP-011',
              'DEP-012'
            ]
          },
          id: 'story-scene-views',
          label: 'Choose the narrowest View'
        },
        {
          callout: {
            body: 'Let examples own reusable data and let the Site own routing, metadata, and deployment.',
            placement: {
              element: 'HOST-SITE'
            },
            takeaways: ['The same definition can drive Studio and deterministic SVG.']
          },
          description:
            'Static rendering stays framework-neutral, authored examples contain only product data, and the Site owns publication.',
          duration: 6,
          focus: {
            elements: [
              'PKG-DC',
              'PKG-DM',
              'PKG-VM',
              'PKG-VS',
              'PKG-SVG',
              'EX-IS',
              'HOST-SITE',
              'DEP-013',
              'DEP-014',
              'DEP-015',
              'DEP-016',
              'DEP-017'
            ]
          },
          id: 'story-scene-outlets',
          label: 'Publish through a host'
        }
      ]
    }
  ],
  subtitle: 'One serialisable product from authored data to public host',
  themes: [
    {
      id: 'OVERVIEW',
      label: 'Overview',
      scenes: [
        {
          description: 'The dependency-free contract supports two independent framework-neutral behaviour packages.',
          focus: {
            elements: ['PKG-DM', 'PKG-DC', 'PKG-VM', 'DEP-001', 'DEP-002']
          },
          id: 'SCN-01',
          label: 'Start with the foundations'
        },
        {
          description:
            'Canvas, Present, and Studio add interactive capability in one direction while retaining the lower-level contracts.',
          focus: {
            elements: [
              'PKG-DM',
              'PKG-VM',
              'PKG-VC',
              'PKG-VP',
              'PKG-VS',
              'DEP-003',
              'DEP-004',
              'DEP-005',
              'DEP-006',
              'DEP-007',
              'DEP-009',
              'DEP-010',
              'DEP-011',
              'DEP-012'
            ]
          },
          id: 'SCN-02',
          label: 'Add interactive Views'
        },
        {
          description:
            'Static rendering stays framework-neutral, authored examples contain only product data, and the Site owns publication.',
          focus: {
            elements: [
              'PKG-DC',
              'PKG-DM',
              'PKG-VM',
              'PKG-VS',
              'PKG-SVG',
              'EX-IS',
              'HOST-SITE',
              'DEP-013',
              'DEP-014',
              'DEP-015',
              'DEP-016',
              'DEP-017'
            ]
          },
          id: 'SCN-03',
          label: 'Compose examples and hosts'
        },
        {
          description: 'The complete product graph keeps dependencies pointing toward lower-level packages.',
          focus: {
            elements: [
              'PKG-DM',
              'PKG-DC',
              'PKG-VM',
              'PKG-VC',
              'PKG-VP',
              'PKG-VS',
              'PKG-SVG',
              'EX-IS',
              'HOST-SITE',
              'DEP-001',
              'DEP-002',
              'DEP-003',
              'DEP-004',
              'DEP-005',
              'DEP-006',
              'DEP-007',
              'DEP-008',
              'DEP-009',
              'DEP-010',
              'DEP-011',
              'DEP-012',
              'DEP-013',
              'DEP-014',
              'DEP-015',
              'DEP-016',
              'DEP-017'
            ]
          },
          id: 'SCN-04',
          label: 'See the complete architecture'
        }
      ]
    }
  ],
  title: 'An Infoschematic of Infoschematics'
})

export const infoschematicsExample = infoschematicsInfoschematic
