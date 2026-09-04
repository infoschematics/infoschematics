import { type PresentationAction, type PresentationState, reducePresentation } from './presentation.ts'

export type ProductionMode = 'present' | 'design' | 'direct'

export type DirectTarget =
  | Readonly<{ kind: 'standalone-scene'; sceneId: string }>
  | Readonly<{ kind: 'theme'; themeId: string }>
  | Readonly<{ kind: 'story'; storyId: string }>
  | Readonly<{
      kind: 'callout'
      owner: 'story' | 'theme'
      ownerId: string
      sceneId: string
    }>
  | Readonly<{ kind: 'storyboard'; storyId: string }>

type PresentProductionState = Readonly<{
  directTarget: null
  mode: 'present'
  presentation: PresentationState
}>

type DesignProductionState = Readonly<{
  directTarget: null
  mode: 'design'
  presentation: PresentationState
}>

type DirectProductionState = Readonly<{
  directTarget: DirectTarget | null
  mode: 'direct'
  presentation: PresentationState
}>

/**
 * Session-only application state. Persistence adapters intentionally receive no
 * production-mode serialisation contract from this package.
 */
export type ProductionState = PresentProductionState | DesignProductionState | DirectProductionState

export type ProductionAction =
  | Readonly<{ action: PresentationAction; type: 'presentation' }>
  | Readonly<{ mode: ProductionMode; type: 'set-mode' }>
  | Readonly<{
      target: DirectTarget | null
      type: 'set-direct-target'
    }>
  | Readonly<{
      availableTargets: readonly DirectTarget[]
      type: 'reconcile-direct-target'
    }>

export const createProductionState = (presentation: PresentationState): ProductionState => ({
  directTarget: null,
  mode: 'present',
  presentation
})

const withoutPresentationFocus = (presentation: PresentationState): PresentationState =>
  reducePresentation(presentation, { type: 'clear-focus' })

const hasText = (value: string) => value.trim().length > 0

export const directTargetIsValid = (target: DirectTarget): boolean => {
  switch (target.kind) {
    case 'standalone-scene':
      return hasText(target.sceneId)
    case 'theme':
      return hasText(target.themeId)
    case 'story':
    case 'storyboard':
      return hasText(target.storyId)
    case 'callout':
      return (
        hasText(target.ownerId) && hasText(target.sceneId) && (target.owner === 'story' || target.owner === 'theme')
      )
  }
}

const directTargetsEqual = (left: DirectTarget, right: DirectTarget) => {
  if (left.kind !== right.kind) return false

  switch (left.kind) {
    case 'standalone-scene':
      return right.kind === left.kind && right.sceneId === left.sceneId
    case 'theme':
      return right.kind === left.kind && right.themeId === left.themeId
    case 'story':
    case 'storyboard':
      return right.kind === left.kind && right.storyId === left.storyId
    case 'callout':
      return (
        right.kind === left.kind &&
        right.owner === left.owner &&
        right.ownerId === left.ownerId &&
        right.sceneId === left.sceneId
      )
  }
}

const setMode = (state: ProductionState, mode: ProductionMode): ProductionState => {
  if (state.mode === mode) return state

  if (mode === 'present') {
    return {
      directTarget: null,
      mode,
      presentation: state.presentation
    }
  }

  if (mode === 'design') {
    return {
      directTarget: null,
      mode,
      presentation: withoutPresentationFocus(state.presentation)
    }
  }

  return {
    directTarget: null,
    mode,
    presentation: withoutPresentationFocus(state.presentation)
  }
}

export const reduceProduction = (state: ProductionState, action: ProductionAction): ProductionState => {
  switch (action.type) {
    case 'presentation':
      if (state.mode !== 'present') return state
      return {
        ...state,
        presentation: reducePresentation(state.presentation, action.action)
      }
    case 'set-mode':
      return setMode(state, action.mode)
    case 'set-direct-target': {
      if (state.mode !== 'direct') return state
      const directTarget = action.target && directTargetIsValid(action.target) ? action.target : null
      return directTarget === state.directTarget ? state : { ...state, directTarget }
    }
    case 'reconcile-direct-target': {
      if (state.mode !== 'direct' || !state.directTarget) return state
      const targetStillExists = action.availableTargets.some((target) =>
        directTargetsEqual(state.directTarget as DirectTarget, target)
      )
      return targetStillExists ? state : { ...state, directTarget: null }
    }
  }
}
