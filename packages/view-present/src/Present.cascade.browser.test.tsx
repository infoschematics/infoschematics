/**
 * A Scene's cascade, played by the host rather than by the reducer.
 *
 * `presentation.test.ts` holds the stage arithmetic to a test, and a stage index that only reaches the reducer would
 * pass every one of those cases while advancing in neither host: the presenter's step and the timed beat both live in
 * `Present.tsx`, not in derivation. So this drives the real component in a real browser — a key on the page for an
 * untimed Sequence, the faked clock for a timed one — and reads the cascade off the rendered Diagram.
 *
 * Both fixtures cue Dynamics that depict a state, because a state is held until it is withdrawn. An event would be
 * retired by the Canvas partway through the run and the reading would then say as much about retirement timing as
 * about the cascade.
 */
import { defineInfoschematicModel } from '@infoschematics/domain-core'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { Present } from './Present.tsx'

/** Divides evenly by three, so each stage of the cascading Scene is exactly 300ms of it. */
const hold = 900

/**
 * A real macrotask, because the faked clock does not drive React's scheduler and `expect.poll` would wait on a
 * `setTimeout` that never fires while the clock is faked.
 */
const macrotask = () =>
  new Promise<void>((resolve) => {
    const channel = new MessageChannel()
    channel.port1.onmessage = () => {
      channel.port1.close()
      resolve()
    }
    channel.port2.postMessage(undefined)
  })

/**
 * Wait for an expected reading, then require it to hold.
 *
 * Waiting alone would accept a reading the tree reaches on its way somewhere else — and settling alone accepts the
 * reading before the commit, which is how an earlier draft of this case passed against a stage index the host never
 * advanced. Both halves are needed: the reading has to arrive, and it has to still be there once everything queued
 * has run.
 */
const reach = async (observe: () => string, expected: string) => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await macrotask()
    if (observe() !== expected) continue
    for (let held = 0; held < 3; held += 1) await macrotask()
    return observe()
  }
  return `${observe()} (never reached ${expected})`
}

const diagram = {
  bounds: { height: 240, width: 620, x: 0, y: 0 },
  gridSize: 10,
  cards: [
    { id: 'SRC', label: 'Source', bounds: { height: 60, width: 120, x: 40, y: 60 } },
    { id: 'MID', label: 'Middle', bounds: { height: 60, width: 120, x: 240, y: 60 } },
    { id: 'SNK', label: 'Sink', bounds: { height: 60, width: 120, x: 440, y: 60 } }
  ],
  dynamics: [
    { id: 'first', label: 'Source is live', kind: 'emphasise-elements', elements: ['SRC'], depicts: 'state' },
    { id: 'second', label: 'Middle is live', kind: 'emphasise-elements', elements: ['MID'], depicts: 'state' },
    { id: 'third', label: 'Sink is live', kind: 'emphasise-elements', elements: ['SNK'], depicts: 'state' }
  ]
} as const

const cascadingScene = {
  id: 'cascade',
  label: 'Cascade',
  duration: hold,
  cues: [
    { dynamic: 'first', stage: 1 },
    { dynamic: 'second', stage: 2 },
    { dynamic: 'third', stage: 3 }
  ]
} as const

/** The same Scene's worth of cues with no order on them: one stage, and the step it always had. */
const flatScene = {
  id: 'flat',
  label: 'Flat',
  duration: hold,
  cues: [{ dynamic: 'first' }, { dynamic: 'second' }, { dynamic: 'third' }]
} as const

const after = { id: 'after', label: 'After' } as const

/** Which Dynamics the Diagram is currently drawing, in a reading order a failure can be read from. */
const playing = (container: HTMLElement) =>
  [...new Set([...container.querySelectorAll<SVGGElement>('[data-dynamic-id]')].map((node) => node.dataset.dynamicId))]
    .sort()
    .join(',')

const stepForward = () =>
  document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }))

const stepBack = () => document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowLeft' }))

const untimed = defineInfoschematicModel({
  id: 'cascade-untimed',
  title: 'Cascade, stepped',
  diagram,
  sequences: [
    {
      id: 'walk',
      label: 'Walk',
      presentation: { callouts: false, display: 'expanded', timed: false },
      scenes: [cascadingScene, after, flatScene]
    }
  ]
})

test('a presenter step advances the cascade within the Scene, and only then past it', async () => {
  const screen = await render(<Present config={untimed} />)
  const observe = () => playing(screen.container)
  /** Which Scene the presenter is on, read from the control the Scene bank marks as pressed. */
  const on = (label: string) =>
    screen.container.querySelector(`button[aria-label="${label}"]`)?.getAttribute('aria-pressed') === 'true'

  await screen.getByRole('button', { name: 'Cascade' }).click()
  // Entry plays the first stage alone. Everything the Scene cues is not everything it shows yet.
  expect(await reach(observe, 'first')).toBe('first')

  stepForward()
  expect(await reach(observe, 'first,second')).toBe('first,second')
  // The Scene has not moved under the stages: this is one Scene playing, not three Scenes.
  expect({ cascade: on('Cascade'), after: on('After') }).toEqual({ cascade: true, after: false })

  stepForward()
  expect(await reach(observe, 'first,second,third')).toBe('first,second,third')
  expect(on('Cascade')).toBe(true)

  // The Scene the presenter reaches is the one they would have reached before cascades existed, having passed
  // through the stages rather than instead of them.
  stepForward()
  expect(await reach(observe, '')).toBe('')
  expect({ cascade: on('Cascade'), after: on('After') }).toEqual({ cascade: false, after: true })

  // Back and forward reverse each other: the Scene is re-entered as it was left rather than replayed from stage one.
  stepBack()
  expect(await reach(observe, 'first,second,third')).toBe('first,second,third')
  stepBack()
  expect(await reach(observe, 'first,second')).toBe('first,second')

  // A Scene whose cues name no stage has one stage: everything plays on entry and one step leaves. Flat is the last
  // Scene, so that step wraps to the first, which is the cascade arriving at its first stage again.
  await screen.getByRole('button', { name: 'Flat' }).click()
  expect(await reach(observe, 'first,second,third')).toBe('first,second,third')
  stepForward()
  expect(await reach(observe, 'first')).toBe('first')
  expect({ cascade: on('Cascade'), flat: on('Flat') }).toEqual({ cascade: true, flat: false })
})

const timed = defineInfoschematicModel({
  id: 'cascade-timed',
  title: 'Cascade, timed',
  diagram,
  sequences: [
    {
      id: 'run',
      label: 'Run',
      presentation: { callouts: true, display: 'collapsed', timed: true },
      scenes: [cascadingScene, after]
    }
  ]
})

test('a timed Scene divides the hold it always had between its stages', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    const screen = await render(<Present config={timed} />)
    const observe = () => playing(screen.container)

    await screen.getByRole('button', { name: 'Run' }).click()
    expect(await reach(observe, 'first')).toBe('first')

    // Three stages over a 900ms hold beat every 300ms, so the Scene is fully played at the moment it would have left.
    await vi.advanceTimersByTimeAsync(hold / 3)
    expect(await reach(observe, 'first,second')).toBe('first,second')
    await vi.advanceTimersByTimeAsync(hold / 3)
    expect(await reach(observe, 'first,second,third')).toBe('first,second,third')
    await vi.advanceTimersByTimeAsync(hold / 3)
    expect(await reach(observe, '')).toBe('')
  } finally {
    vi.useRealTimers()
  }
})
