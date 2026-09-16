/**
 * A real-time Chromium heap profile over sustained automatic playback, run on demand rather than in the gate.
 *
 * The fake-timer cases beside this file measure accumulation driven by cycle count: timers, retained occurrences,
 * retained keys. They cannot see anything driven by elapsed time — retained paint, animation nodes, a renderer's own
 * caches — and the failure that put `SCENE-006` in divergence came from demo cycles running in real time. So this is
 * the other half of the measurement, and it runs the clock rather than advancing it.
 *
 * It reads the heap over the DevTools protocol, and the first attempt did not. `performance.memory` is the obvious
 * instrument and it is a broken one: Chromium quantises it and caches the value, so a 30-second run reported
 * 33.47 MB at every sample, and a run of the same length that deliberately retained about 24 MB of ballast reported
 * 33.47 MB at every sample too — the same number to the last digit. Believing that flat line would have been a
 * measurement of nothing at all. `Runtime.getHeapUsage` reports the live size, and `HeapProfiler.collectGarbage`
 * collects first, so what is left is what is actually retained rather than what has yet to be swept.
 *
 * It stays a procedure rather than a gate case because it costs half a minute of wall clock at the shortest useful
 * length, and the band it reports moves with whatever else the machine is doing. A threshold wide enough to survive a
 * loaded machine would not catch a slow leak, and one tight enough to catch a slow leak would go red on an unrelated
 * commit and then be widened until it was the first kind. The cycle-count assertions in
 * `Present.playback.browser.test.tsx` are the regression guard; this establishes the bound.
 *
 * Run it:
 *
 *     VITE_PLAYBACK_PROFILE=measure bun run --cwd packages/view-present test:browser
 *
 * and to confirm the profile can still see a leak, which is the only thing that makes a flat reading mean anything:
 *
 *     VITE_PLAYBACK_PROFILE=leak bun run --cwd packages/view-present test:browser
 */
import { defineInfoschematicModel } from '@infoschematics/domain-core'
import { expect, test } from 'vitest'
import { cdp } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { Present } from './Present.tsx'

const mode = import.meta.env.VITE_PLAYBACK_PROFILE
const profiling = mode === 'measure' || mode === 'leak'

const hold = 12
/** Lengthen the run when a slow trend has to be told apart from collector noise. */
const runFor = Number(import.meta.env.VITE_PLAYBACK_PROFILE_SECONDS ?? 30) * 1_000
const sampleEvery = 2_000

const config = defineInfoschematicModel({
  id: 'playback-profile',
  title: 'Playback profile',
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

/**
 * The step ordinal the page is currently showing.
 *
 * Sampling every couple of seconds would see only a couple of dozen of the keys a 12ms hold mints, so the count is
 * read out of the key rather than accumulated: `derivePresentation` names each occurrence `present-scene-N` from a
 * monotonic counter, which makes the latest key a direct reading of how many steps have elapsed.
 */
const stepOrdinal = (container: HTMLElement) => {
  const key = container.querySelector<SVGGElement>('.infoschematic-flow-signal')?.dataset.occurrenceKey
  const ordinal = key ? Number(key.replace('present-scene-', '')) : Number.NaN
  return Number.isFinite(ordinal) ? ordinal : undefined
}

/** Held for the whole run in `leak` mode only, so the profile is shown failing before it is believed passing. */
const ballast: number[][] = []

test.runIf(profiling)(
  'profile: sustained real-time playback heap shape',
  async () => {
    const session = cdp()
    await session.send('HeapProfiler.enable')

    /** Retained bytes rather than yet-to-be-swept bytes: collect first, then read. */
    const retainedBytes = async () => {
      await session.send('HeapProfiler.collectGarbage')
      const usage = (await session.send('Runtime.getHeapUsage')) as unknown as { usedSize: number }
      return usage.usedSize
    }

    const screen = await render(<Present config={config} />)
    const signals = () => screen.container.querySelectorAll<SVGGElement>('.infoschematic-flow-signal')

    const baseline = await retainedBytes()
    await screen.getByRole('button', { name: 'Cycle' }).click()

    const rows: string[] = []
    const started = performance.now()
    let elapsed = 0
    let steps = 0
    let last = baseline
    let warm = baseline

    while (elapsed < runFor) {
      await new Promise((resolve) => setTimeout(resolve, sampleEvery))
      elapsed = performance.now() - started
      steps = stepOrdinal(screen.container) ?? steps
      if (mode === 'leak') ballast.push(new Array(200_000).fill(elapsed))
      last = await retainedBytes()
      if (rows.length === 0) warm = last
      rows.push(
        [
          `${(elapsed / 1000).toFixed(0).padStart(3)}s`,
          `steps ${String(steps).padStart(6)}`,
          `signal nodes ${String(signals().length).padStart(3)}`,
          `retained ${(last / 1024 / 1024).toFixed(2).padStart(7)} MB`,
          `${((last - baseline) / 1024).toFixed(0).padStart(7)} KB over baseline`
        ].join('  ')
      )
    }

    // Reported through the error channel because that is the one this browser runner forwards to the terminal.
    console.error(
      [
        `playback heap profile — mode ${mode}, hold ${hold}ms, ${(runFor / 1000).toFixed(0)}s`,
        `baseline retained ${(baseline / 1024 / 1024).toFixed(2)} MB`,
        ...rows,
        // Against the first warm sample, not the pre-mount baseline: mounting Present costs what it costs once, and
        // charging that one-off to the run would read as a leak on every profile.
        `warm drift ${((last - warm) / 1024).toFixed(0)} KB over ${steps} steps, from a ${(warm / 1024 / 1024).toFixed(2)} MB warm floor`
      ].join('\n')
    )

    // The run has to have cycled for the heap shape to be about playback at all.
    expect(steps).toBeGreaterThan(100)
  },
  runFor + 60_000
)
