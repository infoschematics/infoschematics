import { defineInfoschematic, parseInfoschematicDocument } from '@infoschematics/domain-core'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { Studio } from './App.tsx'

const config = defineInfoschematic({
  title: 'Studio interaction',
  infoschematic: {
    cards: [
      {
        code: 'CARD-A',
        detail: 'Source card',
        id: 'card-a',
        label: 'Card A',
        placement: { box: { height: 50, width: 100, x: 80, y: 170 }, ports: { east: 1 } },
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
      [...container.querySelectorAll('pattern#infoschematic-grid-minor')].map((pattern) =>
        pattern.getAttribute('height')
      )
    )
    .toEqual(['7'])
  expect(
    [...container.querySelectorAll('pattern#infoschematic-grid-major-plus-minor')].map((pattern) =>
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
