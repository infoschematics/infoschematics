/** Look at the two-axis model on both grounds: the mode gallery, and a blueprint drawing in light and dark. */
import type { Look } from '../look.ts'

const ground = async ({ page }: Look, mode: 'dark' | 'light') => {
  await page.emulateMedia({ colorScheme: mode })
  await page.evaluate((value: string) => {
    window.localStorage.setItem('infoschematics.colour-scheme', value)
    document.documentElement.setAttribute('data-infoschematic-scheme', value)
  }, mode)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const resolved = await page.evaluate(() => document.documentElement.getAttribute('data-infoschematic-scheme'))
  if (resolved !== mode) throw new Error(`asked for ${mode} and the page resolved ${resolved}`)
}

export const look = async (context: Look) => {
  const { note, page, shot, url } = context

  for (const mode of ['light', 'dark'] as const) {
    await page.goto(url('/docs/components/canvas/'), { waitUntil: 'networkidle' })
    await ground(context, mode)
    await page.locator('#canvas-schemes').scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await shot(`style-and-mode-${mode}`)
    note(`canvas guide, style-and-mode section, ${mode} ground`)
  }

  for (const mode of ['light', 'dark'] as const) {
    await page.goto(url('/playground/'), { waitUntil: 'networkidle' })
    await ground(context, mode)
    await shot(`blueprint-playground-${mode}`)
    note(`playground seed authoring style: blueprint, ${mode} ground`)
  }
}
