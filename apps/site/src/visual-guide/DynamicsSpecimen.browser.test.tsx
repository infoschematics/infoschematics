import { cueRepeatInterval } from '@infoschematics/view-present'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { DynamicsSpecimen } from './DynamicsSpecimen.tsx'

const after = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const paneAt = (container: HTMLElement, index: number) => {
  const pane = container.querySelectorAll<HTMLElement>('figure')[index]
  if (!pane) throw new Error(`Missing pane ${index}`)
  return pane
}

const signalKey = (pane: HTMLElement) =>
  pane.querySelector('.infoschematic-flow-signal')?.getAttribute('data-occurrence-key') ?? undefined

const pressIn = (pane: HTMLElement, label: string) => {
  const button = pane.querySelector<HTMLButtonElement>('figcaption button')
  if (!button || button.textContent !== label) throw new Error(`Missing ${label} control`)
  button.click()
}

/*
 * The guide's panes are watched rather than read, so the evidence has to be taken over time in a real page: a key
 * sampled once says nothing about whether a cadence is running, and a suite that only rendered would pass with the
 * beat never starting or never stopping.
 */
const keysSeenOver = async (pane: HTMLElement, ms: number) => {
  const seen = new Set<string>()
  for (let elapsed = 0; elapsed < ms; elapsed += 100) {
    const key = signalKey(pane)
    if (key) seen.add(key)
    await after(100)
  }
  return seen
}

test('plays the repeat pane on the product cadence and stops the beat when paused', async () => {
  const { container } = await render(<DynamicsSpecimen />)
  const repeat = paneAt(container, 1)

  const played = await keysSeenOver(repeat, cueRepeatInterval * 2.5)
  // Distinct keys are the proof the cue actually cycled: one repeated key would be a single occurrence held still.
  expect(played.size).toBeGreaterThan(2)

  pressIn(repeat, 'Pause')
  await after(cueRepeatInterval)
  const paused = await keysSeenOver(repeat, cueRepeatInterval * 2)

  // Nothing new arrives after the pause, which is the interval's own cleanup rather than a stalled render.
  expect([...paused].filter((key) => !played.has(key))).toEqual([])
  expect(paused.size).toBeLessThan(2)
})

test('plays the once pane only when asked, and holds the state pane until it is withdrawn', async () => {
  const { container } = await render(<DynamicsSpecimen />)
  const once = paneAt(container, 0)
  const state = paneAt(container, 2)

  // A cue played once retires with its treatment and nothing brings it back on its own.
  await expect.poll(() => signalKey(once)).toBe('guide-once-1')
  await expect.poll(() => signalKey(once), { timeout: 2000 }).toBeUndefined()
  expect(await keysSeenOver(once, cueRepeatInterval * 1.5)).toEqual(new Set())

  pressIn(once, 'Play again')
  await expect.poll(() => signalKey(once)).toBe('guide-once-2')

  // The held statement is the other half of the contrast: same key, still painted long after an event would have gone.
  const held = () => state.querySelector('.infoschematic-element-emphasis[data-artefact-id="SENSOR"]')
  await expect.poll(held).not.toBeNull()
  await after(cueRepeatInterval * 2)
  expect(held()).not.toBeNull()
  expect(held()?.closest('[data-occurrence-key]')?.getAttribute('data-occurrence-key')).toBe('guide-state')

  pressIn(state, 'Withdraw')
  await expect.poll(held).toBeNull()
})
