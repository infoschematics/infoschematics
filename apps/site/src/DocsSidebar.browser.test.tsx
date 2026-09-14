import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { DocsSidebar } from './DocsSidebar.tsx'
import { docsIndexPath } from './routes.ts'

test('highlights the outline heading that has reached the top of the page', async () => {
  let firstTop = 20
  let secondTop = 420
  const { container } = await render(
    <>
      <DocsSidebar
        currentPageOutline={[
          { depth: 2, label: 'First section', slug: 'first-section' },
          { depth: 2, label: 'Second section', slug: 'second-section' }
        ]}
        currentPath={docsIndexPath}
      />
      <h2 id="first-section">First section</h2>
      <h2 id="second-section">Second section</h2>
    </>
  )
  const firstHeading = container.querySelector<HTMLElement>('#first-section')
  const secondHeading = container.querySelector<HTMLElement>('#second-section')
  const firstLink = container.querySelector<HTMLAnchorElement>('.docs-sidebar a[href="#first-section"]')
  const secondLink = container.querySelector<HTMLAnchorElement>('.docs-sidebar a[href="#second-section"]')

  if (!firstHeading || !secondHeading || !firstLink || !secondLink) throw new Error('Missing outline fixture')

  firstHeading.getBoundingClientRect = () => new DOMRect(0, firstTop, 100, 40)
  secondHeading.getBoundingClientRect = () => new DOMRect(0, secondTop, 100, 40)
  window.dispatchEvent(new Event('scroll'))

  await expect.poll(() => firstLink.getAttribute('aria-current')).toBe('location')
  expect(secondLink.getAttribute('aria-current')).toBeNull()

  firstTop = -400
  secondTop = 20
  window.dispatchEvent(new Event('scroll'))

  await expect.poll(() => secondLink.getAttribute('aria-current')).toBe('location')
  expect(firstLink.getAttribute('aria-current')).toBeNull()
})
