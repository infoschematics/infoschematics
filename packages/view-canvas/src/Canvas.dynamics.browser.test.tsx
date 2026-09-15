/**
 * Diagram Dynamics in a real browser: the treatment, its finite life, and what a reader is told.
 *
 * The node suite proves the resolution and the markup. Only a browser can say whether the emphasis is actually painted
 * from the shared tokens, whether it retires, and whether the live region carries the Dynamic's meaning rather than
 * the name of the element it happened to outline.
 */
import { defineInfoschematicModel } from '@infoschematics/domain-core'
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
      { id: 'attention', label: 'Sink needs attention', kind: 'emphasise-elements', elements: ['SNK'] }
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
  const outline = emphasis?.firstElementChild as SVGRectElement
  const painted = getComputedStyle(outline)
  expect(painted.stroke).toBe('rgb(242, 166, 59)')
  expect(painted.fill).toBe('none')
  expect(painted.strokeWidth).toBe('3px')
  // Outset from the Card, so the treatment reads as being about the Card rather than part of it.
  expect(outline.getAttribute('x')).toBe('294')
  expect(outline.getAttribute('width')).toBe('132')

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
