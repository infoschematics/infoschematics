import { defineInfoschematic } from '@infoschematics/domain-core'
import type { InfoschematicConfig } from '@infoschematics/domain-model'
import type { ArtefactDraftOperation } from '@infoschematics/view-model/artefact-draft'
import type { ArtefactOperation, ArtefactSelection } from '@infoschematics/view-model/editable'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Canvas } from './Canvas.tsx'

const config = (): InfoschematicConfig =>
  defineInfoschematic({
    title: 'Draft preview',
    infoschematic: {
      cards: [
        {
          code: 'CARD-A',
          detail: 'Card A detail',
          id: 'card-a',
          label: 'Card A',
          placement: {
            box: { height: 50, width: 100, x: 80, y: 170 },
            ports: { east: 1 }
          },
          scope: 'scope',
          scopes: ['scope']
        },
        {
          code: 'CARD-B',
          detail: 'Card B detail',
          id: 'card-b',
          label: 'Card B',
          placement: {
            box: { height: 50, width: 100, x: 360, y: 170 },
            ports: { west: 1 }
          },
          scope: 'scope',
          scopes: ['scope']
        }
      ],
      fabrics: [
        {
          appearance: {
            properties: { tone: 'base' },
            renderer: 'fabric-preview'
          },
          code: 'FABRIC-A',
          detail: 'Fabric detail',
          id: 'fabric-a',
          label: 'Fabric A',
          placement: { box: { height: 70, width: 160, x: 60, y: 70 } },
          scope: 'scope',
          scopes: ['scope']
        }
      ],
      flowFamilies: [
        {
          color: '#7c3aed',
          description: 'Requests',
          id: 'request',
          label: 'Request',
          prefix: 'REQ'
        }
      ],
      flows: [
        {
          code: 'FLOW-A',
          family: 'request',
          id: 'flow-a',
          points: [
            { x: 180, y: 195 },
            { x: 360, y: 195 }
          ],
          source: 'card-a',
          sourcePort: 'E1',
          target: 'card-b',
          targetPort: 'W1'
        }
      ],
      graphics: [
        {
          id: 'graphic-a',
          label: 'Graphic A',
          placement: { height: 30, width: 80, x: 250, y: 80 },
          properties: { caption: 'base' },
          renderer: 'graphic-preview'
        },
        {
          id: 'graphic-b',
          label: 'Graphic B',
          placement: { height: 30, width: 80, x: 350, y: 80 },
          properties: { caption: 'second' },
          renderer: 'graphic-preview'
        }
      ],
      regions: [
        {
          box: { height: 280, radius: 8, width: 620, x: 10, y: 20 },
          fill: '#eef',
          frame: { style: 'solid' },
          id: 'region-a',
          label: 'Region A',
          labelMount: 'boundary'
        }
      ],
      scopes: [
        {
          color: '#2463eb',
          description: 'Scope',
          fill: '#dbeafe',
          id: 'scope',
          label: 'Scope',
          prefix: 'S'
        }
      ],
      viewBox: { height: 320, width: 640, x: 0, y: 0 }
    }
  })

const selection = {
  cardA: {
    code: 'CARD-A',
    geometry: 'box',
    id: 'card-a',
    kind: 'card'
  },
  cardB: {
    code: 'CARD-B',
    geometry: 'box',
    id: 'card-b',
    kind: 'card'
  },
  fabric: {
    code: 'FABRIC-A',
    geometry: 'box',
    id: 'fabric-a',
    kind: 'fabric'
  },
  flow: {
    code: 'FLOW-A',
    geometry: 'route',
    id: 'flow-a',
    kind: 'flow'
  },
  graphicA: {
    code: null,
    geometry: 'box',
    id: 'graphic-a',
    kind: 'graphic'
  },
  graphicB: {
    code: null,
    geometry: 'box',
    id: 'graphic-b',
    kind: 'graphic'
  },
  region: {
    code: null,
    geometry: 'box',
    id: 'region-a',
    kind: 'region'
  }
} as const satisfies Record<string, ArtefactSelection>

const renderers = {
  fabrics: {
    'fabric-preview': ({
      fabric,
      bounds
    }: {
      fabric: ReturnType<typeof config>['infoschematic']['fabrics'][number]
      bounds: { height: number; width: number; x: number; y: number }
    }) => (
      <text>{`${fabric.label}:${bounds.x},${bounds.y},${bounds.width},${bounds.height}:${fabric.appearance?.properties?.tone}`}</text>
    )
  },
  graphics: {
    'graphic-preview': ({
      graphic,
      bounds
    }: {
      graphic: ReturnType<typeof config>['infoschematic']['graphics'][number]
      bounds: { height: number; width: number; x: number; y: number }
    }) => (
      <text>{`${graphic.label}:${bounds.x},${bounds.y},${bounds.width},${bounds.height}:${graphic.properties?.caption}`}</text>
    )
  }
}

describe('InfoschematicDiagram draft preview', () => {
  it('renders creates for every kind from a derived runtime', () => {
    const initial = config()
    const operations: readonly ArtefactOperation[] = [
      {
        at: 1,
        operation: 'create',
        target: {
          code: null,
          geometry: 'box',
          id: 'region-created',
          kind: 'region'
        },
        value: {
          box: { height: 60, radius: 8, width: 620, x: 10, y: 250 },
          fill: '#ffe',
          frame: { style: 'solid' },
          id: 'region-created',
          label: 'Region Created'
        }
      },
      {
        at: 1,
        operation: 'create',
        target: {
          code: 'FABRIC-C',
          geometry: 'box',
          id: 'fabric-created',
          kind: 'fabric'
        },
        value: {
          code: 'FABRIC-C',
          detail: 'Created fabric',
          id: 'fabric-created',
          label: 'Fabric Created',
          placement: { box: { height: 40, width: 100, x: 230, y: 120 } },
          scope: 'scope',
          scopes: ['scope']
        }
      },
      {
        at: 2,
        operation: 'create',
        target: {
          code: 'CARD-C',
          geometry: 'box',
          id: 'card-created',
          kind: 'card'
        },
        value: {
          code: 'CARD-C',
          detail: 'Created card',
          id: 'card-created',
          label: 'Card Created',
          placement: {
            box: { height: 40, width: 90, x: 240, y: 230 },
            ports: { east: 1 }
          },
          scope: 'scope',
          scopes: ['scope']
        }
      },
      {
        at: 1,
        operation: 'create',
        target: {
          code: 'FLOW-C',
          geometry: 'route',
          id: 'flow-created',
          kind: 'flow'
        },
        value: {
          code: 'FLOW-C',
          family: 'request',
          id: 'flow-created',
          points: [
            { x: 330, y: 250 },
            { x: 330, y: 195 },
            { x: 360, y: 195 }
          ],
          source: 'card-created',
          sourcePort: 'E1',
          target: 'card-b',
          targetPort: 'W1'
        }
      },
      {
        at: 2,
        operation: 'create',
        target: {
          code: null,
          geometry: 'box',
          id: 'graphic-created',
          kind: 'graphic'
        },
        value: {
          id: 'graphic-created',
          label: 'Graphic Created',
          placement: { height: 20, width: 70, x: 450, y: 90 },
          renderer: 'graphic-preview'
        }
      }
    ]

    const markup = renderToStaticMarkup(<Canvas artefactOperations={operations} config={initial} mode="design" />)

    for (const id of ['region-created', 'fabric-created', 'card-created', 'flow-created', 'graphic-created']) {
      expect(markup).toContain(`data-artefact-id="${id}"`)
    }
    expect(initial.infoschematic.regions).toHaveLength(1)
    expect(initial.infoschematic.cards).toHaveLength(2)
    expect(initial.infoschematic.flows).toHaveLength(1)
  })

  it('previews geometry, authored order, property replacement and safe removal', () => {
    const initial = config()
    const operations: readonly ArtefactDraftOperation[] = [
      {
        geometry: { box: { height: 260, width: 500, x: 30, y: 35 }, role: 'box' },
        operation: 'move',
        target: selection.region
      },
      {
        geometry: {
          box: { height: 90, width: 190, x: 90, y: 60 },
          role: 'box'
        },
        operation: 'resize',
        target: selection.fabric
      },
      {
        geometry: {
          box: { height: 70, width: 120, x: 300, y: 180 },
          role: 'box'
        },
        operation: 'move',
        target: selection.cardB
      },
      {
        from: 1,
        operation: 'reorder',
        target: selection.cardB,
        to: 0
      },
      {
        from: 1,
        operation: 'reorder',
        target: selection.graphicB,
        to: 0
      },
      {
        operation: 'replace-properties',
        target: selection.fabric,
        value: {
          ...initial.infoschematic.fabrics[0]!,
          appearance: {
            properties: { tone: 'drafted' },
            renderer: 'fabric-preview'
          },
          label: 'Fabric Replaced',
          placement: { box: { height: 90, width: 190, x: 90, y: 60 } }
        }
      },
      {
        operation: 'replace-properties',
        target: selection.graphicB,
        value: {
          ...initial.infoschematic.graphics[1]!,
          label: 'Graphic Replaced',
          properties: { caption: 'drafted' }
        }
      },
      { operation: 'remove', target: selection.cardA }
    ]

    const markup = renderToStaticMarkup(
      <Canvas artefactOperations={operations} config={initial} mode="design" renderers={renderers} />
    )

    expect(markup).toContain('Fabric Replaced:90,60,190,90:drafted')
    expect(markup).toContain('Graphic Replaced:350,80,80,30:drafted')
    expect(markup).not.toContain('data-artefact-id="card-a"')
    expect(markup).not.toContain('data-artefact-id="flow-a"')
    expect(markup.indexOf('data-artefact-id="graphic-b"')).toBeLessThan(markup.indexOf('data-artefact-id="graphic-a"'))
    expect(markup).toContain('aria-label="Region Region A"')
    expect(initial.infoschematic.fabrics[0]?.label).toBe('Fabric A')
  })

  it('keeps legacy position and route drafts over the materialised runtime', () => {
    const initial = config()
    const runtime = createInfoschematicRuntime(initial)
    const draftedFlow = {
      ...runtime.infoschematicFlows[0]!,
      d: 'M200 210 H340',
      points: [
        { x: 200, y: 210 },
        { x: 340, y: 210 }
      ]
    }
    const operations: readonly ArtefactDraftOperation[] = [
      {
        geometry: {
          box: { height: 50, width: 100, x: 120, y: 180 },
          role: 'box'
        },
        operation: 'move',
        target: selection.cardA
      }
    ]

    const markup = renderToStaticMarkup(
      <Canvas
        artefactOperations={operations}
        componentOffsets={new Map([['CARD-A', { dx: 15, dy: 5 }]])}
        config={initial}
        flows={[draftedFlow]}
        mode="design"
      />
    )

    expect(markup).toContain('d="M200 210 H340"')
    expect(markup).toContain('x="135"')
    expect(markup).toContain('y="185"')
  })

  it('uses a materialised Flow route when the supplied Flow has no route draft', () => {
    const initial = config()
    const operations: readonly ArtefactDraftOperation[] = [
      {
        operation: 'replace-properties',
        target: selection.flow,
        value: {
          ...initial.infoschematic.flows[0]!,
          dashed: true,
          points: [
            { x: 180, y: 205 },
            { x: 280, y: 205 },
            { x: 280, y: 215 },
            { x: 360, y: 215 }
          ]
        }
      }
    ]

    const markup = renderToStaticMarkup(<Canvas artefactOperations={operations} config={initial} mode="design" />)

    expect(markup).toContain('d="M180 205 H280 V215 H360"')
    expect(markup).toContain('dashed')
  })

  it('ignores rejected operations and preserves the active Present Graphic', () => {
    const initial = config()
    const duplicate: ArtefactOperation = {
      at: 0,
      operation: 'create',
      target: selection.cardA,
      value: initial.infoschematic.cards[0]!
    }
    const activeGraphic = {
      id: 'present-graphic',
      label: 'Present Graphic',
      properties: { caption: 'present' },
      renderer: 'graphic-preview'
    }
    const baseMarkup = renderToStaticMarkup(<Canvas config={initial} mode="design" />)
    const rejectedMarkup = renderToStaticMarkup(
      <Canvas artefactOperations={[duplicate]} config={initial} mode="design" />
    )
    const presentMarkup = renderToStaticMarkup(
      <Canvas
        artefactOperations={[{ operation: 'remove', target: selection.graphicA }]}
        config={initial}
        graphic={activeGraphic}
        renderers={renderers}
      />
    )

    expect(rejectedMarkup).toBe(baseMarkup)
    expect(presentMarkup).toContain('Present Graphic')
    expect(presentMarkup).toContain(':present')
    expect(presentMarkup).not.toContain('Graphic A:')
  })
})
