import { Canvas, type CanvasProps } from '@infoschematics/view-canvas'
import '@infoschematics/view-canvas/styles.css'
import { useCueCadence } from '@infoschematics/view-present'
import { useCallback, useState } from 'react'
import { dynamicsSpecimen, dynamicsSpecimenSource } from './dynamics.ts'

type Occurrences = NonNullable<CanvasProps['dynamics']>

const noOccurrences: Occurrences = []

/**
 * The three ways a Scene may cue a Dynamic, side by side and each under the reader's own hand.
 *
 * Every pane supplies occurrences the way a Scene cue does, so what is on screen is the product's own treatment
 * rather than a guide imitation of one: a key that changes replays, a key that stays holds, and a withdrawn
 * occurrence cancels. The repeat pane advances its key on `useCueCadence`, the same beat Present and Studio play,
 * so the guide adds no scheduler of its own.
 */
export function DynamicsSpecimen() {
  const [plays, setPlays] = useState(1)
  const [repeating, setRepeating] = useState(true)
  const [cycle, setCycle] = useState(0)
  const [held, setHeld] = useState(true)
  const advance = useCallback(() => setCycle((value) => value + 1), [])
  useCueCadence(repeating, advance, 0)

  const panes = [
    {
      action: () => setPlays((value) => value + 1),
      actionLabel: 'Play again',
      caption: 'once',
      id: 'once',
      occurrences: [{ dynamicId: 'reading-arrives', occurrenceKey: `guide-once-${plays}` }] satisfies Occurrences,
      pressed: undefined
    },
    {
      action: () => setRepeating((value) => !value),
      actionLabel: repeating ? 'Pause' : 'Play',
      caption: 'repeat',
      id: 'repeat',
      occurrences: [{ dynamicId: 'reading-arrives', occurrenceKey: `guide-repeat-${cycle}` }] satisfies Occurrences,
      pressed: repeating
    },
    {
      action: () => setHeld((value) => !value),
      actionLabel: held ? 'Withdraw' : 'Hold',
      caption: 'depicts: state',
      id: 'state',
      occurrences: held
        ? ([{ dynamicId: 'sensor-is-live', occurrenceKey: 'guide-state' }] satisfies Occurrences)
        : noOccurrences,
      pressed: held
    }
  ]

  return (
    <section aria-label="Diagram Dynamics live example" className="demo-frame">
      <header className="demo-frame__heading">
        <div>
          <h3>Playback policies</h3>
          <p>
            Each pane plays one authored Dynamic as a Scene cue would ask for it. Under reduced motion the travelling
            pulse is replaced by a still outline over the same span, so every policy stays perceptible without motion.
          </p>
        </div>
      </header>
      <div className="demo-frame__preview demo-frame__preview--variants">
        {panes.map((pane) => (
          <figure key={pane.id}>
            <Canvas config={dynamicsSpecimen} dynamics={pane.occurrences} />
            <figcaption>
              <code>{pane.caption}</code>{' '}
              <button aria-pressed={pane.pressed} onClick={pane.action} type="button">
                {pane.actionLabel}
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
      <details className="visual-guide__property-reference">
        <summary>
          Authored definition <span>YAML</span>
        </summary>
        <pre className="specimen-snippet__source specimen-snippet__source--expanded">
          <code>{dynamicsSpecimenSource}</code>
        </pre>
      </details>
    </section>
  )
}
