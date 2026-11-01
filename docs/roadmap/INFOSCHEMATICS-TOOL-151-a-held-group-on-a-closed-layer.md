---
id: INFOSCHEMATICS-TOOL-151
area: TOOL
title: A held group on a closed layer
status: triage
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-11-01T23:02:00Z
updated_at: 2026-11-01T23:02:00Z
---

# A held group on a closed layer

## Goal

Studio's rendered suite proves that closing an interaction layer releases a whole held group, not just its anchor, so the composition of `DESIGN-020` with `DESIGN-018` that the [Composition specification](../specs/composition.md) states has a rendered case of its own.

## Context

The Gaps section of [the Composition specification](../specs/composition.md) records that the composition holds on the rendered surface — a held group of three released exactly as a single selection does when its layer closed — but that the clause stating it has no rendered case of its own, and that the case belongs to `DESIGN-015`'s matrix in [the design-session specification](../specs/design-session.md).

A draft of that case was written by an agent worktree around `INFOSCHEMATICS-TOOL-126` and `INFOSCHEMATICS-TOOL-057`, and survived only in the work-in-progress commit `cec8c02d` ("wip: preserve uncommitted worktree changes before estate reshape") on the branch `worktree-agent-abd13720a30e3e0ad`, as `packages/view-studio/src/app/App.compositions.browser.test.tsx`. It was never run in review. The branch was deleted on 2026-11-01 under Kris's decision BRANCH-INFOSCHEMATICS a), so the draft is quoted in full under Discussion. Its second case, a Dynamic played from Studio's Dynamics bank marking a Point, overlaps the Point emphasis coverage `INFOSCHEMATICS-TOOL-126` landed on main; whether the bank-driven path is already covered is to be checked rather than assumed.

## Boundary

A rendered Studio browser case for a held group released when its interaction layer closes, sited in `DESIGN-015`'s matrix, and the Composition specification's Gaps entry updated to point at it. The second draft case comes in only if main has no bank-driven Point case. It does not change selection, grouping or layer behaviour.

## Discussion

### Origin

Captured on 2026-11-01 under BRANCH-INFOSCHEMATICS a), recorded in the hnr.sop.5ge work package, so that the only unique content on the leftover agent branch survives its deletion. The same commit held a throwaway probe for `INFOSCHEMATICS-TOOL-057`, marked "Delete before committing", and a parity-test change already superseded on main; neither is kept.

### The draft test

Verbatim from `cec8c02d:packages/view-studio/src/app/App.compositions.browser.test.tsx`, unrun; its selectors and labels predate main's current Studio and need checking against it.

```tsx
/**
 * Two features at once, on the composed Studio surface.
 *
 * Every feature here arrived with a suite of its own, and each of those suites exercises its feature alone: one
 * fixture, one capability, one thing being asked. A feature that degrades another's usability is invisible to all of
 * them, because no case in any of them has both features switched on. The defect that prompted this file is the
 * shape: a Point became a drawn, selectable artefact kind, a Dynamic could already name an element and emphasise it,
 * and naming a Point produced nothing at all — with every suite green, on both sides.
 *
 * So these cases are sited by where the composition is observable rather than by which feature looks newer. Both of
 * these are only observable here: one needs Studio's editor state and Canvas's rendering together, and the other
 * needs the Dynamics bank, which is a Studio panel, driving a treatment Canvas draws.
 */
import { defineInfoschematicModel } from '@infoschematics/domain-core'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { Studio } from './App.tsx'
import '../styles.css'

const config = defineInfoschematicModel({
  id: 'studio-compositions',
  title: 'Studio compositions',
  diagram: {
    bounds: { height: 320, width: 640, x: 0, y: 0 },
    gridSize: 25,
    regions: [{ id: 'ZONE', label: 'Zone', bounds: { height: 260, width: 600, x: 10, y: 30 } }],
    cards: [
      { id: 'CARD-A', label: 'Card A', bounds: { height: 50, width: 100, x: 40, y: 60 } },
      { id: 'CARD-B', label: 'Card B', bounds: { height: 50, width: 100, x: 200, y: 140 } },
      { id: 'CARD-C', label: 'Card C', bounds: { height: 50, width: 100, x: 400, y: 220 } }
    ],
    points: [{ id: 'EDGE', label: 'Edge', at: { x: 560, y: 100 } }],
    dynamics: [
      { id: 'edge-state', label: 'Edge is live', kind: 'emphasise-elements', elements: ['EDGE'], depicts: 'state' },
      { id: 'zone-state', label: 'Zone is live', kind: 'emphasise-elements', elements: ['ZONE'], depicts: 'state' }
    ]
  }
})

const studio = async () => {
  window.localStorage.clear()
  const { container } = await render(<Studio config={config} />)
  return container
}

const inMode = async (container: HTMLElement, mode: 'design' | 'present') => {
  const control = container.querySelector<HTMLButtonElement>(
    `button[aria-label^="${mode === 'design' ? 'Design' : 'Present'}"]`
  )
  if (!control) throw new Error(`Studio has no ${mode} mode control`)
  control.click()
  await expect.poll(() => container.querySelector('main')?.getAttribute('data-production-mode')).toBe(mode)
}

const artefact = (container: HTMLElement, id: string) =>
  container.querySelector<SVGGElement>(`[data-artefact-id="${id}"]`)

/** Everything the surface is currently showing as chosen, anchor and held alike. */
const chosen = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-artefact-id]')]
    .filter((node) => node.classList.contains('selected') || node.classList.contains('group-held'))
    .map((node) => node.getAttribute('data-artefact-id'))
    .sort()

test('a closed interaction layer releases the whole held group, not just its anchor', async () => {
  const container = await studio()
  await inMode(container, 'design')

  const anchor = artefact(container, 'CARD-A')
  if (!anchor) throw new Error('Studio did not render Card A')
  anchor.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 80 }))
  window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 80 }))
  await expect.poll(() => anchor.classList.contains('selected')).toBe(true)

  for (const [id, pointerId] of [
    ['CARD-B', 81],
    ['CARD-C', 82]
  ] as const) {
    artefact(container, id)?.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId, shiftKey: true })
    )
    await expect.poll(() => artefact(container, id)?.classList.contains('group-held')).toBe(true)
  }
  expect(chosen(container)).toEqual(['CARD-A', 'CARD-B', 'CARD-C'])

  // Closing the layer takes the press away from all three at once. A group left standing would be a selection a
  // Producer can see and drag the handles of, over elements the same setting has just declared untouchable — and it
  // is the group that makes it reachable, because the anchor alone was already covered.
  const layer = () => container.querySelector<HTMLButtonElement>('button[aria-label="Cards interactive"]')
  await expect.poll(() => layer()?.offsetParent ?? null).not.toBeNull()
  layer()?.click()
  await expect.poll(() => layer()?.getAttribute('aria-pressed')).toBe('false')

  // Polled rather than read once: the release lands a commit after the layer setting, and reading immediately shows
  // a group that is about to go. Asserting on that first frame reports a defect that is not there.
  await expect.poll(() => chosen(container)).toEqual([])
  expect(artefact(container, 'CARD-A')?.getAttribute('class')).toContain('layer-inert')
})

test('a Dynamic named from the bank marks a Point, the newest artefact kind', async () => {
  const container = await studio()
  await inMode(container, 'present')

  const bank = () => container.querySelector('section[aria-label="Diagram Dynamics"]')
  await expect.poll(() => bank() !== null).toBe(true)
  const play = (label: string) => {
    const button = [
      ...container.querySelectorAll<HTMLButtonElement>('section[aria-label="Diagram Dynamics"] button')
    ].find((node) => node.textContent === label)
    if (!button) throw new Error(`the Dynamics bank offers no control labelled ${label}`)
    button.click()
  }
  const emphasisFor = (id: string) =>
    container.querySelector(`.infoschematic-element-emphasis[data-artefact-id="${id}"]`)

  // A Region first, to show the bank is working and the surface is painting: this is the pairing that was already
  // covered, and without it a Point drawing nothing looks like a broken fixture rather than a missing geometry.
  play('Zone is live')
  await expect.poll(() => emphasisFor('ZONE') !== null).toBe(true)
  play('Zone is live')

  play('Edge is live')
  expect(artefact(container, 'EDGE')).not.toBeNull()
  await expect.poll(() => emphasisFor('EDGE') !== null).toBe(true)
})
```
