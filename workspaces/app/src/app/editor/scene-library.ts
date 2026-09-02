/*
 * The scenes themselves, as against the scenes a story plays.
 *
 * A scene is the atom: one set of components lit together, carrying no words
 * and no timing. Until now they could only be authored in `src/play/`, so the
 * editor could arrange scenes into a story and could not make one - which is
 * the wrong way round, since the story is the thing that depends on them.
 *
 * Functions from a library to a library, like `scenes.ts` beside it, so the
 * making and naming can be checked without rendering anything.
 */

export type Scene = {
  id: string
  code: string
  label: string
  short?: string
  description: string
  components: readonly string[]
  flows: readonly string[]
}
export type SceneLibrary = readonly Scene[]

/** The prefix every scene's code carries, as a family's does for a flow. */
export const scenePrefix = 'SCN'

/**
 * An identifier from what the scene is called, as a card's is.
 *
 * Every authored scene's id was arrived at this way - "Registry and Discovery"
 * is `registry-and-discovery` - so deriving it keeps a made one
 * indistinguishable from the rest once its change set lands.
 */
export const identifierFrom = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * The next code free in the series.
 *
 * Counted past the highest rather than filling a gap, for the reason
 * ADR-IBC2026-003 gives everywhere else: a gap is the honest record of a
 * removal, and filling one hands back a code something may still name.
 */
export const nextSceneCode = (library: SceneLibrary): string => {
  const serials = library.flatMap((scene) => new RegExp(`^${scenePrefix}-(\\d+)$`).exec(scene.code)?.slice(1) ?? [])
  const highest = serials.reduce((best, serial) => Math.max(best, Number(serial)), 0)
  const width = serials.reduce((widest, serial) => Math.max(widest, serial.length), 2)
  return `${scenePrefix}-${String(highest + 1).padStart(width, '0')}`
}

/**
 * A new scene, lighting nothing.
 *
 * Empty rather than a copy of whatever was selected. A duplicated scene lights
 * the same things under a different name, which looks finished while being
 * wrong, and a reader has to notice before they can fix it.
 */
export const addScene = (library: SceneLibrary, label: string): SceneLibrary => {
  const named = label.trim() || 'New scene'
  return [
    ...library,
    {
      code: nextSceneCode(library),
      components: [],
      description: '',
      flows: [],
      id: identifierFrom(named),
      label: named
    }
  ]
}

export const editScene = (library: SceneLibrary, id: string, change: Partial<Scene>): SceneLibrary =>
  library.map((scene) => (scene.id === id ? { ...scene, ...change } : scene))

/**
 * Take a scene out, unless a story plays it.
 *
 * A story naming a scene that has gone keeps its own lists rather than being
 * emptied, so the beat would quietly light nothing. Refusing here is how the
 * editor states a constraint the model cannot: the caller passes what is
 * played, since the library does not know about stories.
 */
export const removeScene = (library: SceneLibrary, id: string, played: ReadonlySet<string>): SceneLibrary =>
  played.has(id) ? library : library.filter((scene) => scene.id !== id)

/** Add or remove what a scene lights, working out which list the id belongs in. */
export const toggleLit = (library: SceneLibrary, id: string, lit: string, isFlow: boolean): SceneLibrary =>
  library.map((scene) => {
    if (scene.id !== id) return scene
    const key = isFlow ? 'flows' : 'components'
    const current = scene[key] as readonly string[]
    const next = current.includes(lit) ? current.filter((entry) => entry !== lit) : [...current, lit]
    return { ...scene, [key]: next } as Scene
  })

const quoted = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const list = (values: readonly string[]) => `[${values.map(quoted).join(', ')}]`

/**
 * The whole library, ready to paste.
 *
 * A whole list rather than a line per change, for the reason a story's scenes
 * are handed back whole: a scene added or removed is a change to the sequence,
 * and describing that as a set of edits whose order mattered would be a worse
 * way of saying the same thing.
 */
export const libraryAsSource = (library: SceneLibrary): string => {
  const scenes = library.map((scene) => {
    const rows = [
      `    id: ${quoted(scene.id)},`,
      `    code: ${quoted(scene.code)},`,
      `    label: ${quoted(scene.label)},`,
      scene.short ? `    short: ${quoted(scene.short)},` : undefined,
      `    description: ${quoted(scene.description)},`,
      `    components: ${list(scene.components)},`,
      `    flows: ${list(scene.flows)}`
    ].filter(Boolean)
    return `  {\n${rows.join('\n')}\n  }`
  })

  return `spotlights  ->  [\n${scenes.join(',\n')}\n]`
}
