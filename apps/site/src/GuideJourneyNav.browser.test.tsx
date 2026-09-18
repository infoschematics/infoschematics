import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { GuideJourneyNav } from './GuideJourneyNav.tsx'

/*
 * The accelerator is a real listener on a real page, so the evidence is a key pressed in a browser rather than a
 * handler called directly. Navigation is taken through the injected `navigate` so the assertion can be made without
 * the runner leaving the test page.
 */
const press = (key: string, target: EventTarget = document.body, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, ...init }))
}

test('moves along the journey on the arrow keys, and stands aside for anything being adjusted', async () => {
  const visited: string[] = []
  const { container } = await render(
    <>
      <GuideJourneyNav currentPath="/docs/components/canvas/" navigate={(path) => visited.push(path)} />
      <input aria-label="A property control" type="range" />
    </>
  )

  press('ArrowRight')
  press('ArrowLeft')
  expect(visited).toEqual(['/docs/components/regions/', '/docs/components/'])

  // A chord belongs to the browser's own history, and an arrow inside a control belongs to the control.
  press('ArrowRight', document.body, { metaKey: true })
  const control = container.querySelector('input')
  if (!control) throw new Error('Missing control fixture')
  press('ArrowRight', control)
  expect(visited).toHaveLength(2)
})

test('offers no accelerator where the journey does not reach', async () => {
  const visited: string[] = []
  await render(<GuideJourneyNav currentPath="/docs/approach/architecture/" navigate={(path) => visited.push(path)} />)

  press('ArrowRight')
  expect(visited).toEqual([])
})
