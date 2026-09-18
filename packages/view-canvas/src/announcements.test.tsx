import { defineInfoschematicModel } from '@infoschematics/domain-core'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DiagramAnnouncements } from './announcements.tsx'
import { InfoschematicContext } from './runtime-context.tsx'

/*
 * `COMPOSE-004`, at the component that composes the sentence.
 *
 * A host whose accepted set is its drawn set cannot reach this: `Canvas` reconciles an occurrence against what it
 * drew before it ever accepts one. Studio's `useDiagramAnnouncements` accepts what it resolved, so the filtered case
 * arrives here as an accepted announcement with nothing drawn to say it about — which is the shape the live region
 * read a revision prefix out of.
 */
const config = defineInfoschematicModel({
  id: 'announcements',
  title: 'Announcements',
  diagram: {
    bounds: { height: 200, width: 420, x: 0, y: 0 },
    gridSize: 10,
    families: [{ id: 'request', label: 'Request', description: 'Requests', appearance: { color: '#7c3aed' } }],
    cards: [
      { id: 'SRC', label: 'Source', bounds: { height: 60, width: 120, x: 20, y: 40 } },
      { id: 'SNK', label: 'Sink', bounds: { height: 60, width: 120, x: 260, y: 40 } }
    ],
    flows: [
      { id: 'LOAD', family: 'request', source: { element: 'SRC', port: 'E1' }, target: { element: 'SNK', port: 'W1' } }
    ],
    dynamics: [
      { id: 'delivered', label: 'Record delivered', kind: 'signal-flow', flows: ['LOAD'] },
      { id: 'attention', label: 'Sink needs attention', kind: 'emphasise-elements', elements: ['SNK'] }
    ]
  }
})

const runtime = createInfoschematicRuntime(config)
const drawnFlow = { code: 'LOAD', id: 'LOAD', source: 'SRC', target: 'SNK' }
const acceptedSignal = { revision: 1, signals: [{ flowId: 'LOAD', occurrenceKey: 'run-1' }] }
const acceptedEmphasis = {
  revision: 1,
  emphasis: [{ dynamicId: 'attention', elementId: 'SNK', occurrenceKey: 'run-1' }]
}

const announced = (props: Parameters<typeof DiagramAnnouncements>[0]) => {
  const markup = renderToStaticMarkup(
    <InfoschematicContext value={runtime}>
      <DiagramAnnouncements {...props} />
    </InfoschematicContext>
  )
  return [...markup.matchAll(/role="status">([^<]*)</g)].map(([, text]) => text)
}

describe('Diagram announcements', () => {
  it('says nothing at all when the filter removed everything the occurrence would have drawn', () => {
    expect(
      announced({
        drawnElements: new Set<string>(),
        emphasis: acceptedEmphasis,
        flows: [],
        signals: acceptedSignal
      })
    ).toEqual(['', ''])
  })

  it('announces each accepted occurrence once, with its revision, when something was drawn', () => {
    expect(
      announced({
        drawnElements: new Set(['SNK']),
        emphasis: acceptedEmphasis,
        flows: [drawnFlow],
        signals: acceptedSignal
      })
    ).toEqual(['Signal update 1. Flow LOAD, Source to Sink, signalled.', 'Dynamic update 1. Sink needs attention.'])
  })

  it('announces a partly filtered occurrence for the part that was drawn', () => {
    // The requirement is silence when *every* element was removed. One of two still happened, and withholding it
    // would trade one defect for its opposite.
    expect(announced({ drawnElements: new Set(['SNK']), emphasis: acceptedEmphasis, flows: [] })).toEqual([
      '',
      'Dynamic update 1. Sink needs attention.'
    ])
  })

  it('leaves a host that filters nothing to announce what it accepted', () => {
    // `drawnElements` omitted: Studio before it filtered, and any host whose accepted set is its drawn set.
    expect(announced({ emphasis: acceptedEmphasis, flows: [drawnFlow], signals: acceptedSignal })).toEqual([
      'Signal update 1. Flow LOAD, Source to Sink, signalled.',
      'Dynamic update 1. Sink needs attention.'
    ])
  })
})
