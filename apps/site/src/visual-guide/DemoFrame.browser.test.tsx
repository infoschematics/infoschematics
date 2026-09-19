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

/* Where a contain-fit centres a short drawing in a tall box, the slack splits evenly and a caption ends up almost
   as far from the drawing it names as from the next one down. Proximity has to answer the reader's question.

   An inline drawing keeps its own proportions in its own box, so the painted area is the element's box and there is
   no fit to reconstruct — which is the second half of what inlining bought. */
const drawingIn = (figure: Element) => {
  const svg = figure.querySelector('svg')
  if (!svg) throw new Error('Missing rendered preview')
  return svg
}

test('a caption sits decisively with the drawing it names', async () => {
  const config = specimenFor('fabric')
  const { container } = await render(
    <div style={{ width: '280px' }}>
      <DemoFrame
        config={config}
        kind="fabric"
        propertyControls={null}
        reset={() => undefined}
        title="Fabric variants"
        variants={[
          { config, id: 'first', label: 'Internet cloud' },
          { config, id: 'second', label: 'Message bus' }
        ]}
      />
    </div>
  )

  const figures = [...container.querySelectorAll('figure')]
  expect(figures).toHaveLength(2)

  const drawings = figures.map(drawingIn)
  for (const drawing of drawings) {
    await expect.poll(() => drawing.getBoundingClientRect().height).toBeGreaterThan(0)
  }

  const caption = figures[0].querySelector('figcaption')
  if (!caption) throw new Error('Missing caption')

  // The grid is narrow enough to have reflowed to one column, so the neighbour is the drawing below.
  expect(figures[1].getBoundingClientRect().top).toBeGreaterThan(figures[0].getBoundingClientRect().top)

  const box = caption.getBoundingClientRect()
  const toOwn = box.top - drawings[0].getBoundingClientRect().bottom
  const toNeighbour = drawings[1].getBoundingClientRect().top - box.bottom

  /* A centred fit leaves these within about a quarter of each other, which is the reported symptom: the reader
     cannot tell from spacing which drawing the caption belongs to. */
  expect(toOwn).toBeLessThan(toNeighbour / 3)

  /* A box taller than the drawing it holds puts that difference between the drawing and its caption, so the
     variant's height follows its own aspect rather than a figure the stylesheet picked. */
  const drawn = drawings[0].getBoundingClientRect()
  const authored = drawings[0].viewBox.baseVal
  expect(drawn.height).toBeCloseTo((drawn.width * authored.height) / authored.width, 0)
})

/* The report: a specimen met in Rendered read as the weaker drawing than the same specimen in Design. Both modes
   draw the same geometry into the same box, so if they are the same drawing they resolve to the same scale — which
   is measurable, where "crisper" is not. A drawing handed to an `img` cannot be measured this way at all, because
   there is no element in the page whose transform to the screen can be read. */
const screenScale = (svg: SVGSVGElement) => {
  const matrix = svg.getScreenCTM()
  if (!matrix) throw new Error('Drawing is not laid out')
  return matrix.a
}

test('a specimen is drawn at the same scale in Rendered as in Design', async () => {
  const { container } = await render(
    <div style={{ width: '520px' }}>
      <DemoFrame
        config={specimenFor('card')}
        kind="card"
        propertyControls={null}
        reset={() => undefined}
        title="Card properties"
      />
    </div>
  )

  const rendered = container.querySelector<SVGSVGElement>('.demo-frame__rendered > svg')
  if (!rendered) throw new Error('Missing inline rendered drawing')
  await expect.poll(() => rendered.getBoundingClientRect().width).toBeGreaterThan(0)

  const renderedScale = screenScale(rendered)
  /* Below one, a drawing whose thinnest stroke is a single unit lands under a CSS pixel, which is the resampling
     the reporter saw. Asserting the two modes agree is the claim; asserting the scale is sane keeps a future box
     that collapsed to nothing from satisfying the comparison trivially. */
  expect(renderedScale).toBeGreaterThan(0)

  const design = [...container.querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.textContent === 'Design'
  )
  if (!design) throw new Error('Missing Design button')
  design.click()
  await expect.poll(() => container.querySelector('svg.infoschematic-svg.editing')).not.toBeNull()

  const live = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  if (!live) throw new Error('Missing live drawing')
  await expect.poll(() => live.getBoundingClientRect().width).toBeGreaterThan(0)

  expect(screenScale(live)).toBeCloseTo(renderedScale, 2)
})
