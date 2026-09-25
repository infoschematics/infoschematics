import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { z } from 'zod'
import { formatInfoschematicIssue, infoschematicSchema, parseInfoschematic } from '../packages/domain-core/src/index.ts'
import { examplePackages, examplesRoot } from './examples.ts'

/**
 * Every capability the document contract offers is exercised by a published example.
 *
 * Measured before this existed: no authored document anywhere in the repository carried a Fabric, an Adapter Card, a
 * Wrapper Card, an Overlay, a bidirectional Flow, a Specification group, a `calloutPositions` list or an `icon`, so
 * trying one of those out meant hand-editing a real diagram to find out what it drew. The showcase document exists to
 * be that place, and a document only stays the latest version of things if something fails when it falls behind.
 *
 * The capability list is therefore derived from the contract rather than written here: every property the authored Zod
 * schema declares, at the path it declares it, and every value each of its enums admits. A capability added to the
 * contract fails this test until the showcase shows it. Per the repository's own rule about checks that measure
 * nothing, the derivation asserts its own coverage first: a walk that resolved no properties, or lost the enums, would
 * otherwise satisfy every assertion after it.
 */

const showcaseId = 'showcase'

/** How many values an enum may admit before the document is asked for variety rather than every one of them. */
const exhaustiveEnumLimit = 3
/**
 * Paths the contract still accepts but no longer teaches.
 *
 * A retired spelling is kept so documents written against it keep loading, and the showcase is where an author reads
 * the vocabulary they should be writing today. Demanding both would make the showcase teach a name it is retiring.
 */
const retiredPaths = new Set(['diagram.appearance.surface'])

/** Floors the derivation has to clear before its results mean anything. */
const propertyFloor = 100
const enumFloor = 8

type JsonSchemaNode = Readonly<Record<string, unknown>>

type DiscoveredEnum = Readonly<{
  /** Whether the document can author the path more than once, which is what makes several values reachable at all. */
  repeatable: boolean
  values: readonly string[]
}>

type Discovered = Readonly<{
  enums: ReadonlyMap<string, DiscoveredEnum>
  properties: ReadonlySet<string>
}>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Walk the projected JSON Schema, collecting the path of every declared property and every enum's admitted values.
 *
 * A union branch keeps its parent's path, because the compact and structured forms of a Flow are two ways to author one
 * Flow rather than two places in the document; an array's items keep theirs too, and mark everything below them
 * repeatable.
 */
const discover = (root: JsonSchemaNode): Discovered => {
  const properties = new Set<string>()
  const enums = new Map<string, DiscoveredEnum>()
  const seen = new Set<JsonSchemaNode>()

  const visit = (node: unknown, path: string, repeatable: boolean): void => {
    if (!isRecord(node) || seen.has(node)) return
    seen.add(node)
    const values = node.enum
    if (Array.isArray(values) && values.every((value) => typeof value === 'string')) {
      const held = enums.get(path)
      enums.set(path, {
        repeatable: repeatable || (held?.repeatable ?? false),
        values: [...new Set([...(held?.values ?? []), ...values])]
      })
    }
    if (isRecord(node.properties))
      for (const [key, child] of Object.entries(node.properties)) {
        const childPath = path.length === 0 ? key : `${path}.${key}`
        properties.add(childPath)
        visit(child, childPath, repeatable)
      }
    visit(node.items, path, true)
    for (const key of ['anyOf', 'oneOf', 'allOf'])
      if (Array.isArray(node[key])) for (const branch of node[key]) visit(branch, path, repeatable)
  }

  visit(root, '', false)
  return { enums, properties }
}

type PooledChoice = Readonly<{ paths: ReadonlySet<string>; repeatable: boolean; values: readonly string[] }>

/**
 * Pool the paths that admit the same choice, keyed by the values themselves.
 *
 * The contract offers one treatment under more than one spelling — a Flow's line as `line` or as `appearance.line`, a
 * Collection's colour wrapped or unwrapped — and asking each spelling for every value buys nothing but duplicated
 * authoring. Every spelling still has to appear, because each is a property the walk above found; it is the values that
 * are counted across them.
 */
const pool = (enums: ReadonlyMap<string, DiscoveredEnum>): ReadonlyMap<string, PooledChoice> => {
  const pooled = new Map<string, { paths: Set<string>; repeatable: boolean; values: string[] }>()
  for (const [path, { repeatable, values }] of enums) {
    const key = [...values].sort().join(' | ')
    const held = pooled.get(key)
    if (held) {
      held.paths.add(path)
      held.repeatable = held.repeatable || repeatable
      continue
    }
    pooled.set(key, { paths: new Set([path]), repeatable, values: [...values] })
  }
  return pooled
}

type Exercised = Readonly<{ paths: ReadonlySet<string>; values: ReadonlyMap<string, ReadonlySet<string>> }>

/**
 * Walk an authored document, collecting the paths it fills and the scalar values it fills them with.
 *
 * An array contributes its parent's path, matching the schema walk, so one Region authoring a dotted frame and another
 * a dashed one together exercise both values of one path. The canonical parser materialises absent optional fields as
 * explicit `undefined`, which is not authoring them.
 */
const exercise = (document: unknown): Exercised => {
  const paths = new Set<string>()
  const values = new Map<string, Set<string>>()

  const visit = (node: unknown, path: string): void => {
    if (node === undefined || node === null) return
    if (Array.isArray(node)) {
      for (const item of node) visit(item, path)
      return
    }
    if (isRecord(node)) {
      for (const [key, child] of Object.entries(node)) {
        if (child === undefined) continue
        const childPath = path.length === 0 ? key : `${path}.${key}`
        paths.add(childPath)
        visit(child, childPath)
      }
      return
    }
    if (typeof node !== 'string') return
    const held = values.get(path)
    if (held) held.add(node)
    else values.set(path, new Set([node]))
  }

  visit(document, '')
  return { paths, values }
}

const merge = (...parts: readonly Exercised[]): Exercised => {
  const paths = new Set<string>()
  const values = new Map<string, Set<string>>()
  for (const part of parts) {
    for (const path of part.paths) paths.add(path)
    for (const [path, held] of part.values) {
      const existing = values.get(path)
      if (existing) for (const value of held) existing.add(value)
      else values.set(path, new Set(held))
    }
  }
  return { paths, values }
}

const showcase = async (): Promise<Exercised> => {
  const packages = await examplePackages()
  const found = packages.flatMap((entry) =>
    entry.documents.filter((document) => document.id === showcaseId).map((document) => ({ document, entry }))
  )
  expect(found, `no example package declares the ${showcaseId} document`).toHaveLength(1)
  const [first] = found
  if (first === undefined) throw new Error('unreachable')
  const { document, entry } = first
  const pathname = join(examplesRoot, entry.directory, document.source)
  const source = await readFile(pathname, 'utf8')
  const parsed = parseInfoschematic(source, { pathname })
  expect(parsed.ok ? [] : parsed.issues.map(formatInfoschematicIssue)).toEqual([])
  if (!parsed.ok) throw new Error('unreachable')
  /*
   * Both forms of the same document. The authored YAML carries the compact spellings — `link`, a scalar port count, a
   * string box — and the canonical model carries what they mean, so a capability authored either way is exercised.
   */
  return merge(exercise(parseYaml(source)), exercise(parsed.model))
}

describe('example capability coverage', () => {
  it('derives the contract surface it is about to measure', () => {
    const { enums, properties } = discover(z.toJSONSchema(infoschematicSchema, { io: 'input' }))
    expect(properties.size).toBeGreaterThanOrEqual(propertyFloor)
    expect(enums.size).toBeGreaterThanOrEqual(enumFloor)
    // The paths a reader would check by hand, so a walk that resolved a different shape fails here rather than later.
    expect([...properties]).toContain('diagram.cards.adapts')
    expect([...properties]).toContain('diagram.fabrics.properties')
    expect([...properties]).toContain('sequences.scenes.callout.takeaways')
    expect(enums.get('diagram.regions.appearance.frame.style')).toEqual({
      repeatable: true,
      values: ['solid', 'dashed', 'dotted']
    })
    expect(enums.get('diagram.appearance.style')?.repeatable).toBe(false)
  })

  it('shows every property the contract declares', async () => {
    const { properties } = discover(z.toJSONSchema(infoschematicSchema, { io: 'input' }))
    const exercised = await showcase()
    const unshown = [...properties].filter((path) => !retiredPaths.has(path) && !exercised.paths.has(path)).sort()
    expect(unshown).toEqual([])
  })

  it('shows every value a repeatable choice admits, and variety where it admits many', async () => {
    const { enums } = discover(z.toJSONSchema(infoschematicSchema, { io: 'input' }))
    const exercised = await showcase()
    const shortfall: string[] = []
    for (const [choice, { paths, repeatable, values }] of pool(enums)) {
      const asked = [...paths].filter((path) => !retiredPaths.has(path))
      if (asked.length === 0) continue
      const shown = new Set(asked.flatMap((path) => [...(exercised.values.get(path) ?? [])]))
      const where = [...asked].sort().join(', ')
      if (!repeatable) {
        if (shown.size === 0) shortfall.push(`${where}: authors none of ${choice}`)
        continue
      }
      if (values.length <= exhaustiveEnumLimit) {
        const missing = values.filter((value) => !shown.has(value))
        if (missing.length > 0) shortfall.push(`${where}: missing ${missing.join(', ')}`)
        continue
      }
      if (shown.size < 2) shortfall.push(`${where}: authors ${shown.size} of ${values.length} values, needs two`)
    }
    expect(shortfall.sort()).toEqual([])
  })
})
