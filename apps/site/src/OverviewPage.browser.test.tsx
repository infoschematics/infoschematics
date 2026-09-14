import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { OverviewPage } from './OverviewPage.tsx'
import { docsIndexPath, documentationRoutes } from './routes.ts'

test('labelled Infoschematic and guide journey share the article width', async () => {
  const route = documentationRoutes.find((candidate) => candidate.path === docsIndexPath)

  if (!route) throw new Error('Overview route is not published')

  const { container } = await render(<OverviewPage route={route} />)
  const anatomy = container.querySelector<HTMLElement>('.overview-anatomy')
  const journey = container.querySelector<HTMLElement>('.guide-journey')

  if (!anatomy || !journey) throw new Error('Overview anatomy or guide journey is missing')

  expect(getComputedStyle(anatomy).maxWidth).toBe('960px')
  expect(anatomy.getBoundingClientRect().width).toBeCloseTo(journey.getBoundingClientRect().width)
})
