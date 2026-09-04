import type { CalloutConfig, FocusConfig } from './scene.ts'

export type StorySceneConfig = {
  id?: string
  sourceScene?: string
  title?: string
  focus?: FocusConfig
  anchor?: string
  callout?: CalloutConfig
  graphic?: string
  duration?: number
}

export type StoryConfig = {
  id: string
  code: string
  title: string
  short?: string
  question?: string
  scenes: readonly StorySceneConfig[]
}
