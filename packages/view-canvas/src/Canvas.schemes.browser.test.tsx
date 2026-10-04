/**
 * Which palette a drawing is actually painted in, resolved by a browser rather than read out of a stylesheet.
 *
 * The scheme blocks redeclare the same custom property names, so the source cannot say which declaration wins: that
 * depends on `(prefers-color-scheme)`, on a host attribute, on specificity and on source order together, and only
 * the browser applies all four. A node suite reading `tokens.generated.css` would assert the rule it hoped applied.
 * It is also the only place the half-painted failure shows up — a role one scheme declares and another does not
 * resolves to whatever an earlier block left behind, which looks correct in whichever scheme declared it.
 */
import { defineInfoschematicModel } from '@infoschematics/domain-core'
import { resolveAuthoredColour } from '@infoschematics/view-model/colour'
import { type PaintRole, paintFor, paintVariable } from '@infoschematics/view-model/tokens'
import { afterEach, expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { Canvas } from './Canvas.tsx'
import { ColourSchemeButton } from './ColourSchemeButton.tsx'
import './styles.css'

type Ground = Readonly<{ mode?: 'dark' | 'light' | 'system'; modeLocked?: boolean }>

const drawing = (style?: 'blueprint', ground: Ground = {}) =>
  defineInfoschematicModel({
    id: 'schemes-browser',
    title: 'Schemes browser',
    diagram: {
      bounds: { height: 200, width: 400, x: 0, y: 0 },
      gridSize: 10,
      ...(style || ground.mode || ground.modeLocked ? { appearance: { ...(style ? { style } : {}), ...ground } } : {}),
      cards: [{ id: 'SRC', label: 'Source', bounds: { height: 60, width: 120, x: 40, y: 60 } }]
    }
  })

/** Every paint role the manifest declares, named the way the stylesheet declares it. */
const roles = Object.keys(paintFor('neutral', 'light')).filter((role): role is PaintRole => role !== 'artwork')

/** What an element's inherited palette resolves each role to, which is the answer the drawing is painted from. */
const resolved = (element: Element) => {
  const style = getComputedStyle(element)
  return Object.fromEntries(
    roles.map((role) => [role, style.getPropertyValue(paintVariable(role).slice(4, -1)).trim()])
  )
}

const svgOf = (container: HTMLElement) => {
  const svg = container.querySelector('.infoschematic-svg')
  if (!svg) throw new Error('Canvas drew no diagram')
  return svg
}

/* One browser context serves this whole file, so the preference outlives the case that asked for it. */
afterEach(async () => {
  document.documentElement.removeAttribute('data-infoschematic-scheme')
  window.localStorage.removeItem('infoschematics.colour-scheme')
  await commands.emulateColourScheme('no-preference')
  await commands.emulatePrintMedia(false)
})

test('takes the page at its word about the colour scheme before anything is asserted under it', async () => {
  const dark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

  // The negative first: without it, a green run below would prove only that the emulation never arrived.
  await commands.emulateColourScheme('light')
  expect(dark()).toBe(false)
  await commands.emulateColourScheme('dark')
  expect(dark()).toBe(true)
})

test('paints a drawing in the scheme the reader prefers, with every role answered', async () => {
  await commands.emulateColourScheme('light')
  const { container } = await render(<Canvas config={drawing()} />)
  const svg = svgOf(container)

  expect(resolved(svg)).toEqual(Object.fromEntries(roles.map((role) => [role, paintFor('neutral', 'light')[role]])))
  const backdrop = svg.querySelector('.infoschematic-backdrop')
  if (!backdrop) throw new Error('the drawing has no backdrop')
  expect(getComputedStyle(backdrop).fill).toBe('rgb(255, 255, 255)')

  await commands.emulateColourScheme('dark')
  expect(resolved(svg)).toEqual(Object.fromEntries(roles.map((role) => [role, paintFor('neutral', 'dark')[role]])))
  // The colour, not just the variable: a role that resolved and was never painted from would satisfy the map alone.
  expect(getComputedStyle(backdrop).fill).toBe('rgb(22, 27, 32)')
})

/*
 * A style says what the drawing is; a mode says which ground it is read on. They are orthogonal, so an authored
 * blueprint stays a blueprint under either preference and is still realised on the ground the reader is on — the
 * cyanotype on paper, the navy on a dark page. A drawing that ignored the preference would follow its reader
 * everywhere except the one document that chose a treatment, which is the failure this case exists to catch.
 */
test('realises an authored blueprint on the ground the reader is on', async () => {
  const { container } = await render(<Canvas config={drawing('blueprint')} />)
  const svg = svgOf(container)
  const backdrop = svg.querySelector('.infoschematic-backdrop') as Element

  await commands.emulateColourScheme('light')
  expect(resolved(svg)).toEqual(Object.fromEntries(roles.map((role) => [role, paintFor('blueprint', 'light')[role]])))
  expect(getComputedStyle(backdrop).fill).toBe('rgb(238, 243, 249)')

  await commands.emulateColourScheme('dark')
  expect(resolved(svg)).toEqual(Object.fromEntries(roles.map((role) => [role, paintFor('blueprint', 'dark')[role]])))
  expect(getComputedStyle(backdrop).fill).toBe('rgb(8, 23, 37)')
})

test('lets a host that resolved the scheme itself override the reader preference', async () => {
  await commands.emulateColourScheme('dark')
  const { container } = await render(<Canvas config={drawing()} />)
  const svg = svgOf(container)

  // The attribute blocks come last in the generated stylesheet and match the media query's specificity, so source
  // order is what lets a host say the scheme deliberately rather than only being able to agree with the reader.
  document.documentElement.setAttribute('data-infoschematic-scheme', 'light')
  try {
    expect(resolved(svg)).toEqual(Object.fromEntries(roles.map((role) => [role, paintFor('neutral', 'light')[role]])))
  } finally {
    document.documentElement.removeAttribute('data-infoschematic-scheme')
  }
  expect(resolved(svg)).toEqual(Object.fromEntries(roles.map((role) => [role, paintFor('neutral', 'dark')[role]])))
})

test('prints on light paper whatever the reader prefers, in whichever style the drawing is', async () => {
  await commands.emulateColourScheme('dark')
  const { container } = await render(
    <>
      <Canvas config={drawing()} />
      <Canvas config={drawing('blueprint')} />
    </>
  )
  const [plain, authored] = [...container.querySelectorAll('.infoschematic-svg')]
  if (!plain || !authored) throw new Error('Canvas drew fewer diagrams than asked')

  expect(resolved(plain).backdrop).toBe(paintFor('neutral', 'dark').backdrop)

  /* The print block shares its selector's specificity with the reader's preference, so this is source order doing
     the work and no stylesheet reading would show it. Paper takes ink from the drawing, not from the scheme. */
  await commands.emulatePrintMedia(true)
  expect(resolved(plain)).toEqual(Object.fromEntries(roles.map((role) => [role, paintFor('neutral', 'light')[role]])))
  expect(getComputedStyle(plain.querySelector('.infoschematic-backdrop') as Element).fill).toBe('rgb(255, 255, 255)')

  /* Paper is a light ground, and a style is not a ground: a blueprint prints in its own light realisation rather
     than laying a navy backdrop onto the page. It is still a blueprint — the cyanotype one. */
  expect(resolved(authored)).toEqual(
    Object.fromEntries(roles.map((role) => [role, paintFor('blueprint', 'light')[role]]))
  )
})

const palette = (style: 'blueprint' | 'neutral', mode: 'dark' | 'light') =>
  Object.fromEntries(roles.map((role) => [role, paintFor(style, mode)[role]]))

/*
 * A document's own mode, resolved by the browser against a page that disagrees with it.
 *
 * An unlocked mode is a default: the drawing opens on it, and a ground the reader asked for — through the attribute a
 * host or the scheme control sets — moves it. A locked mode is the author saying it must not move, so the same request
 * leaves it where it is. The drawing carries its own attribute for both, and the stylesheet's nested rules have to
 * lose to it; that is a specificity question no reading of the source would settle, so the browser settles it.
 */
test.each(['neutral', 'blueprint'] as const)(
  'opens a %s drawing on its own mode and moves it only when unlocked',
  async (style) => {
    await commands.emulateColourScheme('light')
    const authored = style === 'blueprint' ? 'blueprint' : undefined
    const { container } = await render(
      <>
        <Canvas config={drawing(authored, { mode: 'dark' })} />
        <Canvas config={drawing(authored, { mode: 'dark', modeLocked: true })} />
        <Canvas config={drawing(authored)} />
      </>
    )
    const [opened, locked, plain] = [...container.querySelectorAll('.infoschematic-svg')]
    if (!opened || !locked || !plain) throw new Error('Canvas drew fewer diagrams than asked')

    // Nobody has asked for a ground, so each document's own answer stands and the plain one follows the machine.
    expect(resolved(opened)).toEqual(palette(style, 'dark'))
    expect(resolved(locked)).toEqual(palette(style, 'dark'))
    expect(resolved(plain)).toEqual(palette(style, 'light'))
    expect(plain.hasAttribute('data-infoschematic-scheme')).toBe(false)

    // The reader asks for light: the default gives way, the lock does not.
    document.documentElement.setAttribute('data-infoschematic-scheme', 'light')
    await expect.poll(() => opened.getAttribute('data-infoschematic-scheme')).toBe('light')
    expect(resolved(opened)).toEqual(palette(style, 'light'))
    expect(locked.getAttribute('data-infoschematic-scheme')).toBe('dark')
    expect(resolved(locked)).toEqual(palette(style, 'dark'))

    // And the other way: a page in dark does not move a document locked to light.
    document.documentElement.setAttribute('data-infoschematic-scheme', 'dark')
    const { container: second } = await render(
      <Canvas config={drawing(authored, { mode: 'light', modeLocked: true })} />
    )
    expect(resolved(svgOf(second))).toEqual(palette(style, 'light'))

    // Paper is light whatever ground the document locked, the same as whatever ground the reader chose.
    await commands.emulatePrintMedia(true)
    expect(resolved(locked)).toEqual(palette(style, 'light'))
  }
)

/* A locked `system` binds the drawing to the machine, so a choice made on the page moves the page and not it. */
test('keeps a document locked to system on the machine whatever the page chose', async () => {
  await commands.emulateColourScheme('dark')
  const { container } = await render(<Canvas config={drawing(undefined, { mode: 'system', modeLocked: true })} />)
  const svg = svgOf(container)

  document.documentElement.setAttribute('data-infoschematic-scheme', 'light')
  window.localStorage.setItem('infoschematics.colour-scheme', 'light')
  await expect.poll(() => svg.getAttribute('data-infoschematic-scheme')).toBe('dark')
  expect(resolved(svg)).toEqual(palette('neutral', 'dark'))

  await commands.emulateColourScheme('light')
  await expect.poll(() => svg.getAttribute('data-infoschematic-scheme')).toBe('light')
  expect(resolved(svg)).toEqual(palette('neutral', 'light'))
})

/*
 * The control and the drawing read one answer.
 *
 * Each used to keep its own copy of the scheme, so pressing the control in a title bar repainted the palette — which
 * the stylesheet resolves — and left every authored colour realised for the ground the page had just left, because
 * those are written by the drawing rather than resolved by the browser.
 */
test("re-realises the drawing's authored colours when the reader's control is pressed", async () => {
  await commands.emulateColourScheme('light')
  const config = defineInfoschematicModel({
    id: 'schemes-seeds',
    title: 'Schemes seeds',
    diagram: {
      bounds: { height: 200, width: 400, x: 0, y: 0 },
      gridSize: 10,
      regions: [
        { id: 'R', label: 'Region', bounds: { height: 120, width: 200, x: 20, y: 20 }, appearance: { fill: '#6c8ebf' } }
      ]
    }
  })
  const { container, getByRole } = await render(
    <>
      <ColourSchemeButton />
      <Canvas config={config} />
    </>
  )
  const fill = () => container.querySelector('.infoschematic-region-fill')?.getAttribute('fill')
  expect(fill()).toBe(resolveAuthoredColour('#6c8ebf', 'light', 'ground'))

  await getByRole('button', { name: 'Dark', exact: true }).click()
  await expect.poll(fill).toBe(resolveAuthoredColour('#6c8ebf', 'dark', 'ground'))
})
