import { defineInfoschematic, defineInfoschematicModel } from '@infoschematics/domain-core'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import { describe, expect, it } from 'vitest'
import { cueStageHold } from './cues.ts'
import {
  createPresentationState,
  derivePresentation,
  type PresentationState,
  reducePresentation
} from './presentation.ts'

const runtime = () =>
  createInfoschematicRuntime(
    defineInfoschematic({
      title: 'Presentation state',
      infoschematic: {
        scopes: [
          {
            id: 'one',
            prefix: 'ONE',
            label: 'One',
            description: 'First scope',
            color: '#1199ff',
            fill: '#113355'
          },
          {
            id: 'two',
            prefix: 'TWO',
            label: 'Two',
            description: 'Second scope',
            color: '#ff9911',
            fill: '#553311'
          }
        ],
        flowFamilies: [
          {
            id: 'delivery',
            prefix: 'DEL',
            label: 'Delivery',
            description: 'Delivery flow',
            color: '#44cc88'
          }
        ],
        cards: [
          {
            id: 'source',
            code: 'ONE-001',
            detail: 'Sends work',
            label: 'Source',
            scope: 'one',
            scopes: ['one'],
            placement: {
              box: { x: 100, y: 100, width: 160, height: 80 },
              ports: { east: 1 }
            }
          },
          {
            id: 'target',
            code: 'TWO-001',
            detail: 'Receives work',
            label: 'Target',
            scope: 'two',
            scopes: ['two'],
            placement: {
              box: { x: 500, y: 100, width: 160, height: 80 },
              ports: { west: 1 }
            }
          }
        ],
        flows: [
          {
            id: 'delivery-flow',
            code: 'DEL-001',
            family: 'delivery',
            source: 'source',
            sourcePort: 'E1',
            target: 'target',
            targetPort: 'W1',
            points: [
              { x: 260, y: 140 },
              { x: 500, y: 140 }
            ]
          },
          {
            id: 'return-flow',
            code: 'DEL-002',
            family: 'delivery',
            source: 'target',
            sourcePort: 'W1',
            target: 'source',
            targetPort: 'E1',
            points: [
              { x: 500, y: 160 },
              { x: 260, y: 160 }
            ]
          }
        ]
      },
      standaloneScenes: [
        {
          id: 'scene',
          code: 'SCENE-001',
          label: 'Standalone',
          description: 'A standalone focus',
          focus: {
            artefacts: ['source'],
            flows: ['delivery-flow', 'return-flow']
          }
        }
      ],
      themes: [
        {
          id: 'sequence',
          title: 'Sequence',
          scenes: [
            {
              id: 'sequence-scene',
              code: 'SEQUENCE-001',
              label: 'Sequence focus',
              focus: { artefacts: ['target'], flows: ['delivery-flow'] },
              callout: { body: 'A expanded focus' }
            }
          ]
        }
      ],
      stories: [
        {
          id: 'story',
          code: 'STORY-001',
          title: 'Journey',
          scenes: [
            {
              sourceScene: 'scene',
              focus: { artefacts: ['source'] },
              callout: { body: 'First' },
              duration: 1000
            },
            {
              focus: { artefacts: ['target'] },
              callout: { body: 'Second' },
              duration: 1000
            }
          ]
        }
      ]
    })
  )

describe('presentation state', () => {
  it('supports all four Sequence display and timing combinations', () => {
    const source = createInfoschematicRuntime(
      defineInfoschematicModel({
        id: 'SEQUENCES',
        title: 'Sequence combinations',
        diagram: { bounds: { x: 0, y: 0, width: 100, height: 100 }, gridSize: 10 },
        sequences: (
          [
            ['expanded-manual', 'expanded', false],
            ['expanded-timed', 'expanded', true],
            ['collapsed-manual', 'collapsed', false],
            ['collapsed-timed', 'collapsed', true]
          ] as const
        ).map(([id, display, timed]) => ({
          id,
          label: id,
          presentation: { callouts: id !== 'expanded-manual', display, timed },
          scenes: [{ id: `${id}-scene`, label: 'Scene', duration: 1200 }]
        }))
      })
    )

    expect(source.sequences.map(({ presentation }) => presentation)).toEqual([
      { callouts: false, display: 'expanded', timed: false },
      { callouts: true, display: 'expanded', timed: true },
      { callouts: true, display: 'collapsed', timed: false },
      { callouts: true, display: 'collapsed', timed: true }
    ])

    for (const sequence of source.sequences) {
      const state = reducePresentation(createPresentationState(source), { type: 'start-sequence', sequence })
      expect(derivePresentation(source, state).activeSequence?.id).toBe(sequence.id)
      expect(derivePresentation(source, state).activeSequence?.presentation.timed).toBe(sequence.presentation.timed)
    }
  })

  it('keeps an empty Sequence inert, so a Sequence can be drafted before it has Scenes', () => {
    const source = createInfoschematicRuntime(
      defineInfoschematicModel({
        id: 'EMPTY',
        title: 'Empty sequence',
        diagram: { bounds: { x: 0, y: 0, width: 100, height: 100 }, gridSize: 10 },
        sequences: [
          {
            id: 'drafting',
            label: 'Drafting',
            presentation: { callouts: false, display: 'expanded', timed: false },
            scenes: []
          }
        ]
      })
    )
    const sequence = source.sequences[0]
    const start = createPresentationState(source)

    expect(sequence).toBeDefined()
    if (!sequence) return

    // Identity, not equality: an empty Sequence must leave presentation focus exactly as it found it.
    expect(reducePresentation(start, { type: 'start-sequence', sequence })).toBe(start)
    expect(reducePresentation(start, { type: 'toggle-sequence-scene', sequence, step: 0 })).toBe(start)
  })

  it('shows all filters initially and hides cross-Scope Flows when either endpoint is hidden', () => {
    const source = runtime()
    const initial = createPresentationState(source)
    const initiallyShown = derivePresentation(source, initial)
    const hidden = reducePresentation(initial, {
      type: 'toggle-scope',
      id: 'two'
    })
    const shown = derivePresentation(source, hidden)

    expect(initial.visibleScopes).toEqual(new Set(['one', 'two']))
    expect(initial.visibleFamilies).toEqual(new Set(['delivery']))
    expect(initiallyShown.visibleFlows.map((flow) => flow.id)).toEqual(['DEL-001', 'DEL-002'])
    expect(shown.visibleCards.map((card) => card.id)).toEqual(['ONE-001'])
    expect(shown.visibleFlows).toEqual([])
  })

  it('makes Story, Sequence and standalone Scene focus mutually exclusive', () => {
    const source = runtime()
    const standalone = reducePresentation(createPresentationState(source), {
      type: 'toggle-standalone-scene',
      scene: source.standaloneScenes[0]!
    })
    const sequenced = reducePresentation(standalone, {
      type: 'toggle-expanded-scene',
      scene: source.expandedScenes[0]!
    })
    const playing = reducePresentation(sequenced, {
      type: 'start-story',
      story: source.stories[0]!
    })

    expect(sequenced).toMatchObject({
      playing: null,
      standaloneSceneId: null,
      expandedSceneId: 'SEQUENCE-001'
    })
    expect(playing).toMatchObject({
      playing: { id: 'STORY-001', step: 0 },
      standaloneSceneId: null,
      expandedSceneId: null
    })
  })

  it('wraps Story playback in both directions', () => {
    const source = runtime()
    const playing = reducePresentation(createPresentationState(source), {
      type: 'start-story',
      story: source.stories[0]!
    })
    const previous = reducePresentation(playing, {
      type: 'step-story',
      stories: source.stories,
      delta: -1
    })
    const next = reducePresentation(previous, {
      type: 'step-story',
      stories: source.stories,
      delta: 1
    })

    expect(previous.playing?.step).toBe(1)
    expect(next.playing?.step).toBe(0)
  })

  it('signals every focused Flow once for a Scene entry', () => {
    const source = runtime()
    const entered = reducePresentation(createPresentationState(source), {
      type: 'toggle-standalone-scene',
      scene: source.standaloneScenes[0]!
    })
    const first = derivePresentation(source, entered)
    const unrelated = reducePresentation(entered, {
      type: 'set-annotated',
      value: true
    })

    expect(first.signals).toEqual([
      { flowId: 'DEL-001', occurrenceKey: 'present-scene-1' },
      { flowId: 'DEL-002', occurrenceKey: 'present-scene-1' }
    ])
    expect(derivePresentation(source, unrelated).signals).toEqual(first.signals)
  })

  it('does not replay Scene signals when audience filters change', () => {
    const source = runtime()
    const entered = reducePresentation(createPresentationState(source), {
      type: 'toggle-standalone-scene',
      scene: source.standaloneScenes[0]!
    })
    const filtered = reducePresentation(entered, {
      type: 'toggle-scope',
      id: 'two'
    })
    const restored = reducePresentation(filtered, {
      type: 'toggle-scope',
      id: 'two'
    })

    expect(filtered.sceneOccurrence).toBe(entered.sceneOccurrence)
    expect(restored.sceneOccurrence).toBe(entered.sceneOccurrence)
    expect(derivePresentation(source, filtered).signals).toEqual(derivePresentation(source, entered).signals)
    expect(derivePresentation(source, restored).signals).toEqual(derivePresentation(source, entered).signals)
  })

  it('cancels obsolete signals and assigns a fresh key on re-entry', () => {
    const source = runtime()
    const entered = reducePresentation(createPresentationState(source), {
      type: 'toggle-standalone-scene',
      scene: source.standaloneScenes[0]!
    })
    const cleared = reducePresentation(entered, { type: 'clear-focus' })
    const replayed = reducePresentation(cleared, {
      type: 'toggle-standalone-scene',
      scene: source.standaloneScenes[0]!
    })
    const changed = reducePresentation(replayed, {
      type: 'toggle-expanded-scene',
      scene: source.expandedScenes[0]!
    })

    expect(derivePresentation(source, cleared).signals).toEqual([])
    expect(derivePresentation(source, replayed).signals).toEqual([
      { flowId: 'DEL-001', occurrenceKey: 'present-scene-2' },
      { flowId: 'DEL-002', occurrenceKey: 'present-scene-2' }
    ])
    expect(derivePresentation(source, changed).signals).toEqual([
      { flowId: 'DEL-001', occurrenceKey: 'present-scene-3' }
    ])
  })

  it('allows automatic Scene signalling to be disabled', () => {
    const source = runtime()
    const entered = reducePresentation(createPresentationState(source), {
      type: 'toggle-standalone-scene',
      scene: source.standaloneScenes[0]!
    })

    expect(derivePresentation(source, entered, 'none').signals).toEqual([])
  })

  it('replays inherited focused Flows when a Story re-enters a Scene', () => {
    const source = runtime()
    const started = reducePresentation(createPresentationState(source), {
      type: 'start-story',
      story: source.stories[0]!
    })
    const advanced = reducePresentation(started, {
      type: 'step-story',
      stories: source.stories,
      delta: 1
    })
    const returned = reducePresentation(advanced, {
      type: 'step-story',
      stories: source.stories,
      delta: 1
    })

    expect(derivePresentation(source, started).signals).toEqual([
      { flowId: 'DEL-001', occurrenceKey: 'present-scene-1' },
      { flowId: 'DEL-002', occurrenceKey: 'present-scene-1' }
    ])
    expect(derivePresentation(source, advanced).signals).toEqual([])
    expect(derivePresentation(source, returned).signals).toEqual([
      { flowId: 'DEL-001', occurrenceKey: 'present-scene-3' },
      { flowId: 'DEL-002', occurrenceKey: 'present-scene-3' }
    ])
  })

  it('originates a cued Dynamic on Scene entry, replays a repeat, and cancels with the Scene', () => {
    const source = createInfoschematicRuntime(
      defineInfoschematicModel({
        id: 'CUES',
        title: 'Cued Scenes',
        diagram: {
          bounds: { x: 0, y: 0, width: 400, height: 200 },
          gridSize: 10,
          cards: [
            { id: 'SRC', label: 'Source', bounds: { x: 20, y: 20, width: 100, height: 60 } },
            { id: 'SNK', label: 'Sink', bounds: { x: 260, y: 20, width: 100, height: 60 } }
          ],
          flows: [{ id: 'LOAD', source: { element: 'SRC', port: 'E1' }, target: { element: 'SNK', port: 'W1' } }],
          dynamics: [
            { id: 'delivery', label: 'Record delivered', kind: 'signal-flow', flows: ['LOAD'] },
            { id: 'attention', label: 'Sink needs attention', kind: 'emphasise-elements', elements: ['SNK'] }
          ]
        },
        sequences: [
          {
            id: 'walk',
            label: 'Walkthrough',
            presentation: { display: 'expanded', timed: true, callouts: true },
            scenes: [
              {
                id: 'arrival',
                label: 'Arrival',
                duration: 4000,
                cues: [{ dynamic: 'delivery' }, { dynamic: 'attention', playback: 'repeat' }]
              },
              { id: 'quiet', label: 'Quiet' }
            ]
          }
        ]
      })
    )
    const sequence = source.sequences[0]
    if (!sequence) throw new Error('The fixture declares one Sequence')

    // The projection carries the authored policy and order and no timing: `once` and the first stage are defaulted
    // in, nothing else is added.
    expect(sequence.scenes[0]?.cues).toEqual([
      { dynamic: 'delivery', playback: 'once', stage: 1 },
      { dynamic: 'attention', playback: 'repeat', stage: 1 }
    ])
    expect(sequence.scenes[1]?.cues).toEqual([])

    const entered = reducePresentation(createPresentationState(source), { type: 'start-sequence', sequence })
    const onEntry = derivePresentation(source, entered)
    expect(onEntry.dynamics).toEqual([
      { dynamicId: 'delivery', occurrenceKey: 'present-cue-1' },
      { dynamicId: 'attention', occurrenceKey: 'present-cue-1-0' }
    ])
    expect(onEntry.repeatingCues).toBe(true)

    // A re-derivation of the same state is the same occurrence, so a re-render cannot replay anything.
    expect(derivePresentation(source, entered).dynamics).toEqual(onEntry.dynamics)

    // Advancing the cycle replays the repeating cue alone: the single-shot key is untouched.
    const cycled = reducePresentation(entered, { type: 'replay-cues' })
    expect(derivePresentation(source, cycled).dynamics).toEqual([
      { dynamicId: 'delivery', occurrenceKey: 'present-cue-1' },
      { dynamicId: 'attention', occurrenceKey: 'present-cue-1-1' }
    ])

    // Stepping to a Scene that cues nothing cancels both, and leaves nothing for a View to keep playing.
    const stepped = reducePresentation(cycled, { type: 'step-sequence', sequences: source.sequences, delta: 1 })
    expect(derivePresentation(source, stepped).dynamics).toEqual([])
    expect(derivePresentation(source, stepped).repeatingCues).toBe(false)

    // Returning to the Scene is a new occurrence rather than the retained one.
    const returned = reducePresentation(stepped, { type: 'step-sequence', sequences: source.sequences, delta: -1 })
    expect(derivePresentation(source, returned).dynamics[0]?.occurrenceKey).toBe('present-cue-3')

    // Leaving the Sequence altogether clears the focus, so no cue survives it.
    const cleared = reducePresentation(returned, { type: 'clear-focus' })
    expect(derivePresentation(source, cleared).dynamics).toEqual([])

    // `none` originates nothing at all: a host that wants to own every occurrence gets no cue either.
    expect(derivePresentation(source, entered, 'none').dynamics).toEqual([])
    expect(derivePresentation(source, entered, 'none').repeatingCues).toBe(false)

    // A Scene that stages nothing has one stage, so a step moves past it exactly as it always did.
    expect(onEntry.cueStages).toBe(1)
    expect(onEntry.stepStaysInScene).toBe(false)
    expect(stepped.playing).toEqual({ id: 'walk', step: 1 })
  })

  it('plays a cascade a stage at a time, and steps past the Scene once the last stage has played', () => {
    const source = createInfoschematicRuntime(
      defineInfoschematicModel({
        id: 'CASCADE',
        title: 'Cascading Scenes',
        diagram: {
          bounds: { x: 0, y: 0, width: 400, height: 200 },
          gridSize: 10,
          cards: [
            { id: 'SRC', label: 'Source', bounds: { x: 20, y: 20, width: 100, height: 60 } },
            { id: 'SNK', label: 'Sink', bounds: { x: 260, y: 20, width: 100, height: 60 } }
          ],
          flows: [{ id: 'LOAD', source: { element: 'SRC', port: 'E1' }, target: { element: 'SNK', port: 'W1' } }],
          dynamics: [
            { id: 'delivery', label: 'Record delivered', kind: 'signal-flow', flows: ['LOAD'] },
            { id: 'attention', label: 'Sink needs attention', kind: 'emphasise-elements', elements: ['SNK'] },
            { id: 'settled', label: 'Source settled', kind: 'emphasise-elements', elements: ['SRC'] }
          ]
        },
        sequences: [
          {
            id: 'walk',
            label: 'Walkthrough',
            // Untimed: each stage is one presenter step, which is the case `ADR-INFOSCHEMATICS-035` had to answer.
            presentation: { display: 'expanded', timed: false, callouts: true },
            scenes: [
              {
                id: 'arrival',
                label: 'Arrival',
                cues: [
                  { dynamic: 'delivery', stage: 1 },
                  { dynamic: 'attention', stage: 2, playback: 'repeat' },
                  // The stages are read as an order rather than a count, so the gap to 5 is not an empty beat.
                  { dynamic: 'settled', stage: 5 }
                ]
              },
              { id: 'quiet', label: 'Quiet' }
            ]
          }
        ]
      })
    )
    const sequence = source.sequences[0]
    if (!sequence) throw new Error('The fixture declares one Sequence')
    const step = (state: PresentationState, delta: number) =>
      reducePresentation(state, { type: 'step-sequence', sequences: source.sequences, delta })

    const first = reducePresentation(createPresentationState(source), { type: 'start-sequence', sequence })
    const onEntry = derivePresentation(source, first)
    expect(onEntry.cueStages).toBe(3)
    expect(onEntry.stepStaysInScene).toBe(true)
    // Entry plays the first stage alone: the rest of the cascade has not happened yet.
    expect(onEntry.dynamics).toEqual([{ dynamicId: 'delivery', occurrenceKey: 'present-cue-1' }])
    expect(onEntry.repeatingCues).toBe(false)
    // Deriving twice from one state gives one answer, which is the property the stage index is held here to keep.
    expect(derivePresentation(source, first).dynamics).toEqual(onEntry.dynamics)

    // A step advances within the Scene rather than past it, and the Scene occurrence does not move with it.
    const second = step(first, 1)
    expect(second.playing).toEqual({ id: 'walk', step: 0 })
    expect(second.sceneOccurrence).toBe(first.sceneOccurrence)
    expect(derivePresentation(source, second).dynamics).toEqual([
      { dynamicId: 'delivery', occurrenceKey: 'present-cue-1' },
      { dynamicId: 'attention', occurrenceKey: 'present-cue-1-0' }
    ])
    // The cadence starts only once the stage carrying the repeat has played.
    expect(derivePresentation(source, second).repeatingCues).toBe(true)

    const third = step(second, 1)
    expect(derivePresentation(source, third).dynamics).toEqual([
      { dynamicId: 'delivery', occurrenceKey: 'present-cue-1' },
      { dynamicId: 'attention', occurrenceKey: 'present-cue-1-0' },
      { dynamicId: 'settled', occurrenceKey: 'present-cue-1' }
    ])
    expect(derivePresentation(source, third).stepStaysInScene).toBe(false)

    // The next step lands where it would have landed before the cascade existed, having passed through the stages.
    const past = step(third, 1)
    expect(past.playing).toEqual({ id: 'walk', step: 1 })
    expect(past.cueStage).toBe(0)
    expect(past.sceneOccurrence).toBe(first.sceneOccurrence + 1)
    expect(derivePresentation(source, past).dynamics).toEqual([])

    // Stepping back arrives at the Scene as it was left, so back and forward reverse each other.
    const back = step(past, -1)
    expect(back.playing).toEqual({ id: 'walk', step: 0 })
    expect(back.cueStage).toBe(2)
    expect(derivePresentation(source, back).dynamics).toHaveLength(3)
    const backAgain = step(back, -1)
    expect(backAgain.playing).toEqual({ id: 'walk', step: 0 })
    expect(backAgain.cueStage).toBe(1)

    // `step-cues` is the stage half on its own, and it stops at either end rather than leaving the Scene.
    const held = reducePresentation(backAgain, { type: 'step-cues', sequences: source.sequences, delta: 5 })
    expect(held.cueStage).toBe(2)
    expect(held.playing).toEqual({ id: 'walk', step: 0 })
    expect(reducePresentation(held, { type: 'step-cues', sequences: source.sequences, delta: -9 }).cueStage).toBe(0)

    // Leaving the Scene cancels a part-played cascade, and a `none` policy originates none of it in the first place.
    expect(derivePresentation(source, reducePresentation(second, { type: 'stop-sequence' })).dynamics).toEqual([])
    expect(derivePresentation(source, second, 'none').dynamics).toEqual([])
  })

  it('divides a timed Scene between its stages, so the Scene leaves when it always did', () => {
    // Three stages over a six-second hold beat every two seconds, and the three beats spend the whole of it.
    expect(cueStageHold(6000, 3)).toBe(2000)
    expect(cueStageHold(6000, 3) * 3).toBe(6000)
    // A Scene with no cascade divides by one, and a Scene cueing nothing at all still holds rather than flickering.
    expect(cueStageHold(6000, 1)).toBe(6000)
    expect(cueStageHold(6000, 0)).toBe(6000)
    // A negative hold is not a negative timeout.
    expect(cueStageHold(-1, 2)).toBe(0)
  })
})
