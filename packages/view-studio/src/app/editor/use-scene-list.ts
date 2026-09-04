import { useInfoschematic } from '@infoschematics/view-canvas'
import { useCallback, useMemo, useState } from 'react'
import { usePersistentState } from '../hooks/use-persistent-state.ts'
import {
  clearScenes,
  editScene,
  insertScene,
  moveScene,
  removeScene,
  runTime,
  type Scene,
  type Story,
  scenesAsSource,
  storyCanActivate,
  storyForEditing,
  toggleLit
} from './scenes.ts'

/**
 * A place to keep an edited story, and no more.
 *
 * Every operation is in `stories.ts` as a function from a story to a
 * story, so this holds a draft and forwards. The split is what lets the
 * reordering, the change set and what a scene lights be tested without rendering
 * anything.
 *
 * Drafts persist, like every other draft in this editor: losing an afternoon's
 * reordering to a reload would be real work lost. Which scene is selected does
 * not, because it is a place in a list rather than an edit.
 */
export function useSceneList(_running?: { id: string; step: number } | null) {
  const { config } = useInfoschematic()
  const authoredStories = useMemo(
    () => config.stories.map((story) => storyForEditing(story, config.standaloneScenes)),
    [config.standaloneScenes, config.stories]
  )
  const [drafts, setDrafts] = usePersistentState<Record<string, Story>>(config.id && `${config.id}.stories`, {})
  const [chosen, setChosen] = useState<string>(authoredStories[0]?.id ?? '')
  const [scene, setScene] = useState(0)

  // The authored story until it has been edited, and the draft after.
  const stories = useMemo(
    () => authoredStories.map((authored) => (drafts[authored.id]?.authored ? drafts[authored.id] : authored)),
    [authoredStories, drafts]
  )
  const story = stories.find((entry) => entry.id === chosen) ?? stories[0]
  const standaloneSceneIds = useMemo(
    () => new Set(config.standaloneScenes.map((entry) => entry.id)),
    [config.standaloneScenes]
  )

  const apply = useCallback(
    (change: (current: Story) => Story) => {
      if (!story) return
      setDrafts((current) => {
        const stored = current[story.id]
        return { ...current, [story.id]: change(stored?.authored ? stored : story) }
      })
    },
    [setDrafts, story]
  )

  /*
   * The panel follows a running story, and an edit does not reach it.
   *
   * Editing what is playing is the more useful behaviour and the more
   * surprising: a caption changing under a presenter mid-sentence is worse than
   * one that waits. So the run drives which scene the panel shows - a presenter
   * stepping through and an author watching should be looking at the same
   * thing - and what the author types goes to the draft, which the run will
   * pick up when it is next started from what has been applied.
   */
  const at = Math.min(scene, Math.max(0, (story?.steps.length ?? 1) - 1))

  return {
    /** Which scene is being worked on, clamped so a removal cannot strand it past the end. */
    at,
    scenes: story?.steps ?? [],
    chosen: story?.id ?? '',
    /** Empty or unresolved Stories remain editable but cannot start in Present. */
    canActivate: story ? storyCanActivate(story, standaloneSceneIds) : false,
    clear: () => {
      apply(clearScenes)
      setScene(0)
    },
    choose: (id: string) => {
      setChosen(id)
      setScene(0)
    },
    edit: (change: Partial<Scene>) => apply((current) => editScene(current, at, change)),
    /** Whether this story differs from what is authored, which is what the change set describes. */
    edited: Boolean(story && drafts[story.id]?.authored),
    insert: () => {
      apply((current) => insertScene(current, at))
      setScene(at + 1)
    },
    move: (delta: number) => {
      apply((current) => moveScene(current, at, delta))
      const to = at + delta
      if (story && to >= 0 && to < story.steps.length) setScene(to)
    },
    remove: () => {
      apply((current) => removeScene(current, at))
      setScene(Math.max(0, at - 1))
    },
    /** Direct selection never follows the Scene currently showing in Present. */
    following: false,
    select: setScene,
    /** The whole `steps` array, which is how a sequence is handed back. */
    source: story ? scenesAsSource(story) : '',
    /** Drop the edits to this story, leaving the others alone. */
    revert: () => {
      if (!story) return
      setDrafts((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== story.id)))
    },
    runTime: story ? runTime(story) : 0,
    toggle: (id: string, isFlow: boolean) => apply((current) => toggleLit(current, at, id, isFlow)),
    /*
     * What the selected scene lights, by id, for the Infoschematic to mark.
     *
     * One set rather than the two lists, because the Infoschematic asks "is this
     * lit" of a card and of a flow with the same question. The two lists exist
     * so the id types stay two unions, which is a modelling concern rather than
     * a drawing one.
     */
    lit: new Set<string>([...(story?.steps[at]?.components ?? []), ...(story?.steps[at]?.flows ?? [])]),
    story,
    stories
  }
}

export type SceneList = ReturnType<typeof useSceneList>
