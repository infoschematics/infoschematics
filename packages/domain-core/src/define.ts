import type { InfoschematicConfig, InfoschematicConfigInput } from '@infoschematics/domain-model'
import type { InfoschematicAppearanceConfig } from '@infoschematics/domain-model/appearance'

const defaultViewBox = { x: 0, y: 0, width: 1200, height: 800 } as const

export const defaultInfoschematicAppearance = {
  style: 'neutral',
  mode: 'system',
  modeLocked: false,
  grid: 'none',
  card: {
    compact: false,
    identity: false,
    stereotype: false,
    description: false
  }
} as const satisfies InfoschematicAppearanceConfig

/*
 * Normalisation is where the retired `surface` name stops travelling. A document may still write it and mean `style`,
 * but everything downstream reads one name, so the compatibility is paid for once here rather than at every use.
 */
const normaliseAppearance = (appearance: InfoschematicAppearanceConfig | undefined): InfoschematicAppearanceConfig => {
  const { surface, ...authored } = appearance ?? {}
  return {
    ...defaultInfoschematicAppearance,
    ...authored,
    style: authored.style ?? surface ?? defaultInfoschematicAppearance.style,
    card: {
      ...defaultInfoschematicAppearance.card,
      ...appearance?.card
    }
  }
}

const validateDomains = (input: InfoschematicConfigInput) => {
  const domains = input.infoschematic?.domains ?? []
  const domainIds = new Set<string>()

  for (const domain of domains) {
    if (domainIds.has(domain.id)) throw new Error(`Duplicate Domain id: ${domain.id}`)
    domainIds.add(domain.id)
  }

  for (const card of input.infoschematic?.cards ?? []) {
    if (card.domain !== undefined && !domainIds.has(card.domain)) {
      throw new Error(`Card ${card.id} references unknown Domain: ${card.domain}`)
    }
  }
}

/** Normalise a partial authored definition into a complete Infoschematic. */
export const defineInfoschematic = (input: InfoschematicConfigInput): InfoschematicConfig => {
  validateDomains(input)

  return {
    ...input,
    infoschematic: {
      viewBox: input.infoschematic?.viewBox ?? defaultViewBox,
      appearance: normaliseAppearance(input.infoschematic?.appearance),
      scopes: input.infoschematic?.scopes ?? [],
      domains: input.infoschematic?.domains ?? [],
      flowFamilies: input.infoschematic?.flowFamilies ?? [],
      regions: input.infoschematic?.regions ?? [],
      cards: input.infoschematic?.cards ?? [],
      fabrics: input.infoschematic?.fabrics ?? [],
      points: input.infoschematic?.points ?? [],
      flows: input.infoschematic?.flows ?? [],
      graphics: input.infoschematic?.graphics ?? [],
      interfaces: input.infoschematic?.interfaces ?? [],
      specificationGroups: input.infoschematic?.specificationGroups ?? []
    },
    standaloneScenes: input.standaloneScenes ?? [],
    themes: input.themes ?? [],
    stories: input.stories ?? [],
    calloutPositions: input.calloutPositions ?? []
  }
}
