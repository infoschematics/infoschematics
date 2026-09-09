import { defineInfoschematicModel } from '@infoschematics/domain-core'

export const blankInfoschematic = defineInfoschematicModel({
  diagram: {
    appearance: {
      surface: 'neutral',
      grid: 'none',
      card: {
        compact: false,
        identity: false,
        stereotype: false,
        description: false
      }
    },
    bounds: {
      x: 0,
      y: 0,
      width: 1200,
      height: 800
    },
    cards: [],
    collections: [],
    fabrics: [],
    families: [],
    flows: [],
    overlays: [],
    points: [],
    regions: [],
    sets: []
  },
  id: 'INFOSCHEMATIC',
  specifications: [],
  stories: [],
  themes: [],
  title: 'Infoschematics'
})
