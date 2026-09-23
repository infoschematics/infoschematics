/**
 * What sustained automatic Scene playback costs, measured rather than argued.
 *
 * `SCENE-006` requires repeated playback cycles not to accumulate timers, retained transition state, or memory in
 * proportion to elapsed cycles. Reading the code says they cannot: every playback effect clears its timeout on
 * cleanup, and the presentation state holds no per-cycle collection. That is an argument. This is the measurement.
 *
 * Two things had to be established before any assertion could rest on this runner, because neither was tried in this
 * repository before. Fake timers do control a mounted component's `window.setTimeout`, and `vi.getTimerCount()`
 * reports the pending count exactly — the first case pins that. But React's commit and its passive effects are
 * scheduled outside the faked clock, so advancing time does not by itself leave the tree in the state the advance
 * implies. A single `requestAnimationFrame` looked like enough and was not: it passed, then failed on a later run
 * with the step committed and the next timer not yet scheduled. So each cycle is observed at quiescence instead —
 * macrotasks are yielded until two consecutive observations agree, with a hard cap that throws rather than a timeout
 * that shrugs. Quiescence cannot hide an accumulation, because an accumulation is persistent rather than transient.
 */
import { defineInfoschematicModel } from '@infoschematics/domain-core'
import { useEffect, useState } from 'react'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { cueRepeatInterval } from './cues.ts'
import { Present } from './Present.tsx'

const hold = 1000

/** A real macrotask: the faked clock does not drive React's scheduler, so time has to be given back to the page. */
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
 * The tree's observable state once it has stopped changing.
 *
 * Throwing on the cap matters: a settle that gave up quietly would report whatever it last saw, and a measurement
 * that reads a half-committed tree is how a flat count stops meaning anything.
 */
const settle = async (observe: () => string) => {
  let previous = observe()
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await macrotask()
    const next = observe()
    if (next === previous) return next
    previous = next
  }
  throw new Error(`playback did not settle within 20 macrotasks, last observation ${previous}`)
}

function Ticker() {
  const [n, setN] = useState(0)
  // `n` in the dependency list is the point of the fixture. The effect has to re-run on every tick to schedule the
  // next timeout, because a self-rescheduling timer is what holds the pending count at exactly one across forty
  // ticks. Dropping it leaves one timeout ever, and the case then measures nothing after the first.
  // biome-ignore lint/correctness/useExhaustiveDependencies: rescheduling on `n` is the behaviour under measurement
  useEffect(() => {
    const timer = window.setTimeout(() => setN((value) => value + 1), hold)
    return () => window.clearTimeout(timer)
  }, [n])
  return <output data-testid="ticks">{n}</output>
}

test('fake timers control a mounted component window.setTimeout, and report the pending count exactly', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    const { container } = await render(<Ticker />)
    const observe = () => `${container.querySelector('[data-testid="ticks"]')?.textContent ?? ''}/${vi.getTimerCount()}`

    // One self-rescheduling timeout, forty times over: the count is exactly one throughout, so the clock is faked,
    // the count is readable, and a cleared timeout leaves nothing pending.
    expect(await settle(observe)).toBe('0/1')
    for (let tick = 1; tick <= 40; tick += 1) {
      await vi.advanceTimersByTimeAsync(hold)
      expect(await settle(observe)).toBe(`${tick}/1`)
    }
  } finally {
    vi.useRealTimers()
  }
})

const config = defineInfoschematicModel({
  id: 'sustained-playback',
  title: 'Sustained playback',
  diagram: {
    bounds: { height: 240, width: 480, x: 0, y: 0 },
    gridSize: 10,
    families: [{ id: 'request', label: 'Request', description: 'Requests', appearance: { color: '#7c3aed' } }],
    cards: [
      { id: 'SRC', label: 'Source', bounds: { height: 60, width: 120, x: 40, y: 60 } },
      { id: 'SNK', label: 'Sink', bounds: { height: 60, width: 120, x: 300, y: 60 } }
    ],
    flows: [
      { id: 'LOAD', family: 'request', source: { element: 'SRC', port: 'E1' }, target: { element: 'SNK', port: 'W1' } }
    ]
  },
  sequences: [
    {
      id: 'cycle',
      label: 'Cycle',
      presentation: { callouts: true, display: 'collapsed', timed: true },
      scenes: [
        { id: 'first', label: 'First', focus: { elements: ['LOAD'] }, duration: hold, callout: { body: 'First' } },
        { id: 'second', label: 'Second', focus: { elements: ['LOAD'] }, duration: hold, callout: { body: 'Second' } }
      ]
    }
  ]
})

const cycles = 240

/**
 * The state a playing Sequence holds between steps: one active Flow signal, and two pending timeouts — the
 * Sequence's own step timer and the Canvas timer that retires the Scene's signal occurrence.
 *
 * Asserted absolutely as well as flatly. Flatness alone is anchored to the run's own first cycle, so it accepts a
 * wrong steady state exactly as readily as the right one — a playback effect that leaked one extra timer on every
 * step would settle at a constant offset and read as perfectly bounded. The absolute value is what makes the
 * difference visible, and being exact is what stops it being widened later instead of being understood.
 */
const steadyPlayback = '1/2'

const playback = async (container: HTMLElement) => {
  const signals = () => container.querySelectorAll<SVGGElement>('.infoschematic-flow-signal')
  const keys = new Set<string>()
  return {
    keys,
    observe: () => `${signals().length}/${vi.getTimerCount()}`,
    recordKeys: () => {
      for (const node of signals()) {
        const key = node.dataset.occurrenceKey
        if (key) keys.add(key)
      }
    }
  }
}

/** A step the Audience takes, delivered the way `SCENE-001` steering actually arrives: a key on the page. */
const steerForward = () =>
  document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }))

test('sustained automatic playback accumulates neither timers nor retained transition state', async () => {
  // Only the two call sites playback uses. Faking the frame callbacks or the clock wholesale stops React committing
  // at all, and a case that cannot observe a step cannot observe an accumulation either.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    const screen = await render(<Present config={config} />)
    const { keys, observe, recordKeys } = await playback(screen.container)

    await screen.getByRole('button', { name: 'Cycle' }).click()
    const started = await settle(observe)

    const observations: string[] = []
    for (let cycle = 1; cycle <= cycles; cycle += 1) {
      await vi.advanceTimersByTimeAsync(hold)
      observations.push(await settle(observe))
      recordKeys()
    }

    const drifted = observations.filter((observation) => observation !== steadyPlayback)
    expect({
      started,
      // The run really cycled. Every flatness assertion here would also hold for playback that stopped on its first
      // step, and a Scene occurrence key is minted per step, so the distinct keys the page actually showed are what
      // separate a bounded run from a stalled one.
      keysSeen: keys.size,
      drifted: drifted.slice(0, 8),
      driftedCycles: drifted.length
    }).toEqual({ started: steadyPlayback, keysSeen: cycles, drifted: [], driftedCycles: 0 })
  } finally {
    vi.useRealTimers()
  }
})

/**
 * The same sustained run, steered rather than left alone — and the case that can actually see a missing cleanup.
 *
 * Uninterrupted playback never exercises one: the step timeout has always already fired by the time the effect
 * re-runs, so clearing it is a no-op and deleting the clear changes nothing measurable. Deleting it was tried, and
 * the uninterrupted case above stayed green on every cycle. What a cleanup exists for is the step that arrives while
 * a timeout is still pending, which is what an Audience steering a timed Sequence does, so that is what this drives.
 */
test('steering a timed Sequence mid-hold leaves no timeout behind', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    const screen = await render(<Present config={config} />)
    const { keys, observe, recordKeys } = await playback(screen.container)

    await screen.getByRole('button', { name: 'Cycle' }).click()
    const started = await settle(observe)

    const observations: string[] = []
    for (let cycle = 1; cycle <= cycles; cycle += 1) {
      // Half a hold: the step timeout is pending and has not fired.
      await vi.advanceTimersByTimeAsync(hold / 2)
      steerForward()
      observations.push(await settle(observe))
      recordKeys()
    }

    const drifted = observations.filter((observation) => observation !== steadyPlayback)
    expect({
      started,
      keysSeen: keys.size,
      drifted: drifted.slice(0, 8),
      driftedCycles: drifted.length
    }).toEqual({ started: steadyPlayback, keysSeen: cycles, drifted: [], driftedCycles: 0 })
  } finally {
    vi.useRealTimers()
  }
})

/**
 * A repeating Scene cue, measured on the same terms.
 *
 * `ADR-INFOSCHEMATICS-034` puts the cadence of a `repeat` cue in the View, which brings it under `SCENE-006`: a
 * repeat runs cycles, and cycles must not accumulate. The shape is one interval advancing one occurrence key, so the
 * count to hold flat is the interval plus whatever the Canvas holds for the occurrence currently playing.
 */
const cuedConfig = defineInfoschematicModel({
  id: 'sustained-cues',
  title: 'Sustained cues',
  diagram: {
    bounds: { height: 240, width: 480, x: 0, y: 0 },
    gridSize: 10,
    families: [{ id: 'request', label: 'Request', description: 'Requests', appearance: { color: '#7c3aed' } }],
    cards: [
      { id: 'SRC', label: 'Source', bounds: { height: 60, width: 120, x: 40, y: 60 } },
      { id: 'SNK', label: 'Sink', bounds: { height: 60, width: 120, x: 300, y: 60 } }
    ],
    flows: [
      { id: 'LOAD', family: 'request', source: { element: 'SRC', port: 'E1' }, target: { element: 'SNK', port: 'W1' } }
    ],
    dynamics: [{ id: 'delivery', label: 'Record delivered', kind: 'signal-flow', flows: ['LOAD'] }]
  },
  sequences: [
    {
      id: 'cued',
      label: 'Cued',
      presentation: { callouts: false, display: 'expanded', timed: false },
      scenes: [
        { id: 'beat', label: 'Beat', cues: [{ dynamic: 'delivery', playback: 'repeat' }] },
        { id: 'after', label: 'After', cues: [{ dynamic: 'delivery', playback: 'repeat' }] }
      ]
    }
  ]
})

/** One live signal occurrence, and one pending Canvas retirement for it. The cadence itself is an interval. */
const steadyCue = '1/2'

/*
 * The same quiescence rule, held to three consecutive agreements rather than two.
 *
 * A cue's replay is a state dispatch from inside the faked clock, and the beat is longer than the signal it plays:
 * between the occurrence retiring and the next one committing there is a real, briefly stable reading with nothing
 * playing, and two agreeing observations can land inside it. Three cannot, and an accumulation is persistent rather
 * than transient, so the stricter rule hides nothing it is asked to measure.
 */
const settleCue = async (observe: () => string) => {
  let agreed = 0
  let previous = observe()
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await macrotask()
    const next = observe()
    agreed = next === previous ? agreed + 1 : 0
    previous = next
    if (agreed === 2) return next
  }
  throw new Error(`a cue did not settle within 30 macrotasks, last observation ${previous}`)
}

/*
 * When the Audience steers, measured from the start of the beat.
 *
 * Past the 900ms a Flow signal lasts, so the Scene it arrives on plays its own occurrence rather than being held off
 * by the one still running, and short of the 1400ms beat, so the cadence it retires was genuinely mid-cycle.
 */
const steerAt = 1000

test('a repeating cue holds its cadence over many cycles without accumulating timers or occurrences', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
  try {
    const screen = await render(<Present config={cuedConfig} />)
    const { keys, observe, recordKeys } = await playback(screen.container)

    await screen.getByRole('button', { name: 'Beat' }).click()
    const started = await settle(observe)

    const observations: string[] = []
    for (let cycle = 1; cycle <= cycles; cycle += 1) {
      await vi.advanceTimersByTimeAsync(cueRepeatInterval)
      observations.push(await settleCue(observe))
      recordKeys()
    }

    const drifted = observations.filter((observation) => observation !== steadyCue)
    expect({
      started,
      // A repeat is a new occurrence key per cycle, so the keys the page actually showed prove it replayed rather
      // than sat on its first occurrence with a timer quietly piling up behind it.
      keysSeen: keys.size,
      drifted: drifted.slice(0, 8),
      driftedCycles: drifted.length
    }).toEqual({ started: steadyCue, keysSeen: cycles, drifted: [], driftedCycles: 0 })
  } finally {
    vi.useRealTimers()
  }
})

/**
 * The steering case `SCENE-006`'s caveat asks for, now that a repeat exists to interrupt.
 *
 * An uninterrupted repeat never exercises the cadence's cleanup: the interval is still the same interval. A Scene
 * change mid-cycle is what retires one cadence and starts another, which is the only path on which a missing
 * `clearInterval` shows up as a second beat rather than as nothing at all.
 */
test('a Scene change mid-cycle retires the cadence it interrupted', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
  try {
    const screen = await render(<Present config={cuedConfig} />)
    const { keys, observe, recordKeys } = await playback(screen.container)

    await screen.getByRole('button', { name: 'Beat' }).click()
    const started = await settle(observe)

    const observations: string[] = []
    for (let cycle = 1; cycle <= cycles; cycle += 1) {
      // Inside the beat: the next repeat is pending and has not fired when the Scene changes under it.
      await vi.advanceTimersByTimeAsync(steerAt)
      steerForward()
      observations.push(await settleCue(observe))
      recordKeys()
    }

    const drifted = observations.filter((observation) => observation !== steadyCue)
    expect({
      started,
      keysSeen: keys.size,
      drifted: drifted.slice(0, 8),
      driftedCycles: drifted.length
    }).toEqual({ started: steadyCue, keysSeen: cycles, drifted: [], driftedCycles: 0 })
  } finally {
    vi.useRealTimers()
  }
})
