import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { DemoFrame } from './DemoFrame.tsx'
import { specimenFor } from './specimens.ts'

const buttonWithLabel = (container: HTMLElement, label: string) => {
  const button = container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
  if (!button) throw new Error(`Missing ${label} button`)
  return button
}

test('mode, source expansion, format, and reset stay synchronized', async () => {
  const { container } = await render(
    <DemoFrame
      config={specimenFor('card')}
      kind="card"
      propertyControls={null}
      reset={() => undefined}
      title="Card properties"
    />
  )

  const design = [...container.querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.textContent === 'Design'
  )
  if (!design) throw new Error('Missing Design button')

  design.click()
  await expect.poll(() => container.querySelector('svg.infoschematic-svg.editing')).not.toBeNull()

  buttonWithLabel(container, 'Expand source').click()
  expect(container.querySelector('.specimen-snippet__source--expanded')).not.toBeNull()

  const typescript = [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(
    (button) => button.textContent === 'TypeScript'
  )
  if (!typescript) throw new Error('Missing TypeScript tab')
  typescript.click()
  expect(typescript.getAttribute('aria-selected')).toBe('true')

  buttonWithLabel(container, 'Reset example').click()
  await expect.poll(() => container.querySelector('svg.infoschematic-svg.editing')).toBeNull()
  expect(container.querySelector('.specimen-snippet__source--expanded')).toBeNull()
  expect(container.querySelector('button[aria-pressed="true"]')?.textContent).toBe('Rendered')
})
