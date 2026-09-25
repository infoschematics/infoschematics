import type { ColourMode } from '@infoschematics/domain-model/appearance'

/**
 * What an author's colour means once a drawing has two grounds to be read on.
 *
 * The product lets an author colour a Collection, a Flow family, a Region or an element, and `ADR-INFOSCHEMATICS-037`
 * holds that resolving a mode must never repaint an authored colour. Both of those were kept by pinning the value, and
 * pinning worked for exactly as long as there was one ground: `#6c8ebf` chosen against a navy backdrop is a different
 * colour on paper, and the author is not in a position to meet both at once — they wrote one value.
 *
 * So an authored colour is read as a **seed**: the hue and the saturation are the author's, and the lightness is
 * theirs relative to the other colours they chose, but the band that lightness sits in belongs to the ground. An
 * author who meant a literal value says so, and this module is the only place that distinction is interpreted.
 */

/** A seed carries the author's hue; a pinned value is the author saying they meant exactly that. */
export type AuthoredColour = Readonly<{
  /** `0`–`1`; absent alpha reads as `1`. */
  alpha: number
  hue: number
  lightness: number
  pinned: boolean
  saturation: number
}>

/**
 * The suffix that pins a colour.
 *
 * A suffix rather than a companion field, because every authored colour is a string in a position that already exists
 * — `fill`, `color`, `identity.fill` — and a parallel boolean beside each one would widen the contract in six places
 * to say something about a value rather than about the thing carrying it. A trailing `!` cannot appear in a valid
 * colour, so nothing already written can mean this by accident.
 */
const pinMark = '!'

const hexColour = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/**
 * The lightness a seed is realised at, per ground and per job.
 *
 * Ink has to carry text and strokes against the ground, so it sits well away from it; a fill sits behind other things
 * and stays close to it. The bands are ranges rather than points because an author who chose two colours of different
 * weight meant that difference, and snapping every seed to one lightness would erase it. Mapping into a band keeps
 * the ordering they authored and moves the whole set onto a ground that can carry it.
 */
const bands = {
  fill: { dark: { max: 0.46, min: 0.2 }, light: { max: 0.9, min: 0.68 } },
  ink: { dark: { max: 0.82, min: 0.54 }, light: { max: 0.54, min: 0.26 } }
} as const

/** How much of the ground a seeded backdrop lets through, so a grid or a ruled ground is not erased by a Region. */
const seededGroundAlpha = 0.32

/**
 * What a seed is being realised for.
 *
 * `fill` and `ground` share a band — they are both things drawn behind something else — and differ in whether they
 * let the ground through. A Region is a backdrop and covers a large part of the drawing, so an opaque one erases the
 * grid and every ruled line under it; a Card is a body and an author who coloured one meant a coloured body. `ink`
 * is the third case: text, strokes and arrowheads, which have to carry against the ground rather than sit on it.
 */
const jobs = {
  fill: { band: 'fill', translucent: false },
  ground: { band: 'fill', translucent: true },
  ink: { band: 'ink', translucent: false }
} as const

export type ColourJob = keyof typeof jobs

const channel = (hex: string, offset: number) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255

/** Read an authored colour, or nothing when it is not a form this module can reason about. */
export const parseAuthoredColour = (value: string): AuthoredColour | undefined => {
  const trimmed = value.trim()
  const pinned = trimmed.endsWith(pinMark)
  const body = pinned ? trimmed.slice(0, -pinMark.length).trim() : trimmed
  const digits = hexColour.exec(body)?.[1]
  if (!digits) return undefined

  /* Both short forms expand a digit at a time; only then is it known whether an alpha was written at all. */
  const expanded = digits.length <= 4 ? [...digits].map((digit) => digit.repeat(2)).join('') : digits
  const full = expanded.length === 6 ? `${expanded}ff` : expanded
  const [red, green, blue] = [channel(full, 0), channel(full, 2), channel(full, 4)]
  if (red === undefined || green === undefined || blue === undefined) return undefined

  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  const span = max - min
  const saturation = span === 0 ? 0 : span / (1 - Math.abs(2 * lightness - 1))
  const hue =
    span === 0
      ? 0
      : 60 *
        (((max === red ? (green - blue) / span : max === green ? 2 + (blue - red) / span : 4 + (red - green) / span) %
          6) +
          6)

  return { alpha: channel(full, 6), hue: hue % 360, lightness, pinned, saturation: Math.min(saturation, 1) }
}

const byte = (value: number) =>
  Math.round(Math.min(Math.max(value, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0')

/** HSL back to the `#rrggbbaa` the renderers write. */
const toHex = (colour: Pick<AuthoredColour, 'alpha' | 'hue' | 'lightness' | 'saturation'>) => {
  const chroma = (1 - Math.abs(2 * colour.lightness - 1)) * colour.saturation
  const sector = colour.hue / 60
  const second = chroma * (1 - Math.abs((sector % 2) - 1))
  const [red, green, blue] =
    sector < 1
      ? [chroma, second, 0]
      : sector < 2
        ? [second, chroma, 0]
        : sector < 3
          ? [0, chroma, second]
          : sector < 4
            ? [0, second, chroma]
            : sector < 5
              ? [second, 0, chroma]
              : [chroma, 0, second]
  const lift = colour.lightness - chroma / 2
  const opaque = `#${byte((red ?? 0) + lift)}${byte((green ?? 0) + lift)}${byte((blue ?? 0) + lift)}`
  return colour.alpha >= 1 ? opaque : `${opaque}${byte(colour.alpha)}`
}

/**
 * An authored colour as the value to draw, on one ground, for one job.
 *
 * A pinned colour comes back as written, minus its mark. A value this module cannot read — a named colour, a gradient
 * reference — comes back untouched, because refusing to interpret something is better than guessing at it. Everything
 * else is realised into the band for its ground, keeping the author's hue, their saturation, and their ordering.
 */
export const resolveAuthoredColour = (value: string, mode: ColourMode, job: ColourJob): string => {
  const parsed = parseAuthoredColour(value)
  if (!parsed) return value.trim().endsWith(pinMark) ? value.trim().slice(0, -pinMark.length).trim() : value
  if (parsed.pinned) return toHex(parsed)

  const band = bands[jobs[job].band][mode]
  const lightness = band.min + parsed.lightness * (band.max - band.min)
  /* An author who set their own alpha has already answered the question this default exists to answer. */
  const alpha = jobs[job].translucent && parsed.alpha >= 1 ? seededGroundAlpha : parsed.alpha
  return toHex({ alpha, hue: parsed.hue, lightness, saturation: parsed.saturation })
}

/** Whether an authored value says the author meant that exact colour. */
export const colourIsPinned = (value: string): boolean => parseAuthoredColour(value)?.pinned ?? false

/** A ground to realise seeds against, or the refusal that has to carry both. */
export type ColourGround = ColourMode | 'system'

export type SeedResolver = Readonly<{
  /**
   * The custom properties a deferring rendering has to declare, as `[name, light, dark]`.
   *
   * Empty on a resolved ground, where every seed was written as the colour it came to.
   */
  declarations: () => readonly (readonly [name: string, light: string, dark: string])[]
  /**
   * One value that differs by ground but was not authored, as the value to draw.
   *
   * A readable ink is the case this exists for: it is measured against a seeded fill, so it moves with the ground
   * even though nobody wrote it down, and a deferring rendering that wrote one ground's answer would leave a Card
   * label unreadable for half its readers.
   */
  pair: (light: string, dark: string) => string
  /** One authored colour as the value to draw. */
  resolve: (value: string, job: ColourJob) => string
}>

/**
 * Realise authored colours against a ground, or against both when the rendering declines to pick one.
 *
 * A rendering that defers already carries two palettes and lets the browser choose between them; an authored colour
 * has to travel the same way or a deferring drawing would follow its reader everywhere except the places its author
 * coloured. So a deferred seed becomes a custom property declared once in each palette block — the same mechanism,
 * applied to values the document supplied rather than ones the manifest did.
 *
 * Seeds are pooled by the pair they resolve to, so a colour used by four Flow families declares one property.
 */
export const seedResolver = (ground: ColourGround): SeedResolver => {
  if (ground !== 'system') {
    return {
      declarations: () => [],
      pair: (light, dark) => (ground === 'dark' ? dark : light),
      resolve: (value, job) => resolveAuthoredColour(value, ground, job)
    }
  }

  const declared = new Map<string, readonly [name: string, light: string, dark: string]>()
  const pool = (light: string, dark: string) => {
    if (light === dark) return light
    const key = `${light}/${dark}`
    const existing = declared.get(key)
    if (existing) return `var(${existing[0]})`
    const name = `--infoschematic-seed-${declared.size + 1}`
    declared.set(key, [name, light, dark])
    return `var(${name})`
  }

  return {
    declarations: () => [...declared.values()],
    pair: pool,
    resolve: (value, job) => pool(resolveAuthoredColour(value, 'light', job), resolveAuthoredColour(value, 'dark', job))
  }
}
