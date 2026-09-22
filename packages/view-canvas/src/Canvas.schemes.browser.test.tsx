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
import { type PaintRole, paintFor, paintVariable } from '@infoschematics/view-model/tokens'
import { afterEach, expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { Canvas } from './Canvas.tsx'
import './styles.css'

const drawing = (surface?: 'blueprint') =>
  defineInfoschematicModel({
    id: 'schemes-browser',
    title: 'Schemes browser',
    diagram: {
      bounds: { height: 200, width: 400, x: 0, y: 0 },
      gridSize: 10,
      ...(surface ? { appearance: { surface } } : {}),
      cards: [{ id: 'SRC', label: 'Source', bounds: { height: 60, width: 120, x: 40, y: 60 } }]
    }
  })

/** Every paint role the manifest declares, named the way the stylesheet declares it. */
const roles = Object.keys(paintFor('light')).filter((role): role is PaintRole => role !== 'artwork')

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

  expect(resolved(svg)).toEqual(Object.fromEntries(roles.map((role) => [role, paintFor('light')[role]])))
  const backdrop = svg.querySelector('.infoschematic-backdrop')
  if (!backdrop) throw new Error('the drawing has no backdrop')
  expect(getComputedStyle(backdrop).fill).toBe('rgb(255, 255, 255)')

  await commands.emulateColourScheme('dark')
  expect(resolved(svg)).toEqual(Object.fromEntries(roles.map((role) => [role, paintFor('dark')[role]])))
  // The colour, not just the variable: a role that resolved and was never painted from would satisfy the map alone.
  expect(getComputedStyle(backdrop).fill).toBe('rgb(22, 27, 32)')
})

test('keeps an authored blueprint a blueprint under either preference', async () => {
  const { container } = await render(<Canvas config={drawing('blueprint')} />)
  const svg = svgOf(container)
  const blueprint = Object.fromEntries(roles.map((role) => [role, paintFor('blueprint')[role]]))

  await commands.emulateColourScheme('light')
  expect(resolved(svg)).toEqual(blueprint)
  await commands.emulateColourScheme('dark')
  expect(resolved(svg)).toEqual(blueprint)
  expect(getComputedStyle(svg.querySelector('.infoschematic-backdrop') as Element).fill).toBe('rgb(8, 23, 37)')
})

test('lets a host that resolved the scheme itself override the reader preference', async () => {
  await commands.emulateColourScheme('dark')
  const { container } = await render(<Canvas config={drawing()} />)
  const svg = svgOf(container)

  // The attribute blocks come last in the generated stylesheet and match the media query's specificity, so source
  // order is what lets a host say the scheme deliberately rather than only being able to agree with the reader.
  document.documentElement.setAttribute('data-infoschematic-scheme', 'light')
  try {
    expect(resolved(svg)).toEqual(Object.fromEntries(roles.map((role) => [role, paintFor('light')[role]])))
  } finally {
    document.documentElement.removeAttribute('data-infoschematic-scheme')
  }
  expect(resolved(svg)).toEqual(Object.fromEntries(roles.map((role) => [role, paintFor('dark')[role]])))
})

test('prints on light paper whatever the reader prefers, and prints a blueprint as authored', async () => {
  await commands.emulateColourScheme('dark')
  const { container } = await render(
    <>
      <Canvas config={drawing()} />
      <Canvas config={drawing('blueprint')} />
    </>
  )
  const [plain, authored] = [...container.querySelectorAll('.infoschematic-svg')]
  if (!plain || !authored) throw new Error('Canvas drew fewer diagrams than asked')

  expect(resolved(plain).backdrop).toBe(paintFor('dark').backdrop)

  /* The print block shares its selector's specificity with the reader's preference, so this is source order doing
     the work and no stylesheet reading would show it. Paper takes ink from the drawing, not from the scheme. */
  await commands.emulatePrintMedia(true)
  expect(resolved(plain)).toEqual(Object.fromEntries(roles.map((role) => [role, paintFor('light')[role]])))
  expect(getComputedStyle(plain.querySelector('.infoschematic-backdrop') as Element).fill).toBe('rgb(255, 255, 255)')

  // A blueprint is a treatment its author chose rather than a scheme resolved for a reader, and it prints as drawn.
  expect(resolved(authored)).toEqual(Object.fromEntries(roles.map((role) => [role, paintFor('blueprint')[role]])))
})
