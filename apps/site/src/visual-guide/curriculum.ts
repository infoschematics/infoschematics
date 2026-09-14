export type SpecimenKind = 'canvas' | 'region' | 'fabric' | 'card' | 'flow' | 'point' | 'graphic'

// This author-facing projection stays byte-for-byte aligned with Domain Model's
// appearance catalogue. The broader guideProperties collection below adds
// geometry controls used only to teach the surrounding component records.
export const guideAppearanceOptions = {
  'card.compact': { control: 'flag', values: [] },
  'card.description': { control: 'flag', values: [] },
  'card.identity': { control: 'flag', values: [] },
  'card.stereotype': { control: 'flag', values: [] },
  grid: {
    control: 'choice',
    values: ['none', 'major', 'major-plus-minor', 'dots']
  },
  'region.fill': { control: 'colour', values: [] },
  'region.frame.opacity': {
    control: 'number',
    range: { max: 1, min: 0 },
    values: []
  },
  'region.frame.style': {
    control: 'choice',
    values: ['solid', 'dashed', 'dotted']
  },
  'region.labelMount': { control: 'choice', values: ['boundary', 'internal'] },
  'region.labelOffset': {
    control: 'number',
    range: { max: 200, min: -200 },
    values: []
  },
  'region.labelPlacement': {
    control: 'choice',
    values: ['north-west', 'north', 'north-east', 'west', 'center', 'east', 'south-west', 'south', 'south-east']
  },
  surface: { control: 'choice', values: ['neutral', 'blueprint'] }
} as const

export type GuidePropertyKey =
  | 'canvas.grid'
  | 'canvas.surface'
  | 'canvas.viewBox.height'
  | 'canvas.viewBox.width'
  | 'card.compact'
  | 'card.description'
  | 'card.height'
  | 'card.identity'
  | 'card.ports.east'
  | 'card.ports.north'
  | 'card.ports.south'
  | 'card.ports.west'
  | 'card.stereotype'
  | 'card.variant'
  | 'card.width'
  | 'fabric.caption'
  | 'fabric.height'
  | 'fabric.ports.east'
  | 'fabric.ports.north'
  | 'fabric.ports.south'
  | 'fabric.ports.west'
  | 'fabric.width'
  | 'flow.bidirectional'
  | 'flow.dashed'
  | 'flow.labelAlong'
  | 'graphic.height'
  | 'graphic.width'
  | 'point.x'
  | 'point.y'
  | 'point.ports.east'
  | 'point.ports.north'
  | 'point.ports.south'
  | 'point.ports.west'
  | 'region.fill'
  | 'region.fillOpacity'
  | 'region.frame.opacity'
  | 'region.frame.style'
  | 'region.height'
  | 'region.labelMount'
  | 'region.label'
  | 'region.labelOffset'
  | 'region.labelPlacement'
  | 'region.radius'
  | 'region.width'

export type GuidePropertyDescriptor = Readonly<{
  control: 'choice' | 'colour' | 'flag' | 'number' | 'text'
  range?: Readonly<{ max: number; min: number; step?: number }>
  values?: readonly string[]
}>

export const guideProperties: Readonly<Record<GuidePropertyKey, GuidePropertyDescriptor>> = {
  'canvas.surface': { control: 'choice', values: ['neutral', 'blueprint'] },
  'canvas.grid': {
    control: 'choice',
    values: ['none', 'major', 'major-plus-minor', 'dots']
  },
  'canvas.viewBox.width': {
    control: 'number',
    range: { min: 360, max: 1200, step: 20 }
  },
  'canvas.viewBox.height': {
    control: 'number',
    range: { min: 240, max: 800, step: 20 }
  },
  'region.width': {
    control: 'number',
    range: { min: 240, max: 620, step: 10 }
  },
  'region.height': {
    control: 'number',
    range: { min: 140, max: 320, step: 10 }
  },
  'region.radius': { control: 'number', range: { min: 0, max: 40, step: 2 } },
  'region.fill': { control: 'colour' },
  'region.fillOpacity': {
    control: 'number',
    range: { min: 0, max: 1, step: 0.05 }
  },
  'region.frame.style': {
    control: 'choice',
    values: ['solid', 'dashed', 'dotted']
  },
  'region.frame.opacity': {
    control: 'number',
    range: { min: 0, max: 1, step: 0.05 }
  },
  'region.labelPlacement': {
    control: 'choice',
    values: ['north-west', 'north', 'north-east', 'west', 'center', 'east', 'south-west', 'south', 'south-east']
  },
  'region.labelMount': { control: 'choice', values: ['boundary', 'internal'] },
  'region.label': { control: 'text' },
  'region.labelOffset': {
    control: 'number',
    range: { min: -200, max: 200, step: 5 }
  },
  'fabric.width': {
    control: 'number',
    range: { min: 160, max: 480, step: 10 }
  },
  'fabric.height': {
    control: 'number',
    range: { min: 80, max: 240, step: 10 }
  },
  'fabric.caption': { control: 'text' },
  'fabric.ports.north': {
    control: 'number',
    range: { min: 0, max: 4, step: 1 }
  },
  'fabric.ports.east': {
    control: 'number',
    range: { min: 0, max: 4, step: 1 }
  },
  'fabric.ports.south': {
    control: 'number',
    range: { min: 0, max: 4, step: 1 }
  },
  'fabric.ports.west': {
    control: 'number',
    range: { min: 0, max: 4, step: 1 }
  },
  'card.width': { control: 'number', range: { min: 160, max: 420, step: 10 } },
  'card.height': { control: 'number', range: { min: 80, max: 220, step: 10 } },
  'card.variant': { control: 'choice', values: ['standard', 'adapter'] },
  'card.ports.north': { control: 'number', range: { min: 0, max: 4, step: 1 } },
  'card.ports.east': { control: 'number', range: { min: 0, max: 4, step: 1 } },
  'card.ports.south': { control: 'number', range: { min: 0, max: 4, step: 1 } },
  'card.ports.west': { control: 'number', range: { min: 0, max: 4, step: 1 } },
  'card.compact': { control: 'flag' },
  'card.identity': { control: 'flag' },
  'card.stereotype': { control: 'flag' },
  'card.description': { control: 'flag' },
  'flow.dashed': { control: 'flag' },
  'flow.bidirectional': { control: 'flag' },
  'flow.labelAlong': {
    control: 'number',
    range: { min: 0.1, max: 0.9, step: 0.1 }
  },
  'point.x': { control: 'number', range: { min: 220, max: 500, step: 10 } },
  'point.y': { control: 'number', range: { min: 100, max: 300, step: 10 } },
  'point.ports.north': { control: 'number', range: { min: 0, max: 4, step: 1 } },
  'point.ports.east': { control: 'number', range: { min: 0, max: 4, step: 1 } },
  'point.ports.south': { control: 'number', range: { min: 0, max: 4, step: 1 } },
  'point.ports.west': { control: 'number', range: { min: 0, max: 4, step: 1 } },
  'graphic.width': {
    control: 'number',
    range: { min: 120, max: 420, step: 10 }
  },
  'graphic.height': {
    control: 'number',
    range: { min: 60, max: 220, step: 10 }
  }
}

export const propertyLabels: Readonly<Record<GuidePropertyKey, string>> = {
  'canvas.surface': 'Surface',
  'canvas.grid': 'Grid',
  'canvas.viewBox.width': 'View box width',
  'canvas.viewBox.height': 'View box height',
  'region.width': 'Width',
  'region.height': 'Height',
  'region.radius': 'Corner radius',
  'region.fill': 'Fill colour',
  'region.fillOpacity': 'Fill opacity',
  'region.frame.style': 'Frame style',
  'region.frame.opacity': 'Frame opacity',
  'region.labelPlacement': 'Label placement',
  'region.labelMount': 'Label mount',
  'region.label': 'Label',
  'region.labelOffset': 'Label offset',
  'fabric.width': 'Width',
  'fabric.height': 'Height',
  'fabric.caption': 'Caption',
  'fabric.ports.north': 'North ports',
  'fabric.ports.east': 'East ports',
  'fabric.ports.south': 'South ports',
  'fabric.ports.west': 'West ports',
  'card.width': 'Width',
  'card.height': 'Height',
  'card.variant': 'Card type',
  'card.ports.north': 'North ports',
  'card.ports.east': 'East ports',
  'card.ports.south': 'South ports',
  'card.ports.west': 'West ports',
  'card.compact': 'Compact layout',
  'card.identity': 'Identity code',
  'card.stereotype': 'Stereotype',
  'card.description': 'Description',
  'flow.dashed': 'Dashed line',
  'flow.bidirectional': 'Bidirectional',
  'flow.labelAlong': 'Label position',
  'point.x': 'Horizontal position',
  'point.y': 'Vertical position',
  'point.ports.north': 'North ports',
  'point.ports.east': 'East ports',
  'point.ports.south': 'South ports',
  'point.ports.west': 'West ports',
  'graphic.width': 'Width',
  'graphic.height': 'Height'
}

export type PropertyReference = Readonly<{
  name: string
  summary: string
}>

export type ComponentSection = Readonly<{
  id: SpecimenKind
  title: string
  layer: 'background' | 'midground' | 'foreground'
  summary: string
  propertyKeys: readonly GuidePropertyKey[]
  properties: readonly PropertyReference[]
}>

export const componentSections: readonly ComponentSection[] = [
  {
    id: 'canvas',
    title: 'Canvas',
    layer: 'background',
    summary:
      'The Canvas is the drawing area behind every element. Its view box sets the coordinate space; its surface and grid set the backdrop.',
    propertyKeys: ['canvas.surface', 'canvas.grid', 'canvas.viewBox.width', 'canvas.viewBox.height'],
    properties: [
      {
        name: 'viewBox',
        summary: 'The x, y, width, and height of the shared diagram coordinate space.'
      },
      {
        name: 'appearance.surface',
        summary: 'The neutral or blueprint surface; omitting it uses the neutral default.'
      },
      {
        name: 'appearance.grid',
        summary: 'No grid, major lines, major plus minor lines, or dots.'
      }
    ]
  },
  {
    id: 'region',
    title: 'Region',
    layer: 'background',
    summary:
      'A Region gives part of the Canvas a named boundary. It establishes geography; it is not a connectable component.',
    propertyKeys: [
      'region.width',
      'region.height',
      'region.radius',
      'region.fill',
      'region.fillOpacity',
      'region.frame.style',
      'region.frame.opacity',
      'region.labelPlacement',
      'region.labelMount',
      'region.label',
      'region.labelOffset'
    ],
    properties: [
      { name: 'id, label', summary: 'Stable identity and the visible name.' },
      {
        name: 'box',
        summary: 'Position, width, height, and optional corner radius.'
      },
      {
        name: 'fill',
        summary: 'Optional colour; an alpha channel makes it translucent.'
      },
      {
        name: 'frame',
        summary: 'Optional solid, dashed, or dotted border with opacity.'
      },
      {
        name: 'labelPlacement',
        summary: 'One of nine compass positions, or none.'
      },
      {
        name: 'labelMount, labelOffset',
        summary: 'Whether the label sits inside or on the boundary, and its edge offset.'
      }
    ]
  },
  {
    id: 'fabric',
    title: 'Fabric',
    layer: 'midground',
    summary:
      'A Fabric is a connectable plane or shared substrate. Unlike a Region, it can be the source or target of a Flow.',
    propertyKeys: [
      'fabric.width',
      'fabric.height',
      'fabric.caption',
      'fabric.ports.north',
      'fabric.ports.east',
      'fabric.ports.south',
      'fabric.ports.west'
    ],
    properties: [
      {
        name: 'id, code, label, detail',
        summary: 'Stable identity and reader-facing text.'
      },
      {
        name: 'scope, scopes, scopeRule',
        summary: 'Default scope and the applicability rule.'
      },
      {
        name: 'conformsTo, services',
        summary: 'Optional specifications and services associated with the Fabric.'
      },
      {
        name: 'placement',
        summary: 'A box plus optional ports on its four sides.'
      },
      {
        name: 'appearance.renderer',
        summary: 'The stable renderer key used by the host.'
      },
      {
        name: 'appearance.caption, detail, properties',
        summary: 'Portable values passed to that renderer.'
      }
    ]
  },
  {
    id: 'card',
    title: 'Card',
    layer: 'foreground',
    summary:
      'A Card is a placed component. It carries identity and meaning, and its ports make it connectable to Flows.',
    propertyKeys: [
      'card.variant',
      'card.width',
      'card.height',
      'card.ports.north',
      'card.ports.east',
      'card.ports.south',
      'card.ports.west',
      'card.compact',
      'card.identity',
      'card.stereotype',
      'card.description'
    ],
    properties: [
      {
        name: 'id, code, label, detail',
        summary: 'Stable identity and reader-facing text.'
      },
      {
        name: 'scope, scopes, scopeRule',
        summary: 'Default scope and the applicability rule.'
      },
      {
        name: 'conformsTo, services',
        summary: 'Optional specifications and services associated with the Card.'
      },
      {
        name: 'domain, stereotype, wraps',
        summary: 'Optional classification and composition metadata.'
      },
      {
        name: 'placement',
        summary: 'A box plus optional ports on its four sides.'
      },
      {
        name: 'appearance.card',
        summary: 'Shared compactness and metadata-visibility defaults.'
      }
    ]
  },
  {
    id: 'flow',
    title: 'Flow',
    layer: 'foreground',
    summary:
      'A Flow is a meaningful connection between ports. Its authored points preserve the route instead of asking a renderer to invent one.',
    propertyKeys: ['flow.dashed', 'flow.bidirectional', 'flow.labelAlong'],
    properties: [
      {
        name: 'id, code, family',
        summary: 'Stable identity and the Flow Family that supplies its visual identity.'
      },
      {
        name: 'source, sourcePort, target, targetPort',
        summary: 'The two connected artefacts and their named ports.'
      },
      {
        name: 'points',
        summary: 'The authored route through diagram coordinates.'
      },
      {
        name: 'label.along',
        summary: 'The label position along the route, from 0 to 1.'
      },
      {
        name: 'operation, conformsTo, over',
        summary: 'Optional semantics and specification references.'
      },
      {
        name: 'bidirectional, dashed',
        summary: 'Direction and line-style properties.'
      }
    ]
  },
  {
    id: 'point',
    title: 'Point',
    layer: 'foreground',
    summary:
      'A Point is a labelled junction or anchor. It becomes useful when Flows meet, split, or need an explicit waypoint with identity.',
    propertyKeys: [
      'point.x',
      'point.y',
      'point.ports.north',
      'point.ports.east',
      'point.ports.south',
      'point.ports.west'
    ],
    properties: [
      { name: 'id, code, label', summary: 'Stable identity and visible text.' },
      {
        name: 'scopes',
        summary: 'The scopes in which the Point is applicable.'
      },
      {
        name: 'point',
        summary: 'Its x and y position in diagram coordinates.'
      },
      {
        name: 'ports',
        summary: 'Optional connectable positions on its four sides.'
      }
    ]
  },
  {
    id: 'graphic',
    title: 'Graphic',
    layer: 'foreground',
    summary:
      'A Graphic reserves a placed visual supplied by a renderer. Scenes can reveal it when an explanation needs more than the structural diagram.',
    propertyKeys: ['graphic.width', 'graphic.height'],
    properties: [
      {
        name: 'id, label',
        summary: 'Stable identity and an optional accessible name.'
      },
      {
        name: 'renderer',
        summary: 'The stable renderer key used by the host.'
      },
      { name: 'placement', summary: 'An optional x, y, width, and height.' },
      { name: 'scopes', summary: 'Optional scope applicability.' },
      {
        name: 'properties',
        summary: 'Portable string, number, or boolean values for the renderer.'
      }
    ]
  }
]

export const guidePropertyKeys = Object.keys(guideProperties) as readonly GuidePropertyKey[]

export const uncataloguedGuideProperties = guidePropertyKeys.filter(
  (key) => !componentSections.some((section) => section.propertyKeys.includes(key))
)
