import { defineInfoschematic } from '@infoschematics/domain-core'
import { artefactDestination, scopeDestination } from '@infoschematics/view-model/destination'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Canvas } from './Canvas.tsx'

/**
 * What a destination does to a rendering that has no reader.
 *
 * Arriving is a viewport movement and a selection, and a server rendering has neither a viewport a reader controls
 * nor a reader to select for. So the interesting assertion here is a negative one: the markup is identical whether an
 * address was supplied or not, which is the same property `STATIC-025` states for the still renderer and the reason a
 * link cannot quietly change the picture a document produces.
 */
const config = defineInfoschematic({
  title: 'Addressed document',
  infoschematic: {
    scopes: [
      { color: '#2463eb', description: 'Inside', fill: '#dbeafe', id: 'inside', label: 'Inside', prefix: 'IN' },
      { color: '#b45309', description: 'Edge', fill: '#fde68a', id: 'edge', label: 'Edge', prefix: 'ED' }
    ],
    flowFamilies: [{ color: '#7c3aed', description: 'Requests', id: 'request', label: 'Request', prefix: 'REQ' }],
    cards: [
      {
        code: 'IN-01',
        detail: 'Source',
        id: 'source',
        label: 'Source',
        placement: { box: { height: 60, width: 120, x: 20, y: 40 }, ports: { east: 1 } },
        scope: 'inside',
        scopes: ['inside']
      },
      {
        code: 'ED-01',
        detail: 'Target',
        id: 'target',
        label: 'Target',
        placement: { box: { height: 60, width: 120, x: 260, y: 40 }, ports: { west: 1 } },
        scope: 'edge',
        scopes: ['edge']
      }
    ],
    viewBox: { height: 200, width: 440, x: 0, y: 0 }
  }
})

const markup = (destination?: ReturnType<typeof artefactDestination>) =>
  renderToStaticMarkup(<Canvas config={config} destination={destination ?? null} />)

describe('a destination in a rendering nobody is reading', () => {
  it('draws the whole document, addressed or not', () => {
    const plain = markup()
    for (const address of [
      artefactDestination('ED-01'),
      scopeDestination('edge'),
      artefactDestination('CARD-99'),
      scopeDestination('nowhere')
    ]) {
      const addressed = markup(address)
      expect(addressed).toContain('Target')
      expect(addressed).toContain('Source')
      /* Byte-identical, so no address — resolvable or not — can change the picture a definition produces. */
      expect(addressed).toBe(plain)
    }
  })

  it('mounts an arrival region that says nothing until a reader is sent somewhere', () => {
    expect(markup()).toContain('data-arrival-announcement="true"')
    expect(markup(artefactDestination('ED-01'))).toContain(
      '<p aria-live="polite" class="infoschematic-signal-announcement" data-arrival-announcement="true" role="status"></p>'
    )
  })

  it('refuses an address that leads nowhere without throwing', () => {
    /* The failure this guards is the one that matters: a link in prose outlives the document it points into, and a
       Diagram that threw on a stale address would take the host page down with it. */
    expect(() => markup(artefactDestination('CARD-99'))).not.toThrow()
    expect(() => markup(scopeDestination('nowhere'))).not.toThrow()
  })
})
