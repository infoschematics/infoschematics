import type { ResolvedCardTreatment } from './appearance.ts'

/**
 * Detail as a continuous policy, resolved in named bands from one number: the scale at which a drawing is rendered.
 *
 * `ADR-INFOSCHEMATICS-039` settles the shape. Detail is not a step into a named view of a part — that is addressing,
 * and it belongs to `INFOSCHEMATICS-TOOL-115` — because an Infoschematic is authored to be read inside someone else's
 * document, and navigating a reader out of that document is the behaviour of a diagram tool rather than of an embedded
 * artefact. A pure function of scale is also the only shape a static outlet can be handed: a still has no reader and no
 * gesture, so it can be given a band and nothing else.
 *
 * The thresholds are the ones `ADR-INFOSCHEMATICS-011` already fixed for responsive Card detail; this module names
 * them rather than inventing a second set, so a rendering reduced because it is small and a rendering enlarged because
 * a reader magnified it land on the same answer.
 *
 * Nothing here remembers anything. Hysteresis — not dropping a band the instant a reader's hand wobbles back across a
 * threshold — is the interactive view's, because `APPEAR-017` forbids this resolver inspecting ambient viewport state,
 * and a function with memory is exactly that state by another name. The Canvas holds the previous band and applies the
 * margin; this file maps a scale to a band and says what the band reveals.
 */
export type DetailBand = 'full' | 'identified' | 'minimal' | 'outline'

/** Every band, from the least revealed to the most, which is the order a magnifying reader crosses them in. */
export const detailBands = ['minimal', 'outline', 'identified', 'full'] as const satisfies readonly DetailBand[]

/**
 * The rendered scale at or above which each band applies.
 *
 * A scale of 1 means the authored view box is drawn at its authored size; 2 means a reader has magnified it twofold.
 * `minimal` floors at zero because there is no rendering too small to be in some band.
 */
export const detailBandFloors = {
  full: 0.8,
  identified: 0.6,
  minimal: 0,
  outline: 0.4
} as const satisfies Readonly<Record<DetailBand, number>>

/** A band's position in `detailBands`, so two bands can be compared without restating the order. */
export const detailBandRank = (band: DetailBand): number => detailBands.indexOf(band)

/**
 * The band one rendered scale resolves to. A scale that is not a finite positive number resolves to `minimal`, because
 * a rendering whose size is unknown is not a rendering anything may be claimed about.
 */
export const resolveDetailBand = (scale: number): DetailBand => {
  if (!Number.isFinite(scale) || scale <= 0) return 'minimal'
  if (scale >= detailBandFloors.full) return 'full'
  if (scale >= detailBandFloors.identified) return 'identified'
  if (scale >= detailBandFloors.outline) return 'outline'
  return 'minimal'
}

/**
 * What a band withholds from what was asked for.
 *
 * A band only ever withholds. `APPEAR-016` makes the authored value a ceiling and the caller's override the single
 * restatement of it, so magnification restores a row the scale had withheld and never adds one nobody asked for. An
 * element that pins its own code stands outside this altogether, per `APPEAR-018`, and compactness is treatment rather
 * than disclosure, so it passes through untouched.
 */
export const resolveDetailTreatment = (band: DetailBand, requested: ResolvedCardTreatment): ResolvedCardTreatment => ({
  compact: requested.compact,
  description: requested.description && band === 'full',
  identity: requested.identity && detailBandRank(band) >= detailBandRank('identified'),
  stereotype: requested.stereotype && detailBandRank(band) >= detailBandRank('outline')
})

/** What each band reveals, in a reader's words rather than the resolver's field names. */
export const detailBandReveals = {
  full: 'Card names, stereotypes, codes and descriptions',
  identified: 'Card names, stereotypes and codes',
  minimal: 'Card names only',
  outline: 'Card names and stereotypes'
} as const satisfies Readonly<Record<DetailBand, string>>

/**
 * What an assistive reader is told when magnification moves the drawing into another band.
 *
 * It says what is now shown and says the document is unchanged, because it is: nothing authored moved, and a reader
 * who is told only that something appeared has been told the document edited itself.
 */
export const detailBandAnnouncement = (band: DetailBand): string =>
  `${detailBandReveals[band]}. The document has not changed.`
