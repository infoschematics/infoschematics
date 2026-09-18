import { useEffect } from 'react'

/**
 * How often a repeating cue plays again.
 *
 * Long enough for a Flow signal to travel and clear before the next occurrence starts, so a repeat reads as a cadence
 * rather than a stutter. The interval lives in the View because nothing authored says how long: a cue carries which
 * Dynamic and how often, never a duration.
 */
export const cueRepeatInterval = 1400

/**
 * Advance a repeating cue's occurrence key on one shared cadence.
 *
 * A cue's key is presentation state, so a repeat is this one interval advancing it rather than a timer per cue, and
 * there is no timer at all while the focused Scene cues nothing that repeats. Every surface that plays cues — Present
 * and Studio's Present surface — calls this, so rehearsal and presentation keep the same beat and Studio adds no
 * second scheduler of its own.
 */
export const useCueCadence = (repeating: boolean, replay: () => void, sceneOccurrence: number) => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: `sceneOccurrence` is a dependency the effect does not read on purpose. A new Scene occurrence restarts the cadence, so a cue's first play is not cut short by the previous Scene's beat.
  useEffect(() => {
    if (!repeating) return
    const timer = window.setInterval(replay, cueRepeatInterval)
    return () => window.clearInterval(timer)
  }, [repeating, replay, sceneOccurrence])
}
