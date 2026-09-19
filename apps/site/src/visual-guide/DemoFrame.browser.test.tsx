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
  const feedback = container.querySelector<HTMLElement>('.specimen-snippet__notice')

  if (!feedback) throw new Error('Missing snippet notice')

  expect(getComputedStyle(feedback).display).toBe('none')

  const design = [...container.querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.textContent === 'Design'
  )
  if (!design) throw new Error('Missing Design button')

  design.click()
  await expect.poll(() => container.querySelector('svg.infoschematic-svg.editing')).not.toBeNull()

  buttonWithLabel(container, 'Expand source').click()
  await expect.poll(() => container.querySelector('.specimen-snippet__source--expanded')).not.toBeNull()

  const typescript = [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(
    (button) => button.textContent === 'TypeScript'
  )
  if (!typescript) throw new Error('Missing TypeScript tab')
  typescript.click()
  await expect.poll(() => typescript.getAttribute('aria-selected')).toBe('true')

  buttonWithLabel(container, 'Copy snippet').click()
  await expect.poll(() => feedback.textContent).not.toBe('')
  await expect.poll(() => getComputedStyle(feedback).display).not.toBe('none')

  buttonWithLabel(container, 'Reset example').click()
  await expect.poll(() => container.querySelector('svg.infoschematic-svg.editing')).toBeNull()
  await expect.poll(() => container.querySelector('.specimen-snippet__source--expanded')).toBeNull()
  await expect.poll(() => container.querySelector('button[aria-pressed="true"]')?.textContent).toBe('Rendered')
})

test('a copy notice clears itself, while one a reader must act on stays', async () => {
  /* The runner's clipboard is not the browser's: driving the real button here would exercise whichever path
     the environment happens to allow, so each path is put in deliberately. */
  const clipboard = { writeText: async () => undefined }
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard })

  const { container } = await render(
    <DemoFrame
      config={specimenFor('card')}
      kind="card"
      propertyControls={null}
      reset={() => undefined}
      title="Card properties"
    />
  )
  const notice = container.querySelector<HTMLElement>('.specimen-snippet__notice')
  if (!notice) throw new Error('Missing snippet notice')

  buttonWithLabel(container, 'Copy snippet').click()
  await expect.poll(() => notice.textContent).toBe('YAML copied.')
  await expect.poll(() => notice.textContent, { timeout: 5000 }).toBe('')
  await expect.poll(() => getComputedStyle(notice).display).toBe('none')

  clipboard.writeText = async () => {
    throw new Error('Clipboard unavailable')
  }
  buttonWithLabel(container, 'Copy snippet').click()
  await expect.poll(() => notice.textContent).toContain('Select the snippet to copy it manually')

  /* The instruction is the reader's only way out, so it waits for them rather than for a timer. */
  await new Promise((resolve) => setTimeout(resolve, 3200))
  expect(notice.textContent).toContain('Select the snippet to copy it manually')
})
