/*
 * Editing a story, as a value rather than as a hook.
 *
 * Every operation here takes a story and returns one. Nothing holds
 * state, nothing reaches for React, and nothing knows a panel exists — which is
 * what lets the scene list, the reordering and the change set be checked at the
 * boundary rather than through a rendered tree. The hook above this is then a
 * place to keep a draft, and no more.
 *
 * A draft is a whole story rather than a difference from one. The other
 * editors hold differences because they are editing something whose identity is
 * fixed; a scene has no identity apart from its position, so a draft that said
 * "the third scene's caption" would mean something else the moment a scene was
 * inserted above it.
 */

export type Scene = {
  anchor?: string
  callout?: { x: number; y: number }
  caption: string
  components: readonly string[]
  flows: readonly string[]
  hold: number
  overlay?: string
  takeaways?: readonly string[]
  title?: string
}
export type Story = {
  id: string
  code: string
  label: string
  short?: string
  question: string
  steps: readonly Scene[]
}

export const holdFor = (caption: string): number => {
  const words = caption.trim() === '' ? 0 : caption.trim().split(/\s+/).length
  const tenths = (words / 4) * 10
  const whole = Math.floor(tenths)
  const rest = tenths - whole
  const rounded = rest > 0.5 ? whole + 1 : rest < 0.5 ? whole : whole % 2 === 0 ? whole : whole + 1
  return Math.min(11900, Math.max(3100, rounded * 100))
}

/** Moved by one, or left alone at either end rather than wrapping. */
export const moveScene = (story: Story, at: number, delta: number): Story => {
  const to = at + delta
  if (at < 0 || at >= story.steps.length || to < 0 || to >= story.steps.length) return story

  const steps = [...story.steps]
  const [moved] = steps.splice(at, 1)
  steps.splice(to, 0, moved)
  return { ...story, steps }
}

export const removeScene = (story: Story, at: number): Story =>
  // The last scene stays. A story with no scenes is not a shorter
  // story, it is a broken descriptor that fails validation on load.
  story.steps.length <= 1 || at < 0 || at >= story.steps.length
    ? story
    : { ...story, steps: story.steps.filter((_, index) => index !== at) }

/**
 * A new scene, after the one given.
 *
 * Empty rather than a copy of its neighbour. A duplicated scene lights the same
 * things and says the same words, so it looks finished while being wrong, and
 * the reader has to notice before they can fix it.
 */
export const insertScene = (story: Story, after: number): Story => {
  const blank: Scene = { caption: '', components: [], flows: [], hold: holdFor(''), title: 'New scene' }
  const steps = [...story.steps]
  steps.splice(Math.min(Math.max(after + 1, 0), steps.length), 0, blank)
  return { ...story, steps }
}

export const editScene = (story: Story, at: number, change: Partial<Scene>): Story => ({
  ...story,
  steps: story.steps.map((step, index) => (index === at ? { ...step, ...change } : step))
})

/**
 * Add or remove what a scene lights, by code.
 *
 * Takes an id and works out which of the two lists it belongs in, because a
 * reader selecting something on the stage has selected a component or a flow
 * and should not have to say which. The descriptors keep two lists because
 * their id types are two unions, and the typecheck on those is what stops a
 * scene naming something that does not exist.
 */
export const toggleLit = (story: Story, at: number, id: string, isFlow: boolean): Story => {
  const step = story.steps[at]
  if (!step) return story

  const key = isFlow ? 'flows' : 'components'
  const current = step[key] as readonly string[]
  const next = current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]

  return editScene(story, at, { [key]: next } as Partial<Scene>)
}

export const runTime = (story: Story): number => story.steps.reduce((total, step) => total + step.hold, 0)

const quoted = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const list = (values: readonly string[]) => `[${values.map(quoted).join(', ')}]`

/**
 * The whole `steps` array, ready to paste.
 *
 * A whole array rather than a line per change, unlike every other change set in
 * this editor. Those name a property of a thing that has an identity; a scene is
 * identified by where it sits, so reordering one would have to be described as
 * a set of moves whose order of application mattered. Handing back the sequence
 * says the same thing with nothing to get wrong.
 */
export const scenesAsSource = (story: Story): string => {
  const scenes = story.steps.map((step) => {
    const rows = [
      `      caption: ${quoted(step.caption)},`,
      `      hold: ${step.hold},`,
      step.title ? `      title: ${quoted(step.title)},` : undefined,
      step.takeaways?.length ? `      takeaways: ${list(step.takeaways)},` : undefined,
      step.anchor ? `      anchor: ${quoted(step.anchor)},` : undefined,
      step.callout ? `      callout: { x: ${step.callout.x}, y: ${step.callout.y} },` : undefined,
      step.overlay ? `      overlay: ${quoted(step.overlay)},` : undefined,
      `      components: ${list(step.components)},`,
      `      flows: ${list(step.flows)}`
    ].filter(Boolean)
    return `    {\n${rows.join('\n')}\n    }`
  })

  return `${story.code}  ->  steps: [\n${scenes.join(',\n')}\n  ],`
}
