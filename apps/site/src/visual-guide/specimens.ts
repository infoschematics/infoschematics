import { defineInfoschematic, type InfoschematicConfig } from '@infoschematics/domain-core'
import type { AppearanceOptionKey } from './curriculum.ts'

export type AppearanceOptionValue = boolean | number | string

const viewBox = { x: 0, y: 0, width: 720, height: 400 }

const baseDefinition = () =>
  defineInfoschematic({
    title: 'Visual guide specimen',
    subtitle: 'A small system showing the visible parts of an Infoschematic.',
    infoschematic: {
      viewBox,
      appearance: {
        surface: 'neutral',
        grid: 'none',
        card: { compact: false, description: true, identity: true, stereotype: true }
      },
      scopes: [
        {
          id: 'core',
          label: 'Core',
          prefix: 'CORE',
          description: 'Core platform scope',
          color: '#55a7ff',
          fill: '#142b45'
        },
        {
          id: 'edge',
          label: 'Edge',
          prefix: 'EDGE',
          description: 'Customer-facing scope',
          color: '#48c6a8',
          fill: '#12352f'
        }
      ],
      domains: [
        { id: 'platform', label: 'Platform', color: '#55a7ff', fill: '#dcecff' },
        { id: 'experience', label: 'Experience', color: '#12866f', fill: '#d9f5ed' }
      ],
      flowFamilies: [
        { id: 'request', label: 'Request', prefix: 'REQ', description: 'A request path', color: '#ffb84d' }
      ],
      regions: [
        {
          id: 'region',
          label: 'Service boundary',
          box: { x: 28, y: 30, width: 664, height: 332, radius: 12 },
          fill: '#10263b',
          frame: { style: 'solid', opacity: 0.8 },
          labelMount: 'boundary',
          labelOffset: 0,
          labelPlacement: 'north-west'
        }
      ],
      fabrics: [
        {
          id: 'fabric',
          code: 'FAB-01',
          label: 'Event fabric',
          detail: 'Connectable midground',
          scopes: ['core'],
          scope: 'core',
          placement: { box: { x: 78, y: 118, width: 220, height: 150 }, ports: { east: 2 } },
          appearance: { renderer: 'default', caption: 'Event fabric' }
        }
      ],
      cards: [
        {
          id: 'card',
          code: 'CARD-01',
          label: 'Customer API',
          detail: 'A foreground component',
          scopes: ['edge'],
          scope: 'edge',
          domain: 'experience',
          stereotype: 'Service',
          placement: { box: { x: 410, y: 105, width: 230, height: 105 }, ports: { west: 2 } }
        }
      ],
      points: [{ id: 'point', code: 'PT-01', label: 'External entry', scopes: ['edge'], point: { x: 350, y: 310 } }],
      flows: [
        {
          id: 'flow',
          code: 'REQ-01',
          family: 'request',
          source: 'fabric',
          sourcePort: 'E1',
          target: 'card',
          targetPort: 'W1',
          points: [
            { x: 298, y: 168 },
            { x: 350, y: 168 },
            { x: 350, y: 140 },
            { x: 410, y: 140 }
          ]
        }
      ],
      graphics: [
        {
          id: 'graphic',
          label: 'Graphic overlay',
          renderer: 'guide-graphic',
          placement: { x: 442, y: 258, width: 168, height: 62 },
          scopes: ['edge']
        }
      ]
    }
  })

export const anatomySpecimen = baseDefinition()

export const treatmentSpecimen = () => baseDefinition()

export const appearanceOptionValue = (config: InfoschematicConfig, key: AppearanceOptionKey): AppearanceOptionValue => {
  const appearance = config.infoschematic.appearance
  const region = config.infoschematic.regions[0]

  switch (key) {
    case 'surface':
      return appearance?.surface ?? 'neutral'
    case 'grid':
      return appearance?.grid ?? 'none'
    case 'card.compact':
      return appearance?.card?.compact ?? false
    case 'card.description':
      return appearance?.card?.description ?? false
    case 'card.identity':
      return appearance?.card?.identity ?? false
    case 'card.stereotype':
      return appearance?.card?.stereotype ?? false
    case 'region.fill':
      return region?.fill ?? '#10263b'
    case 'region.frame.opacity':
      return region?.frame?.opacity ?? 1
    case 'region.frame.style':
      return region?.frame?.style ?? 'solid'
    case 'region.labelMount':
      return region?.labelMount ?? 'boundary'
    case 'region.labelOffset':
      return region?.labelOffset ?? 0
    case 'region.labelPlacement':
      return region?.labelPlacement ?? 'north-west'
  }
}

export const withAppearanceOption = (
  config: InfoschematicConfig,
  key: AppearanceOptionKey,
  value: AppearanceOptionValue
): InfoschematicConfig => {
  const appearance = config.infoschematic.appearance ?? {}

  if (key === 'surface' || key === 'grid') {
    return {
      ...config,
      infoschematic: { ...config.infoschematic, appearance: { ...appearance, [key]: value } }
    } as InfoschematicConfig
  }

  if (key.startsWith('card.')) {
    const field = key.slice('card.'.length)
    return {
      ...config,
      infoschematic: {
        ...config.infoschematic,
        appearance: { ...appearance, card: { ...appearance.card, [field]: value } }
      }
    } as InfoschematicConfig
  }

  const regions = config.infoschematic.regions.map((region, index) => {
    if (index !== 0) return region
    if (key === 'region.fill') return { ...region, fill: String(value) }
    if (key === 'region.frame.opacity') {
      return { ...region, frame: { style: region.frame?.style ?? 'solid', opacity: Number(value) } }
    }
    if (key === 'region.frame.style') {
      return { ...region, frame: { ...region.frame, style: String(value) } }
    }
    const field = key.slice('region.'.length)
    return { ...region, [field]: value }
  })

  return { ...config, infoschematic: { ...config.infoschematic, regions } } as InfoschematicConfig
}
