import type { CalloutConfig, FocusConfig } from './scene.ts'

export type SequencePresentationConfig = {
  display: 'expanded' | 'collapsed'
  timed: boolean
  callouts: boolean
}

export type SequenceSceneConfig = {
  id: string
  code: string
  label: string
  description?: string
  focus: FocusConfig
  anchor?: string
  callout?: CalloutConfig
  graphic?: string
  duration?: number
}

/**
 * View-boundary form used while established Theme and Story inputs remain
 * supported. Canonical inputs are projected here before runtime derivation.
 */
export type SequenceConfig = {
  id: string
  code: string
  label: string
  description?: string
  presentation: SequencePresentationConfig
  scenes: readonly SequenceSceneConfig[]
}
