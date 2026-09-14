import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import {
  InlineSvgReference,
  type InlineSvgReferenceProps,
  mountInlineSvgInteractions,
  resolveInlineSvgArtefact
} from './InlineSvgReference.tsx'

type Listener = (event: Event) => void

class FakeElement {
  private readonly attributes: Record<string, string>
  private readonly closestValues = new Map<string, FakeElement | null>()

  constructor(attributes: Record<string, string> = {}) {
    this.attributes = attributes
  }

  closest(selector: string) {
    return this.closestValues.get(selector) ?? null
  }

  getAttribute(name: string) {
    return this.attributes[name] ?? null
  }

  setClosest(selector: string, value: FakeElement | null) {
    this.closestValues.set(selector, value)
  }
}

class FakeHost {
  private readonly listeners = new Map<string, Set<Listener>>()

  constructor(
    private readonly svg: FakeElement,
    private readonly descendants: ReadonlySet<FakeElement>
  ) {}

  addEventListener(type: string, listener: Listener) {
    const listeners = this.listeners.get(type) ?? new Set<Listener>()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  contains(candidate: FakeElement) {
    return this.descendants.has(candidate)
  }

  dispatch(type: string, target: FakeElement) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ target } as unknown as Event)
    }
  }

  querySelector(selector: string) {
    return selector === ':scope > svg' ? this.svg : null
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener)
  }
}

const config = (id = 'shared'): InlineSvgReferenceProps['input'] => ({
  title: 'Inline reference',
  infoschematic: {
    cards: [
      {
        code: 'CARD-001',
        detail: 'An inspectable source',
        id,
        label: 'Source',
        placement: { box: { height: 40, width: 80, x: 20, y: 20 }, ports: {} },
        scope: 'core',
        scopes: ['core']
      }
    ],
    fabrics: [],
    flowFamilies: [],
    flows: [],
    graphics: [],
    interfaces: [],
    points: [],
    regions: [],
    scopes: [
      {
        color: '#2463eb',
        description: 'Core scope',
        fill: '#dbeafe',
        id: 'core',
        label: 'Core',
        prefix: 'CORE'
      }
    ],
    specificationGroups: [],
    viewBox: { height: 80, width: 120, x: 0, y: 0 }
  },
  calloutPositions: [],
  standaloneScenes: [],
  stories: [],
  themes: []
})

const fakeDiagram = (id: string) => {
  const svg = new FakeElement()
  const artefact = new FakeElement({ 'data-artefact-id': id, 'data-artefact-kind': 'card' })
  const child = new FakeElement()
  artefact.setClosest('[data-artefact-id][data-artefact-kind]', artefact)
  artefact.setClosest('svg', svg)
  child.setClosest('[data-artefact-id][data-artefact-kind]', artefact)
  const host = new FakeHost(svg, new Set([svg, artefact, child]))
  return { artefact, child, host: host as unknown as HTMLElement, rawHost: host, svg }
}

describe('InlineSvgReference', () => {
  it('places renderer output inline and provides a named keyboard-equivalent action', () => {
    const markup = renderToStaticMarkup(
      <InlineSvgReference
        actions={[{ id: 'shared', kind: 'card', label: 'Inspect Source' }]}
        input={config()}
        resourceIdPrefix="reference-test"
      />
    )

    expect(markup).toContain('<svg xmlns="http://www.w3.org/2000/svg"')
    expect(markup).not.toContain('data:image/svg+xml')
    expect(markup).toContain('data-artefact-id="CARD-001" data-artefact-kind="card"')
    expect(markup).toContain('<button type="button">Inspect Source</button>')
    expect(markup).toContain('role="status"')
  })

  it('resolves descendants only within the mounted host SVG', () => {
    const first = fakeDiagram('shared')
    const second = fakeDiagram('shared')

    expect(resolveInlineSvgArtefact(first.child as unknown as EventTarget, first.host)).toEqual({
      id: 'shared',
      kind: 'card'
    })
    expect(resolveInlineSvgArtefact(second.child as unknown as EventTarget, first.host)).toBeNull()
  })

  it('removes delegated listeners during replacement or unmount', () => {
    const first = fakeDiagram('first')
    const onActivate = vi.fn()
    const onHover = vi.fn()
    const teardown = mountInlineSvgInteractions(first.host, { onActivate, onHover })

    first.rawHost.dispatch('pointerover', first.child)
    first.rawHost.dispatch('click', first.child)
    expect(onHover).toHaveBeenLastCalledWith({ id: 'first', kind: 'card' })
    expect(onActivate).toHaveBeenLastCalledWith({ id: 'first', kind: 'card' })

    teardown()
    first.rawHost.dispatch('click', first.child)
    expect(onActivate).toHaveBeenCalledTimes(1)
  })
})
