import { defineInfoschematic, defineInfoschematicModel, parseInfoschematicDocument } from '@infoschematics/domain-core'
import { elementEmphasisDuration } from '@infoschematics/view-canvas'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { Studio } from './App.tsx'
/*
 * Studio's stylesheet, because the panel dock is a cascade state over a mounted panel rather than a render branch.
 * Collapsed, `.control-room.collapsed .state-panel` hides everything the dock holds while leaving all of it in the
 * tree, so `querySelector` answers for a control nobody can reach. Without this import a reachability assertion is
 * vacuous and this suite passed for months over a surface a person could not touch at all.
 */
import '../styles.css'

const config = defineInfoschematic({
  title: 'Studio interaction',
  infoschematic: {
    cards: [
      {
        code: 'CARD-A',
        detail: 'Source card',
        id: 'card-a',
        label: 'Card A',
        placement: { box: { height: 50, width: 100, x: 80, y: 170 }, ports: { east: 1, north: 1 } },
        scope: 'scope',
        scopes: ['scope']
      },
      {
        code: 'CARD-B',
        detail: 'Target card',
        id: 'card-b',
        label: 'Card B',
        placement: { box: { height: 50, width: 100, x: 360, y: 170 }, ports: { west: 1 } },
        scope: 'scope',
        scopes: ['scope']
      }
    ],
    flowFamilies: [{ color: '#7c3aed', description: 'Requests', id: 'request', label: 'Request', prefix: 'REQ' }],
    flows: [
      {
        code: 'FLOW-A',
        family: 'request',
        id: 'flow-a',
        points: [
          { x: 180, y: 195 },
          { x: 360, y: 195 }
        ],
        source: 'card-a',
        sourcePort: 'E1',
        target: 'card-b',
        targetPort: 'W1'
      },
      {
        code: 'FLOW-B',
        family: 'request',
        id: 'flow-b',
        points: [
          { x: 200, y: 90 },
          { x: 130, y: 90 },
          { x: 130, y: 170 }
        ],
        source: 'point-a',
        sourcePort: 'S1',
        target: 'card-a',
        targetPort: 'N1'
      }
    ],
    /* Two Points twenty units apart: far enough that each centre is its own press, close enough that their widened
       hit targets overlap, which is the arrangement that proves a press takes the Point it was aimed at. */
    points: [
      {
        code: 'POINT-A',
        id: 'point-a',
        label: 'Point A',
        point: { x: 200, y: 90 },
        scopes: ['scope']
      },
      {
        code: 'POINT-B',
        id: 'point-b',
        label: 'Point B',
        point: { x: 220, y: 90 },
        scopes: ['scope']
      }
    ],
    scopes: [{ color: '#2463eb', description: 'Cards', fill: '#dbeafe', id: 'scope', label: 'Scope', prefix: 'CARD' }],
    viewBox: { height: 320, width: 640, x: 0, y: 0 }
  }
})

test('Studio keyboard edits render one reviewable change with undo, redo and reviewable removal', async () => {
  window.localStorage.clear()
  const { container } = await render(<Studio config={config} />)
  const design = container.querySelector<HTMLButtonElement>('button[aria-label^="Design"]')
  if (!design) throw new Error('Studio has no Design mode control')
  design.click()
  await expect.poll(() => container.querySelector('main')?.getAttribute('data-production-mode')).toBe('design')

  const card = container.querySelector<SVGGElement>('[data-artefact-id="CARD-A"]')
  if (!card) throw new Error('Studio did not render Card A')
  const currentCard = () => container.querySelector<SVGGElement>('[data-artefact-id="CARD-A"]')
  card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 21 }))
  window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 21 }))
  await expect.poll(() => card.classList.contains('selected')).toBe(true)

  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }))
  await expect.poll(() => card.getAttribute('transform')).toBe('translate(90 170)')
  await expect.poll(() => container.querySelector('.change-list')?.textContent ?? '').toContain('CARD-A')

  const undo = container.querySelector<HTMLButtonElement>('button[aria-label="Undo"]')
  const redo = container.querySelector<HTMLButtonElement>('button[aria-label="Redo"]')
  if (!undo || !redo) throw new Error('Studio did not render history controls')
  undo.click()
  await expect.poll(() => card.getAttribute('transform')).toBe('translate(80 170)')
  redo.click()
  await expect.poll(() => card.getAttribute('transform')).toBe('translate(90 170)')

  const x = container.querySelector<HTMLInputElement>('input[aria-label="CARD-A x"]')
  if (!x) throw new Error('Studio did not render numeric placement for Card A')
  const setInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (!setInputValue) throw new Error('browser has no native input value setter')
  setInputValue.call(x, '120')
  x.dispatchEvent(new Event('input', { bubbles: true }))
  await expect.poll(() => currentCard()?.getAttribute('transform')).toBe('translate(120 170)')

  const findMoreEast = () =>
    [...container.querySelectorAll<HTMLButtonElement>('button')]
      .filter((button) => button.getAttribute('aria-label')?.startsWith('More on'))
      .at(-1)
  await expect.poll(findMoreEast).toBeDefined()
  const moreEast = findMoreEast()
  if (!moreEast) throw new Error('Studio did not render Card port-count controls')
  moreEast.click()
  await expect.poll(() => container.querySelector('.change-list')?.textContent ?? '').toContain('ports')

  const dropOne = container.querySelector<HTMLButtonElement>('.change-drop')
  if (!dropOne) throw new Error('Studio did not render individual change removal')
  dropOne.click()
  await expect.poll(() => currentCard()?.getAttribute('transform')).toBe('translate(80 170)')

  const discard = container.querySelector<HTMLButtonElement>('button[aria-label="Discard every change"]')
  if (!discard) throw new Error('Studio did not render draft discard control')
  discard.click()
  await expect.poll(() => container.querySelector('.change-list')).toBeNull()

  currentCard()?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Delete' }))
  await expect.poll(() => container.querySelector('.change-list')?.textContent ?? '').toContain('CARD-A')
  await expect.poll(() => currentCard()?.classList.contains('going')).toBe(true)
  const changes = container.querySelector('.change-list')?.textContent ?? ''
  expect(changes).toContain('CARD-A')
  expect(changes).toContain('FLOW-A')

  currentCard()?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Delete' }))
  await expect.poll(() => currentCard()?.classList.contains('going')).toBe(false)
  await expect.poll(() => currentCard()?.getAttribute('transform')).toBe('translate(80 170)')
  expect(container.querySelector('.change-list')).toBeNull()
})

test('Studio creation and property clearing stay rendered and reviewable until discard', async () => {
  window.localStorage.clear()
  const { container } = await render(<Studio config={config} />)
  const design = container.querySelector<HTMLButtonElement>('button[aria-label^="Design"]')
  if (!design) throw new Error('Studio has no Design mode control')
  design.click()
  await expect.poll(() => container.querySelector('main')?.getAttribute('data-production-mode')).toBe('design')

  const createRegion = container.querySelector<HTMLButtonElement>('button[aria-label="Create Region"]')
  if (!createRegion) throw new Error('Studio has no Region creation control')
  createRegion.click()
  await expect.poll(() => container.querySelector('[data-artefact-kind="region"]')).not.toBeNull()
  await expect.poll(() => container.querySelector('.change-list')?.textContent ?? '').toContain('create region')

  const properties = container.querySelector<HTMLTextAreaElement>('textarea[aria-label="Edit region properties"]')
  const apply = [...container.querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.textContent?.trim() === 'Apply properties'
  )
  if (!properties || !apply) throw new Error('created Region has no property controls')
  const setTextAreaValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  if (!setTextAreaValue) throw new Error('browser has no native textarea value setter')
  setTextAreaValue.call(properties, '{"fill":"#abcdef","label":"Working area"}')
  properties.dispatchEvent(new Event('input', { bubbles: true }))
  apply.click()
  await expect
    .poll(() => container.querySelector('[data-artefact-kind="region"]')?.getAttribute('aria-label'))
    .toBe('Region Working area')
  await expect.poll(() => container.querySelector('.infoschematic-region-fill')?.getAttribute('fill')).toBe('#abcdef')

  setTextAreaValue.call(properties, '{"fill":null}')
  properties.dispatchEvent(new Event('input', { bubbles: true }))
  apply.click()
  await expect.poll(() => container.querySelector('.infoschematic-region-fill')).toBeNull()

  const discard = container.querySelector<HTMLButtonElement>('button[aria-label="Discard every change"]')
  if (!discard) throw new Error('Studio did not render draft discard control')
  discard.click()
  await expect.poll(() => container.querySelector('[data-artefact-kind="region"]')).toBeNull()
  expect(container.querySelector('.change-list')).toBeNull()
})

test('canonical YAML Sequences open in Direct mode and emit stable-id document edits', async () => {
  window.localStorage.clear()
  const parsed = parseInfoschematicDocument(`id: HOSTED
title: Hosted sequences
diagram:
  bounds: 0 0 640 320
  gridSize: 10
sequences:
  - id: OVERVIEW
    label: Overview
    presentation:
      display: expanded
      timed: false
      callouts: false
    scenes:
      - id: SCN-01
        label: Opening
        description: Opening scene
`)
  if (!parsed.ok) throw new Error('hosted Sequence fixture should parse')
  const changed = vi.fn()
  const replaced = vi.fn()
  const { container } = await render(
    <Studio document={parsed.document} onDocumentChange={changed} onDocumentReplace={replaced} />
  )
  const direct = container.querySelector<HTMLButtonElement>('button[aria-label^="Direct"]')
  if (!direct) throw new Error('Studio has no Direct mode control')
  direct.click()
  await expect.poll(() => container.querySelector('main')?.getAttribute('data-production-mode')).toBe('direct')

  const label = [...container.querySelectorAll<HTMLInputElement>('.scene-fields input')].find(
    (input) => input.value === 'Opening'
  )
  if (!label) throw new Error('canonical Overview Scene did not open in Direct mode')
  // Direct's editor is in the dock, and entering Direct opens it: this case reached the field without pressing
  // anything, which only holds because the mode brought the dock with it.
  expect(label.offsetParent).not.toBeNull()
  const setInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (!setInputValue) throw new Error('browser has no native input value setter')
  setInputValue.call(label, 'Edited opening')
  label.dispatchEvent(new Event('input', { bubbles: true }))

  await expect.poll(() => changed.mock.calls.length).toBeGreaterThan(0)
  const change = changed.mock.calls.at(-1)?.[0]
  expect(change?.model.sequences[0]?.scenes[0]?.label).toBe('Edited opening')
  expect(change?.edit.operations[0]?.path).toEqual([
    { field: 'sequences' },
    { id: 'OVERVIEW' },
    { field: 'scenes' },
    { id: 'SCN-01' },
    { field: 'label' }
  ])

  const sourceTab = [...container.querySelectorAll<HTMLButtonElement>('.panel-tabs button')].find(
    (button) => button.textContent?.trim() === 'Source'
  )
  if (!sourceTab) throw new Error('Direct mode did not retain the Source tab')
  sourceTab.click()
  await expect
    .poll(() => container.querySelector<HTMLTextAreaElement>('.source-panel textarea')?.value ?? '')
    .toContain('label: Edited opening')
})

test('Studio source panel validates, replaces, copies, undoes and redoes one retained document', async () => {
  window.localStorage.clear()
  const parsed = parseInfoschematicDocument(`# retained heading
id: SOURCE
title: Initial source
diagram:
  bounds: 0 0 640 320
  gridSize: 10
`)
  if (!parsed.ok) throw new Error('source panel fixture should parse')
  const initialDocument = parsed.document
  const replacements = vi.fn()
  const copied = vi.fn(async () => undefined)
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copied } })

  function HostedStudio() {
    const [document, setDocument] = useState(initialDocument)
    return (
      <Studio
        document={document}
        onDocumentChange={(change) => setDocument(change.document)}
        onDocumentReplace={(replacement) => {
          replacements(replacement)
          setDocument(replacement.document)
        }}
      />
    )
  }

  const { container } = await render(<HostedStudio />)
  const showPanels = container.querySelector<HTMLButtonElement>('button[aria-label="Show panels"]')
  if (!showPanels) throw new Error('Studio did not render panel visibility control')
  showPanels.click()
  await expect.poll(() => container.querySelector('button[aria-label="Collapse panels"]')).not.toBeNull()
  const sourceTab = [...container.querySelectorAll<HTMLButtonElement>('.panel-tabs button')].find(
    (button) => button.textContent?.trim() === 'Source'
  )
  if (!sourceTab) throw new Error('Studio did not render Source tab for an authored document')
  sourceTab.click()

  await expect.poll(() => container.querySelector('.source-panel textarea')).not.toBeNull()
  const source = container.querySelector<HTMLTextAreaElement>('.source-panel textarea')
  if (!source) throw new Error('Studio did not render YAML source editor')
  expect(source.value).toContain('# retained heading')
  const setTextAreaValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  if (!setTextAreaValue) throw new Error('browser has no native textarea value setter')

  setTextAreaValue.call(
    source,
    `id: SOURCE
title: Invalid source
diagram:
  bounds: no
  gridSize: 10
`
  )
  source.dispatchEvent(new Event('input', { bubbles: true }))
  const apply = [...container.querySelectorAll<HTMLButtonElement>('.source-panel button')].find(
    (button) => button.textContent?.trim() === 'Apply source'
  )
  if (!apply) throw new Error('Studio did not render source apply action')
  apply.click()
  await expect.poll(() => container.querySelector('[role="alert"]')?.textContent ?? '').toContain('not applied')
  expect(container.querySelector('h1')?.textContent).toContain('Initial source')
  expect(replacements).not.toHaveBeenCalled()

  setTextAreaValue.call(
    source,
    `# retained replacement
id: SOURCE
title: Replaced source
diagram:
  bounds: 0 0 640 320
  gridSize: 10
`
  )
  source.dispatchEvent(new Event('input', { bubbles: true }))
  apply.click()
  await expect.poll(() => container.querySelector('h1')?.textContent ?? '').toContain('Replaced source')
  expect(replacements).toHaveBeenCalledTimes(1)
  expect(replacements.mock.calls[0]?.[0].source).toContain('# retained replacement')

  const copy = [...container.querySelectorAll<HTMLButtonElement>('.source-panel button')].find(
    (button) => button.textContent?.trim() === 'Copy YAML'
  )
  const undo = [...container.querySelectorAll<HTMLButtonElement>('.source-panel button')].find(
    (button) => button.textContent?.trim() === 'Undo'
  )
  const redo = [...container.querySelectorAll<HTMLButtonElement>('.source-panel button')].find(
    (button) => button.textContent?.trim() === 'Redo'
  )
  if (!copy || !undo || !redo) throw new Error('Studio did not render source copy and history actions')
  copy.click()
  await expect.poll(() => copied.mock.calls.length).toBe(1)
  expect(copied).toHaveBeenCalledWith(expect.stringContaining('# retained replacement'))

  undo.click()
  await expect.poll(() => container.querySelector('h1')?.textContent ?? '').toContain('Initial source')
  redo.click()
  await expect.poll(() => container.querySelector('h1')?.textContent ?? '').toContain('Replaced source')
})

test('Studio persists the authored Design grid and uses it for keyboard movement', async () => {
  window.localStorage.clear()
  const parsed = parseInfoschematicDocument(`id: GRID
title: Authored grid
diagram:
  bounds: 0 0 320 200
  gridSize: 10
  collections:
    - id: CORE
      label: Core
  cards:
    - id: CARD-A
      label: Card A
      collection: CORE
      bounds: 20 40 80 50
      ports: 0
`)
  if (!parsed.ok) throw new Error('authored grid fixture should parse')
  const initialDocument = parsed.document
  const changed = vi.fn()

  function HostedStudio() {
    const [document, setDocument] = useState(initialDocument)
    return (
      <Studio
        document={document}
        onDocumentChange={(change) => {
          changed(change)
          setDocument(change.document)
        }}
      />
    )
  }

  const { container } = await render(<HostedStudio />)
  const showPanels = container.querySelector<HTMLButtonElement>('button[aria-label="Show panels"]')
  if (!showPanels) throw new Error('Studio did not render panel visibility control')
  showPanels.click()
  await expect.poll(() => container.querySelector('button[aria-label="Collapse panels"]')).not.toBeNull()
  const design = container.querySelector<HTMLButtonElement>('button[aria-label^="Design"]')
  if (!design) throw new Error('Studio has no Design mode control')
  design.click()
  await expect.poll(() => container.querySelector('main')?.getAttribute('data-production-mode')).toBe('design')

  await expect.poll(() => container.querySelector('input[aria-label="Design grid size"]')).not.toBeNull()
  const gridSize = container.querySelector<HTMLInputElement>('input[aria-label="Design grid size"]')
  if (!gridSize) throw new Error('Studio did not render the Design grid control')
  const setInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (!setInputValue) throw new Error('browser has no native input value setter')
  gridSize.focus()
  setInputValue.call(gridSize, '7')
  gridSize.dispatchEvent(new Event('input', { bubbles: true }))
  gridSize.blur()

  await expect.poll(() => changed.mock.calls.length).toBe(1)
  expect(changed.mock.calls[0]?.[0].edit.operations).toEqual([
    { op: 'replace', path: [{ field: 'diagram' }, { field: 'gridSize' }], value: 7 }
  ])
  expect(changed.mock.calls[0]?.[0].model.diagram.gridSize).toBe(7)
  await expect.poll(() => gridSize.value).toBe('7')
  await expect
    .poll(() =>
      // Canvas names the definitions it owns per mount, so the grid is found by what it is rather than
      // by a literal identifier. The composite pattern's own id ends in `-plus-minor`, so it is not caught here.
      [...container.querySelectorAll('pattern[id$="-grid-minor"]')].map((pattern) => pattern.getAttribute('height'))
    )
    .toEqual(['7'])
  expect(
    [...container.querySelectorAll('pattern[id$="-grid-major-plus-minor"]')].map((pattern) =>
      pattern.getAttribute('height')
    )
  ).toEqual(['35'])

  const card = container.querySelector<SVGGElement>('[data-artefact-id="CARD-A"]')
  if (!card) throw new Error('Studio did not render the authored Card')
  card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 31 }))
  window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 31 }))
  await expect.poll(() => card.classList.contains('selected')).toBe(true)
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }))
  await expect.poll(() => card.getAttribute('transform')).toBe('translate(27 40)')

  const beforeZero = changed.mock.calls.length
  gridSize.focus()
  setInputValue.call(gridSize, '0')
  gridSize.dispatchEvent(new Event('input', { bubbles: true }))
  gridSize.blur()
  await expect.poll(() => changed.mock.calls.length).toBe(beforeZero + 1)
  expect(changed.mock.calls.at(-1)?.[0].edit.operations).toEqual([
    { op: 'replace', path: [{ field: 'diagram' }, { field: 'gridSize' }], value: 0 }
  ])
  await expect
    .poll(() => container.querySelector('svg.infoschematic-svg')?.getAttribute('data-grid-treatment'))
    .toBe('none')
  expect(container.querySelector('rect.infoschematic-authored-grid')).toBeNull()

  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }))
  await expect.poll(() => card.getAttribute('transform')).toBe('translate(28 40)')

  const restore = container.querySelector<HTMLButtonElement>('button[aria-label="Restore ten-unit Design grid"]')
  if (!restore) throw new Error('Studio did not render the grid reset action')
  restore.click()
  await expect.poll(() => changed.mock.calls.at(-1)?.[0].model.diagram.gridSize).toBe(10)
  await expect.poll(() => gridSize.value).toBe('10')
})

test('Studio plays an authored Diagram Dynamic, replays it, and lets it retire', async () => {
  window.localStorage.clear()
  const dynamicConfig = defineInfoschematicModel({
    id: 'studio-dynamics',
    title: 'Studio dynamics',
    diagram: {
      bounds: { height: 320, width: 640, x: 0, y: 0 },
      gridSize: 10,
      families: [{ id: 'request', label: 'Request', description: 'Requests', appearance: { color: '#7c3aed' } }],
      cards: [
        { id: 'CARD-A', label: 'Card A', bounds: { height: 50, width: 100, x: 80, y: 170 } },
        { id: 'CARD-B', label: 'Card B', bounds: { height: 50, width: 100, x: 360, y: 170 } }
      ],
      flows: [
        {
          id: 'FLOW-A',
          family: 'request',
          source: { element: 'CARD-A', port: 'E1' },
          target: { element: 'CARD-B', port: 'W1' }
        }
      ],
      dynamics: [
        { id: 'delivered', label: 'Record delivered', kind: 'signal-flow', flows: ['FLOW-A'] },
        { id: 'attention', label: 'Card B needs attention', kind: 'emphasise-elements', elements: ['CARD-B'] }
      ]
    }
  })

  const { container } = await render(<Studio config={dynamicConfig} />)
  const bank = container.querySelector('section[aria-label="Diagram Dynamics"]')
  if (!bank) throw new Error('Studio did not render the Dynamics controls')

  const play = (label: string) => {
    const button = [...bank.querySelectorAll<HTMLButtonElement>('button')].find(
      (candidate) => candidate.textContent === label
    )
    if (!button) throw new Error(`Studio has no control for ${label}`)
    button.click()
    return button
  }

  const emphasis = () =>
    container.querySelector<SVGGElement>('.infoschematic-element-emphasis[data-artefact-id="CARD-B"]')

  const attention = play('Card B needs attention')
  await expect.poll(() => emphasis()?.dataset.occurrenceKey).toBe('studio-1')
  expect(attention.getAttribute('aria-pressed')).toBe('true')

  play('Card B needs attention')
  await expect.poll(() => emphasis()?.dataset.occurrenceKey).toBe('studio-2')

  // The occurrence is finite without the author doing anything further.
  await expect.poll(() => emphasis(), { timeout: 4000 }).toBeNull()

  play('Record delivered')
  await expect
    .poll(() => container.querySelector('[data-artefact-id="FLOW-A"] .infoschematic-flow-signal'))
    .not.toBeNull()
  expect(emphasis()).toBeNull()
})

test('Studio rehearses a state-depicting Dynamic as a hold the Producer ends, not a pulse that ends itself', async () => {
  window.localStorage.clear()
  const heldConfig = defineInfoschematicModel({
    id: 'studio-held-dynamic',
    title: 'Studio held dynamic',
    diagram: {
      bounds: { height: 320, width: 640, x: 0, y: 0 },
      gridSize: 10,
      cards: [
        { id: 'CARD-A', label: 'Card A', bounds: { height: 50, width: 100, x: 80, y: 170 } },
        { id: 'CARD-B', label: 'Card B', bounds: { height: 50, width: 100, x: 360, y: 170 } }
      ],
      dynamics: [
        { id: 'arrived', label: 'Record arrived', kind: 'emphasise-elements', elements: ['CARD-A'] },
        {
          id: 'on-this-stage',
          label: 'We are on this stage',
          kind: 'emphasise-elements',
          elements: ['CARD-B'],
          depicts: 'state'
        }
      ]
    }
  })

  const { container } = await render(<Studio config={heldConfig} />)
  const bank = container.querySelector('section[aria-label="Diagram Dynamics"]')
  if (!bank) throw new Error('Studio did not render the Dynamics controls')

  const control = (label: string) => {
    const button = [...bank.querySelectorAll<HTMLButtonElement>('button')].find(
      (candidate) => candidate.textContent === label
    )
    if (!button) throw new Error(`Studio has no control for ${label}`)
    return button
  }
  const emphasisOn = (elementId: string) =>
    container.querySelector<SVGGElement>(`.infoschematic-element-emphasis[data-artefact-id="${elementId}"]`)

  // First the event, rehearsed alone, so this case knows rehearsal does still withdraw an occurrence on its own.
  control('Record arrived').click()
  await expect.poll(() => emphasisOn('CARD-A')).not.toBeNull()
  await expect.poll(() => emphasisOn('CARD-A'), { timeout: elementEmphasisDuration * 4 }).toBeNull()
  expect(control('Record arrived').getAttribute('aria-pressed')).toBe('false')

  control('We are on this stage').click()
  await expect.poll(() => emphasisOn('CARD-B')?.dataset.depicts).toBe('state')

  // Nothing but the wait, and longer than the withdrawal that has just been watched happen to the event.
  await new Promise((resolve) => {
    setTimeout(resolve, elementEmphasisDuration * 3)
  })
  expect(emphasisOn('CARD-B')).not.toBeNull()
  expect(control('We are on this stage').getAttribute('aria-pressed')).toBe('true')

  // The same control ends it, which is the only way a Producer can: the hold is the host's to withdraw.
  control('We are on this stage').click()
  await expect.poll(() => emphasisOn('CARD-B')).toBeNull()
  await expect.poll(() => control('We are on this stage').getAttribute('aria-pressed')).toBe('false')
})

test('Studio layer controls close a kind to interaction and release whatever it held selected', async () => {
  window.localStorage.clear()
  const { container } = await render(<Studio config={config} />)
  const design = container.querySelector<HTMLButtonElement>('button[aria-label^="Design"]')
  if (!design) throw new Error('Studio has no Design mode control')
  design.click()
  await expect.poll(() => container.querySelector('main')?.getAttribute('data-production-mode')).toBe('design')

  // The editor mode follows the production mode through an effect, so the Design tools arrive a render later.
  const control = (label: string) => container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
  /*
   * Reachable, not merely present. This case used to read the layer controls straight out of the tree with the dock
   * collapsed, so it operated buttons that were `display: none` for its whole run and reported a green over a surface
   * nobody could press. `offsetParent` is null under a hidden ancestor, which is the difference `querySelector` misses.
   */
  await expect.poll(() => control('Cards interactive')?.offsetParent ?? null).not.toBeNull()
  const cards = control('Cards interactive')
  const flows = control('Flows interactive')
  const card = container.querySelector<SVGGElement>('[data-artefact-id="CARD-A"]')
  if (!cards || !flows || !card) throw new Error('Studio did not render the Design layer controls')

  // Every kind is interactive when Design opens, so the control reads pressed before anything is done to it.
  expect(cards.getAttribute('aria-pressed')).toBe('true')
  card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 31 }))
  window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 31 }))
  await expect.poll(() => card.classList.contains('selected')).toBe(true)

  /*
   * Closing the layer the selection lives in releases it. Keeping it would leave a selected element that no longer
   * answers the pointer, reachable only through the very handles the closed layer has just taken away.
   */
  cards.click()
  await expect.poll(() => cards.getAttribute('aria-pressed')).toBe('false')
  await expect.poll(() => card.classList.contains('layer-inert')).toBe(true)
  await expect.poll(() => card.classList.contains('selected')).toBe(false)
  await expect.poll(() => card.getAttribute('tabindex')).toBeNull()
  // Closed to interaction, not hidden, and nothing about it authored: the diagram still draws it where it was.
  expect(card.getAttribute('transform')).toBe('translate(80 170)')
  expect(container.querySelector('.change-list')?.textContent ?? '').not.toContain('CARD-A')

  // One kind at a time: closing Cards left the Flows control alone, and its ports with it.
  expect(flows.getAttribute('aria-pressed')).toBe('true')
  expect(container.querySelector('.audit-port')).not.toBeNull()
  flows.click()
  await expect.poll(() => container.querySelector('.audit-port')).toBeNull()

  // Leaving Design and returning reopens every layer, so a filter never outlives the sitting that set it.
  const present = container.querySelector<HTMLButtonElement>('button[aria-label^="Direct"]')
  if (!present) throw new Error('Studio has no presentation mode control')
  present.click()
  await expect.poll(() => control('Cards interactive')).toBeNull()
  design.click()
  await expect.poll(() => control('Cards interactive')?.getAttribute('aria-pressed')).toBe('true')
  expect(control('Flows interactive')?.getAttribute('aria-pressed')).toBe('true')
  expect(container.querySelector('.audit-port')).not.toBeNull()
})

/*
 * Where a diagram coordinate lands on the screen, so a press can be aimed at a Point rather than dispatched at an
 * element already found in the tree. Finding the element first proves nothing about what a pointer would reach: a
 * Point's visible mark takes no pointer events at all, and what answers a press is a transparent disc more than
 * twice its radius. `elementFromPoint` is the only assertion that distinguishes those two.
 */
const artefactAt = (svg: SVGSVGElement, at: { x: number; y: number }) => {
  const aimed = svg.createSVGPoint()
  aimed.x = at.x
  aimed.y = at.y
  const onScreen = () => {
    const matrix = svg.getScreenCTM()
    if (!matrix) throw new Error('the diagram reports no screen transform')
    return aimed.matrixTransform(matrix)
  }
  /*
   * The aimed coordinate is brought to the middle of the window before it is asked what is there.
   *
   * A hit test is answered in window coordinates, and this suite runs every case against one page: where it is
   * scrolled when this case starts is whatever the previous case left. The diagram is also wider than the window
   * the suite runs in, so scrolling the whole diagram into view still leaves its western half outside - centring
   * the point rather than the diagram is what makes any coordinate on the surface askable.
   */
  const before = onScreen()
  window.scrollBy(before.x - window.innerWidth / 2, before.y - window.innerHeight / 2)
  const client = onScreen()
  const element = document.elementFromPoint(client.x, client.y)
  if (!element) throw new Error(`nothing is on screen at ${at.x},${at.y} - the diagram is out of the window`)
  return element.closest('[data-artefact-kind="point"]')?.getAttribute('data-artefact-id') ?? null
}

test('a Point answers a press across its widened target and lets go when its layer closes', async () => {
  window.localStorage.clear()
  const { container } = await render(<Studio config={config} />)
  const design = container.querySelector<HTMLButtonElement>('button[aria-label^="Design"]')
  if (!design) throw new Error('Studio has no Design mode control')
  design.click()
  await expect.poll(() => container.querySelector('main')?.getAttribute('data-production-mode')).toBe('design')

  const svg = container.querySelector<SVGSVGElement>('.infoschematic-svg')
  const pointA = () => container.querySelector<SVGGElement>('[data-artefact-id="POINT-A"]')
  const markA = () => container.querySelector<SVGCircleElement>('[data-artefact-id="POINT-A"] .point-mark')
  if (!svg || !pointA()) throw new Error('Studio did not render the authored Points')

  // Six units of paint, where it was authored: Design adds a target to the static rendering without altering it.
  expect(markA()?.getAttribute('r')).toBe('6')
  expect(markA()?.getAttribute('cx')).toBe('200')

  /*
   * Eight units off centre is the case the widened target exists for: outside the mark, inside the disc. Deleting
   * the `.point-target` circle from the Point layer makes this line, and only this line, fail.
   */
  await expect.poll(() => artefactAt(svg, { x: 192, y: 90 })).toBe('POINT-A')
  expect(artefactAt(svg, { x: 200, y: 90 })).toBe('POINT-A')
  // Twenty units apart, so the two discs overlap and each Point still takes the press aimed at it.
  expect(artefactAt(svg, { x: 220, y: 90 })).toBe('POINT-B')
  /*
   * Thirty units west is nobody's. FLOW-B runs along y 90 out to x 130 with a twelve-unit press stroke of its own,
   * and the Point layer is painted over it, so a target that reached this far would quietly take the line's presses.
   */
  expect(artefactAt(svg, { x: 160, y: 90 })).toBeNull()

  pointA()?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 41 }))
  window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 41 }))
  await expect.poll(() => pointA()?.classList.contains('selected')).toBe(true)
  // Reachable without a pointer as well, which is what the role and the tab stop are for.
  expect(pointA()?.getAttribute('role')).toBe('button')
  expect(pointA()?.getAttribute('tabindex')).toBe('0')

  const control = (label: string) => container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
  await expect.poll(() => control('Points interactive')?.offsetParent ?? null).not.toBeNull()
  const points = control('Points interactive')
  if (!points) throw new Error('Design has no Points layer control')
  expect(points.getAttribute('aria-pressed')).toBe('true')

  points.click()
  await expect.poll(() => points.getAttribute('aria-pressed')).toBe('false')
  await expect.poll(() => pointA()?.classList.contains('layer-inert')).toBe(true)
  /*
   * Polled rather than read once. Closing the layer and releasing what it held are two pieces of state meeting in an
   * effect, so the class arrives a render after `layer-inert` does, and a single read here reports a Point that is
   * still selected when it is about to be let go.
   */
  await expect.poll(() => pointA()?.classList.contains('selected')).toBe(false)
  await expect.poll(() => pointA()?.getAttribute('tabindex')).toBeNull()
  expect(pointA()?.getAttribute('role')).toBe('img')
  // Closed to interaction, not hidden, and nothing authored about it: still drawn where it was.
  expect(markA()?.getAttribute('cx')).toBe('200')
  expect(markA()?.getAttribute('r')).toBe('6')
  expect(container.querySelector('.change-list')).toBeNull()
  /*
   * And released in the sense that matters: the disc is not drawn at all for a layer that cannot answer, so there is
   * nothing under the pointer to press rather than a control that silently ignores it.
   */
  expect(container.querySelector('[data-artefact-id="POINT-A"] .point-target')).toBeNull()
  expect(artefactAt(svg, { x: 192, y: 90 })).toBeNull()
  expect(artefactAt(svg, { x: 200, y: 90 })).toBeNull()
})

test('a selected Point moves by key and by typed coordinate, and takes its Flow when removed', async () => {
  window.localStorage.clear()
  const { container } = await render(<Studio config={config} />)
  const design = container.querySelector<HTMLButtonElement>('button[aria-label^="Design"]')
  if (!design) throw new Error('Studio has no Design mode control')
  design.click()
  await expect.poll(() => container.querySelector('main')?.getAttribute('data-production-mode')).toBe('design')

  const pointA = () => container.querySelector<SVGGElement>('[data-artefact-id="POINT-A"]')
  const markA = () => container.querySelector<SVGCircleElement>('[data-artefact-id="POINT-A"] .point-mark')
  if (!pointA()) throw new Error('Studio did not render the authored Points')

  pointA()?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 51 }))
  window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 51 }))
  await expect.poll(() => pointA()?.classList.contains('selected')).toBe(true)

  /*
   * One grid step east. A Point has no box to translate, so the move has to arrive on the coordinate the mark is
   * drawn at - a Point measured as a box would have moved by half an extent it has not got, or not at all.
   */
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }))
  await expect.poll(() => markA()?.getAttribute('cx')).toBe('210')
  expect(markA()?.getAttribute('cy')).toBe('90')
  await expect.poll(() => container.querySelector('.change-list')?.textContent ?? '').toContain('POINT-A')

  const undo = container.querySelector<HTMLButtonElement>('button[aria-label="Undo"]')
  if (!undo) throw new Error('Studio did not render history controls')
  undo.click()
  await expect.poll(() => markA()?.getAttribute('cx')).toBe('200')

  /*
   * Dragging cannot land on a chosen coordinate, which is why the number is typed. The field is named for the Point
   * rather than for the key the editor addresses it by, so what a screen reader says is `POINT-A x`.
   */
  const x = container.querySelector<HTMLInputElement>('input[aria-label="POINT-A x"]')
  const y = container.querySelector<HTMLInputElement>('input[aria-label="POINT-A y"]')
  if (!x || !y) throw new Error('Studio did not render numeric placement for Point A')
  const setInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (!setInputValue) throw new Error('browser has no native input value setter')
  setInputValue.call(x, '120')
  x.dispatchEvent(new Event('input', { bubbles: true }))
  await expect.poll(() => markA()?.getAttribute('cx')).toBe('120')
  // One axis at a time, and the other is left where it was rather than reset to whatever the field last showed.
  setInputValue.call(y, '60')
  y.dispatchEvent(new Event('input', { bubbles: true }))
  await expect.poll(() => markA()?.getAttribute('cy')).toBe('60')
  expect(markA()?.getAttribute('cx')).toBe('120')

  const discard = container.querySelector<HTMLButtonElement>('button[aria-label="Discard every change"]')
  if (!discard) throw new Error('Studio did not render draft discard control')
  discard.click()
  await expect.poll(() => container.querySelector('.change-list')).toBeNull()
  expect(markA()?.getAttribute('cx')).toBe('200')

  /*
   * FLOW-B leaves POINT-A, so removing the Point has to offer to remove the line with it. Left behind, the line
   * would name a source the document no longer has, and the edit would be refused rather than drawn.
   */
  pointA()?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Delete' }))
  await expect.poll(() => pointA()?.classList.contains('going')).toBe(true)
  await expect.poll(() => container.querySelector('.change-list')?.textContent ?? '').toContain('POINT-A')
  const changes = container.querySelector('.change-list')?.textContent ?? ''
  expect(changes).toContain('FLOW-B')
  // POINT-B is not attached to anything and was not selected, so nothing about it is proposed.
  expect(changes).not.toContain('POINT-B')

  pointA()?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Delete' }))
  await expect.poll(() => pointA()?.classList.contains('going')).toBe(false)
  expect(container.querySelector('.change-list')).toBeNull()
  expect(markA()?.getAttribute('cx')).toBe('200')
})

/*
 * Three Cards, no two of them sharing an edge or a gap, so every group operation has something to change and an
 * already-aligned fixture cannot pass by accident.
 */
const groupConfig = defineInfoschematic({
  title: 'Group alignment',
  infoschematic: {
    cards: [
      {
        code: 'CARD-A',
        detail: 'Anchor card',
        id: 'card-a',
        label: 'Card A',
        placement: { box: { height: 50, width: 100, x: 40, y: 40 } },
        scope: 'scope',
        scopes: ['scope']
      },
      {
        code: 'CARD-B',
        detail: 'Middle card',
        id: 'card-b',
        label: 'Card B',
        placement: { box: { height: 50, width: 100, x: 200, y: 120 } },
        scope: 'scope',
        scopes: ['scope']
      },
      {
        code: 'CARD-C',
        detail: 'Far card',
        id: 'card-c',
        label: 'Card C',
        placement: { box: { height: 50, width: 100, x: 500, y: 200 } },
        scope: 'scope',
        scopes: ['scope']
      }
    ],
    scopes: [{ color: '#2463eb', description: 'Cards', fill: '#dbeafe', id: 'scope', label: 'Scope', prefix: 'CARD' }],
    viewBox: { height: 320, width: 640, x: 0, y: 0 }
  }
})

test('a held group aligns and distributes onto its anchor, and one undo puts the whole group back', async () => {
  window.localStorage.clear()
  const { container } = await render(<Studio config={groupConfig} />)
  const design = container.querySelector<HTMLButtonElement>('button[aria-label^="Design"]')
  if (!design) throw new Error('Studio has no Design mode control')
  design.click()
  await expect.poll(() => container.querySelector('main')?.getAttribute('data-production-mode')).toBe('design')

  const at = (id: string) => container.querySelector<SVGGElement>(`[data-artefact-id="${id}"]`)
  const placedAt = (id: string) => at(id)?.getAttribute('transform')
  const control = (label: string) => container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)

  // Nothing is held but the one Card, so a group control has nothing to act on and says so by being disabled.
  at('CARD-A')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 60 }))
  window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 60 }))
  await expect.poll(() => at('CARD-A')?.classList.contains('selected')).toBe(true)
  expect(control('Align top')?.disabled).toBe(true)

  for (const [id, pointerId] of [
    ['CARD-B', 61],
    ['CARD-C', 62]
  ] as const) {
    at(id)?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId, shiftKey: true }))
    await expect.poll(() => at(id)?.classList.contains('group-held')).toBe(true)
  }
  expect(control('Align top')?.disabled).toBe(false)
  expect(control('Distribute across')?.disabled).toBe(false)

  control('Align top')?.click()
  // The anchor stays exactly where it was; the other two come onto its top edge and move on no other axis.
  await expect.poll(() => placedAt('CARD-B')).toBe('translate(200 40)')
  expect(placedAt('CARD-A')).toBe('translate(40 40)')
  expect(placedAt('CARD-C')).toBe('translate(500 40)')
  // One row per element moved, because a row names the authored source a review has to read.
  expect(container.querySelectorAll('.change-drop').length).toBe(2)

  const undo = container.querySelector<HTMLButtonElement>('button[aria-label="Undo"]')
  if (!undo) throw new Error('Studio did not render history controls')
  undo.click()
  await expect.poll(() => placedAt('CARD-B')).toBe('translate(200 120)')
  expect(placedAt('CARD-C')).toBe('translate(500 200)')
  expect(container.querySelector('.change-list')).toBeNull()

  // The outermost two are left where they are and the gaps between all three are equalised: 560 across, 300 of it
  // occupied, so 130 of space on either side of the middle Card.
  control('Distribute across')?.click()
  await expect.poll(() => placedAt('CARD-B')).toBe('translate(270 120)')
  expect(placedAt('CARD-A')).toBe('translate(40 40)')
  expect(placedAt('CARD-C')).toBe('translate(500 200)')

  undo.click()
  await expect.poll(() => placedAt('CARD-B')).toBe('translate(200 120)')
  expect(container.querySelector('.change-list')).toBeNull()
})

test('arrow keys carry the whole held group, one step for the group rather than one each', async () => {
  window.localStorage.clear()
  const { container } = await render(<Studio config={groupConfig} />)
  const design = container.querySelector<HTMLButtonElement>('button[aria-label^="Design"]')
  if (!design) throw new Error('Studio has no Design mode control')
  design.click()
  await expect.poll(() => container.querySelector('main')?.getAttribute('data-production-mode')).toBe('design')

  const at = (id: string) => container.querySelector<SVGGElement>(`[data-artefact-id="${id}"]`)
  const placedAt = (id: string) => at(id)?.getAttribute('transform')

  at('CARD-A')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 63 }))
  window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 63 }))
  // The anchor has to be held before the next press can extend it; a Shift press with nothing held is a plain
  // selection of whatever it landed on.
  await expect.poll(() => at('CARD-A')?.classList.contains('selected')).toBe(true)
  at('CARD-B')?.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 64, shiftKey: true })
  )
  await expect.poll(() => at('CARD-B')?.classList.contains('group-held')).toBe(true)

  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }))
  await expect.poll(() => placedAt('CARD-A')).toBe('translate(50 40)')
  expect(placedAt('CARD-B')).toBe('translate(210 120)')
  // Two steps rather than one twice as long: each press is measured from where the group now is.
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }))
  await expect.poll(() => placedAt('CARD-A')).toBe('translate(60 40)')
  expect(placedAt('CARD-B')).toBe('translate(220 120)')
})

/*
 * A document with something in each of the collapsed rail's three Present groups, a Card to select in Design, a
 * Sequence to direct, and an id, so `DOCK.panels.collapsed` can be read back from `localStorage` by name.
 */
const dockDocument = `id: DOCK
title: Docked panels
diagram:
  bounds: 0 0 640 320
  gridSize: 10
  collections:
    - id: CORE
      label: Core
  families:
    - id: request
      label: Request
      description: Requests
      color: "#79c9ff"
  cards:
    - id: CARD-A
      label: Card A
      collection: CORE
      bounds: 20 40 80 50
      ports: 0
scopes:
  - id: core
    label: Core scope
    description: The Cards
    elements:
      - CARD-A
sequences:
  - id: OVERVIEW
    label: Overview
    presentation:
      display: expanded
      timed: false
      callouts: false
    scenes:
      - id: SCN-01
        label: Opening
        description: Opening scene
`

const hostDock = async () => {
  const parsed = parseInfoschematicDocument(dockDocument)
  if (!parsed.ok) throw new Error('dock fixture should parse')
  const initialDocument = parsed.document

  function HostedStudio() {
    const [document, setDocument] = useState(initialDocument)
    return <Studio document={document} onDocumentChange={(change) => setDocument(change.document)} />
  }

  const { container } = await render(<HostedStudio />)
  return {
    collapsed: () => container.querySelector('.control-room')?.classList.contains('collapsed'),
    container,
    mode: () => container.querySelector('main')?.getAttribute('data-production-mode'),
    press: (label: string) => {
      const button = container.querySelector<HTMLButtonElement>(`button[aria-label^="${label}"]`)
      if (!button) throw new Error(`Studio has no control labelled ${label}`)
      button.click()
      return button
    },
    /* `display: none` leaves a control in the tree; `offsetParent` is what a person's reach looks like as an assertion. */
    reachable: (selector: string) => Boolean(container.querySelector<HTMLElement>(selector)?.offsetParent),
    tab: (label: string) => {
      const button = [...container.querySelectorAll<HTMLButtonElement>('.panel-tabs button')].find(
        (candidate) => candidate.textContent?.trim() === label
      )
      if (!button) throw new Error(`Studio has no ${label} panel tab`)
      button.click()
      return button
    }
  }
}

test('the panel dock opens with a Producer mode and keeps a collapse made inside one', async () => {
  window.localStorage.clear()
  const studio = await hostDock()

  /*
   * Present is the collapsed default, and the rail is Present's own affordance: the Scope, Family and Sequence
   * controls PRESENT-009 requires are reachable in forty-eight pixels while the dock itself is not.
   */
  expect(studio.collapsed()).toBe(true)
  expect(studio.reachable('.panel-rail [aria-label="Architectural scopes"] button')).toBe(true)
  expect(studio.reachable('.panel-rail [aria-label="Flow families"] button')).toBe(true)
  expect(studio.reachable('.panel-rail [aria-label="Sequences"] button')).toBe(true)
  expect(studio.reachable('.state-panel')).toBe(false)

  // Present to Design opens the dock, because the rail carries none of Design's tools and never did.
  studio.press('Design')
  await expect.poll(studio.mode).toBe('design')
  await expect.poll(studio.collapsed).toBe(false)
  await expect.poll(() => studio.reachable('button[aria-label="Cards interactive"]')).toBe(true)
  expect(studio.reachable('.editor-tab')).toBe(true)
  // Honestly empty rather than usefully populated: collapsed is a Present layout, so there is no rail here at all.
  expect(studio.container.querySelector('.panel-rail')).toBeNull()

  /*
   * The open is a transition, not a state held across the mode. Collapsing inside Design stands, through a re-render
   * and through a selection change, because otherwise the dock springs back on the next thing the Producer does.
   */
  studio.press('Collapse panels')
  await expect.poll(studio.collapsed).toBe(true)
  const card = studio.container.querySelector<SVGGElement>('[data-artefact-id="CARD-A"]')
  if (!card) throw new Error('Studio did not render the authored Card')
  card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 41 }))
  window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 41 }))
  await expect.poll(() => card.classList.contains('selected')).toBe(true)
  expect(studio.collapsed()).toBe(true)

  // Design to Direct is another mode entry, so the dock comes back with Direct's target chooser and a target in it.
  studio.press('Direct')
  await expect.poll(studio.mode).toBe('direct')
  await expect.poll(studio.collapsed).toBe(false)
  await expect.poll(() => studio.reachable('.editor-tab-header select')).toBe(true)
  /*
   * A chooser with this document's targets in it, and the Scene's own fields below it, rather than an empty panel.
   * Direct does not preselect a target - `reconcileDirectTargets` is declared and never called - and choosing one for
   * a Producer is the panel's own content, which this item does not touch.
   */
  await expect
    .poll(() =>
      [...studio.container.querySelectorAll<HTMLOptionElement>('.editor-tab-header select option')]
        .map((option) => option.value)
        .filter((value) => value.length > 0)
    )
    .toContain('standalone-scene:SCN-01')
  expect(studio.reachable('.scene-fields input')).toBe(true)
  expect(studio.container.querySelector('.source-panel')).toBeNull()

  /*
   * Returning to Present drops the override and the document's own preference decides again. It was never rewritten:
   * one visit to Design must not change what Present looks like for this document from then on.
   */
  studio.press('Present')
  await expect.poll(studio.mode).toBe('present')
  await expect.poll(studio.collapsed).toBe(true)
  expect(window.localStorage.getItem('DOCK.panels.collapsed')).toBe('true')
})

test('a mode change lands on that mode own panel rather than on whatever tab was last open', async () => {
  window.localStorage.clear()
  const studio = await hostDock()

  studio.press('Show panels')
  await expect.poll(studio.collapsed).toBe(false)
  studio.tab('Source')
  await expect.poll(() => studio.reachable('.source-panel textarea')).toBe(true)

  /*
   * Source outlived its mode and took priority over the mode's own panel, so Present with the YAML open became Design
   * showing the YAML. The tab strip reads the same either way, which is why no existing case saw this.
   */
  studio.press('Design')
  await expect.poll(studio.mode).toBe('design')
  await expect.poll(() => studio.reachable('.editor-tab')).toBe(true)
  expect(studio.container.querySelector('.source-panel')).toBeNull()

  // The same on the way in from Direct, which is where a Producer reading the YAML of a Scene actually is.
  studio.press('Direct')
  await expect.poll(studio.mode).toBe('direct')
  studio.tab('Source')
  await expect.poll(() => studio.reachable('.source-panel textarea')).toBe(true)
  studio.press('Present')
  await expect.poll(studio.mode).toBe('present')
  expect(studio.container.querySelector('.source-panel')).toBeNull()
  studio.press('Design')
  await expect.poll(studio.mode).toBe('design')
  await expect.poll(() => studio.reachable('.editor-tab')).toBe(true)
  expect(studio.container.querySelector('.source-panel')).toBeNull()
})

test('a reload restores the dock preference and none of the Producer mode that opened it', async () => {
  window.localStorage.clear()
  // What a Producer who expanded the dock in Present left behind, and all they left behind.
  window.localStorage.setItem('DOCK.panels.collapsed', 'false')
  const studio = await hostDock()

  expect(studio.mode()).toBe('present')
  expect(studio.collapsed()).toBe(false)
  expect(studio.reachable('.state-panel')).toBe(true)
  expect(studio.container.querySelector('.panel-rail')).toBeNull()
  expect(studio.container.querySelector('.editor-tab')).toBeNull()
})
