import { defineInfoschematicModel } from '@infoschematics/domain-core'

export const blankInfoschematic = defineInfoschematicModel({
  id: 'INFOSCHEMATIC',
  title: 'Infoschematics',
  diagram: {
    gridSize: 10,
    bounds: {
      x: 0,
      y: 0,
      width: 1920,
      height: 1080
    },
    appearance: {
      surface: 'blueprint',
      grid: 'major-plus-minor',
      card: {
        description: false,
        stereotype: false,
        compact: false,
        identity: false
      }
    }
  }
})
