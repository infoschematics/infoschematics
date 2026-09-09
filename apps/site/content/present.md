# Present an Infoschematic

[Present](/docs/reference/vocabulary/#present) is the audience-facing view around an Infoschematic. It lets a presenter control what remains visible, focus the [audience](/docs/reference/vocabulary/#audience) on a [Scene](/docs/reference/vocabulary/#scene), and move through a [Story](/docs/reference/vocabulary/#story) — explaining the model without changing it.

```tsx
import { Present } from '@infoschematics/view-present'
import '@infoschematics/view-present/styles.css'
import { myInfoschematic } from '@example/my-infoschematic'

export function App() {
  return <Present config={myInfoschematic} />
}
```

## Three audience questions

Present answers three questions in order:

1. **What is this Infoschematic?** The diagram shows the Cards, Fabrics, and Flows and how they relate.
2. **What is showing now?** The controls and Info panel explain which Scopes and Flow families remain visible.
3. **What should I follow?** A Scene focuses part of the same diagram, and a Story moves through a sequence of those focused explanations.

The diagram answers first; the controls help the audience read it without becoming a competing application surface.

## Filtering and focus

Scope and Flow-family controls are **subtractive** — they decide what remains present. A Scene is **emphatic** — it brings named content forward and pushes the rest back without moving anything. Filters apply first, then the Scene focuses only what remains visible. Story focus takes precedence over Thematic Scene focus, which takes precedence over Standalone Scene focus; at most one is active, and clearing every Scene leaves all visible content at full strength.

Geometry never changes during presentation. Placement, routes, ports, and labels stay fixed while filters and Scenes change, so the audience keeps its spatial memory of the diagram. A [Callout](/docs/reference/vocabulary/#callout) is the one thing that floats over the composition — and even it never moves the content beneath it.

## Story playback

A running Story steps through its Scenes with optional automatic advance. The primary actions are ordinary labelled buttons mirrored by contextual keyboard shortcuts: while a Story runs, **left** and **right** step through it, **space** holds or resumes automatic advance, and **Escape** stops it. Thematic Scenes use the same stepping keys without implying playback. Keyboard help is available in the view, and Callouts announce changes politely with explicit previous, next, and exit controls.

The Details panel's Info view is a derived register of the same runtime model the diagram uses — useful for orientation, and unable to disagree with the diagram. For presenting, the Details panel and expanded controls can collapse so the diagram takes the available canvas, while a compact rail keeps the filters and Story controls in reach.

## Flow signals

Entering a Scene produces one transient signal per focused Flow by default — the `focused-flows` policy. The occurrence stays stable across React re-renders, so completed motion does not replay; stepping to another Scene creates new occurrences and cancels obsolete ones. Set `signalPolicy="none"` when Scene entry should not read as Flow activity; a host can still supply explicit occurrences for real application events. Under `prefers-reduced-motion` the travelling pulse becomes finite in-place emphasis, and every signal is announced in a live region — motion is never the only evidence.

## Where next

Present is one of three mount choices — the [React integration guide](/docs/react-integration/) covers choosing between Canvas, Present, and Studio and supplying host renderers. To author the Scenes and Stories Present plays, see [Capabilities](/docs/capabilities/) and the [authoring guide](/docs/authoring/).
