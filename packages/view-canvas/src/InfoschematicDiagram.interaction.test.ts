import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

// Two layers of the diagram are deliberately inert - the connections and the
// annotations - so codes and lines never eat a click meant for something else.
// Every control drawn inside them therefore has to ask for interaction back,
// and one that forgets looks completely normal and does nothing at all. That
// has happened three times, so it is checked rather than remembered.
describe('InfoschematicDiagram interaction styles', () => {
  it('lets every pointer-controlled class receive pointer events', async () => {
    const markup = await readFile(new URL('./InfoschematicDiagram.tsx', import.meta.url), 'utf8')
    const styles = await readFile(new URL('./styles.css', import.meta.url), 'utf8')

    // Read one JSX opening tag at a time. A window of characters can either
    // miss a handler set far from its className or pair one element's class
    // with another element's handler.
    const openingTags = () => {
      const tags: string[] = []
      for (let at = markup.indexOf('<'); at !== -1; at = markup.indexOf('<', at + 1)) {
        if (!/[a-zA-Z]/.test(markup[at + 1] ?? '')) continue
        let depth = 0
        for (let index = at; index < markup.length; index += 1) {
          const character = markup[index]
          if (character === '{') depth += 1
          else if (character === '}') depth -= 1
          else if (character === '>' && depth === 0) {
            tags.push(markup.slice(at, index))
            break
          }
        }
      }
      return tags
    }

    const interactiveClasses = new Set<string>()
    for (const tag of openingTags()) {
      if (!/onPointer(?:Down|Move)=/.test(tag)) continue
      const className = tag.match(/className=(?:"|\{`)([a-z][a-z0-9-]*)/)
      if (className) interactiveClasses.add(className[1])
    }

    const inertClasses = new Set<string>()
    for (const [, selector] of styles.matchAll(/\.([a-z][a-z0-9-]*)\s*\{[^}]*pointer-events:\s*none/g)) {
      inertClasses.add(selector)
    }

    const failures: string[] = []
    for (const className of [...interactiveClasses].sort()) {
      const rules = [...styles.matchAll(new RegExp(`\\.${className}\\b[^{]*\\{([^}]*)\\}`, 'g'))]
      if (rules.length === 0) {
        failures.push(`${className} carries a pointer handler and has no rule at all`)
        continue
      }
      const asksForPointerEvents = rules.some(([, body]) =>
        /pointer-events:\s*(auto|stroke|all|visible)/.test(body),
      )
      if (!asksForPointerEvents && !inertClasses.has(className)) {
        failures.push(`${className} carries a pointer handler but never asks for pointer-events`)
      }
    }

    expect(failures, `Controls that cannot be clicked:\n  ${failures.join('\n  ')}`).toEqual([])
    expect(interactiveClasses.size).toBeGreaterThan(0)
  })
})
