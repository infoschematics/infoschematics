import { describe, expect, it } from 'vitest'
import { defineInfoschematic } from '@infoschematics/domain-core'
import { resolveSceneFlowSignals, type SceneSignalSelection } from './signals.ts'

const flow = (id: string) => ({
  id,
  code: id.toUpperCase(),
  family: 'activity',
  source: 'source',
  sourcePort: 'E1' as const,
  target: 'target',
  targetPort: 'W1' as const,
  points: [],
})

const config = defineInfoschematic({
  title: 'Signals',
  infoschematic: {
    flows: [flow('first'), flow('second')],
  },
  standaloneScenes: [
    {
      id: 'standalone',
      code: 'SCENE-01',
      label: 'Standalone',
      description: 'Standalone Scene',
      focus: { flows: ['second', 'missing', 'first', 'second'] },
    },
    {
      id: 'source',
      code: 'SCENE-02',
      label: 'Story source',
      description: 'Inherited Story Scene focus',
      focus: { flows: ['first'] },
    },
  ],
  themes: [
    {
      id: 'theme',
      title: 'Theme',
      scenes: [
        {
          id: 'thematic',
          code: 'THEME-01',
          label: 'Thematic',
          focus: { flows: ['second'] },
        },
      ],
    },
  ],
  stories: [
    {
      id: 'story',
      code: 'STORY-01',
      title: 'Story',
      scenes: [
        { sourceScene: 'source' },
        { sourceScene: 'source', focus: { artefacts: [], flows: ['second'] } },
        { sourceScene: 'source', focus: { flows: [] } },
        { sourceScene: 'missing' },
      ],
    },
  ],
})

describe('Scene Flow signal resolution', () => {
  it('resolves known Standalone and Thematic focused Flows in authored order', () => {
    expect(
      resolveSceneFlowSignals(
        config,
        { kind: 'standalone', sceneId: 'standalone' },
        'entry-1',
      ),
    ).toEqual([
      { flowId: 'second', occurrenceKey: 'entry-1' },
      { flowId: 'first', occurrenceKey: 'entry-1' },
    ])

    expect(
      resolveSceneFlowSignals(
        config,
        { kind: 'theme', themeId: 'theme', sceneId: 'thematic' },
        'entry-2',
      ),
    ).toEqual([{ flowId: 'second', occurrenceKey: 'entry-2' }])
  })

  it('inherits Story focus and respects explicit Flow focus including an empty list', () => {
    expect(
      resolveSceneFlowSignals(
        config,
        { kind: 'story', storyId: 'story', sceneIndex: 0 },
        'story-1',
      ),
    ).toEqual([{ flowId: 'first', occurrenceKey: 'story-1' }])

    expect(
      resolveSceneFlowSignals(
        config,
        { kind: 'story', storyId: 'story', sceneIndex: 1 },
        'story-2',
      ),
    ).toEqual([{ flowId: 'second', occurrenceKey: 'story-2' }])

    expect(
      resolveSceneFlowSignals(
        config,
        { kind: 'story', storyId: 'story', sceneIndex: 2 },
        'story-3',
      ),
    ).toEqual([])
  })

  it('returns no occurrences for unknown or malformed Scene references', () => {
    const selections: readonly SceneSignalSelection[] = [
      { kind: 'standalone', sceneId: 'missing' },
      { kind: 'theme', themeId: 'missing', sceneId: 'thematic' },
      { kind: 'theme', themeId: 'theme', sceneId: 'missing' },
      { kind: 'story', storyId: 'missing', sceneIndex: 0 },
      { kind: 'story', storyId: 'story', sceneIndex: -1 },
      { kind: 'story', storyId: 'story', sceneIndex: 1.5 },
      { kind: 'story', storyId: 'story', sceneIndex: 3 },
      { kind: 'story', storyId: 'story', sceneIndex: 99 },
    ]

    for (const selection of selections) {
      expect(resolveSceneFlowSignals(config, selection, 'unknown')).toEqual([])
    }
  })

  it('keeps occurrence identity host-owned and does not mutate authored configuration', () => {
    const before = JSON.stringify(config)
    const selection = { kind: 'standalone', sceneId: 'standalone' } as const

    const first = resolveSceneFlowSignals(config, selection, 'stable-entry')
    const repeated = resolveSceneFlowSignals(config, selection, 'stable-entry')
    const replayed = resolveSceneFlowSignals(config, selection, 'new-entry')

    expect(repeated).toEqual(first)
    expect(replayed.map(({ occurrenceKey }) => occurrenceKey)).toEqual([
      'new-entry',
      'new-entry',
    ])
    expect(JSON.stringify(config)).toBe(before)
  })
})
