import { useCallback, useMemo, useState } from 'react'
import { usePersistentState } from '../hooks/use-persistent-state.ts'
import { type RuntimeStory as Demonstration, useInfoschematic } from '../infoschematic-context.tsx'
import {
  editScene,
  insertScene,
  moveScene,
  removeScene,
  runTime,
  type Scene,
  scenesAsSource,
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
export function useSceneList(running?: { id: string; step: number } | null) {
  const { config, demonstrations } = useInfoschematic()
  const [drafts, setDrafts] = usePersistentState<Record<string, Demonstration>>(config.id && `${config.id}.stories`, {})
  const [chosen, setChosen] = useState<string>(demonstrations[0]?.id ?? '')
  const [scene, setScene] = useState(0)

  // The authored story until it has been edited, and the draft after.
  const stories = useMemo(() => demonstrations.map((authored) => drafts[authored.id] ?? authored), [drafts])
  const story = stories.find((entry) => entry.id === chosen) ?? stories[0]

  const apply = useCallback(
    (change: (current: Demonstration) => Demonstration) => {
      if (!story) return
      setDrafts((current) => ({ ...current, [story.id]: change(current[story.id] ?? story) }))
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
  const followed = running && running.id === story?.id ? running.step : scene
  const at = Math.min(followed, Math.max(0, (story?.steps.length ?? 1) - 1))

  return {
    /** Which scene is being worked on, clamped so a removal cannot strand it past the end. */
    at,
    scenes: story?.steps ?? [],
    chosen: story?.id ?? '',
    choose: (id: string) => {
      setChosen(id)
      setScene(0)
    },
    edit: (change: Partial<Scene>) => apply((current) => editScene(current, at, change)),
    /** Whether this story differs from what is authored, which is what the change set describes. */
    edited: Boolean(story && drafts[story.id]),
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
    /** Whether the shown scene is the one playing, so the panel can say so. */
    following: Boolean(running && running.id === story?.id),
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
     * What the selected scene lights, by id, for the stage to mark.
     *
     * One set rather than the two lists, because the stage asks "is this
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
