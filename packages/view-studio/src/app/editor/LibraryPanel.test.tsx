import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { LibraryPanel } from './LibraryPanel.tsx'
import { createLibraryIdentityAllocator, type LibraryContext } from './library.ts'

const context = (flow: LibraryContext['flow']): LibraryContext => ({
  allocate: createLibraryIdentityAllocator(),
  at: 0,
  box: { x: 40, y: 60 },
  flow,
  scope: 'inside',
})

describe('LibraryPanel', () => {
  it('exposes an accessible picker and hides Flow templates without valid endpoints', () => {
    const html = renderToStaticMarkup(<LibraryPanel context={context(undefined)} onInstantiate={vi.fn()} />)

    expect(html).toContain('aria-label="Library"')
    expect(html).toContain('aria-label="Add Service card"')
    expect(html).toContain('aria-label="Add Platform fabric"')
    expect(html).not.toContain('Add Directed flow')
  })

  it('shows Flow templates when both endpoint ports and an orthogonal route are valid', () => {
    const html = renderToStaticMarkup(
      <LibraryPanel
        context={context({
          family: 'request',
          source: { component: 'source', point: { x: 40, y: 80 }, port: 'E1' },
          target: { component: 'target', point: { x: 280, y: 80 }, port: 'W1' },
        })}
        onInstantiate={vi.fn()}
      />,
    )

    expect(html).toContain('aria-label="Add Directed flow"')
  })
})
