import { describe, expect, it } from 'vitest'
import type { ThemeConfig } from '@infoschematics/domain-model/theme'
import {
  addTheme,
  addThemeScene,
  clearThemeScenes,
  editThemeScene,
  moveThemeScene,
  removeThemeScene,
  themeCanActivate,
  themesAsSource,
  toggleThemeLit,
} from './theme-composition.ts'

const themes: readonly ThemeConfig[] = [
  {
    id: 'operations',
    scenes: [
      {
        callout: { body: 'Keep this', properties: { tone: 'quiet' }, renderer: 'aside' },
        code: 'THM-07',
        focus: { artefacts: ['card-a'], flows: ['flow-a'] },
        id: 'overview',
        label: 'Overview',
      },
      { code: 'THM-08', focus: {}, id: 'detail', label: 'Detail' },
    ],
    title: 'Operations',
  },
]

describe('Theme composition', () => {
  it('creates an empty Theme and a globally numbered Scene without copying focus', () => {
    const made = addTheme(themes, 'Operations')
    expect(made.at(-1)).toEqual({ id: 'operations-2', scenes: [], title: 'Operations' })

    const composed = addThemeScene(made, 'operations-2', 'Overview')
    expect(composed.at(-1)?.scenes[0]).toEqual({
      code: 'THM-09',
      description: '',
      focus: {},
      id: 'overview-2',
      label: 'Overview',
    })
  })

  it('makes move, remove and clear total at collection boundaries', () => {
    expect(moveThemeScene(themes, 'operations', 0, -1)).toBe(themes)
    expect(moveThemeScene(themes, 'missing', 0, 1)).toBe(themes)
    expect(removeThemeScene(themes, 'operations', 8)).toBe(themes)
    expect(clearThemeScenes(clearThemeScenes(themes, 'missing'), 'missing')).toBe(themes)

    const moved = moveThemeScene(themes, 'operations', 0, 1)
    expect(moved[0]?.scenes.map((scene) => scene.id)).toEqual(['detail', 'overview'])
    expect(removeThemeScene(moved, 'operations', 1)[0]?.scenes).toHaveLength(1)
    expect(clearThemeScenes(themes, 'operations')[0]?.scenes).toEqual([])
  })

  it('preserves unexposed Callout configuration while editing focus and text', () => {
    const focused = toggleThemeLit(themes, 'operations', 'overview', 'card-b', false)
    const edited = editThemeScene(focused, 'operations', 'overview', { description: 'Changed' })
    const scene = edited[0]?.scenes[0]

    expect(scene?.focus.artefacts).toEqual(['card-a', 'card-b'])
    expect(scene?.callout).toEqual({ body: 'Keep this', properties: { tone: 'quiet' }, renderer: 'aside' })
    expect(themesAsSource(edited)).toContain('"renderer": "aside"')
  })

  it('keeps empty and stale Themes editable but ineligible for Present', () => {
    expect(themeCanActivate({ id: 'empty', scenes: [], title: 'Empty' })).toBe(false)
    expect(themeCanActivate(themes[0] as ThemeConfig, new Set(['card-a']), new Set(['flow-a']))).toBe(true)
    expect(themeCanActivate(themes[0] as ThemeConfig, new Set(), new Set(['flow-a']))).toBe(true)

    const allStale: ThemeConfig = {
      id: 'stale',
      scenes: [{ code: 'THM-10', focus: { artefacts: ['gone'] }, id: 'gone', label: 'Gone' }],
      title: 'Stale',
    }
    expect(themeCanActivate(allStale, new Set(), new Set())).toBe(false)
  })
})
