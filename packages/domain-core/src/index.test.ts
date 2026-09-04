import { defineInfoschematic } from '@infoschematics/domain-core'
import { describe, expect, it } from 'vitest'

describe('defineInfoschematic', () => {
  it('normalises a title-only definition', () => {
    expect(defineInfoschematic({ title: 'Infoschematics' })).toEqual({
      title: 'Infoschematics',
      infoschematic: {
        viewBox: { x: 0, y: 0, width: 1200, height: 800 },
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
        scopes: [],
        domains: [],
        flowFamilies: [],
        regions: [],
        cards: [],
        fabrics: [],
        points: [],
        flows: [],
        graphics: [],
        interfaces: [],
        specificationGroups: []
      },
      standaloneScenes: [],
      themes: [],
      stories: [],
      calloutPositions: []
    })
  })

  it('merges authored appearance over backward-compatible defaults', () => {
    const config = defineInfoschematic({
      title: 'Blueprint',
      infoschematic: {
        appearance: {
          surface: 'blueprint',
          grid: 'major-plus-minor',
          card: { compact: true, identity: false }
        }
      }
    })

    expect(config.infoschematic.appearance).toEqual({
      surface: 'blueprint',
      grid: 'major-plus-minor',
      card: {
        compact: true,
        identity: false,
        stereotype: false,
        description: false
      }
    })
  })

  it('keeps Domain classification independent from Scope applicability', () => {
    const config = defineInfoschematic({
      title: 'Classified',
      infoschematic: {
        domains: [
          {
            id: 'platform',
            label: 'Platform',
            color: '#123456',
            fill: '#abcdef'
          }
        ],
        scopes: [
          {
            id: 'internal',
            prefix: 'INT',
            label: 'Internal',
            description: 'Internal applicability',
            color: '#654321',
            fill: '#fedcba'
          }
        ],
        cards: [
          {
            id: 'runtime',
            code: 'RUN',
            label: 'Runtime',
            detail: 'Runtime package',
            scope: 'internal',
            scopes: ['internal'],
            domain: 'platform',
            stereotype: 'package',
            placement: { box: { x: 0, y: 0, width: 120, height: 80 } }
          }
        ]
      }
    })

    expect(config.infoschematic.cards[0]).toMatchObject({
      domain: 'platform',
      scope: 'internal',
      stereotype: 'package'
    })
    expect(config.infoschematic.domains?.[0]?.color).toBe('#123456')
    expect(config.infoschematic.scopes[0]?.color).toBe('#654321')
    expect(JSON.parse(JSON.stringify(config))).toEqual(config)
  })

  it('rejects duplicate and dangling Domain references', () => {
    expect(() =>
      defineInfoschematic({
        title: 'Duplicate domains',
        infoschematic: {
          domains: [
            { id: 'platform', label: 'One', color: '#111', fill: '#eee' },
            { id: 'platform', label: 'Two', color: '#222', fill: '#ddd' }
          ]
        }
      })
    ).toThrow('Duplicate Domain id: platform')

    expect(() =>
      defineInfoschematic({
        title: 'Dangling domain',
        infoschematic: {
          cards: [
            {
              id: 'runtime',
              code: 'RUN',
              label: 'Runtime',
              detail: 'Runtime package',
              scope: 'internal',
              scopes: ['internal'],
              domain: 'missing',
              placement: { box: { x: 0, y: 0, width: 120, height: 80 } }
            }
          ]
        }
      })
    ).toThrow('Card runtime references unknown Domain: missing')
  })
})
