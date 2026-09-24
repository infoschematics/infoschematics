/**
 * Diagram Dynamics in a real browser: the treatment, its finite life, and what a reader is told.
 *
 * The node suite proves the resolution and the markup. Only a browser can say whether the emphasis is actually painted
 * from the shared tokens, whether it retires, and whether the live region carries the Dynamic's meaning rather than
 * the name of the element it happened to outline.
 */
import { defineInfoschematicModel } from '@infoschematics/domain-core'
import type { ArtefactSelection } from '@infoschematics/view-model/editable'
import { emphasisPerimeterPath, emphasisPointRadius } from '@infoschematics/view-model/perimeter'
import { useState } from 'react'
import { afterEach, expect, test } from 'vitest'
import { commands } from 'vitest/browser'
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
    points: [{ id: 'EDGE', label: 'Edge', at: { x: 240, y: 170 } }],
    flows: [
      { id: 'LOAD', family: 'request', source: { element: 'SRC', port: 'E1' }, target: { element: 'SNK', port: 'W1' } }
    ],
    dynamics: [
      { id: 'delivered', label: 'Record delivered', kind: 'signal-flow', flows: ['LOAD'] },
      { id: 'attention', label: 'Sink needs attention', kind: 'emphasise-elements', elements: ['SNK'] },
      {
        id: 'edge-attention',
        label: 'Edge needs attention',
        kind: 'emphasise-elements',
        elements: ['EDGE'],
        depicts: 'state'
      },
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

/** Where a diagram coordinate lands on the page, so a press can be aimed at the element rather than at a guess. */
const screenPoint = (svg: SVGSVGElement, x: number, y: number) => {
  const matrix = svg.getScreenCTM()
  if (!matrix) throw new Error('rendered SVG has no screen transform')
  const place = svg.createSVGPoint()
  place.x = x
  place.y = y
  const screen = place.matrixTransform(matrix)
  return { clientX: screen.x, clientY: screen.y }
}

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

  /* The host's own two announcement regions, in their order. The Diagram carries a third for its detail band, which
     is not a document event and would otherwise shift these indices out from under every case in this file. */
  const status = container.querySelectorAll('[role="status"]:not([data-detail-announcement])')[1]
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
    .poll(() => container.querySelectorAll('[role="status"]:not([data-detail-announcement])')[1].textContent)
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
  const status = () => container.querySelectorAll('[role="status"]:not([data-detail-announcement])')[1] as HTMLElement

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
    .poll(() => container.querySelectorAll('[role="status"]:not([data-detail-announcement])')[0].textContent)
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

/**
 * The emphasis a Point is given, and the press it must still take underneath it.
 *
 * A Point is the one emphasis target that is not a box, and the node suite can only read the markup back. What a
 * browser adds is the two things that markup cannot state: that the ring the layout engine actually resolved runs
 * outside the six-unit disc rather than over it, and that drawing something on top of the smallest element on the
 * surface did not take its press away. The second is the real hazard — an emphasis layer that swallowed pointer
 * events would pass every assertion about what it looks like.
 */
test('rings a Point outside its disc and leaves the disc itself pressable', async () => {
  const selected: (ArtefactSelection | null)[] = []
  const { container } = await render(
    <Canvas
      config={config}
      dynamics={[{ dynamicId: 'edge-attention', occurrenceKey: 'run-1' }]}
      editor="design"
      onArtefactSelect={(selection) => selected.push(selection)}
    />
  )

  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  const emphasis = container.querySelector<SVGGElement>('.infoschematic-element-emphasis[data-artefact-id="EDGE"]')
  if (!svg || !emphasis) throw new Error('rendered Point emphasis is incomplete')

  const ring = emphasis.firstElementChild as SVGCircleElement
  expect(ring.tagName).toBe('circle')
  const painted = getComputedStyle(ring)
  expect(painted.stroke).toBe('rgb(242, 166, 59)')
  expect(painted.fill).toBe('none')
  expect(painted.strokeWidth).toBe('3px')

  /* Asked of the geometry the browser resolved rather than of the attribute written into it, and asked as a box
     round the Point's own centre: a ring drawn at the Point's radius instead of the outset one would still be a
     circle in the right place and would read as a thicker Point. */
  expect(ring.getAttribute('r')).toBe(String(emphasisPointRadius))
  const drawn = ring.getBBox()
  expect(drawn.width).toBe(emphasisPointRadius * 2)
  expect(drawn.x).toBe(240 - emphasisPointRadius)
  expect(drawn.y).toBe(170 - emphasisPointRadius)
  const mark = container.querySelector<SVGCircleElement>('.infoschematic-point .point-mark')
  expect(Number(mark?.getAttribute('r'))).toBeLessThan(emphasisPointRadius)

  /* The press. The emphasis is drawn last and therefore lies over the Point, so the only thing keeping the Point
     reachable is `pointer-events: none` on the emphasis layer — which is why this asks the browser what is actually
     at the Point's centre rather than asking the stylesheet what it declared. */
  const at = screenPoint(svg, 240, 170)
  const topmost = document.elementFromPoint(at.clientX, at.clientY)
  expect(topmost?.classList.contains('point-target')).toBe(true)
  topmost?.dispatchEvent(new PointerEvent('pointerdown', { ...at, bubbles: true, pointerId: 11 }))
  window.dispatchEvent(new PointerEvent('pointerup', { ...at, bubbles: true, pointerId: 11 }))
  expect(selected.at(-1)).toMatchObject({ id: 'EDGE', kind: 'point' })
})

/* One browser context serves this whole file, so an emulated media feature outlives the case that asked for it.
   Every case below either never touches it or hands it back here, which is what keeps the cases above measuring
   full motion. */
afterEach(async () => {
  await commands.emulateReducedMotion(false)
})

test('takes the page at its word about reduced motion before anything is asserted under it', async () => {
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // The negative first: without this, a green run below would prove only that the emulation never arrived.
  expect(reduced()).toBe(false)
  await commands.emulateReducedMotion(true)
  expect(reduced()).toBe(true)
})

test('holds a held emphasis steady under reduced motion rather than animating it', async () => {
  await commands.emulateReducedMotion(true)
  const { container } = await render(
    <Canvas config={config} dynamics={[{ dynamicId: 'on-this-stage', occurrenceKey: 'hold-1' }]} />
  )

  const held = () => container.querySelector<SVGGElement>('.infoschematic-element-emphasis[data-artefact-id="ZONE"]')
  await expect.poll(held).not.toBeNull()
  const outline = held()?.firstElementChild as SVGPathElement

  /* The sustained rule carries a class and an attribute and the media query adds no specificity, so this fails
     the moment the reduced-motion block stops restating the held case — the exact cascade defect TOOL-059 found
     by hand. Asked of the page rather than of the stylesheet text, so it fails whether the rule was deleted or
     merely lost. */
  expect(getComputedStyle(outline).animationName).toBe('none')
  expect(getComputedStyle(outline).opacity).toBe('0.9')

  // And it is a steady outline rather than a slow one: the same opacity a treatment-length later.
  await new Promise((resolve) => {
    setTimeout(resolve, elementEmphasisDuration)
  })
  expect(getComputedStyle(outline).animationName).toBe('none')
  expect(getComputedStyle(outline).opacity).toBe('0.9')
})

test('removes the travelling mark under reduced motion rather than parking it', async () => {
  await commands.emulateReducedMotion(true)
  const { container } = await render(
    <Canvas config={config} dynamics={[{ dynamicId: 'on-this-stage', occurrenceKey: 'hold-1' }]} />
  )

  await expect
    .poll(() => container.querySelector('.infoschematic-element-emphasis[data-artefact-id="ZONE"]'))
    .not.toBeNull()
  const mark = container.querySelector<SVGCircleElement>('.infoschematic-element-emphasis-mark')
  expect(mark).not.toBeNull()
  const seen = mark as SVGCircleElement

  /* `animation: none` cannot still an `animateMotion` element, because declarative SVG motion is not a CSS
     animation — TOOL-060's finding, and the reason the mark is switched off by class instead. So the assertion is
     that it occupies no space at all, not that it stopped moving: a mark stilled by the wrong mechanism would keep
     going round and pass any test that only sampled one position. */
  expect(getComputedStyle(seen).display).toBe('none')
  const at = seen.getBoundingClientRect()
  expect(at.width).toBe(0)
  expect(at.height).toBe(0)

  // Nowhere later either, in case a rule elsewhere revives it once the treatment is under way.
  await new Promise((resolve) => {
    setTimeout(resolve, elementEmphasisDuration / 2)
  })
  expect(seen.getBoundingClientRect().width).toBe(0)
})

test('leaves an emphasised Point the steady ring under reduced motion', async () => {
  await commands.emulateReducedMotion(true)
  const { container } = await render(
    <Canvas config={config} dynamics={[{ dynamicId: 'edge-attention', occurrenceKey: 'run-1' }]} />
  )

  const ringOf = () =>
    container.querySelector<SVGCircleElement>('.infoschematic-element-emphasis[data-artefact-id="EDGE"] circle')
  await expect.poll(ringOf).not.toBeNull()
  const ring = ringOf() as SVGCircleElement

  /* A Point's ring is reached by the generic `.infoschematic-element-emphasis > *` rules rather than by anything
     written for a circle, so this is where a treatment that quietly needed its own selector would show up: the
     reduced-motion restatement for a held occurrence has to land on it exactly as it lands on a box's outline. */
  expect(getComputedStyle(ring).animationName).toBe('none')
  expect(getComputedStyle(ring).opacity).toBe('0.9')
  expect(ring.getAttribute('r')).toBe(String(emphasisPointRadius))

  // Steady rather than slow, and still nothing sent round it — a Point declines the travelling mark at full motion too.
  await new Promise((resolve) => {
    setTimeout(resolve, elementEmphasisDuration)
  })
  expect(getComputedStyle(ring).animationName).toBe('none')
  expect(getComputedStyle(ring).opacity).toBe('0.9')
  expect(
    container.querySelector(
      '.infoschematic-element-emphasis[data-artefact-id="EDGE"] .infoschematic-element-emphasis-mark'
    )
  ).toBeNull()
})
