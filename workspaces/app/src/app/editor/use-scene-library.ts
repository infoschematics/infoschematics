import { useMemo, useState } from 'react'
import { usePersistentState } from '../hooks/use-persistent-state.ts'
import { useInfoschematic } from '../infoschematic-context.tsx'
import { addScene, editScene, libraryAsSource, removeScene, type Scene, toggleLit } from './scene-library.ts'

/**
 * A place to keep an edited scene library, and no more.
 *
 * Every operation is in `scene-library.ts` as a function from a library to a
 * library, so this holds a draft and forwards - the same split the story editor
 * has, and for the same reason: the making, the naming and the change set are
 * checkable without rendering anything.
 */
export function useSceneLibrary() {
  const { config, standaloneScenes, stories } = useInfoschematic()
  const [draft, setDraft] = usePersistentState<readonly Scene[] | null>(config.id && `${config.id}.scenes`, null)
  const [chosen, setChosen] = useState<string>(standaloneScenes[0]?.id ?? '')

  const library = draft ?? standaloneScenes
  const scene = library.find((entry) => entry.id === chosen) ?? library[0]

  /*
   * Which scenes a story plays, so one cannot be removed out from under it.
   *
   * Read from what is authored rather than from any edited story, because that
   * is what the change set will be pasted alongside: a scene removed here and a
   * story still naming it is a Story Scene that lights nothing, silently.
   */
  const played = useMemo(
    () => new Set(stories.flatMap((story) => story.steps.flatMap((step) => (step.scene ? [step.scene] : [])))),
    [stories],
  )

  return {
    add: (label: string) => {
      const next = addScene(library, label)
      setDraft(next)
      setChosen(next.at(-1)?.id ?? chosen)
    },
    choose: setChosen,
    chosen: scene?.id ?? '',
    /** Whether the library differs from what is authored, which the change set describes. */
    edited: draft !== null,
    edit: (change: Partial<Scene>) => scene && setDraft(editScene(library, scene.id, change)),
    library,
    /** What this scene lights, by id, for the Infoschematic to mark. */
    lit: new Set<string>([...(scene?.components ?? []), ...(scene?.flows ?? [])]),
    /** A scene a story plays cannot be removed; the panel says so rather than failing quietly. */
    played,
    remove: () => {
      if (!scene) return
      const next = removeScene(library, scene.id, played)
      if (next === library) return
      setDraft(next)
      setChosen(next[0]?.id ?? '')
    },
    revert: () => setDraft(null),
    scene,
    source: libraryAsSource(library),
    toggle: (id: string, isFlow: boolean) => scene && setDraft(toggleLit(library, scene.id, id, isFlow)),
  }
}

export type SceneLibraryEditor = ReturnType<typeof useSceneLibrary>
