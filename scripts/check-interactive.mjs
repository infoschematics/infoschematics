#!/usr/bin/env bun
// Two layers of the diagram are deliberately inert - the connections and the
// annotations - so codes and lines never eat a click meant for something else.
// Every control drawn inside them therefore has to ask for interaction back,
// and one that forgets looks completely normal and does nothing at all. That
// has happened three times, so it is checked rather than remembered.

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const markup = await readFile(join(root, 'workspaces/app/src/app/InfoschematicDiagram.tsx'), 'utf8')
const styles = await readFile(join(root, 'workspaces/app/src/styles.css'), 'utf8')

// One JSX opening tag at a time, rather than a window of characters: a window
// either misses a handler set far from its className or pairs one element's
// class with another's handler, and both were tried.
const openingTags = () => {
  const tags = []
  for (let at = markup.indexOf('<'); at !== -1; at = markup.indexOf('<', at + 1)) {
    if (!/[a-zA-Z]/.test(markup[at + 1] ?? '')) continue
    let depth = 0
    for (let i = at; i < markup.length; i += 1) {
      const char = markup[i]
      if (char === '{') depth += 1
      else if (char === '}') depth -= 1
      else if (char === '>' && depth === 0) {
        tags.push(markup.slice(at, i))
        break
      }
    }
  }
  return tags
}

const named = new Set()
for (const tag of openingTags()) {
  if (!/onPointer(?:Down|Move)=/.test(tag)) continue
  const cls = tag.match(/className=(?:"|\{`)([a-z][a-z0-9-]*)/)
  if (cls) named.add(cls[1])
}

const inert = new Set()
for (const [, selector] of styles.matchAll(/\.([a-z][a-z0-9-]*)\s*\{[^}]*pointer-events:\s*none/g)) inert.add(selector)

const failures = []
for (const cls of [...named].sort()) {
  const rules = [...styles.matchAll(new RegExp(`\\.${cls}\\b[^{]*\\{([^}]*)\\}`, 'g'))]
  if (rules.length === 0) {
    failures.push(`${cls} carries a pointer handler and has no rule at all`)
    continue
  }
  const asks = rules.some(([, body]) => /pointer-events:\s*(auto|stroke|all|visible)/.test(body))
  if (!asks && !inert.has(cls)) failures.push(`${cls} carries a pointer handler but never asks for pointer-events`)
}

if (failures.length > 0) {
  console.error(`Controls that cannot be clicked:\n  ${failures.join('\n  ')}`)
  process.exit(1)
}
console.log(`Every one of the ${named.size} interactive classes asks for pointer events.`)
