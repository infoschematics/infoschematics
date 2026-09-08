import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

/*
 * `.editor-tab` is a two-row grid: what acts on the editor, then the split it
 * acts on. Direct mode adds a target chooser, and as a third child it took an
 * implicit auto row — the hint painted over the select and the Storyboard form
 * was chopped by the changes pane instead of scrolling. The regression is
 * structural, so it is checked where it lives rather than through a screenshot.
 */
describe('the editor tab grid', () => {
  it('gives the split pane a bounded track in every mode', async () => {
    const source = await readFile(new URL('./DetailsPanel.tsx', import.meta.url), 'utf8')
    const styles = await readFile(new URL('../../styles.css', import.meta.url), 'utf8')
    const tab = source.slice(source.indexOf('<div className="editor-tab">'), source.indexOf('<SplitPane>'))

    expect(styles).toContain('grid-template-rows: auto minmax(0, 1fr);')
    expect(styles).toContain('.editor-tab-header {')
    // The chooser and the tools share the header, so the tab keeps two children.
    expect(tab).toContain('<div className="editor-tab-header">')
    expect(tab.match(/<div className="editor-tab-header">/g)).toHaveLength(1)
    expect(tab.trimEnd().endsWith('</div>')).toBe(true)
  })
})
