export type AppearanceOptionKey =
  | 'card.compact'
  | 'card.description'
  | 'card.identity'
  | 'card.stereotype'
  | 'grid'
  | 'region.fill'
  | 'region.frame.opacity'
  | 'region.frame.style'
  | 'region.labelMount'
  | 'region.labelOffset'
  | 'region.labelPlacement'
  | 'surface'

type GuideAppearanceOption = {
  control: 'choice' | 'colour' | 'flag' | 'number'
  range?: Readonly<{ max: number; min: number }>
  values: readonly string[]
}

export const guideAppearanceOptions: Readonly<Record<AppearanceOptionKey, GuideAppearanceOption>> = {
  surface: { control: 'choice', values: ['neutral', 'blueprint'] },
  grid: { control: 'choice', values: ['none', 'major', 'major-plus-minor', 'dots'] },
  'card.compact': { control: 'flag', values: [] },
  'card.description': { control: 'flag', values: [] },
  'card.identity': { control: 'flag', values: [] },
  'card.stereotype': { control: 'flag', values: [] },
  'region.fill': { control: 'colour', values: [] },
  'region.frame.opacity': { control: 'number', range: { max: 1, min: 0 }, values: [] },
  'region.frame.style': { control: 'choice', values: ['solid', 'dashed', 'dotted'] },
  'region.labelMount': { control: 'choice', values: ['boundary', 'internal'] },
  'region.labelOffset': { control: 'number', range: { max: 200, min: -200 }, values: [] },
  'region.labelPlacement': {
    control: 'choice',
    values: ['north-west', 'north', 'north-east', 'west', 'center', 'east', 'south-west', 'south', 'south-east']
  }
}

export const guideAppearanceOptionKeys = Object.keys(guideAppearanceOptions) as readonly AppearanceOptionKey[]

export type VisualArtefact = {
  id: 'card' | 'fabric' | 'flow' | 'graphic' | 'point' | 'region'
  title: string
  layer: 'background' | 'midground' | 'foreground'
  summary: string
}

export const visualArtefacts: readonly VisualArtefact[] = [
  {
    id: 'region',
    title: 'Region',
    layer: 'background',
    summary: 'Authored geography: a labelled box with an optional fill and frame.'
  },
  {
    id: 'fabric',
    title: 'Fabric',
    layer: 'midground',
    summary: 'A connectable plane or backdrop that can participate in Flows and Scene focus.'
  },
  {
    id: 'card',
    title: 'Card',
    layer: 'foreground',
    summary: 'A placed component with identity, scope, optional domain, and optional descriptive detail.'
  },
  {
    id: 'flow',
    title: 'Flow',
    layer: 'foreground',
    summary: 'A semantic connection whose family, endpoints, direction, and route remain authored data.'
  },
  {
    id: 'point',
    title: 'Point',
    layer: 'foreground',
    summary: 'A labelled junction or anchor placed directly on the diagram.'
  },
  {
    id: 'graphic',
    title: 'Graphic',
    layer: 'foreground',
    summary: 'A renderer-selected overlay, normally revealed by a Scene rather than always visible.'
  }
]

export const visualGroupings = [
  { id: 'scope', title: 'Scope', summary: 'Controls which scoped artefacts are applicable or visible.' },
  { id: 'domain', title: 'Domain', summary: 'Classifies Cards by sphere of concern and supplies a visual treatment.' },
  {
    id: 'flow-family',
    title: 'Flow Family',
    summary: 'Classifies what a Flow carries and supplies its colour and identity.'
  }
] as const

export type TreatmentSection = {
  id: 'canvas-treatments' | 'region-treatments' | 'card-treatments'
  title: string
  termId: 'infoschematic' | 'region' | 'standard-card'
  summary: string
  optionKeys: readonly AppearanceOptionKey[]
}

export const treatmentSections: readonly TreatmentSection[] = [
  {
    id: 'canvas-treatments',
    title: 'Canvas treatments',
    termId: 'infoschematic',
    summary: 'Surface establishes the overall backdrop; grid adds coordinate texture without changing structure.',
    optionKeys: ['surface', 'grid']
  },
  {
    id: 'region-treatments',
    title: 'Region treatments',
    termId: 'region',
    summary: 'Fill and frame establish geography while label placement, mount, and offset keep its name legible.',
    optionKeys: [
      'region.fill',
      'region.frame.style',
      'region.frame.opacity',
      'region.labelPlacement',
      'region.labelMount',
      'region.labelOffset'
    ]
  },
  {
    id: 'card-treatments',
    title: 'Card treatments',
    termId: 'standard-card',
    summary: 'Card options control composition and optional visible metadata without deleting authored information.',
    optionKeys: ['card.compact', 'card.identity', 'card.stereotype', 'card.description']
  }
]

export const optionLabels: Readonly<Record<AppearanceOptionKey, string>> = {
  surface: 'Surface',
  grid: 'Grid',
  'card.compact': 'Compact composition',
  'card.description': 'Description',
  'card.identity': 'Identity code',
  'card.stereotype': 'Stereotype',
  'region.fill': 'Fill',
  'region.frame.opacity': 'Frame opacity',
  'region.frame.style': 'Frame style',
  'region.labelMount': 'Label mount',
  'region.labelOffset': 'Label offset',
  'region.labelPlacement': 'Label placement'
}

export const uncataloguedGuideOptions = guideAppearanceOptionKeys.filter(
  (key) => !treatmentSections.some((section) => section.optionKeys.includes(key))
)
