import { defineInfoschematicModel } from '@infoschematics/domain-core'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Present } from './Present.tsx'

const config = defineInfoschematicModel({
  id: 'present-dynamics',
  title: 'Present dynamics',
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

describe('Present Diagram Dynamics', () => {
  it('passes host occurrences through to the Canvas without touching Scene signalling', () => {
    const quiet = renderToStaticMarkup(<Present config={config} />)
    const emphasised = renderToStaticMarkup(
      <Present config={config} dynamics={[{ dynamicId: 'attention', occurrenceKey: 'run-1' }]} />
    )

    expect(quiet).not.toContain('infoschematic-element-emphasis')
    expect(emphasised).toContain('data-artefact-id="SNK" data-dynamic-id="attention" data-emphasised="true"')
    expect(emphasised).toContain('data-occurrence-key="run-1"')
    // Everything the presentation itself draws is unchanged by the occurrence.
    expect(emphasised.replace(/<g class="infoschematic-emphasis">.*?<\/g><\/g>/s, '')).toBe(quiet)
  })

  it('signals a Flow a Dynamic names, so a host event and a Scene reach the same treatment', () => {
    const signalled = renderToStaticMarkup(
      <Present config={config} dynamics={[{ dynamicId: 'delivered', occurrenceKey: 'run-1' }]} />
    )

    expect(signalled).toContain('class="infoschematic-flow-signal"')
    expect(signalled).not.toContain('infoschematic-element-emphasis')
  })

  it('ignores an occurrence naming a Dynamic the document does not declare', () => {
    expect(
      renderToStaticMarkup(<Present config={config} dynamics={[{ dynamicId: 'absent', occurrenceKey: 'x' }]} />)
    ).toBe(renderToStaticMarkup(<Present config={config} />))
  })
})
