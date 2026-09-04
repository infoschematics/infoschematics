import type { ThematicSceneConfig, ThemeConfig } from '@infoschematics/domain-model/theme'
import { useInfoschematic } from '@infoschematics/view-canvas'
import { useMemo, useState } from 'react'
import { usePersistentState } from '../hooks/use-persistent-state.ts'
import {
  addTheme,
  addThemeScene,
  clearThemeScenes,
  editTheme,
  editThemeScene,
  moveThemeScene,
  removeTheme,
  removeThemeScene,
  type ThemeCollection,
  themeCanActivate,
  themesAsSource,
  toggleThemeLit
} from './theme-composition.ts'

/** Persistent Theme drafts and transient Direct selection. */
export function useThemeComposition() {
  const { config } = useInfoschematic()
  const [draft, setDraft] = usePersistentState<ThemeCollection | null>(config.id && `${config.id}.themes`, null)
  const [chosenTheme, setChosenTheme] = useState(config.themes[0]?.id ?? '')
  const [chosenScene, setChosenScene] = useState(0)
  const themes = draft ?? config.themes
  const theme = themes.find((candidate) => candidate.id === chosenTheme) ?? themes[0]
  const at = Math.min(chosenScene, Math.max(0, (theme?.scenes.length ?? 1) - 1))
  const scene = theme?.scenes[at]

  const validArtefactIds = useMemo(
    () =>
      new Set([
        ...config.infoschematic.cards.map((entry) => entry.id),
        ...config.infoschematic.fabrics.map((entry) => entry.id),
        ...config.infoschematic.points.map((entry) => entry.id)
      ]),
    [config.infoschematic.cards, config.infoschematic.fabrics, config.infoschematic.points]
  )
  const validFlowIds = useMemo(
    () => new Set(config.infoschematic.flows.map((entry) => entry.id)),
    [config.infoschematic.flows]
  )

  const apply = (change: (current: ThemeCollection) => ThemeCollection) => setDraft(change(themes))

  return {
    addScene: (label: string) => {
      if (!theme) return
      const next = addThemeScene(themes, theme.id, label)
      setDraft(next)
      setChosenScene(Math.max(0, (next.find((candidate) => candidate.id === theme.id)?.scenes.length ?? 1) - 1))
    },
    addTheme: (title: string) => {
      const next = addTheme(themes, title)
      setDraft(next)
      setChosenTheme(next.at(-1)?.id ?? chosenTheme)
      setChosenScene(0)
    },
    at,
    /** Empty or stale Theme compositions remain drafts but cannot be shown in Present. */
    canActivate: theme ? themeCanActivate(theme, validArtefactIds, validFlowIds) : false,
    chooseScene: setChosenScene,
    chooseTheme: (id: string) => {
      setChosenTheme(id)
      setChosenScene(0)
    },
    chosenTheme: theme?.id ?? '',
    clear: () => {
      if (!theme) return
      apply((current) => clearThemeScenes(current, theme.id))
      setChosenScene(0)
    },
    editScene: (change: Partial<ThematicSceneConfig>) => {
      if (!theme || !scene) return
      apply((current) => editThemeScene(current, theme.id, scene.id, change))
    },
    editTheme: (change: Partial<ThemeConfig>) => {
      if (!theme) return
      apply((current) => editTheme(current, theme.id, change))
    },
    edited: draft !== null,
    lit: new Set<string>([...(scene?.focus.artefacts ?? []), ...(scene?.focus.flows ?? [])]),
    move: (delta: number) => {
      if (!theme) return
      apply((current) => moveThemeScene(current, theme.id, at, delta))
      const to = at + delta
      if (to >= 0 && to < theme.scenes.length) setChosenScene(to)
    },
    removeScene: () => {
      if (!theme || !scene) return
      apply((current) => removeThemeScene(current, theme.id, at))
      setChosenScene(Math.max(0, at - 1))
    },
    removeTheme: () => {
      if (!theme) return
      const next = removeTheme(themes, theme.id)
      setDraft(next)
      setChosenTheme(next[0]?.id ?? '')
      setChosenScene(0)
    },
    revert: () => {
      setDraft(null)
      setChosenTheme(config.themes[0]?.id ?? '')
      setChosenScene(0)
    },
    scene,
    scenes: theme?.scenes ?? [],
    source: themesAsSource(themes),
    theme,
    themes,
    toggle: (id: string, isFlow: boolean) => {
      if (!theme || !scene) return
      apply((current) => toggleThemeLit(current, theme.id, scene.id, id, isFlow))
    }
  }
}

export type ThemeComposition = ReturnType<typeof useThemeComposition>
