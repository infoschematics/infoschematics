// Where a Card's own text sits inside its box. Both renderers draw the same
// Card, so the arithmetic belongs here rather than twice in their drawing code:
// while it lived in both, Canvas placed a label at a fixed height that suited an
// 80-tall Card and static SVG centred it, and nothing said which was right.
//
// Every position is the element's visual centre, so a renderer draws it with a
// middle dominant baseline and one number means one thing in both. The text is
// fitted here too, for the same reason: two wrapping rules is how the renderers
// came to disagree about what a Card says as well as where it says it.

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
  /** Authored description, fitted to the width its band leaves. */
  description?: string
  detail: CardLayoutDetail
  /** Authored label, wrapped or ended with an ellipsis to fit the box. */
  label: string
  /** Authored stereotype, whose drawn width decides whether it clears the identity chip. */
  stereotype?: string
}>

export type CardTextPlacement = Readonly<{
  anchor: 'middle' | 'start'
  x: number
  y: number
}>

export type CardLabelPlacement = CardTextPlacement &
  Readonly<{
    lineHeight: number
    /** The label as it is drawn: one line per drawn line, fitted to the box. */
    lines: readonly string[]
  }>

/** A placed element and the text that fits where it was placed. */
export type CardFittedPlacement = CardTextPlacement & Readonly<{ text: string }>

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
  description: CardFittedPlacement | null
  identity: CardIdentityPlacement | null
  label: CardLabelPlacement
  stereotype: CardFittedPlacement | null
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
const labelAdvance = 7.28
const compactLabelAdvance = 6.76
const descriptionAdvance = 5
const labelLineLimit = 2
const ellipsis = '\u2026'

const band = topInset + chipHeight

/**
 * Drawn width from a fixed advance per character. There is no text metric on the
 * server and both renderers must agree anyway, so a Card fits its metadata by
 * the same estimate in the browser and in a static file.
 */
const identityWidth = (code: string) => Math.max(identityMinimumWidth, code.length * codeAdvance + codePadding)
const stereotypeWidth = (stereotype: string) => stereotype.length * stereotypeAdvance

const authored = (text: string | undefined) => (text && text.trim().length > 0 ? text : undefined)

const fits = (text: string, width: number, advance: number) => text.length * advance <= width

/** Cut to what the width holds, ending in an ellipsis so the reader knows there is more. */
const truncate = (text: string, width: number, advance: number) => {
  if (fits(text, width, advance)) return text
  const room = Math.floor(width / advance) - 1
  return room >= 1 ? `${text.slice(0, room).trimEnd()}${ellipsis}` : ''
}

/**
 * Break a label onto the lines it is allowed, against the width it has rather
 * than a character count. Whatever will not fit on the last line is cut there,
 * so a long label ends in an ellipsis instead of running through the border.
 */
const wrap = (text: string, width: number, advance: number, limit: number): readonly string[] => {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (let index = 0; index < words.length; index += 1) {
    const word = words[index] ?? ''
    const candidate = current.length === 0 ? word : `${current} ${word}`
    if (current.length === 0 || fits(candidate, width, advance)) {
      current = candidate
      continue
    }
    if (lines.length + 1 === limit)
      return [...lines, truncate([current, ...words.slice(index)].join(' '), width, advance)]
    lines.push(current)
    current = word
  }
  return [...lines, truncate(current, width, advance)]
}

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
  description,
  detail,
  label: authoredLabel,
  stereotype
}: CardLayoutRequest): CardLayout => {
  const usable = box.width - inset * 2
  const identityCode = detail.identity ? authored(code) : undefined
  const stereotypeText = detail.stereotype ? authored(stereotype) : undefined
  // A compact Card keeps one line: its stack is a band, a label and a
  // description, and a wrapped label would push the description into the floor.
  const labelLines = compact
    ? [truncate(authoredLabel.trim(), usable, compactLabelAdvance)]
    : wrap(
        authoredLabel,
        usable,
        labelAdvance,
        box.height >= topInset * 2 + lineHeight * labelLineLimit ? labelLineLimit : 1
      )
  const lines = labelLines.length

  // The top band holds the stereotype and the identity chip. A compact Card
  // stacks its label under the band, so it also needs room for both.
  const banded = box.height >= band + lineHeight
  const stacked = !compact || box.height >= bandedCompactLabelY + lineHeight

  // The stereotype fits the box, and the identity chip yields to it where the
  // two would meet: a fitted stereotype never overruns, but it can still reach.
  const stereotypeFitted = stereotypeText === undefined ? '' : truncate(stereotypeText, usable, stereotypeAdvance)
  const stereotypeSpan = stereotypeWidth(stereotypeFitted)
  const stereotypePlaced = stereotypeFitted.length > 0 && banded && stacked

  const chipWidth = identityCode === undefined ? 0 : identityWidth(identityCode)
  const chipStart = box.width - chipWidth - chipGap
  const identityPlaced =
    identityCode !== undefined &&
    banded &&
    chipWidth + chipGap * 2 <= box.width &&
    (!stereotypePlaced || inset + stereotypeSpan <= chipStart)

  const descriptionText = detail.description ? truncate(authored(description) ?? '', usable, descriptionAdvance) : ''
  const describing = descriptionText.length > 0
  const compactLabelY = stereotypePlaced ? bandedCompactLabelY : bareCompactLabelY
  const label: CardLabelPlacement = compact
    ? {
        anchor: 'start',
        lineHeight,
        lines: labelLines,
        x: inset,
        // A box too short even for the bare stack centres what it can show.
        y: box.height >= compactLabelY + lineHeight / 2 ? compactLabelY : box.height / 2
      }
    : {
        anchor: 'middle',
        lineHeight,
        lines: labelLines,
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
    description: descriptionPlaced
      ? { anchor: label.anchor, text: descriptionText, x: label.x, y: descriptionY }
      : null,
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
    stereotype: stereotypePlaced
      ? { anchor: 'start', text: stereotypeFitted, x: inset, y: topInset + chipHeight / 2 }
      : null
  }
}
