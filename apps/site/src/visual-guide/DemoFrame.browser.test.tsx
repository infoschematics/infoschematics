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
   as far from the drawing it names as from the next one down. Proximity has to answer the reader's question. */
const verticalAnchor = (image: HTMLImageElement) => {
  /* The resolved value is a percentage pair, not the keyword the stylesheet was written with. */
  const keyword = { bottom: 1, center: 0.5, top: 0 } as Record<string, number>
  const stated = getComputedStyle(image).objectPosition.split(' ')[1] ?? 'center'
  return stated in keyword ? keyword[stated] : Number.parseFloat(stated) / 100
}

const paintedRect = (image: HTMLImageElement) => {
  const box = image.getBoundingClientRect()
  const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight)
  const height = image.naturalHeight * scale
  const top = box.top + (box.height - height) * verticalAnchor(image)
  return { bottom: top + height, top }
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

  const images = figures.map((figure) => {
    const image = figure.querySelector('img')
    if (!image) throw new Error('Missing rendered preview')
    return image
  })
  for (const image of images) await expect.poll(() => image.naturalHeight).toBeGreaterThan(0)

  const caption = figures[0].querySelector('figcaption')
  if (!caption) throw new Error('Missing caption')

  // The grid is narrow enough to have reflowed to one column, so the neighbour is the drawing below.
  expect(figures[1].getBoundingClientRect().top).toBeGreaterThan(figures[0].getBoundingClientRect().top)

  const box = caption.getBoundingClientRect()
  const toOwn = box.top - paintedRect(images[0]).bottom
  const toNeighbour = paintedRect(images[1]).top - box.bottom

  /* A centred fit leaves these within about a quarter of each other, which is the reported symptom: the reader
     cannot tell from spacing which drawing the caption belongs to. */
  expect(toOwn).toBeLessThan(toNeighbour / 3)

  /* A box taller than the drawing it holds puts that difference between the drawing and its caption, so the
     variant's height follows its own aspect rather than a figure the stylesheet picked. */
  const drawing = images[0].getBoundingClientRect()
  expect(drawing.height).toBeCloseTo((drawing.width * images[0].naturalHeight) / images[0].naturalWidth, 0)
})
