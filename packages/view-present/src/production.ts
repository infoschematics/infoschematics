import { type PresentationAction, type PresentationState, reducePresentation } from './presentation.ts'

export type DirectTarget =
  | Readonly<{ kind: 'standalone-scene'; sceneId: string }>
  | Readonly<{ kind: 'sequence'; sequenceId: string }>
  | Readonly<{ kind: 'story'; storyId: string }>
  | Readonly<{
      kind: 'callout'
      owner: 'story' | 'sequence'
      ownerId: string
      sceneId: string
    }>
  | Readonly<{ kind: 'storyboard'; storyId: string }>

export type WorkspaceKind = 'design' | 'direct'

/**
 * Which set of tools the Producer is working with.
 *
 * Design and Direct are two tasks over one document with the same capability, differing in which panels and which
 * interaction layers are in front of the Producer — what an editing application calls a workspace. A Direct target
 * is part of that arrangement rather than of the application, which is why it lives here and nowhere else: the
 * Design workspace has no field to leave null.
 */
export type Workspace = Readonly<{ kind: 'design' }> | Readonly<{ directTarget: DirectTarget | null; kind: 'direct' }>

/**
 * Session-only application state, on two independent axes. Persistence adapters intentionally receive no
 * serialisation contract for either from this package.
 *
 * `producing` is a capability boundary: false is the Audience's view of the product, with none of the Producer's
 * tools, and it is where every mount starts. `workspace` is a preference about tools, and it survives a visit to
 * the Audience's view — a Producer who presents a Sequence and comes back returns to the workspace they left,
 * which is the whole reason the two are not one field.
 */
export type ProductionState = Readonly<{
  presentation: PresentationState
  producing: boolean
  workspace: Workspace
}>

export type ProductionAction =
  | Readonly<{ action: PresentationAction; type: 'presentation' }>
  | Readonly<{ producing: boolean; type: 'set-producing' }>
  | Readonly<{ kind: WorkspaceKind; type: 'enter-workspace' }>
  | Readonly<{
      target: DirectTarget | null
      type: 'set-direct-target'
    }>
  | Readonly<{
      availableTargets: readonly DirectTarget[]
      type: 'reconcile-direct-target'
    }>

export const createProductionState = (presentation: PresentationState): ProductionState => ({
  presentation,
  producing: false,
  workspace: { kind: 'design' }
})

/** The Direct target, for the callers that hold a whole state rather than the workspace it carries. */
export const directTargetOf = (state: ProductionState): DirectTarget | null =>
  state.workspace.kind === 'direct' ? state.workspace.directTarget : null

const withoutPresentationFocus = (presentation: PresentationState): PresentationState =>
  reducePresentation(presentation, { type: 'clear-focus' })

const hasText = (value: string) => value.trim().length > 0

export const directTargetIsValid = (target: DirectTarget): boolean => {
  switch (target.kind) {
    case 'standalone-scene':
      return hasText(target.sceneId)
    case 'sequence':
      return hasText(target.sequenceId)
    case 'story':
    case 'storyboard':
      return hasText(target.storyId)
    case 'callout':
      return (
        hasText(target.ownerId) && hasText(target.sceneId) && (target.owner === 'story' || target.owner === 'sequence')
      )
  }
}

const directTargetsEqual = (left: DirectTarget, right: DirectTarget) => {
  if (left.kind !== right.kind) return false

  switch (left.kind) {
    case 'standalone-scene':
      return right.kind === left.kind && right.sceneId === left.sceneId
    case 'sequence':
      return right.kind === left.kind && right.sequenceId === left.sequenceId
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

/**
 * Which presentation actions are about what the Diagram draws rather than about presenting it.
 *
 * Scope and family visibility answer "what is on the surface", which a Producer laying a Diagram out asks as often
 * as a presenter does. Everything else here moves through Scenes, Stories and Sequences, and running the view
 * through those states while someone is authoring it would fight the work rather than serve it.
 */
const changesWhatIsDrawn = (action: PresentationAction): boolean =>
  action.type === 'toggle-scope' ||
  action.type === 'toggle-family' ||
  action.type === 'show-all-scopes' ||
  action.type === 'show-all-families'

const emptyWorkspace = (kind: WorkspaceKind): Workspace => (kind === 'direct' ? { directTarget: null, kind } : { kind })

export const reduceProduction = (state: ProductionState, action: ProductionAction): ProductionState => {
  switch (action.type) {
    case 'presentation':
      if (state.producing && !changesWhatIsDrawn(action.action)) return state
      return {
        ...state,
        presentation: reducePresentation(state.presentation, action.action)
      }
    case 'set-producing':
      if (state.producing === action.producing) return state
      // Taking up the tools puts away what was being presented; putting them down leaves the Audience's view where
      // this Producer left it, so returning shows what the last reader saw rather than a restored performance.
      return {
        ...state,
        presentation: action.producing ? withoutPresentationFocus(state.presentation) : state.presentation,
        producing: action.producing
      }
    case 'enter-workspace':
      // A workspace is entered afresh: a Direct target belongs to the arrangement of tools, so leaving Direct for
      // Design leaves its selection behind. Presenting is not leaving, which is what this split exists to say.
      if (state.workspace.kind === action.kind) return state
      return { ...state, workspace: emptyWorkspace(action.kind) }
    case 'set-direct-target': {
      if (state.workspace.kind !== 'direct') return state
      const directTarget = action.target && directTargetIsValid(action.target) ? action.target : null
      return directTarget === state.workspace.directTarget
        ? state
        : { ...state, workspace: { directTarget, kind: 'direct' } }
    }
    case 'reconcile-direct-target': {
      if (state.workspace.kind !== 'direct') return state
      const { directTarget } = state.workspace
      if (!directTarget) return state
      const targetStillExists = action.availableTargets.some((target) => directTargetsEqual(directTarget, target))
      return targetStillExists ? state : { ...state, workspace: { directTarget: null, kind: 'direct' } }
    }
  }
}
