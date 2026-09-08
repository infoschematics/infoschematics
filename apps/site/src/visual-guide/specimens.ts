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
      // Blueprint with a full grid is the treatment the authored examples reach
      // for, so the guide opens on what the renderers can actually do rather
      // than on the bare neutral surface a definition falls back to.
      appearance: {
        surface: 'blueprint',
        grid: 'major-plus-minor',
        card: { compact: false, description: true, identity: true, stereotype: true }
      },
      // Blueprint reads as ink on a drawing: every Scope and Domain shares the
      // one dark fill and separates by stroke colour alone. A light fill here
      // turns each Card into a sticker on the surface instead of a part of it.
      scopes: [
        {
          id: 'core',
          label: 'Core',
          prefix: 'CORE',
          description: 'Core platform scope',
          color: '#79c9ff',
          fill: '#0d1b2a'
        },
        {
          id: 'edge',
          label: 'Edge',
          prefix: 'EDGE',
          description: 'Customer-facing scope',
          color: '#48c6a8',
          fill: '#0d1b2a'
        }
      ],
      domains: [
        { id: 'platform', label: 'Platform', color: '#6c8ebf', fill: '#0d1b2a' },
        { id: 'experience', label: 'Experience', color: '#82b366', fill: '#0d1b2a' }
      ],
      flowFamilies: [
        { id: 'request', label: 'Request', prefix: 'REQ', description: 'A request path', color: '#79c9ff' }
      ],
      regions: [
        {
          id: 'region',
          label: 'Service boundary',
          box: { x: 28, y: 30, width: 664, height: 332, radius: 12 },
          // Barely-there fill: the grid reads through the Region, so the panel
          // sits on the drawing rather than masking it.
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
          label: 'Event fabric',
          detail: 'Connectable midground',
          scopes: ['core'],
          scope: 'core',
          placement: { box: { x: 78, y: 120, width: 220, height: 120 }, ports: { east: 1 } },
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
          placement: { box: { x: 410, y: 120, width: 230, height: 120 }, ports: { west: 1 } }
        }
      ],
      points: [{ id: 'point', code: 'PT-01', label: 'External entry', scopes: ['edge'], point: { x: 188, y: 309 } }],
      flows: [
        {
          id: 'flow',
          code: 'REQ-01',
          family: 'request',
          source: 'fabric',
          sourcePort: 'E1',
          target: 'card',
          targetPort: 'W1',
          // One straight run between facing Ports: the guide's first Flow shows
          // the route, not a detour around an avoidable misalignment.
          label: { along: 0.5 },
          points: [
            { x: 298, y: 180 },
            { x: 410, y: 180 }
          ]
        }
      ],
      graphics: [
        {
          id: 'graphic',
          label: 'Graphic overlay',
          renderer: 'guide-graphic',
          placement: { x: 410, y: 278, width: 230, height: 62 },
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
      return region?.fill ?? '#12273b24'
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
