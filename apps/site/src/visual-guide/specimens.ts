import { defineInfoschematic, type InfoschematicConfig } from '@infoschematics/domain-core'
import { stringify } from 'yaml'
import type { GuidePropertyKey, SpecimenKind } from './curriculum.ts'

export type GuidePropertyValue = boolean | number | string

const viewBox = { x: 0, y: 0, width: 720, height: 400 }

const completeSpecimen = () =>
  defineInfoschematic({
    title: 'Labelled Infoschematic example',
    subtitle: 'Every visible diagram component shown in context.',
    infoschematic: {
      viewBox,
      appearance: {
        surface: 'blueprint',
        grid: 'major-plus-minor',
        card: {
          compact: false,
          description: true,
          identity: true,
          stereotype: true
        }
      },
      scopes: [
        {
          id: 'primary',
          label: 'Primary',
          prefix: 'PRI',
          description: 'Primary guide scope',
          color: '#79c9ff',
          fill: '#0d1b2a'
        },
        {
          id: 'secondary',
          label: 'Secondary',
          prefix: 'SEC',
          description: 'Secondary guide scope',
          color: '#48c6a8',
          fill: '#0d1b2a'
        }
      ],
      domains: [{ id: 'example', label: 'Example', color: '#82b366', fill: '#0d1b2a' }],
      flowFamilies: [
        {
          id: 'connection',
          label: 'Flow',
          prefix: 'FLOW',
          description: 'A meaningful connection',
          color: '#79c9ff'
        }
      ],
      regions: [
        {
          id: 'region',
          label: 'Region',
          box: { x: 30, y: 30, width: 660, height: 330, radius: 10 },
          fill: '#12273b24',
          frame: { style: 'solid', opacity: 1 },
          labelMount: 'boundary',
          labelOffset: 0,
          labelPlacement: 'north-west'
        }
      ],
      fabrics: [
        {
          id: 'fabric',
          code: 'FAB-01',
          label: 'Fabric',
          detail: 'Connectable plane',
          scopes: ['primary'],
          scope: 'primary',
          placement: {
            box: { x: 70, y: 110, width: 220, height: 120 },
            ports: { east: 1 }
          },
          appearance: { renderer: 'default', caption: 'Fabric' }
        }
      ],
      cards: [
        {
          id: 'card',
          code: 'CARD-01',
          label: 'Card',
          detail: 'Placed component',
          scopes: ['secondary'],
          scope: 'secondary',
          domain: 'example',
          stereotype: 'Component',
          placement: {
            box: { x: 430, y: 110, width: 220, height: 120 },
            ports: { west: 1, south: 1 }
          }
        }
      ],
      points: [
        {
          id: 'point',
          code: 'POINT-01',
          label: 'Point',
          scopes: ['secondary'],
          point: { x: 540, y: 310 },
          ports: { north: 1 }
        }
      ],
      flows: [
        {
          id: 'flow',
          code: 'FLOW-01',
          family: 'connection',
          source: 'fabric',
          sourcePort: 'E1',
          target: 'card',
          targetPort: 'W1',
          label: { along: 0.5 },
          points: [
            { x: 290, y: 170 },
            { x: 430, y: 170 }
          ]
        },
        {
          id: 'point-flow',
          code: 'FLOW-02',
          family: 'connection',
          source: 'card',
          sourcePort: 'S1',
          target: 'point',
          targetPort: 'N1',
          label: { along: 0.55 },
          points: [
            { x: 540, y: 230 },
            { x: 540, y: 310 }
          ]
        }
      ],
      graphics: [
        {
          id: 'graphic',
          label: 'Graphic',
          renderer: 'guide-graphic',
          placement: { x: 70, y: 270, width: 220, height: 70 },
          scopes: ['primary']
        }
      ]
    }
  })

const withDiagramParts = (
  config: InfoschematicConfig,
  parts: Partial<
    Pick<InfoschematicConfig['infoschematic'], 'regions' | 'fabrics' | 'cards' | 'flows' | 'points' | 'graphics'>
  >
): InfoschematicConfig => ({
  ...config,
  infoschematic: {
    ...config.infoschematic,
    regions: [],
    fabrics: [],
    cards: [],
    flows: [],
    points: [],
    graphics: [],
    ...parts
  }
})

/**
 * One drawing that leaves to the palette everything a document does not state, so a scheme is what decides it.
 *
 * Every other specimen authors a blueprint surface and fills tuned for it, which is a deliberate treatment and
 * therefore the same in either scheme — correct, and useless for showing what a scheme changes. This one authors
 * no surface, no grid colour, no Region fill and no frame colour, so paper, grid, frames and every piece of type
 * come from the palette. A Card still names a Scope and a Flow still names a family, and both carry an author's
 * colour: those stay put in either scheme, which is the other half of what the page has to show.
 */
export const schemeSpecimen: InfoschematicConfig = defineInfoschematic({
  title: 'Colour scheme example',
  subtitle: 'The same definition, painted by the scheme it is read in.',
  infoschematic: {
    viewBox: { x: 0, y: 0, width: 720, height: 260 },
    appearance: { grid: 'major-plus-minor', card: { identity: true, stereotype: true } },
    /* Mid-tone rather than tuned to a paper: an authored colour is not repainted by a scheme, so one chosen for
       light paper would still be sitting on dark paper under the other preference. The ink over it is resolved
       from its luminance either way. */
    scopes: [
      {
        id: 'placed',
        label: 'Placed',
        prefix: 'PLA',
        description: 'Placed components',
        color: '#79c9ff',
        fill: '#3f5a70'
      }
    ],
    flowFamilies: [
      { id: 'connection', label: 'Flow', prefix: 'FLOW', description: 'A meaningful connection', color: '#79c9ff' }
    ],
    regions: [
      {
        id: 'region',
        label: 'Region',
        box: { x: 30, y: 30, width: 660, height: 200, radius: 10 },
        frame: { style: 'solid', opacity: 1 },
        labelMount: 'boundary',
        labelPlacement: 'north-west'
      }
    ],
    cards: [
      {
        id: 'source',
        code: 'CARD-01',
        label: 'Source',
        detail: 'Placed component',
        stereotype: 'Component',
        scopes: ['placed'],
        scope: 'placed',
        placement: { box: { x: 80, y: 90, width: 220, height: 100 }, ports: { east: 1 } }
      },
      {
        id: 'target',
        code: 'CARD-02',
        label: 'Target',
        detail: 'Placed component',
        stereotype: 'Component',
        scopes: ['placed'],
        scope: 'placed',
        placement: { box: { x: 420, y: 90, width: 220, height: 100 }, ports: { west: 1 } }
      }
    ],
    fabrics: [],
    points: [],
    flows: [
      {
        id: 'flow',
        code: 'FLOW-01',
        family: 'connection',
        source: 'source',
        sourcePort: 'E1',
        target: 'target',
        targetPort: 'W1',
        label: { along: 0.5 },
        points: [
          { x: 300, y: 140 },
          { x: 420, y: 140 }
        ]
      }
    ],
    graphics: []
  }
})

export const anatomySpecimen = completeSpecimen()

export function specimenFor(kind: SpecimenKind): InfoschematicConfig {
  const config = completeSpecimen()
  const { regions, fabrics, cards, flows, points, graphics } = config.infoschematic

  switch (kind) {
    case 'canvas':
      return withDiagramParts(config, {})
    case 'region':
      return withDiagramParts(config, {
        regions: regions.map((region) => ({
          ...region,
          box: { x: 100, y: 70, width: 520, height: 260, radius: 10 }
        }))
      })
    case 'fabric':
      return withDiagramParts(config, {
        fabrics: fabrics.map((fabric) => ({
          ...fabric,
          placement: {
            box: { x: 210, y: 130, width: 300, height: 140 },
            ports: { east: 1, north: 1, south: 1, west: 1 }
          }
        }))
      })
    case 'card':
      return withDiagramParts(config, {
        cards: cards.map((card) => ({
          ...card,
          placement: {
            box: { x: 250, y: 140, width: 220, height: 120 },
            ports: { east: 1, north: 1, south: 1, west: 1 }
          }
        }))
      })
    case 'flow':
      return withDiagramParts(config, {
        fabrics: fabrics.map((fabric) => ({
          ...fabric,
          placement: {
            box: { x: 70, y: 140, width: 220, height: 120 },
            ports: { east: 1 }
          }
        })),
        cards: cards.map((card) => ({
          ...card,
          placement: {
            box: { x: 430, y: 140, width: 220, height: 120 },
            ports: { west: 1 }
          }
        })),
        flows: flows.slice(0, 1).map((flow) => ({
          ...flow,
          points: [
            { x: 290, y: 200 },
            { x: 430, y: 200 }
          ]
        }))
      })
    case 'point':
      return withDiagramParts(config, {
        cards: cards.map((card) => ({
          ...card,
          placement: {
            box: { x: 250, y: 70, width: 220, height: 120 },
            ports: { south: 1 }
          }
        })),
        flows: flows.slice(1).map((flow) => ({
          ...flow,
          points: [
            { x: 360, y: 190 },
            { x: 360, y: 280 }
          ]
        })),
        points: points.map((point) => ({
          ...point,
          point: { x: 360, y: 280 },
          ports: { north: 1 }
        }))
      })
    case 'graphic':
      return withDiagramParts(config, {
        graphics: graphics.map((graphic) => ({
          ...graphic,
          label: 'Graphic',
          placement: { x: 180, y: 120, width: 360, height: 160 },
          properties: {
            text: 'Any serialisable properties the treatment reads: strings, numbers, and flags.',
            tone: 'quiet'
          }
        }))
      })
  }
}

const regionFill = (config: InfoschematicConfig) => config.infoschematic.regions[0]?.fill ?? '#12273b24'

const colourWithoutAlpha = (value: string) => (/^#[0-9a-f]{8}$/i.test(value) ? value.slice(0, 7) : value)

const opacityFromColour = (value: string) =>
  /^#[0-9a-f]{8}$/i.test(value) ? Number.parseInt(value.slice(7), 16) / 255 : 1

const colourWithOpacity = (value: string, opacity: number) => {
  const colour = /^#[0-9a-f]{6}$/i.test(value) ? value : '#12273b'
  const alpha = Math.round(Math.min(1, Math.max(0, opacity)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${colour}${alpha}`
}

export const guidePropertyValue = (config: InfoschematicConfig, key: GuidePropertyKey): GuidePropertyValue => {
  const diagram = config.infoschematic
  const region = diagram.regions[0]
  const fabric = diagram.fabrics[0]
  const card = diagram.cards[0]
  const flow = diagram.flows[0]
  const point = diagram.points[0]
  const graphic = diagram.graphics[0]

  switch (key) {
    case 'canvas.viewBox.width':
      return diagram.viewBox.width
    case 'canvas.viewBox.height':
      return diagram.viewBox.height
    case 'canvas.surface':
      return diagram.appearance?.surface ?? 'neutral'
    case 'canvas.grid':
      return diagram.appearance?.grid ?? 'none'
    case 'region.width':
      return region?.box.width ?? 0
    case 'region.label':
      return region?.label ?? ''
    case 'region.height':
      return region?.box.height ?? 0
    case 'region.radius':
      return region?.box.radius ?? 0
    case 'region.fill':
      return colourWithoutAlpha(regionFill(config))
    case 'region.fillOpacity':
      return opacityFromColour(regionFill(config))
    case 'region.frame.style':
      return region?.frame?.style ?? 'solid'
    case 'region.frame.opacity':
      return region?.frame?.opacity ?? 1
    case 'region.labelPlacement':
      return region?.labelPlacement ?? 'north-west'
    case 'region.labelMount':
      return region?.labelMount ?? 'boundary'
    case 'region.labelOffset':
      return region?.labelOffset ?? 0
    case 'fabric.width':
      return fabric?.placement.box.width ?? 0
    case 'fabric.height':
      return fabric?.placement.box.height ?? 0
    case 'fabric.caption':
      return fabric?.appearance?.caption ?? ''
    case 'fabric.ports.north':
      return fabric?.placement.ports?.north ?? 0
    case 'fabric.ports.east':
      return fabric?.placement.ports?.east ?? 0
    case 'fabric.ports.south':
      return fabric?.placement.ports?.south ?? 0
    case 'fabric.ports.west':
      return fabric?.placement.ports?.west ?? 0
    case 'card.width':
      return card?.placement.box.width ?? 0
    case 'card.height':
      return card?.placement.box.height ?? 0
    case 'card.variant':
      return diagram.cards.some(({ wraps }) => Boolean(wraps)) ? 'adapter' : 'standard'
    case 'card.ports.north':
      return card?.placement.ports?.north ?? 0
    case 'card.ports.east':
      return card?.placement.ports?.east ?? 0
    case 'card.ports.south':
      return card?.placement.ports?.south ?? 0
    case 'card.ports.west':
      return card?.placement.ports?.west ?? 0
    case 'card.compact':
      return diagram.appearance?.card?.compact ?? false
    case 'card.identity':
      return diagram.appearance?.card?.identity ?? false
    case 'card.stereotype':
      return diagram.appearance?.card?.stereotype ?? false
    case 'card.description':
      return diagram.appearance?.card?.description ?? false
    case 'flow.dashed':
      return flow?.dashed ?? false
    case 'flow.bidirectional':
      return flow?.bidirectional ?? false
    case 'flow.labelAlong':
      return flow?.label?.along ?? 0.5
    case 'point.x':
      return point?.point.x ?? 0
    case 'point.y':
      return point?.point.y ?? 0
    case 'point.ports.north':
      return point?.ports?.north ?? 0
    case 'point.ports.east':
      return point?.ports?.east ?? 0
    case 'point.ports.south':
      return point?.ports?.south ?? 0
    case 'point.ports.west':
      return point?.ports?.west ?? 0
    case 'graphic.width':
      return graphic?.placement?.width ?? 0
    case 'graphic.height':
      return graphic?.placement?.height ?? 0
  }
}

const updateFirst = <T>(items: readonly T[], update: (item: T) => T): readonly T[] =>
  items.map((item, index) => (index === 0 ? update(item) : item))

export const withGuideProperty = (
  config: InfoschematicConfig,
  key: GuidePropertyKey,
  value: GuidePropertyValue
): InfoschematicConfig => {
  const diagram = config.infoschematic
  const appearance = diagram.appearance ?? {}

  if (key === 'canvas.surface' || key === 'canvas.grid') {
    const field = key.slice('canvas.'.length)
    return {
      ...config,
      infoschematic: {
        ...diagram,
        appearance: { ...appearance, [field]: value }
      }
    } as InfoschematicConfig
  }

  if (key === 'canvas.viewBox.width' || key === 'canvas.viewBox.height') {
    const axis = key.endsWith('width') ? 'width' : 'height'
    return {
      ...config,
      infoschematic: {
        ...diagram,
        viewBox: { ...diagram.viewBox, [axis]: Number(value) }
      }
    }
  }

  if (key.startsWith('region.')) {
    const regions = updateFirst(diagram.regions, (region) => {
      if (key === 'region.width' || key === 'region.height' || key === 'region.radius') {
        const field = key.slice('region.'.length)
        return { ...region, box: { ...region.box, [field]: Number(value) } }
      }
      if (key === 'region.label') return { ...region, label: String(value) }
      if (key === 'region.fill') {
        return {
          ...region,
          fill: colourWithOpacity(String(value), opacityFromColour(regionFill(config)))
        }
      }
      if (key === 'region.fillOpacity') {
        return {
          ...region,
          fill: colourWithOpacity(colourWithoutAlpha(regionFill(config)), Number(value))
        }
      }
      if (key === 'region.frame.opacity') {
        return {
          ...region,
          frame: {
            style: region.frame?.style ?? 'solid',
            opacity: Number(value)
          }
        }
      }
      if (key === 'region.frame.style') {
        const style = String(value) as NonNullable<typeof region.frame>['style']
        return { ...region, frame: { ...region.frame, style } }
      }
      return { ...region, [key.slice('region.'.length)]: value }
    })
    return {
      ...config,
      infoschematic: { ...diagram, regions }
    } as InfoschematicConfig
  }

  if (key.startsWith('fabric.')) {
    const fabrics = updateFirst(diagram.fabrics, (fabric) => {
      const field = key.slice('fabric.'.length)
      if (field === 'caption') {
        return {
          ...fabric,
          appearance: {
            ...fabric.appearance,
            renderer: fabric.appearance?.renderer ?? 'default',
            caption: String(value)
          }
        }
      }
      if (field.startsWith('ports.')) {
        const side = field.slice('ports.'.length) as 'east' | 'north' | 'south' | 'west'
        return {
          ...fabric,
          placement: {
            ...fabric.placement,
            ports: { ...fabric.placement.ports, [side]: Number(value) }
          }
        }
      }
      return {
        ...fabric,
        placement: {
          ...fabric.placement,
          box: { ...fabric.placement.box, [field]: Number(value) }
        }
      }
    })
    return {
      ...config,
      infoschematic: { ...diagram, fabrics }
    } as InfoschematicConfig
  }

  if (key.startsWith('card.')) {
    const field = key.slice('card.'.length)
    if (field === 'variant') {
      const standard = diagram.cards.find(({ wraps }) => !wraps)
      if (!standard) return config
      const cards =
        value === 'adapter'
          ? [
              standard,
              {
                ...standard,
                id: 'adapter-card',
                code: 'ADAPTER-01',
                label: 'Adapter Card',
                detail: 'Wraps the Standard Card',
                stereotype: 'Adapter',
                wraps: standard.id
              }
            ]
          : [standard]
      return {
        ...config,
        infoschematic: { ...diagram, cards }
      } as InfoschematicConfig
    }
    if (field.startsWith('ports.')) {
      const side = field.slice('ports.'.length) as 'east' | 'north' | 'south' | 'west'
      const cards = updateFirst(diagram.cards, (card) => ({
        ...card,
        placement: {
          ...card.placement,
          ports: { ...card.placement.ports, [side]: Number(value) }
        }
      }))
      return {
        ...config,
        infoschematic: { ...diagram, cards }
      } as InfoschematicConfig
    }
    if (field === 'width' || field === 'height') {
      const cards = updateFirst(diagram.cards, (card) => ({
        ...card,
        placement: {
          ...card.placement,
          box: { ...card.placement.box, [field]: Number(value) }
        }
      }))
      return {
        ...config,
        infoschematic: { ...diagram, cards }
      } as InfoschematicConfig
    }
    return {
      ...config,
      infoschematic: {
        ...diagram,
        appearance: {
          ...appearance,
          card: { ...appearance.card, [field]: Boolean(value) }
        }
      }
    } as InfoschematicConfig
  }

  if (key.startsWith('flow.')) {
    const field = key.slice('flow.'.length)
    const flows = updateFirst(diagram.flows, (flow) =>
      field === 'labelAlong' ? { ...flow, label: { along: Number(value) } } : { ...flow, [field]: Boolean(value) }
    )
    return {
      ...config,
      infoschematic: { ...diagram, flows }
    } as InfoschematicConfig
  }

  if (key.startsWith('point.ports.')) {
    const side = key.slice('point.ports.'.length) as 'east' | 'north' | 'south' | 'west'
    const points = updateFirst(diagram.points, (point) => ({
      ...point,
      ports: { ...point.ports, [side]: Number(value) }
    }))
    return { ...config, infoschematic: { ...diagram, points } } as InfoschematicConfig
  }

  if (key.startsWith('point.')) {
    const axis = key.slice('point.'.length) as 'x' | 'y'
    const points = updateFirst(diagram.points, (point) => ({
      ...point,
      point: { ...point.point, [axis]: Number(value) }
    }))
    const movedPoint = points[0]?.point
    const flows = movedPoint
      ? updateFirst(diagram.flows, (flow) => ({
          ...flow,
          points: flow.points.map((routePoint, index) => (index === flow.points.length - 1 ? movedPoint : routePoint))
        }))
      : diagram.flows
    return {
      ...config,
      infoschematic: { ...diagram, flows, points }
    } as InfoschematicConfig
  }

  const field = key.slice('graphic.'.length)
  const graphics = updateFirst(diagram.graphics, (graphic) => ({
    ...graphic,
    placement: {
      x: graphic.placement?.x ?? 76,
      y: graphic.placement?.y ?? 276,
      width: graphic.placement?.width ?? 214,
      height: graphic.placement?.height ?? 64,
      [field]: Number(value)
    }
  }))
  return {
    ...config,
    infoschematic: { ...diagram, graphics }
  } as InfoschematicConfig
}

/**
 * The same specimen drawn under one standard treatment.
 *
 * The catalogue is the product's own artwork rather than a host's, so the guide shows it by name: each standard key
 * is the same placed element under a different treatment, which is what an author choosing one needs to compare.
 */
export const withGuideTreatment = (
  config: InfoschematicConfig,
  kind: 'fabric' | 'graphic',
  renderer: string
): InfoschematicConfig => {
  const diagram = config.infoschematic
  if (kind === 'fabric')
    return {
      ...config,
      infoschematic: {
        ...diagram,
        fabrics: updateFirst(diagram.fabrics, (fabric) => ({
          ...fabric,
          appearance: { ...fabric.appearance, renderer }
        }))
      }
    } as InfoschematicConfig
  return {
    ...config,
    infoschematic: {
      ...diagram,
      graphics: updateFirst(diagram.graphics, (graphic) => ({ ...graphic, renderer }))
    }
  } as InfoschematicConfig
}

export type SpecimenSnippetFormat = 'typescript' | 'yaml'

const specimenSnippetInput = (config: InfoschematicConfig, kind: SpecimenKind) => {
  const diagram = config.infoschematic
  const backdrop = {
    surface: diagram.appearance?.surface,
    grid: diagram.appearance?.grid
  }
  const base = { viewBox: diagram.viewBox, appearance: backdrop }

  switch (kind) {
    case 'canvas':
      return { infoschematic: base }
    case 'region':
      return { infoschematic: { ...base, regions: diagram.regions } }
    case 'fabric':
      return {
        infoschematic: {
          ...base,
          scopes: diagram.scopes,
          fabrics: diagram.fabrics
        }
      }
    case 'card':
      return {
        infoschematic: {
          ...base,
          appearance: { ...backdrop, card: diagram.appearance?.card },
          scopes: diagram.scopes,
          domains: diagram.domains,
          cards: diagram.cards
        }
      }
    case 'flow':
      return {
        infoschematic: {
          ...base,
          scopes: diagram.scopes,
          domains: diagram.domains,
          flowFamilies: diagram.flowFamilies,
          fabrics: diagram.fabrics,
          cards: diagram.cards,
          flows: diagram.flows
        }
      }
    case 'point':
      return {
        infoschematic: {
          ...base,
          scopes: diagram.scopes,
          domains: diagram.domains,
          flowFamilies: diagram.flowFamilies,
          cards: diagram.cards,
          points: diagram.points,
          flows: diagram.flows
        }
      }
    case 'graphic':
      return {
        infoschematic: {
          ...base,
          scopes: diagram.scopes,
          graphics: diagram.graphics
        }
      }
  }
}

export function specimenSnippet(config: InfoschematicConfig, kind: SpecimenKind, format: SpecimenSnippetFormat) {
  const input = specimenSnippetInput(config, kind)
  if (format === 'yaml') return stringify(input, { lineWidth: 0 })

  return `import { defineInfoschematic } from '@infoschematics/domain-core'

export const ${kind}Example = defineInfoschematic(${JSON.stringify(input, null, 2)})
`
}
