import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { Playground } from './Playground.tsx'

const setTextArea = (textarea: HTMLTextAreaElement, value: string) => {
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  if (!setValue) throw new Error('Browser has no native textarea value setter')
  setValue.call(textarea, value)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
}

test('Playground hosts Studio preset, source validation, copy and reset journeys', async () => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  const { container } = await render(<Playground />)
  const preset = container.querySelector<HTMLSelectElement>('.playground-preset select')
  if (!preset) throw new Error('Playground did not render its preset picker')

  preset.value = 'media-pipeline'
  preset.dispatchEvent(new Event('change', { bubbles: true }))
  await expect.poll(() => container.querySelector('h1')?.textContent ?? '').toContain('Live media pipeline')
  expect(new URL(window.location.href).searchParams.get('preset')).toBe('media-pipeline')

  const showPanels = container.querySelector<HTMLButtonElement>('button[aria-label="Show panels"]')
  if (!showPanels) throw new Error('Hosted Studio did not render its panel visibility control')
  showPanels.click()
  await expect.poll(() => container.querySelector('button[aria-label="Collapse panels"]')).not.toBeNull()
  const sourceTab = [...container.querySelectorAll<HTMLButtonElement>('.panel-tabs button')].find(
    (button) => button.textContent?.trim() === 'Source'
  )
  if (!sourceTab) throw new Error('Hosted Studio did not expose its Source tab')
  sourceTab.click()

  await expect.poll(() => container.querySelector('.source-panel textarea')).not.toBeNull()
  const source = container.querySelector<HTMLTextAreaElement>('.source-panel textarea')
  if (!source) throw new Error('Hosted Studio did not render its YAML source editor')
  const originalSource = source.value
  setTextArea(
    source,
    `id: MEDIA-PIPELINE
title: Invalid hosted edit
diagram:
  bounds: no
  gridSize: 10
`
  )
  const apply = [...container.querySelectorAll<HTMLButtonElement>('.source-panel button')].find(
    (button) => button.textContent?.trim() === 'Apply source'
  )
  if (!apply) throw new Error('Hosted Studio did not render its source apply action')
  apply.click()
  await expect.poll(() => container.querySelector('[role="alert"]')?.textContent ?? '').toContain('not applied')
  expect(container.querySelector('h1')?.textContent).toContain('Live media pipeline')

  setTextArea(source, originalSource.replace(/^title:.*$/m, 'title: Hosted pipeline edit'))
  apply.click()
  await expect.poll(() => container.querySelector('h1')?.textContent ?? '').toContain('Hosted pipeline edit')
  await expect
    .poll(() => container.querySelector('.playground-document-state')?.textContent?.trim() ?? '')
    .toBe('Edited')
  expect(
    [...container.querySelectorAll<HTMLButtonElement>('.source-panel button')].some(
      (button) => button.textContent?.trim() === 'Copy YAML'
    )
  ).toBe(true)

  const reset = [...container.querySelectorAll<HTMLButtonElement>('.playground-actions button')].find(
    (button) => button.textContent?.trim() === 'Reset preset'
  )
  if (!reset) throw new Error('Playground did not render its reset action')
  expect(reset.disabled).toBe(false)
  reset.click()
  await expect.poll(() => container.querySelector('h1')?.textContent ?? '').toContain('Live media pipeline')
  await expect
    .poll(() => container.querySelector('.playground-document-state')?.textContent?.trim() ?? '')
    .toBe('Preset loaded')
})
