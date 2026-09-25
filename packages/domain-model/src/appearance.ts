/**
 * The treatment an author chose for a drawing, which says what the drawing is rather than where it is being read.
 *
 * A style owns every colour the author did not name: the backdrop, the grid, the strokes, the text, the annotations.
 * It is authored once and it does not change when a reader moves between grounds — a blueprint stays a blueprint on a
 * light page and on a dark one. What changes is the ground it is realised against, which is the mode below.
 */
export type VisualStyle = 'neutral' | 'blueprint'

/**
 * The ground a drawing is read on, once something has resolved it.
 *
 * There are two, and `system` is deliberately not one of them: it is a refusal to choose rather than a third answer,
 * so it is resolved away — by the browser's preference, the host's attribute, or the command line — before any palette
 * is selected. No code that picks a colour ever sees it.
 */
export type ColourMode = 'light' | 'dark'

/** The mode a document may author, which adds the refusal to the two grounds. */
export type AuthoredColourMode = ColourMode | 'system'

export type GridTreatment = 'none' | 'major' | 'major-plus-minor' | 'dots'

export type RegionLabelFrameTreatment = 'plain' | 'notched'

export type RegionLabelPlacement =
  | 'north-west'
  | 'north'
  | 'north-east'
  | 'west'
  | 'center'
  | 'east'
  | 'south-west'
  | 'south'
  | 'south-east'

export type RegionLabelTreatment = 'none' | RegionLabelPlacement

/**
 * What a Card discloses, as the Diagram's own statement about every Card.
 *
 * `identity`, `stereotype` and `description` are a ceiling rather than a fixed answer or an opening default: they say
 * the most a reader may ever be shown, so a rendering too small for a row may withhold it and no rendered size or
 * magnification may restore one the document left off. An element that states its own `identity` is the floor beneath
 * that and survives the reduction. `compact` is treatment rather than disclosure — it decides how a Card stacks its
 * text and at which size, withholds nothing, and takes no part in either the output override or the reduction.
 */
export type CardDetailDefaults = {
  compact?: boolean
  identity?: boolean
  stereotype?: boolean
  description?: boolean
}

export type InfoschematicAppearanceConfig = {
  style?: VisualStyle
  /**
   * The former name for `style`, accepted so documents written under it keep working.
   *
   * It said `surface` because the value used to decide the ground as well as the treatment; splitting those apart is
   * what made the old name wrong. `defineInfoschematic` resolves it into `style` and does not pass it on, so nothing
   * downstream has to know both names.
   */
  surface?: VisualStyle
  /**
   * The ground this document would like to be read on, defaulting to `system`.
   *
   * A document is entitled to an opinion — a drawing made for a dark deck is not improved by a light page — but the
   * opinion is a default rather than an instruction unless `modeLocked` says otherwise. `system` says the document
   * declines to choose, which is the honest answer for most documents and so is what absence means.
   */
  mode?: AuthoredColourMode
  /**
   * Whether the reader may change the mode away from the one this document authored.
   *
   * Orthogonal to `mode`, and both combinations are wanted: an unlocked `dark` opens dark and lets a reader move,
   * while a locked `system` tracks the machine and offers no control at all.
   */
  modeLocked?: boolean
  grid?: GridTreatment
  card?: CardDetailDefaults
  /**
   * Whether every element draws its own code, as the Diagram's default.
   *
   * `card.identity` says the same thing for Cards alone and was the only way to say it; this is the same statement
   * made once for every kind, and an element that states its own `identity` is the more specific answer.
   */
  identity?: boolean
}

const visualStyleMembers: Record<VisualStyle, true> = {
  neutral: true,
  blueprint: true
}

const authoredColourModeMembers: Record<AuthoredColourMode, true> = {
  light: true,
  dark: true,
  system: true
}

const gridTreatmentMembers: Record<GridTreatment, true> = {
  none: true,
  major: true,
  'major-plus-minor': true,
  dots: true
}

const regionLabelPlacementMembers: Record<RegionLabelPlacement, true> = {
  'north-west': true,
  north: true,
  'north-east': true,
  west: true,
  center: true,
  east: true,
  'south-west': true,
  south: true,
  'south-east': true
}

export const visualStyles = Object.keys(visualStyleMembers) as readonly VisualStyle[]

export const authoredColourModes = Object.keys(authoredColourModeMembers) as readonly AuthoredColourMode[]

export const gridTreatments = Object.keys(gridTreatmentMembers) as readonly GridTreatment[]

export const regionLabelPlacements = Object.keys(regionLabelPlacementMembers) as readonly RegionLabelPlacement[]
