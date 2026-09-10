import { describe, expect, it } from 'vitest'
import { blankInfoschematic } from './index.ts'

describe('blankInfoschematic', () => {
  it('uses the canonical blank Infoschematic presentation', () => {
    expect(blankInfoschematic).toMatchObject({
      id: 'INFOSCHEMATIC',
      title: 'Infoschematics',
      diagram: {
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
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
  })

  it('contains only the default blank canvas and its title', () => {
    expect(blankInfoschematic.title).toBe('Infoschematics')
    expect(blankInfoschematic.diagram.collections).toEqual([])
    expect(blankInfoschematic.diagram.families).toEqual([])
    expect(blankInfoschematic.scopes).toEqual([])
    expect(blankInfoschematic.diagram.regions).toEqual([])
    expect(blankInfoschematic.diagram.cards).toEqual([])
    expect(blankInfoschematic.diagram.fabrics).toEqual([])
    expect(blankInfoschematic.diagram.points).toEqual([])
    expect(blankInfoschematic.diagram.flows).toEqual([])
    expect(blankInfoschematic.diagram.overlays).toEqual([])
    expect(blankInfoschematic.specifications).toEqual([])
    expect(blankInfoschematic.themes).toEqual([])
    expect(blankInfoschematic.stories).toEqual([])
  })
})
