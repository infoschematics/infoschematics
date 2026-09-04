import type { ThematicSceneConfig, ThemeConfig } from '@infoschematics/domain-model/theme'

export type ThemeCollection = readonly ThemeConfig[]

const identifierFrom = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const uniqueIdentifier = (wanted: string, used: ReadonlySet<string>, fallback: string): string => {
  const base = identifierFrom(wanted) || fallback
  if (!used.has(base)) return base
  let serial = 2
  while (used.has(`${base}-${serial}`)) serial += 1
  return `${base}-${serial}`
}

export const nextThemeSceneCode = (themes: ThemeCollection): string => {
  const serials = themes.flatMap((theme) =>
    theme.scenes.flatMap((scene) => /^THM-(\d+)$/.exec(scene.code)?.slice(1) ?? [])
  )
  const highest = serials.reduce((best, serial) => Math.max(best, Number(serial)), 0)
  const width = serials.reduce((widest, serial) => Math.max(widest, serial.length), 2)
  return `THM-${String(highest + 1).padStart(width, '0')}`
}

/** Create an empty Theme which is editable in Direct but not activatable in Present. */
export const addTheme = (themes: ThemeCollection, title: string): ThemeCollection => {
  const named = title.trim() || 'New Theme'
  const used = new Set(themes.map((theme) => theme.id))
  return [...themes, { id: uniqueIdentifier(named, used, 'theme'), scenes: [], title: named }]
}

export const editTheme = (themes: ThemeCollection, id: string, change: Partial<ThemeConfig>): ThemeCollection =>
  themes.map((theme) => (theme.id === id ? { ...theme, ...change, id: theme.id } : theme))

export const removeTheme = (themes: ThemeCollection, id: string): ThemeCollection =>
  themes.some((theme) => theme.id === id) ? themes.filter((theme) => theme.id !== id) : themes

export const addThemeScene = (themes: ThemeCollection, themeId: string, label: string): ThemeCollection => {
  const theme = themes.find((candidate) => candidate.id === themeId)
  if (!theme) return themes

  const named = label.trim() || 'New Scene'
  const used = new Set(themes.flatMap((candidate) => candidate.scenes.map((scene) => scene.id)))
  const scene: ThematicSceneConfig = {
    code: nextThemeSceneCode(themes),
    description: '',
    focus: {},
    id: uniqueIdentifier(named, used, 'theme-scene'),
    label: named
  }
  return themes.map((candidate) =>
    candidate.id === themeId ? { ...candidate, scenes: [...candidate.scenes, scene] } : candidate
  )
}

export const editThemeScene = (
  themes: ThemeCollection,
  themeId: string,
  sceneId: string,
  change: Partial<ThematicSceneConfig>
): ThemeCollection =>
  themes.map((theme) =>
    theme.id === themeId
      ? {
          ...theme,
          scenes: theme.scenes.map((scene) =>
            scene.id === sceneId ? { ...scene, ...change, code: scene.code, id: scene.id } : scene
          )
        }
      : theme
  )

export const moveThemeScene = (
  themes: ThemeCollection,
  themeId: string,
  at: number,
  delta: number
): ThemeCollection => {
  const theme = themes.find((candidate) => candidate.id === themeId)
  const to = at + delta
  if (!theme || at < 0 || at >= theme.scenes.length || to < 0 || to >= theme.scenes.length) return themes

  const scenes = [...theme.scenes]
  const [moved] = scenes.splice(at, 1)
  scenes.splice(to, 0, moved)
  return themes.map((candidate) => (candidate.id === themeId ? { ...candidate, scenes } : candidate))
}

export const removeThemeScene = (themes: ThemeCollection, themeId: string, at: number): ThemeCollection => {
  const theme = themes.find((candidate) => candidate.id === themeId)
  if (!theme || at < 0 || at >= theme.scenes.length) return themes
  return themes.map((candidate) =>
    candidate.id === themeId ? { ...candidate, scenes: candidate.scenes.filter((_, index) => index !== at) } : candidate
  )
}

export const clearThemeScenes = (themes: ThemeCollection, themeId: string): ThemeCollection => {
  const theme = themes.find((candidate) => candidate.id === themeId)
  if (!theme || theme.scenes.length === 0) return themes
  return themes.map((candidate) => (candidate.id === themeId ? { ...candidate, scenes: [] } : candidate))
}

export const toggleThemeLit = (
  themes: ThemeCollection,
  themeId: string,
  sceneId: string,
  id: string,
  isFlow: boolean
): ThemeCollection => {
  const theme = themes.find((candidate) => candidate.id === themeId)
  const scene = theme?.scenes.find((candidate) => candidate.id === sceneId)
  if (!theme || !scene) return themes

  const key = isFlow ? 'flows' : 'artefacts'
  const current = scene.focus[key] ?? []
  const next = current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
  return editThemeScene(themes, themeId, sceneId, { focus: { ...scene.focus, [key]: next } })
}

/** Empty and structurally stale Themes stay editable, but Present must refuse them. */
export const themeCanActivate = (
  theme: ThemeConfig,
  validArtefactIds?: ReadonlySet<string>,
  validFlowIds?: ReadonlySet<string>
): boolean =>
  theme.scenes.some(
    (scene) =>
      scene.id.trim() !== '' &&
      scene.code.trim() !== '' &&
      scene.label.trim() !== '' &&
      (!validArtefactIds || (scene.focus.artefacts ?? []).every((id) => validArtefactIds.has(id))) &&
      (!validFlowIds || (scene.focus.flows ?? []).every((id) => validFlowIds.has(id)))
  )

/** The complete authored collection, so fields not exposed by the panel survive. */
export const themesAsSource = (themes: ThemeCollection): string => `themes  ->  ${JSON.stringify(themes, null, 2)}`
