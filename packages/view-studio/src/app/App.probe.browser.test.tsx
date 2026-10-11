/**
 * THROWAWAY exploration probe for INFOSCHEMATICS-TOOL-057 step 4. Delete before committing.
 *
 * Reads back what the composed Studio surface actually does with interaction layers closed, a held group of three, a
 * non-default authored grid size, and a Dynamic running.
 */
import { defineInfoschematicModel } from '@infoschematics/domain-core'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { Studio } from './App.tsx'
import '../styles.css'

const config = defineInfoschematicModel({
  id: 'probe',
  title: 'Probe',
  diagram: {
    bounds: { height: 320, width: 640, x: 0, y: 0 },
    // Deliberately not the default: the authored pitch has to reach the rendered pattern.
    gridSize: 25,
    regions: [{ id: 'ZONE', label: 'Zone', bounds: { height: 260, width: 600, x: 10, y: 30 } }],
    cards: [
      { id: 'CARD-A', label: 'Card A', bounds: { height: 50, width: 100, x: 40, y: 60 } },
      { id: 'CARD-B', label: 'Card B', bounds: { height: 50, width: 100, x: 200, y: 140 } },
      { id: 'CARD-C', label: 'Card C', bounds: { height: 50, width: 100, x: 400, y: 220 } }
    ],
    points: [{ id: 'EDGE', label: 'Edge', at: { x: 560, y: 100 } }],
    dynamics: [
      { id: 'card-state', label: 'Card A is live', kind: 'emphasise-elements', elements: ['CARD-A'], depicts: 'state' },
      { id: 'edge-state', label: 'Edge is live', kind: 'emphasise-elements', elements: ['EDGE'], depicts: 'state' },
      { id: 'zone-state', label: 'Zone is live', kind: 'emphasise-elements', elements: ['ZONE'], depicts: 'state' }
    ]
  }
})

const designing = async () => {
  window.localStorage.clear()
  const { container } = await render(<Studio config={config} />)
  const design = container.querySelector<HTMLButtonElement>('button[aria-label^="Design"]')
  if (!design) throw new Error('Studio has no Design mode control')
  design.click()
  await expect.poll(() => container.querySelector('main')?.getAttribute('data-production-mode')).toBe('design')
  return container
}

const findings: string[] = []
const report = (...parts: unknown[]) => {
  findings.push(parts.map((part) => String(part)).join(' '))
}

const at = (container: HTMLElement, id: string) => container.querySelector<SVGGElement>(`[data-artefact-id="${id}"]`)

test('PROBE 1: the authored grid pitch on the Studio surface', async () => {
  const container = await designing()
  const patterns = [...container.querySelectorAll('pattern')].map((pattern) => ({
    id: pattern.id,
    height: pattern.getAttribute('height'),
    width: pattern.getAttribute('width')
  }))
  const surface = container.querySelector('.infoschematic')
  report('PROBE grid patterns', JSON.stringify(patterns))
  report('PROBE surface background-image', surface ? getComputedStyle(surface).backgroundImage.slice(0, 120) : 'none')
  expect(findings).toEqual('SHOW-ME')
})

test('PROBE 2: a held group of three, then the Card layer closes under it', async () => {
  const container = await designing()
  const anchor = at(container, 'CARD-A')
  if (!anchor) throw new Error('no anchor')
  anchor.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 70 }))
  window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 70 }))
  await expect.poll(() => anchor.classList.contains('selected')).toBe(true)

  for (const [id, pointerId] of [
    ['CARD-B', 71],
    ['CARD-C', 72]
  ] as const) {
    at(container, id)?.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId, shiftKey: true })
    )
    await expect.poll(() => at(container, id)?.classList.contains('group-held')).toBe(true)
  }

  const held = () =>
    [...container.querySelectorAll('[data-artefact-id]')]
      .filter((node) => node.classList.contains('group-held') || node.classList.contains('selected'))
      .map(
        (node) =>
          `${node.getAttribute('data-artefact-id')}:${node
            .getAttribute('class')
            ?.match(/group-held|selected/g)
            ?.join('+')}`
      )
  report('PROBE held before close', JSON.stringify(held()))

  // What Canvas's group treatment computes to through Studio's own stylesheet.
  const b = at(container, 'CARD-B')?.querySelector('rect')
  report(
    'PROBE group-held computed',
    b ? JSON.stringify({ stroke: getComputedStyle(b).stroke, dash: getComputedStyle(b).strokeDasharray }) : 'none'
  )

  const control = (label: string) => container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
  await expect.poll(() => control('Cards interactive')?.offsetParent ?? null).not.toBeNull()
  control('Cards interactive')?.click()
  await expect.poll(() => control('Cards interactive')?.getAttribute('aria-pressed')).toBe('false')
  report('PROBE held immediately after close', JSON.stringify(held()))
  report('PROBE card layer-inert', at(container, 'CARD-B')?.getAttribute('class')?.includes('layer-inert'))
  let released = false
  try {
    await expect.poll(() => held().length, { timeout: 2000 }).toBe(0)
    released = true
  } catch {
    released = false
  }
  report('PROBE group released after polling', released)
  report('PROBE held after polling', JSON.stringify(held()))
  expect(findings).toEqual('SHOW-ME')
})

test('PROBE 3: running a Dynamic, and where the bank lives', async () => {
  window.localStorage.clear()
  const { container } = await render(<Studio config={config} />)
  const mode = () => container.querySelector('main')?.getAttribute('data-production-mode')
  report('PROBE opening mode', mode())

  const bank = () => container.querySelector('section[aria-label="Diagram Dynamics"]')
  report('PROBE bank present at open', bank() !== null)

  const design = container.querySelector<HTMLButtonElement>('button[aria-label^="Design"]')
  design?.click()
  await expect.poll(mode).toBe('design')
  report('PROBE bank present in design', bank() !== null)

  const present = container.querySelector<HTMLButtonElement>('button[aria-label^="Present"]')
  report('PROBE has Present control', present !== null)
  present?.click()
  await expect.poll(mode).toBe('present')
  await expect.poll(() => bank() !== null).toBe(true)

  const play = (label: string) => {
    const button = [
      ...container.querySelectorAll<HTMLButtonElement>('section[aria-label="Diagram Dynamics"] button')
    ].find((node) => node.textContent === label)
    if (!button) throw new Error(`no Dynamic control ${label}`)
    button.click()
  }

  const emphasisFor = (id: string) =>
    container.querySelector(`.infoschematic-element-emphasis[data-artefact-id="${id}"]`)

  play('Zone is live')
  await expect.poll(() => emphasisFor('ZONE') !== null).toBe(true)
  report('PROBE ZONE emphasis painted', emphasisFor('ZONE') !== null)

  play('Zone is live')
  play('Edge is live')
  await new Promise((resolve) => setTimeout(resolve, 200))
  report('PROBE EDGE drawn as artefact', at(container, 'EDGE') !== null)
  report('PROBE EDGE emphasis painted', emphasisFor('EDGE') !== null)
  report(
    'PROBE every emphasis group now',
    JSON.stringify(
      [...container.querySelectorAll('.infoschematic-element-emphasis')].map((n) => n.getAttribute('data-artefact-id'))
    )
  )
  expect(findings).toEqual('SHOW-ME')
})
