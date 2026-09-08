// Where a Card's own text sits inside its box. Both renderers draw the same
// Card, so the arithmetic belongs here rather than twice in their drawing code:
// while it lived in both, Canvas placed a label at a fixed height that suited an
// 80-tall Card and static SVG centred it, and nothing said which was right.
//
// Every position is the element's visual centre, so a renderer draws it with a
// middle dominant baseline and one number means one thing in both.

export type CardBox = Readonly<{ height: number; width: number }>

/** Which optional elements the resolved treatment offers, before they are fitted. */
export type CardLayoutDetail = Readonly<{
  description: boolean
  identity: boolean
  stereotype: boolean
}>

export type CardLayoutRequest = Readonly<{
  box: CardBox
  /** A compact Card stacks its text from the top left; the legacy treatment centres it. */
  compact: boolean
  /** Authored identity code, which the chip is sized from. */
  code?: string
  detail: CardLayoutDetail
  /** How many lines the label is drawn on; a renderer that does not wrap passes one. */
  labelLines?: number
  /** Authored stereotype, whose drawn width decides whether it clears the identity chip. */
  stereotype?: string
}>

export type CardTextPlacement = Readonly<{
  anchor: 'middle' | 'start'
  x: number
  y: number
}>

export type CardLabelPlacement = CardTextPlacement & Readonly<{ lineHeight: number }>

export type CardIdentityPlacement = Readonly<{
  height: number
  /** Centre of the chip, where its text is drawn. */
  textX: number
  textY: number
  width: number
  x: number
  y: number
}>

export type CardLayout = Readonly<{
  description: CardTextPlacement | null
  identity: CardIdentityPlacement | null
  label: CardLabelPlacement
  stereotype: CardTextPlacement | null
}>

const inset = 10
const topInset = 8
const chipGap = 8
const chipHeight = 20
const lineHeight = 13
const bandedCompactLabelY = 38
const bareCompactLabelY = 28
const descriptionLift = 6
const descriptionGap = 20
const compactDescriptionGap = 18
const descriptionFloor = 10
const descriptionHalf = 5
const identityMinimumWidth = 42
const codeAdvance = 6.5
const codePadding = 14
const stereotypeAdvance = 5.8

const band = topInset + chipHeight

/**
 * Drawn width from a fixed advance per character. There is no text metric on the
 * server and both renderers must agree anyway, so a Card fits its metadata by
 * the same estimate in the browser and in a static file.
 */
const identityWidth = (code: string) => Math.max(identityMinimumWidth, code.length * codeAdvance + codePadding)
const stereotypeWidth = (stereotype: string) => stereotype.length * stereotypeAdvance

const authored = (text: string | undefined) => (text && text.trim().length > 0 ? text : undefined)

/**
 * Place one Card's internals inside its own box.
 *
 * The label always renders: a Card too small for its metadata is a legible Card
 * carrying less, not a Card with text through its own border. Each optional
 * element is offered only while its band fits the box, and the identity chip
 * gives way to an authored stereotype it would otherwise sit on top of.
 */
export const resolveCardLayout = ({
  box,
  code,
  compact,
  detail,
  labelLines,
  stereotype
}: CardLayoutRequest): CardLayout => {
  const lines = Math.max(1, labelLines ?? 1)
  const identityCode = detail.identity ? authored(code) : undefined
  const stereotypeText = detail.stereotype ? authored(stereotype) : undefined

  // The top band holds the stereotype and the identity chip. A compact Card
  // stacks its label under the band, so it also needs room for both.
  const banded = box.height >= band + lineHeight
  const stacked = !compact || box.height >= bandedCompactLabelY + lineHeight

  const stereotypeSpan = stereotypeText === undefined ? 0 : stereotypeWidth(stereotypeText)
  const stereotypePlaced = stereotypeText !== undefined && banded && stacked && inset * 2 + stereotypeSpan <= box.width

  const chipWidth = identityCode === undefined ? 0 : identityWidth(identityCode)
  const chipStart = box.width - chipWidth - chipGap
  const identityPlaced =
    identityCode !== undefined &&
    banded &&
    chipWidth + chipGap * 2 <= box.width &&
    (!stereotypePlaced || inset + stereotypeSpan <= chipStart)

  const describing = detail.description
  const compactLabelY = stereotypePlaced ? bandedCompactLabelY : bareCompactLabelY
  const label: CardLabelPlacement = compact
    ? {
        anchor: 'start',
        lineHeight,
        x: inset,
        // A box too short even for the bare stack centres what it can show.
        y: box.height >= compactLabelY + lineHeight / 2 ? compactLabelY : box.height / 2
      }
    : {
        anchor: 'middle',
        lineHeight,
        x: box.width / 2,
        y: box.height / 2 - (describing ? descriptionLift : 0) - ((lines - 1) * lineHeight) / 2
      }

  const lastLine = label.y + (lines - 1) * lineHeight
  const descriptionY = compact
    ? Math.min(box.height - descriptionFloor, lastLine + compactDescriptionGap)
    : lastLine + descriptionGap
  const descriptionPlaced =
    describing && descriptionY >= lastLine + lineHeight && descriptionY + descriptionHalf <= box.height

  return {
    description: descriptionPlaced ? { anchor: label.anchor, x: label.x, y: descriptionY } : null,
    identity: identityPlaced
      ? {
          height: chipHeight,
          textX: chipStart + chipWidth / 2,
          textY: topInset + chipHeight / 2,
          width: chipWidth,
          x: chipStart,
          y: topInset
        }
      : null,
    label,
    stereotype: stereotypePlaced ? { anchor: 'start', x: inset, y: topInset + chipHeight / 2 } : null
  }
}
