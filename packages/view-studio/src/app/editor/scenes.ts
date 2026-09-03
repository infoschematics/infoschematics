import type { StandaloneSceneConfig } from '@infoschematics/domain-model/scene'
import type { StoryConfig, StorySceneConfig } from '@infoschematics/domain-model/story'

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
  /** The authored value this editable projection preserves and writes back. */
  authored: StorySceneConfig
  anchor?: string
  callout?: { x: number; y: number }
  calloutTitle?: string
  caption: string
  components: readonly string[]
  flows: readonly string[]
  hold: number
  overlay?: string
  renderer?: string
  scene?: string
  takeaways?: readonly string[]
  title?: string
}
export type Story = {
  /** The authored value this editable projection preserves and writes back. */
  authored: StoryConfig
  id: string
  code: string
  label: string
  short?: string
  question: string
  steps: readonly Scene[]
}

/**
 * Project an authored Story into the fields the editor presents without
 * throwing away fields the editor does not yet expose.
 */
export const storyForEditing = (
  story: StoryConfig,
  standaloneScenes: readonly StandaloneSceneConfig[],
): Story => {
  const standaloneById = new Map(standaloneScenes.map((scene) => [scene.id, scene]))
  return {
    authored: story,
    code: story.code,
    id: story.id,
    label: story.title,
    question: story.question ?? '',
    short: story.short,
    steps: story.scenes.map((scene) => {
      const source = scene.sourceScene ? standaloneById.get(scene.sourceScene) : undefined
      return {
        anchor: scene.anchor,
        authored: scene,
        callout: scene.callout?.at,
        calloutTitle: scene.callout?.title,
        caption: scene.callout?.body ?? '',
        components: scene.focus?.artefacts ?? source?.focus.artefacts ?? [],
        flows: scene.focus?.flows ?? source?.focus.flows ?? [],
        hold: scene.duration ?? 0,
        renderer: scene.callout?.renderer,
        scene: scene.sourceScene,
        takeaways: scene.callout?.takeaways,
        title: scene.title,
      }
    }),
  }
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
  at < 0 || at >= story.steps.length
    ? story
    : { ...story, steps: story.steps.filter((_, index) => index !== at) }

/** Empty is a valid Direct draft, even though it cannot be activated in Present. */
export const clearScenes = (story: Story): Story =>
  story.steps.length === 0 ? story : { ...story, steps: [] }

/**
 * A new scene, after the one given.
 *
 * Empty rather than a copy of its neighbour. A duplicated scene lights the same
 * things and says the same words, so it looks finished while being wrong, and
 * the reader has to notice before they can fix it.
 */
export const insertScene = (story: Story, after: number): Story => {
  const authored: StorySceneConfig = {
    callout: { body: '' },
    duration: holdFor(''),
    title: 'New scene',
  }
  const blank: Scene = {
    authored,
    caption: '',
    components: [],
    flows: [],
    hold: authored.duration ?? 0,
    title: authored.title,
  }
  const steps = [...story.steps]
  steps.splice(Math.min(Math.max(after + 1, 0), steps.length), 0, blank)
  return { ...story, steps }
}

export const editScene = (story: Story, at: number, change: Partial<Scene>): Story => ({
  ...story,
  steps: story.steps.map((step, index) => {
    if (index !== at) return step

    const authored = { ...step.authored }
    if ('title' in change) authored.title = change.title
    if ('anchor' in change) authored.anchor = change.anchor
    if ('hold' in change) authored.duration = change.hold
    if ('caption' in change || 'calloutTitle' in change || 'renderer' in change || 'takeaways' in change) {
      authored.callout = {
        ...authored.callout,
        body: change.caption ?? step.caption,
        renderer: 'renderer' in change ? change.renderer : step.renderer,
        takeaways: change.takeaways ?? step.takeaways,
        title: 'calloutTitle' in change ? change.calloutTitle : step.calloutTitle,
      }
    }

    return { ...step, ...change, authored }
  }),
})

/**
 * Add or remove what a scene lights, by code.
 *
 * Takes an id and works out which of the two lists it belongs in, because a
 * reader selecting something on the Infoschematic has selected a component or a flow
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

  const changed = editScene(story, at, { [key]: next } as Partial<Scene>)
  return {
    ...changed,
    steps: changed.steps.map((candidate, index) =>
      index === at
        ? {
            ...candidate,
            authored: {
              ...candidate.authored,
              focus: {
                ...candidate.authored.focus,
                artefacts: isFlow ? candidate.components : next,
                flows: isFlow ? next : candidate.flows,
              },
            },
          }
        : candidate,
    ),
  }
}

export const runTime = (story: Story): number => story.steps.reduce((total, step) => total + step.hold, 0)

/**
 * Present can only activate a Story with at least one resolvable Scene.
 * Inline Story Scenes are self-contained; references must still name an
 * authored Standalone Scene.
 */
export const storyCanActivate = (story: Story, standaloneSceneIds: ReadonlySet<string>): boolean =>
  story.steps.some((step) => {
    const source = step.authored.sourceScene
    return source === undefined || (source.trim() !== '' && standaloneSceneIds.has(source))
  })

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
  const authored: StoryConfig = {
    ...story.authored,
    code: story.code,
    id: story.id,
    question: story.authored.question,
    scenes: story.steps.map((step) => step.authored),
    short: story.short,
    title: story.label,
  }
  return `${story.code}  ->  ${JSON.stringify(authored, null, 2)}`
}
