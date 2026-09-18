import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { ViewBoundary } from './ViewBoundary.tsx'

const Throws = ({ fail }: { fail: boolean }) => {
  if (fail) throw new Error('A route may not run diagonally: 650,260 to 610,380')
  return <p>Drawn</p>
}

/*
 * The host's containment, asserted on the rendered page rather than on the handler: what the defect cost before was
 * the whole surrounding page, so the test that matters is that the chrome outside the boundary survives and the
 * offered way back is reachable.
 */
test('a View that cannot build its runtime costs its own surface and offers the way back', async () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  let failing = true
  const recover = vi.fn(() => {
    failing = false
  })

  const { container, rerender } = await render(
    <div>
      <h1>Site chrome</h1>
      <ViewBoundary onRecover={{ label: 'Reset preset', recover }} surface="The Playground">
        <Throws fail={failing} />
      </ViewBoundary>
    </div>
  )

  // The page around the View is still there, which is the whole point of containing the throw.
  expect(container.querySelector('h1')?.textContent).toBe('Site chrome')
  const notice = container.querySelector('[role="alert"]')
  expect(notice?.textContent).toContain('The Playground could not be drawn')
  expect(notice?.textContent).toContain('A route may not run diagonally: 650,260 to 610,380')

  const back = container.querySelector<HTMLButtonElement>('.view-boundary button')
  if (!back) throw new Error('Boundary offered no way back')
  expect(back.textContent).toBe('Reset preset')
  back.click()
  expect(recover).toHaveBeenCalledOnce()

  await rerender(
    <div>
      <h1>Site chrome</h1>
      <ViewBoundary onRecover={{ label: 'Reset preset', recover }} surface="The Playground">
        <Throws fail={failing} />
      </ViewBoundary>
    </div>
  )
  await expect.poll(() => container.querySelector('p')?.textContent).toBe('Drawn')
  expect(container.querySelector('[role="alert"]')).toBeNull()
  errors.mockRestore()
})
