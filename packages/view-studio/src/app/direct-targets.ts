import type { DirectTarget } from '@infoschematics/view-present'
import type { SceneLibraryEditor } from './editor/use-scene-library.ts'
import type { SceneList } from './editor/use-scene-list.ts'
import type { ThemeComposition } from './editor/use-theme-composition.ts'

/**
 * Every Direct target the authored document currently offers, and the label the chooser shows for it.
 *
 * The panel that chooses a target and the reconciliation that clears a target which has left the document have to
 * agree on this list exactly: a reconciliation working from a shorter list clears a target the chooser still offers,
 * and one working from a longer list leaves a target pointing at something no Producer can see. So the list is derived
 * once, here, and both read it — the panel for its options, `App` for what it hands the production reducer.
 */
export type DirectOption = Readonly<{
  label: string
  target: DirectTarget
}>

/** A stable string for a target, so two structurally equal targets compare as one. */
export const directTargetKey = (target: DirectTarget): string => {
  switch (target.kind) {
    case 'standalone-scene':
      return `${target.kind}:${target.sceneId}`
    case 'theme':
      return `${target.kind}:${target.themeId}`
    case 'story':
    case 'storyboard':
      return `${target.kind}:${target.storyId}`
    case 'callout':
      return `${target.kind}:${target.owner}:${target.ownerId}:${target.sceneId}`
  }
}

export const directOptionsFor = (
  scenes: SceneLibraryEditor['library'],
  themes: ThemeComposition['themes'],
  stories: SceneList['stories']
): readonly DirectOption[] => {
  const standaloneScenes = scenes.map((scene) => ({
    label: scene.label,
    target: { kind: 'standalone-scene', sceneId: scene.id } as const
  }))
  const themeTargets = themes.map((theme) => ({
    label: theme.title,
    target: { kind: 'theme', themeId: theme.id } as const
  }))
  const storyTargets = stories.map((story) => ({
    label: story.label,
    target: { kind: 'story', storyId: story.id } as const
  }))
  const themeCallouts = themes.flatMap((theme) =>
    theme.scenes.map((scene) => ({
      label: `${theme.title} — ${scene.label}`,
      target: {
        kind: 'callout',
        owner: 'theme',
        ownerId: theme.id,
        sceneId: scene.id
      } as const
    }))
  )
  const storyCallouts = stories.flatMap((story) =>
    story.steps.map((scene, index) => ({
      label: `${story.label} — ${scene.title || `Scene ${index + 1}`}`,
      target: {
        kind: 'callout',
        owner: 'story',
        ownerId: story.id,
        sceneId: scene.authored.id ?? scene.scene ?? `${story.id}-scene-${index + 1}`
      } as const
    }))
  )
  const storyboards = stories.map((story) => ({
    label: story.label,
    target: { kind: 'storyboard', storyId: story.id } as const
  }))

  return [...standaloneScenes, ...themeTargets, ...storyTargets, ...themeCallouts, ...storyCallouts, ...storyboards]
}
