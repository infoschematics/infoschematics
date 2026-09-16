/**
 * Diagram Dynamics in a real browser: the treatment, its finite life, and what a reader is told.
 *
 * The node suite proves the resolution and the markup. Only a browser can say whether the emphasis is actually painted
 * from the shared tokens, whether it retires, and whether the live region carries the Dynamic's meaning rather than
 * the name of the element it happened to outline.
 */
import { defineInfoschematicModel } from '@infoschematics/domain-core'
import { emphasisPerimeterPath } from '@infoschematics/view-model/perimeter'
import { useState } from 'react'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from './Canvas.tsx'
import { elementEmphasisDuration } from './element-emphasis.ts'
import './styles.css'

const config = defineInfoschematicModel({
  id: 'dynamics-browser',
  title: 'Dynamics browser',
  diagram: {
    bounds: { height: 240, width: 480, x: 0, y: 0 },
    gridSize: 10,
    regions: [{ id: 'ZONE', label: 'Zone', bounds: { height: 160, width: 440, x: 20, y: 30 } }],
    families: [{ id: 'request', label: 'Request', description: 'Requests', appearance: { color: '#7c3aed' } }],
    cards: [
      { id: 'SRC', label: 'Source', bounds: { height: 60, width: 120, x: 40, y: 60 } },
      { id: 'SNK', label: 'Sink', bounds: { height: 60, width: 120, x: 300, y: 60 } }
    ],
    flows: [
      { id: 'LOAD', family: 'request', source: { element: 'SRC', port: 'E1' }, target: { element: 'SNK', port: 'W1' } }
    ],
    dynamics: [
      { id: 'delivered', label: 'Record delivered', kind: 'signal-flow', flows: ['LOAD'] },
      { id: 'attention', label: 'Sink needs attention', kind: 'emphasise-elements', elements: ['SNK'] },
      {
        id: 'on-this-stage',
        label: 'We are on this stage',
        kind: 'emphasise-elements',
        elements: ['ZONE'],
        depicts: 'state'
      }
    ]
  }
})

const emphasisOf = (container: HTMLElement) =>
  container.querySelector<SVGGElement>('.infoschematic-element-emphasis[data-artefact-id="SNK"]')

test('paints an emphasis from the shared tokens and retires it without the host withdrawing anything', async () => {
  const { container } = await render(
    <Canvas config={config} dynamics={[{ dynamicId: 'attention', occurrenceKey: 'run-1' }]} />
  )

  const emphasis = emphasisOf(container)
  expect(emphasis).not.toBeNull()
  const outline = emphasis?.firstElementChild as SVGPathElement
  const painted = getComputedStyle(outline)
  expect(painted.stroke).toBe('rgb(242, 166, 59)')
  expect(painted.fill).toBe('none')
  expect(painted.strokeWidth).toBe('3px')
  // Outset from the Card, so the treatment reads as being about the Card rather than part of it. Asked of the
  // geometry the browser actually resolved, so the answer survives the outline being a path a mark can travel
  // rather than the `rect` it used to be.
  expect(outline.getAttribute('d')).toBe(emphasisPerimeterPath({ height: 60, width: 120, x: 300, y: 60 }))
  const drawn = outline.getBBox()
  expect(drawn.x).toBe(294)
  expect(drawn.width).toBe(132)

  const status = container.querySelectorAll('[role="status"]')[1]
  await expect.poll(() => status.textContent).toBe('Dynamic update 1. Sink needs attention.')

  await expect.poll(() => emphasisOf(container), { timeout: elementEmphasisDuration * 4 }).toBeNull()
})

test('replays on a changed occurrence key and cancels when the host withdraws the occurrence', async () => {
  function Host() {
    const [occurrenceKey, setOccurrenceKey] = useState('run-1')
    const [playing, setPlaying] = useState(true)
    return (
      <>
        <button onClick={() => setOccurrenceKey('run-2')} type="button">
          Replay
        </button>
        <button onClick={() => setPlaying(false)} type="button">
          Stop
        </button>
        <Canvas config={config} dynamics={playing ? [{ dynamicId: 'attention', occurrenceKey }] : []} />
      </>
    )
  }

  const screen = await render(<Host />)
  const container = screen.container as HTMLElement

  await expect.poll(() => emphasisOf(container)?.dataset.occurrenceKey).toBe('run-1')
  await screen.getByRole('button', { name: 'Replay' }).click()
  await expect.poll(() => emphasisOf(container)?.dataset.occurrenceKey).toBe('run-2')
  await expect
    .poll(() => container.querySelectorAll('[role="status"]')[1].textContent)
    .toBe('Dynamic update 2. Sink needs attention.')

  await screen.getByRole('button', { name: 'Stop' }).click()
  await expect.poll(() => emphasisOf(container)).toBeNull()
})

test('sustains a held emphasis long past the finite duration and ends it when the host withdraws it', async () => {
  function Host() {
    const [held, setHeld] = useState(true)
    return (
      <>
        <button onClick={() => setHeld(false)} type="button">
          Leave
        </button>
        <Canvas config={config} dynamics={held ? [{ dynamicId: 'on-this-stage', occurrenceKey: 'hold-1' }] : []} />
      </>
    )
  }

  const screen = await render(<Host />)
  const container = screen.container as HTMLElement
  const heldOf = () => container.querySelector<SVGGElement>('.infoschematic-element-emphasis[data-artefact-id="ZONE"]')
  const status = () => container.querySelectorAll('[role="status"]')[1] as HTMLElement

  await expect.poll(() => heldOf()?.dataset.depicts).toBe('state')
  await expect.poll(() => status().textContent).toBe('Dynamic update 1. We are on this stage.')

  // Nothing but the wait: the finite treatment would have been retired by the Canvas several times over by now.
  await new Promise((resolve) => {
    setTimeout(resolve, elementEmphasisDuration * 3)
  })

  const outline = heldOf()?.firstElementChild as SVGPathElement | undefined
  expect(outline).toBeDefined()
  const painted = getComputedStyle(outline as SVGPathElement)
  expect(painted.animationName).toBe('infoschematic-element-emphasis-held')
  expect(painted.animationIterationCount).toBe('infinite')
  expect(painted.stroke).toBe('rgb(242, 166, 59)')
  // An SVG element has no offsetParent to consult, so ask the two things that do decide whether a reader sees it:
  // it occupies space on the page, and the sustained treatment is part way between its two opacities, never off.
  const box = (outline as SVGPathElement).getBoundingClientRect()
  expect(box.width).toBeGreaterThan(0)
  expect(box.height).toBeGreaterThan(0)
  expect(Number(painted.opacity)).toBeGreaterThanOrEqual(0.55)
  expect(Number(painted.opacity)).toBeLessThanOrEqual(0.9)
  // A hold that is still the same hold says nothing further: the reader was told once, and no revision followed.
  expect(status().textContent).toBe('Dynamic update 1. We are on this stage.')

  await screen.getByRole('button', { name: 'Leave' }).click()
  await expect.poll(heldOf).toBeNull()
  await expect.poll(() => status().textContent).toBe('')
})

test('signals the Flow a signal-flow Dynamic names, leaving every other element untouched', async () => {
  const { container } = await render(
    <Canvas config={config} dynamics={[{ dynamicId: 'delivered', occurrenceKey: 'run-1' }]} />
  )

  await expect.poll(() => container.querySelector('.infoschematic-flow-signal')).not.toBeNull()
  expect(container.querySelector('[data-artefact-id="LOAD"] .infoschematic-flow-signal')).not.toBeNull()
  expect(emphasisOf(container)).toBeNull()
  await expect
    .poll(() => container.querySelectorAll('[role="status"]')[0].textContent)
    .toContain('Flow LOAD, Source to Sink, signalled.')
})

test('sends the mark round the element over time, and never off the line it is travelling', async () => {
  const { container } = await render(
    <Canvas config={config} dynamics={[{ dynamicId: 'on-this-stage', occurrenceKey: 'hold-1' }]} />
  )

  const group = () => container.querySelector<SVGGElement>('.infoschematic-element-emphasis[data-artefact-id="ZONE"]')
  await expect.poll(group).not.toBeNull()
  const emphasis = group() as SVGGElement
  const outline = emphasis.firstElementChild as SVGPathElement
  const mark = emphasis.querySelector<SVGCircleElement>('.infoschematic-element-emphasis-mark')
  expect(mark).not.toBeNull()

  /* Where the mark actually is, as the browser resolves it. `getBoundingClientRect` carries the transform
     `animateMotion` contributes; `getBBox` would not, and would report the disc parked at the origin for ever. */
  const seen = mark as SVGCircleElement
  const positions: { x: number; y: number }[] = []
  for (let sample = 0; sample < 8; sample += 1) {
    const at = seen.getBoundingClientRect()
    positions.push({ x: Math.round(at.left), y: Math.round(at.top) })
    await new Promise((resolve) => {
      setTimeout(resolve, elementEmphasisDuration / 8)
    })
  }

  // It moves, and it keeps moving: a mark that arrived somewhere once and stopped would pass a single reading.
  expect(new Set(positions.map(({ x, y }) => `${x},${y}`)).size).toBeGreaterThan(3)

  /* And it moves round the element rather than across it. The outline's own box plus the mark's radius is the
     whole region a perimeter walk may visit, so a mark cutting the interior or straying outside fails here — which
     is the assertion that the mark and the outline are one path rather than two statements of the same shape. */
  const line = outline.getBoundingClientRect()
  const slack = 8
  for (const { x, y } of positions) {
    expect(x).toBeGreaterThanOrEqual(Math.floor(line.left) - slack)
    expect(x).toBeLessThanOrEqual(Math.ceil(line.right) + slack)
    expect(y).toBeGreaterThanOrEqual(Math.floor(line.top) - slack)
    expect(y).toBeLessThanOrEqual(Math.ceil(line.bottom) + slack)
  }

  // Held, so it is still going round after the finite treatment would have been retired: `repeatCount` earning its
  // place in the markup, not merely being present in it.
  await new Promise((resolve) => {
    setTimeout(resolve, elementEmphasisDuration * 2)
  })
  const late = seen.getBoundingClientRect()
  await new Promise((resolve) => {
    setTimeout(resolve, elementEmphasisDuration / 4)
  })
  const later = seen.getBoundingClientRect()
  expect(`${Math.round(late.left)},${Math.round(late.top)}`).not.toBe(
    `${Math.round(later.left)},${Math.round(later.top)}`
  )
})
