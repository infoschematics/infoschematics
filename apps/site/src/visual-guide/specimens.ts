import {
  type CardDetailDefaults,
  defineInfoschematic,
  type GridTreatment,
  gridTreatments,
  type InfoschematicConfig,
  type RegionLabelPlacement,
  regionLabelPlacements,
  type SurfaceTreatment,
  surfaceTreatments
} from '@infoschematics/domain-core'

export interface Specimen {
  key: string
  caption: string
  config: InfoschematicConfig
}

const specimenViewBox = { x: 0, y: 0, width: 320, height: 200 } as const

function specimen(
  key: string,
  caption: string,
  options: {
    surface?: SurfaceTreatment
    grid?: GridTreatment
    labelPlacement?: RegionLabelPlacement
    card?: CardDetailDefaults
  } = {}
): Specimen {
  return {
    key,
    caption,
    config: defineInfoschematic({
      title: caption,
      infoschematic: {
        viewBox: specimenViewBox,
        appearance: {
          surface: options.surface,
          grid: options.grid,
          card: options.card
        },
        regions: [
          {
            id: 'region',
            label: 'Region',
            box: { x: 20, y: 20, width: 280, height: 160, radius: 8 },
            frame: { style: 'solid' },
            labelPlacement: options.labelPlacement ?? 'north-west'
          }
        ],
        cards: [
          {
            id: 'card',
            code: 'CARD-01',
            label: 'Card',
            detail: 'Specimen card',
            scopes: [],
            scope: 'region',
            stereotype: 'Service',
            placement: { box: { x: 60, y: 80, width: 200, height: 70 } }
          }
        ]
      }
    })
  }
}

export const surfaceSpecimens: readonly Specimen[] = surfaceTreatments.map((surface) =>
  specimen(`surface-${surface}`, surface, { surface })
)

export const gridSpecimens: readonly Specimen[] = gridTreatments.map((grid) => specimen(`grid-${grid}`, grid, { grid }))

export const regionLabelPlacementSpecimens: readonly Specimen[] = regionLabelPlacements.map((labelPlacement) =>
  specimen(`region-label-${labelPlacement}`, labelPlacement, { labelPlacement })
)

const cardDetailSequence: readonly { key: string; caption: string; card: CardDetailDefaults }[] = [
  { key: 'card-detail-label-only', caption: 'Label only', card: {} },
  { key: 'card-detail-plus-stereotype', caption: '+ stereotype', card: { stereotype: true } },
  { key: 'card-detail-plus-identity', caption: '+ identity', card: { stereotype: true, identity: true } },
  {
    key: 'card-detail-plus-description',
    caption: '+ description',
    card: { stereotype: true, identity: true, description: true }
  },
  {
    key: 'card-detail-all-compact',
    caption: 'All details, compact',
    card: { stereotype: true, identity: true, description: true, compact: true }
  }
]

export const cardDetailSpecimens: readonly Specimen[] = cardDetailSequence.map(({ key, caption, card }) =>
  specimen(key, caption, { card })
)
