import { describe, expect, it } from 'vitest'
import type { PresentationState } from './presentation.ts'
import { createProductionState, type DirectTarget, type ProductionMode, reduceProduction } from './production.ts'

const presentation = (): PresentationState => ({
  annotated: true,
  autoAdvance: false,
  playing: { id: 'story-one', step: 2 },
  sceneOccurrence: 3,
  standaloneSceneId: null,
  takeaways: false,
  thematicSceneId: 'theme-scene-one',
  visibleFamilies: new Set(['family-one']),
  visibleScopes: new Set(['scope-one'])
})

const modes: readonly ProductionMode[] = ['present', 'design', 'direct']

const enterMode = (mode: ProductionMode) =>
  reduceProduction(createProductionState(presentation()), {
    mode,
    type: 'set-mode'
  })

describe('production mode', () => {
  it('starts every new session in Present without a Direct target', () => {
    const state = createProductionState(presentation())

    expect(state.mode).toBe('present')
    expect(state.directTarget).toBeNull()
  })

  for (const from of modes) {
    for (const to of modes) {
      it(`defines the ${from} to ${to} transition`, () => {
        const before = enterMode(from)
        const after = reduceProduction(before, { mode: to, type: 'set-mode' })

        expect(after.mode).toBe(to)
        expect(after.presentation.annotated).toBe(true)
        expect(after.presentation.autoAdvance).toBe(false)
        expect(after.presentation.takeaways).toBe(false)
        expect(after.presentation.visibleFamilies).toEqual(new Set(['family-one']))
        expect(after.presentation.visibleScopes).toEqual(new Set(['scope-one']))

        if (to === 'present' && from === 'present') {
          expect(after.presentation.playing).toEqual({ id: 'story-one', step: 2 })
          expect(after.presentation.thematicSceneId).toBe('theme-scene-one')
        } else {
          expect(after.presentation.playing).toBeNull()
          expect(after.presentation.standaloneSceneId).toBeNull()
          expect(after.presentation.thematicSceneId).toBeNull()
        }
      })
    }
  }

  it('does not resume playback when returning to Present', () => {
    const designing = reduceProduction(createProductionState(presentation()), {
      mode: 'design',
      type: 'set-mode'
    })

    const presenting = reduceProduction(designing, {
      mode: 'present',
      type: 'set-mode'
    })

    expect(presenting.presentation.playing).toBeNull()
    expect(presenting.presentation.thematicSceneId).toBeNull()
  })

  it('routes presentation actions only while Present is active', () => {
    const initial = createProductionState(presentation())
    const updated = reduceProduction(initial, {
      action: { type: 'toggle-scope', id: 'scope-two' },
      type: 'presentation'
    })
    const designing = reduceProduction(updated, {
      mode: 'design',
      type: 'set-mode'
    })

    expect(updated.presentation.visibleScopes).toEqual(new Set(['scope-one', 'scope-two']))
    expect(
      reduceProduction(designing, {
        action: { type: 'toggle-scope', id: 'scope-one' },
        type: 'presentation'
      })
    ).toBe(designing)
  })
})

describe('Direct targets', () => {
  const targets = [
    { kind: 'standalone-scene', sceneId: 'scene-one' },
    { kind: 'theme', themeId: 'theme-one' },
    { kind: 'story', storyId: 'story-one' },
    {
      kind: 'callout',
      owner: 'theme',
      ownerId: 'theme-one',
      sceneId: 'theme-scene-one'
    },
    { kind: 'storyboard', storyId: 'story-one' }
  ] as const satisfies readonly DirectTarget[]

  it.each(targets)('selects the $kind target independently of presentation focus', (target) => {
    const direct = enterMode('direct')
    const selected = reduceProduction(direct, {
      target,
      type: 'set-direct-target'
    })

    expect(selected.directTarget).toEqual(target)
    expect(selected.presentation.playing).toBeNull()
    expect(selected.presentation.thematicSceneId).toBeNull()
  })

  it('ignores Direct target actions outside Direct', () => {
    const state = createProductionState(presentation())

    expect(
      reduceProduction(state, {
        target: targets[0],
        type: 'set-direct-target'
      })
    ).toBe(state)
  })

  it('clears empty and stale targets without throwing', () => {
    const direct = enterMode('direct')
    const empty = reduceProduction(direct, {
      target: { kind: 'story', storyId: '' },
      type: 'set-direct-target'
    })
    const selected = reduceProduction(empty, {
      target: targets[2],
      type: 'set-direct-target'
    })

    expect(empty.directTarget).toBeNull()
    expect(
      reduceProduction(selected, {
        availableTargets: [],
        type: 'reconcile-direct-target'
      }).directTarget
    ).toBeNull()
  })

  it('retains a target that is still available and clears a stale one', () => {
    const direct = enterMode('direct')
    const selected = reduceProduction(direct, {
      target: targets[3],
      type: 'set-direct-target'
    })
    const retained = reduceProduction(selected, {
      availableTargets: [...targets],
      type: 'reconcile-direct-target'
    })

    expect(retained).toBe(selected)
    expect(
      reduceProduction(selected, {
        availableTargets: [targets[0]],
        type: 'reconcile-direct-target'
      }).directTarget
    ).toBeNull()
  })

  it('clears Direct targets when another mode takes ownership', () => {
    const selected = reduceProduction(enterMode('direct'), {
      target: targets[4],
      type: 'set-direct-target'
    })

    const designed = reduceProduction(selected, {
      mode: 'design',
      type: 'set-mode'
    })
    const directAgain = reduceProduction(designed, {
      mode: 'direct',
      type: 'set-mode'
    })

    expect(designed.directTarget).toBeNull()
    expect(directAgain.directTarget).toBeNull()
  })
})
