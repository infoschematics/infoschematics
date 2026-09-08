// What every authored appearance option is, described once at runtime.
//
// The unions that declare these options are erased before anything can offer
// them, so each consumer that wanted to present an option re-listed its members
// by hand: Studio's Region controls carried their own copy of all nine label
// placements, and the site's visual guide curated its own card sequence. Every
// copy is a place the option surface can drift, and it drifted.
//
// This catalogue is description, not behaviour. It states which options exist,
// what they accept, how they are offered, and which concept in the vocabulary
// each one gives visual form to. It decides nothing about what an absent option
// means: the renderers still own that, and `default` only records what they
// already do.

import type { CardDetailDefaults, InfoschematicAppearanceConfig } from './appearance.ts'
import { gridTreatments, regionLabelPlacements, surfaceTreatments } from './appearance.ts'
import type { RegionConfig, RegionFrameConfig } from './region.ts'
import { regionFrameStyles, regionLabelMounts } from './region.ts'

/**
 * A term id from the glossary in `docs/reference/vocabulary.md`.
 *
 * Citing the id rather than repeating the name is what stops the product's
 * language and its option surface moving independently: a term cannot be
 * reworded or retired without the citation failing.
 */
export type VocabularyTermId =
  | 'adapter-card'
  | 'callout'
  | 'fabric'
  | 'flow'
  | 'graphic'
  | 'infoschematic'
  | 'infoschematic-artefact'
  | 'port'
  | 'region'
  | 'route'
  | 'scene'
  | 'standalone-scene'
  | 'standard-card'
  | 'story'
  | 'story-scene'
  | 'thematic-scene'
  | 'theme'
  | 'waypoint'

/** How an option is offered: one of a closed set, on or off, a magnitude, or a colour. */
export type AppearanceOptionControl = 'choice' | 'colour' | 'flag' | 'number'

/** Appearance-bearing members of a Region, as distinct from its identity and its box. */
type RegionAppearanceField = Extract<keyof RegionConfig, 'fill' | 'labelMount' | 'labelOffset' | 'labelPlacement'>

type RegionFrameField = Extract<keyof RegionFrameConfig, 'opacity' | 'style'>

/**
 * Every authored appearance option, as a path from the config that carries it.
 *
 * Derived from the config types rather than written out, so adding a member to
 * `CardDetailDefaults` or `InfoschematicAppearanceConfig` widens this union and
 * the catalogue below stops compiling until the new option is described.
 */
export type AppearanceOptionKey =
  | Exclude<keyof InfoschematicAppearanceConfig, 'card'>
  | `card.${keyof CardDetailDefaults & string}`
  | `region.${RegionAppearanceField}`
  | `region.frame.${RegionFrameField}`

export type AppearanceOptionDescriptor = Readonly<{
  control: AppearanceOptionControl
  /** What the renderers draw when the option is absent, where they state one. */
  default?: boolean | number | string
  /** A number control's inclusive bounds. */
  range?: Readonly<{ max: number; min: number }>
  /** The concept this option gives visual form to. */
  term: VocabularyTermId
  /** A choice control's authored values, in the order the domain states them; empty otherwise. */
  values: readonly string[]
}>

const noValues: readonly string[] = Object.freeze([])

/**
 * Keyed by the option-key union, so an option that exists in the config and is
 * not described here is a compile error rather than a gap someone notices later.
 */
export const appearanceOptions: Readonly<Record<AppearanceOptionKey, AppearanceOptionDescriptor>> = Object.freeze({
  'card.compact': { control: 'flag', default: false, term: 'standard-card', values: noValues },
  'card.description': { control: 'flag', default: false, term: 'standard-card', values: noValues },
  'card.identity': { control: 'flag', default: false, term: 'standard-card', values: noValues },
  'card.stereotype': { control: 'flag', default: false, term: 'standard-card', values: noValues },
  grid: { control: 'choice', default: 'none', term: 'infoschematic', values: gridTreatments },
  'region.fill': { control: 'colour', term: 'region', values: noValues },
  'region.frame.opacity': { control: 'number', range: { max: 1, min: 0 }, term: 'region', values: noValues },
  'region.frame.style': { control: 'choice', term: 'region', values: regionFrameStyles },
  'region.labelMount': { control: 'choice', default: 'boundary', term: 'region', values: regionLabelMounts },
  'region.labelOffset': { control: 'number', range: { max: 200, min: -200 }, term: 'region', values: noValues },
  'region.labelPlacement': { control: 'choice', term: 'region', values: regionLabelPlacements },
  surface: { control: 'choice', default: 'neutral', term: 'infoschematic', values: surfaceTreatments }
})

export const appearanceOptionKeys = Object.keys(appearanceOptions) as readonly AppearanceOptionKey[]
