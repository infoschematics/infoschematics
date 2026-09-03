import { ChevronLeft, ChevronRight, Pause, X } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import type { CalloutConfig } from '@infoschematics/domain-model/scene'
import type { Box } from '@infoschematics/view-model/geometry'
import { chooseSpot, type Obstacle } from '@infoschematics/view-model/placement'
import {
  resolveInfoschematicRenderer,
  type InfoschematicRuntime,
  useInfoschematic,
  useInfoschematicRenderers,
} from '@infoschematics/view-canvas'

/** Anything that focuses part of the Infoschematic: a Story Scene or Thematic Scene. */
export type Lit = { components: readonly string[]; flows: readonly string[]; callout?: { x: number; y: number } }

// The callout gets out of the way of whatever the step has lit, so the
// narrative never covers the thing it is narrating.

// A card hidden under the callout is a card the reader cannot see; a line
// crossed by it is still legible. Both are avoided, this one first.
const componentWeight = 6

const grown = (box: Box, by: number, weight: number): Obstacle => ({
  height: box.height + by * 2,
  weight,
  width: box.width + by * 2,
  x: box.x - by,
  y: box.y - by,
})

/**
 * Everything the step has lit, as boxes. Fabrics are read from their own
 * bounds because the layout holds Cards only. Lines are taken one segment at
 * a time so an orthogonal route does not claim the empty rectangle it turns through.
 */
export const litObstacles = (step: Lit, runtime: InfoschematicRuntime): Obstacle[] => {
  const { infoschematicFabrics, infoschematicFlows, infoschematicLayout } = runtime
  const flowById = new Map(infoschematicFlows.map((flow) => [flow.id, flow]))
  const fabricById = new Map(infoschematicFabrics.map((fabric) => [fabric.id, fabric]))
  const obstacles: Obstacle[] = []

  for (const id of step.components) {
    const card = infoschematicLayout[id]
    if (card) {
      obstacles.push(grown(card, 12, componentWeight))
      continue
    }
    const fabric = fabricById.get(id)
    if (fabric) obstacles.push(grown(fabric.bounds, 12, componentWeight))
  }

  for (const id of step.flows) {
    const points = flowById.get(id)?.points
    if (!points) continue
    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1]
      const to = points[index]
      obstacles.push(
        grown(
          {
            height: Math.abs(to.y - from.y),
            width: Math.abs(to.x - from.x),
            x: Math.min(from.x, to.x),
            y: Math.min(from.y, to.y),
          },
          4,
          1,
        ),
      )
    }
  }

  return obstacles
}

/*
 * One callout for both things that narrate the Infoschematic.
 *
 * A Story Scene and a Thematic Scene are the same object to a reader -
 * a card that says whose voice this is, what this one is called, and a
 * paragraph - and they place themselves against the same obstacles. What
 * differs is the timer: a Story advances itself and offers a hold, and a Theme
 * does not, because stepping between Thematic Scenes is browsing rather than
 * a performance. Passing no `autoAdvance` is what says so.
 */
export function SceneCallout({
  autoAdvance,
  body,
  calloutConfig,
  eyebrow,
  logo,
  onExit,
  onStep,
  onToggleAuto,
  step,
  stepNumber,
  stepTotal,
  profile,
  takeaways,
  title,
  wide,
}: {
  /** Absent for anything that does not run itself. */
  autoAdvance?: boolean
  body: string
  calloutConfig?: CalloutConfig
  eyebrow: string
  logo?: string
  onExit: () => void
  onStep: (delta: number) => void
  onToggleAuto?: () => void
  step: Lit
  stepNumber: number
  stepTotal: number
  /** Who is speaking, where that is a different question from what they say. */
  profile?: readonly string[]
  takeaways?: readonly string[]
  title?: string
  /** The cover carries a synopsis rather than one contribution, and needs the room. */
  wide?: boolean
}) {
  const runtime = useInfoschematic()
  const renderers = useInfoschematicRenderers()
  const { calloutPorts, infoschematicViewBox } = runtime
  // A side of its own is worth having only where there is something to put in
  // it. A Thematic Scene with neither a mark nor a profile reads as a Story Scene does.
  const aside = Boolean(logo || profile?.length)
  const callout = useRef<HTMLDivElement>(null)
  const [port, setPort] = useState(step.callout ?? calloutPorts[0] ?? { x: 0.5, y: 0.5 })
  const resolved = calloutConfig
    ? resolveInfoschematicRenderer(
        renderers,
        'callout',
        calloutConfig.renderer,
        calloutConfig.properties,
        'id' in step && typeof step.id === 'string' ? step.id : undefined,
      )
    : undefined
  const standardContent = (
    <>
      {title ? <p className="callout-title">{title}</p> : null}
      <p className="callout-body">{body}</p>
      {takeaways && takeaways.length > 0 ? (
        <ul className="callout-takeaways">
          {takeaways.map((takeaway) => (
            <li key={takeaway}>{takeaway}</li>
          ))}
        </ul>
      ) : null}
    </>
  )

  // Measured rather than estimated: the callout's size in diagram units depends
  // on the width the Infoschematic happens to have, which the panel can change.
  useLayoutEffect(() => {
    const element = callout.current
    const container = element?.parentElement?.parentElement
    if (!element || !container) return

    const choose = () => {
      if (step.callout) {
        setPort(step.callout)
        return
      }
      const unitsPerPixel = infoschematicViewBox.width / container.clientWidth
      setPort(
        chooseSpot({
          candidates: calloutPorts,
          label: { height: element.offsetHeight * unitsPerPixel, width: element.offsetWidth * unitsPerPixel },
          obstacles: litObstacles(step, runtime),
          view: infoschematicViewBox,
        }),
      )
    }

    choose()
    const observer = new ResizeObserver(choose)
    observer.observe(container)
    return () => observer.disconnect()
  }, [calloutPorts, infoschematicViewBox, runtime, step])

  return (
    <div className="infoschematic-callout-layer" aria-live="polite">
      <div
        className={`scene-callout${wide ? ' wide' : ''}${aside ? ' sided' : ''}`}
        ref={callout}
        role="status"
        style={{ left: `${port.x * 100}%`, top: `${port.y * 100}%` }}
      >
        <p className="callout-heading">
          {logo && !aside ? <img alt="" className="callout-logo" src={logo} /> : null}
          <span>{eyebrow}</span>
          <em>
            {stepNumber} of {stepTotal}
          </em>
        </p>

        {/* Two sides where there is something to say about the speaker as well
            as about the diagram: who they are on the left, what they contribute
            on the right. Neither is given the greater share - a mark and a
            paragraph balance a title and a list well enough at equal width. */}
        <div className={aside ? 'callout-sides' : undefined}>
          {aside ? (
            <div className="callout-aside">
              {logo ? <img alt="" className="callout-mark" src={logo} /> : null}
              {profile?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          <div>
            {resolved && calloutConfig ? (
              <resolved.Component callout={calloutConfig} properties={resolved.properties}>
                {standardContent}
              </resolved.Component>
            ) : (
              standardContent
            )}
          </div>
        </div>
        <div className="callout-actions">
          <button
            aria-label="Previous step"
            onClick={() => onStep(-1)}
            title="Previous step · left arrow"
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={14} />
          </button>
          {autoAdvance === undefined || !onToggleAuto ? null : (
            <button
              aria-label={
                autoAdvance ? 'Advancing automatically. Activate to hold.' : 'Held. Activate to advance automatically.'
              }
              aria-pressed={autoAdvance}
              className="callout-timer"
              onClick={onToggleAuto}
              title={autoAdvance ? 'Advancing automatically · space to hold' : 'Held · space to resume'}
              type="button"
            >
              {autoAdvance ? (
                // Keyed on the step so the sweep restarts with each Story Scene.
                <svg aria-hidden="true" className="callout-countdown" key={stepNumber} viewBox="0 0 16 16">
                  <circle className="countdown-track" cx="8" cy="8" r="6.25" />
                  <circle
                    className="countdown-sweep"
                    cx="8"
                    cy="8"
                    r="6.25"
                    style={{ animationDuration: `${'hold' in step ? step.hold : 0}ms` }}
                  />
                </svg>
              ) : (
                <Pause aria-hidden="true" size={14} />
              )}
            </button>
          )}
          <button aria-label="Next step" onClick={() => onStep(1)} title="Next step · right arrow" type="button">
            <ChevronRight aria-hidden="true" size={14} />
          </button>
          <button
            aria-label="Stop the Story"
            className="callout-exit"
            onClick={onExit}
            title="Stop · escape"
            type="button"
          >
            <X aria-hidden="true" size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
