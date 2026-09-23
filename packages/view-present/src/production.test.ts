import { describe, expect, it } from 'vitest'
import type { PresentationState } from './presentation.ts'
import {
  createProductionState,
  type DirectTarget,
  directTargetOf,
  type ProductionState,
  reduceProduction,
  type WorkspaceKind
} from './production.ts'

const presentation = (): PresentationState => ({
  annotated: true,
  autoAdvance: false,
  cueCycle: 0,
  playing: { id: 'story-one', step: 2 },
  sceneOccurrence: 3,
  standaloneSceneId: null,
  takeaways: false,
  expandedSceneId: 'sequence-scene-one',
  visibleFamilies: new Set(['family-one']),
  visibleScopes: new Set(['scope-one'])
})

const workspaces: readonly WorkspaceKind[] = ['design', 'direct']

const produceIn = (kind: WorkspaceKind, from: ProductionState = createProductionState(presentation())) =>
  reduceProduction(reduceProduction(from, { kind, type: 'enter-workspace' }), {
    producing: true,
    type: 'set-producing'
  })

const present = (state: ProductionState) => reduceProduction(state, { producing: false, type: 'set-producing' })

describe('the capability axis', () => {
  it('starts every new session presenting, in a workspace holding no Direct target', () => {
    const state = createProductionState(presentation())

    expect(state.producing).toBe(false)
    expect(state.workspace.kind).toBe('design')
    expect(directTargetOf(state)).toBeNull()
  })

  it('puts away what was being presented when the tools come out, and leaves it alone when they go away', () => {
    const producing = produceIn('design')

    expect(producing.presentation.playing).toBeNull()
    expect(producing.presentation.expandedSceneId).toBeNull()
    expect(producing.presentation.annotated).toBe(true)
    expect(producing.presentation.visibleScopes).toEqual(new Set(['scope-one']))

    const presenting = present(producing)

    expect(presenting.presentation.playing).toBeNull()
    expect(presenting.presentation.expandedSceneId).toBeNull()
    expect(presenting.presentation.annotated).toBe(true)
  })

  it('leaves everything alone when the axis it already holds is reasserted', () => {
    const presenting = createProductionState(presentation())
    expect(reduceProduction(presenting, { producing: false, type: 'set-producing' })).toBe(presenting)

    const producing = produceIn('direct')
    expect(reduceProduction(producing, { producing: true, type: 'set-producing' })).toBe(producing)
    expect(reduceProduction(producing, { kind: 'direct', type: 'enter-workspace' })).toBe(producing)
  })

  /*
   * The defect this split exists to fix. Presenting used to overwrite the workspace, so a Producer directing a
   * Sequence who showed it to someone came back to Design and had to find their way to Direct again.
   */
  for (const kind of workspaces) {
    it(`returns to the ${kind} workspace after presenting from it`, () => {
      const working = produceIn(kind)
      const presenting = present(working)

      expect(presenting.producing).toBe(false)
      expect(presenting.workspace.kind).toBe(kind)

      const resumed = reduceProduction(presenting, { producing: true, type: 'set-producing' })

      expect(resumed.producing).toBe(true)
      expect(resumed.workspace.kind).toBe(kind)
    })
  }

  it('keeps a Direct target across a visit to the Audience view', () => {
    const target: DirectTarget = { kind: 'sequence', sequenceId: 'sequence-one' }
    const selected = reduceProduction(produceIn('direct'), { target, type: 'set-direct-target' })

    const resumed = reduceProduction(present(selected), { producing: true, type: 'set-producing' })

    expect(directTargetOf(resumed)).toEqual(target)
  })
})

describe('the workspace axis', () => {
  it('moves between workspaces without touching whether a Producer is producing', () => {
    const designing = produceIn('design')
    const directing = reduceProduction(designing, { kind: 'direct', type: 'enter-workspace' })

    expect(directing.producing).toBe(true)
    expect(directing.workspace.kind).toBe('direct')

    const presenting = present(directing)
    const designingAgain = reduceProduction(presenting, { kind: 'design', type: 'enter-workspace' })

    expect(designingAgain.producing).toBe(false)
    expect(designingAgain.workspace.kind).toBe('design')
  })

  /*
   * What the Diagram draws is asked on either axis; how it is presented is asked only while presenting. A Producer
   * laying out a Diagram still wants to see one scope at a time, and still does not want a Scene running under them.
   */
  it('routes visibility actions whether or not a Producer is producing, and the rest only while presenting', () => {
    const initial = createProductionState(presentation())
    const updated = reduceProduction(initial, {
      action: { type: 'toggle-scope', id: 'scope-two' },
      type: 'presentation'
    })
    const designing = produceIn('design', updated)

    expect(updated.presentation.visibleScopes).toEqual(new Set(['scope-one', 'scope-two']))

    const filtered = reduceProduction(designing, {
      action: { type: 'toggle-scope', id: 'scope-one' },
      type: 'presentation'
    })
    expect(filtered.producing).toBe(true)
    expect(filtered.presentation.visibleScopes).toEqual(new Set(['scope-two']))

    expect(
      reduceProduction(designing, {
        action: { type: 'set-takeaways', value: true },
        type: 'presentation'
      })
    ).toBe(designing)
  })
})

describe('Direct targets', () => {
  const targets = [
    { kind: 'standalone-scene', sceneId: 'scene-one' },
    { kind: 'sequence', sequenceId: 'sequence-one' },
    { kind: 'story', storyId: 'story-one' },
    {
      kind: 'callout',
      owner: 'sequence',
      ownerId: 'sequence-one',
      sceneId: 'sequence-scene-one'
    },
    { kind: 'storyboard', storyId: 'story-one' }
  ] as const satisfies readonly DirectTarget[]

  it.each(targets)('selects the $kind target independently of presentation focus', (target) => {
    const selected = reduceProduction(produceIn('direct'), {
      target,
      type: 'set-direct-target'
    })

    expect(directTargetOf(selected)).toEqual(target)
    expect(selected.presentation.playing).toBeNull()
    expect(selected.presentation.expandedSceneId).toBeNull()
  })

  it('ignores Direct target actions outside the Direct workspace', () => {
    const state = createProductionState(presentation())

    expect(
      reduceProduction(state, {
        target: targets[0],
        type: 'set-direct-target'
      })
    ).toBe(state)
  })

  it('clears empty and stale targets without throwing', () => {
    const direct = produceIn('direct')
    const empty = reduceProduction(direct, {
      target: { kind: 'story', storyId: '' },
      type: 'set-direct-target'
    })
    const selected = reduceProduction(empty, {
      target: targets[2],
      type: 'set-direct-target'
    })

    expect(directTargetOf(empty)).toBeNull()
    expect(
      directTargetOf(
        reduceProduction(selected, {
          availableTargets: [],
          type: 'reconcile-direct-target'
        })
      )
    ).toBeNull()
  })

  it('retains a target that is still available and clears a stale one', () => {
    const selected = reduceProduction(produceIn('direct'), {
      target: targets[3],
      type: 'set-direct-target'
    })
    const retained = reduceProduction(selected, {
      availableTargets: [...targets],
      type: 'reconcile-direct-target'
    })

    expect(retained).toBe(selected)
    expect(
      directTargetOf(
        reduceProduction(selected, {
          availableTargets: [targets[0]],
          type: 'reconcile-direct-target'
        })
      )
    ).toBeNull()
  })

  it('leaves a Direct target behind when the Producer takes up another workspace', () => {
    const selected = reduceProduction(produceIn('direct'), {
      target: targets[4],
      type: 'set-direct-target'
    })

    const designing = reduceProduction(selected, { kind: 'design', type: 'enter-workspace' })
    const directAgain = reduceProduction(designing, { kind: 'direct', type: 'enter-workspace' })

    expect(directTargetOf(designing)).toBeNull()
    expect(directTargetOf(directAgain)).toBeNull()
  })
})
