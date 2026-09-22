import { describe, expect, it } from 'vitest'
import { resolveCardLayout } from './card-layout.ts'
import { codeBadgeRadius, resolveCodeBadge } from './code-badge.ts'
import { visualTokens } from './tokens.ts'

const box = { height: 80, width: 160, x: 100, y: 60 }

describe('code badge placement', () => {
  it("puts a code in the top right corner of an element's box, clear of everything else drawn there", () => {
    const badge = resolveCodeBadge({ box, kind: 'box' }, 'FAB-001')

    expect(badge).toEqual({ height: 20, textX: 228, textY: 79, width: 56, x: 200, y: 65 })
    expect(badge.x + badge.width).toBeLessThanOrEqual(box.x + box.width)
  })

  it("takes a Card's own identity slot rather than landing a few pixels off it", () => {
    const layout = resolveCardLayout({
      box: { height: box.height, width: box.width },
      code: 'PLT-001',
      compact: true,
      description: 'Accepts work',
      detail: { description: true, identity: true, stereotype: true },
      label: 'Gateway',
      stereotype: 'service'
    })
    const slot = layout.identity
    if (!slot) throw new Error('the reference Card has room for its chip')
    const badge = resolveCodeBadge({ box, kind: 'chip', slot }, 'PLT-001')

    // The one rectangle, wherever the request came from: `ROUTE-021` states the rule this serves.
    expect(badge.width).toBe(slot.width)
    expect(badge.x).toBe(box.x + slot.x)
    expect(badge.y).toBe(box.y + slot.y)
  })

  it("drops an Adapter's code into the rim below the Card it holds, where its name already is", () => {
    const held = { height: 80, width: 180, x: 110, y: 70 }
    const clasp = { height: 140, width: 200, x: 100, y: 60 }
    const badge = resolveCodeBadge({ box: clasp, held, kind: 'clasp' }, 'ADP-001')

    expect(badge.y).toBeGreaterThan(held.y + held.height)
    expect(badge.y).toBeLessThan(clasp.y + clasp.height)
    expect(badge.x + badge.width).toBe(clasp.x + clasp.width - 4)
  })

  it("stacks a Point's code above its mark, and above its label where the label took that side", () => {
    const at = { x: 400, y: 300 }
    const bare = resolveCodeBadge({ at, kind: 'mark' }, 'PNT-001')
    const stacked = resolveCodeBadge({ at, kind: 'mark', labelSide: 'above' }, 'PNT-001')

    expect(bare.textX).toBe(at.x)
    expect(bare.y + bare.height).toBeLessThan(at.y)
    expect(stacked.y).toBeLessThan(bare.y)
    expect(bare.y - stacked.y).toBe(
      visualTokens.canvas.geometry.pointLabelHeight + visualTokens.canvas.geometry.pointLabelGap
    )
  })

  it('centres a Flow code on its route and keeps the narrower minimum a floating chip needs', () => {
    const route = resolveCodeBadge({ at: { x: 400, y: 300 }, kind: 'route' }, 'FLW-1')
    const component = resolveCodeBadge({ box, kind: 'box' }, 'FLW-1')

    expect(route.textX).toBe(400)
    expect(route.y + route.height / 2).toBe(300)
    // A chip with nothing to sit inside is read against the line; a code on an element is read against the element.
    expect(route.width).toBeLessThan(component.width)
  })

  it('draws every code as one shape, so a tag and a chip are not two shapes a reader must reconcile', () => {
    expect(codeBadgeRadius).toBe(visualTokens.canvas.metrics.annotationRadius)
    for (const anchor of [
      { box, kind: 'box' },
      { at: { x: 0, y: 0 }, kind: 'route' },
      { at: { x: 0, y: 0 }, kind: 'mark' }
    ] as const) {
      const badge = resolveCodeBadge(anchor, 'ANY-001')
      expect(badge.height).toBe(visualTokens.canvas.metrics.annotationHeight)
      expect(badge.textX).toBe(badge.x + badge.width / 2)
      expect(badge.textY).toBe(badge.y + badge.height - 6)
    }
  })
})
