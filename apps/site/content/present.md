# Present an Infoschematic

[Present](/docs/reference/vocabulary/#present) is the Audience-facing view around an Infoschematic. It lets a presenter control what remains visible, focus the [Audience](/docs/reference/vocabulary/#audience) on a [Scene](/docs/reference/vocabulary/#scene), and move through a [Sequence](/docs/reference/vocabulary/#sequence) without changing the model.

```tsx
import { Present } from '@infoschematics/view-present'
import '@infoschematics/view-present/styles.css'
import { myInfoschematic } from '@example/my-infoschematic'

export function App() {
  return <Present config={myInfoschematic} />
}
```

## Three Audience questions

Present answers three questions in order:

1. **What is this Infoschematic?** The Diagram shows Cards, Fabrics, Flows, and how they relate.
2. **What is showing now?** The controls and Info panel explain which Scopes and Flow Families remain visible.
3. **What should I follow?** A Scene focuses part of the same Diagram, and a Sequence orders focused explanations with explicit selection and timing behaviour.

The Diagram answers the first question; the controls help the Audience read it without becoming a competing application surface.

## Filtering and focus

Scope and Flow-family controls are **subtractive** — they decide what remains present. Scene focus is **emphatic** — it brings named content forward and pushes the rest back without moving anything. Filters apply first, then a Scene focuses only what remains visible. At most one Standalone or Sequence Scene is active, and clearing it leaves all visible content at full strength.

Geometry never changes during presentation. Placement, routes, ports, and labels stay fixed while filters and Scenes change, so the Audience keeps its spatial memory of the Diagram.

## Sequence selection and playback

An expanded Sequence exposes every Scene as a selector. A collapsed Sequence exposes one selector that starts at its first Scene. Either display can advance manually; when `timed` is enabled, automatic advance is also available.

The primary actions are ordinary labelled buttons and are mirrored by contextual keyboard shortcuts: **left** and **right** step through an active Sequence, **space** holds or resumes timed advance, and **Escape** stops it. Callouts expose explicit previous, next, and exit controls. A Sequence with `callouts: false` retains the same focus and navigation without drawing its authored Callouts.

The Details panel's Info view is derived from the same runtime model as the Diagram. The Details panel and expanded controls can collapse so the Diagram takes the available canvas, while a compact rail keeps filters and Sequence controls in reach.

## Flow signals

Entering a Scene produces one transient signal per focused Flow under the default `focused-flows` policy. The occurrence stays stable across React renders, so completed motion does not replay; stepping to another Scene creates new occurrences and cancels obsolete ones. Set `signalPolicy="none"` when Scene entry should not signal Flow activity.

Under `prefers-reduced-motion`, a travelling pulse becomes finite in-place emphasis, and every signal is announced in a live region. Motion is never the only evidence.

## Diagram Dynamics

Where a document declares named [Diagram Dynamics](/docs/reference/vocabulary/#diagram-dynamic), Present passes host occurrences straight through to the Canvas: `dynamics={[{ dynamicId: 'playback-stalled', occurrenceKey: event.id }]}` signals or emphasises whatever that Dynamic names, without the host knowing the diagram. Scene signalling is untouched by it, a new occurrence key replays, dropping the occurrence cancels, and the live region says the Dynamic's own label whether the treatment moves or not.

## Light and dark

A presentation takes the colour scheme of the page it is on, and carries no switch of its own. Changing scheme partway through is a change everyone in the room sees, and the person who wants it is rarely the person at the controls — so pin the scheme before you start, in the Studio you present from or in the page you embed into.

## Where next

Present is one of three mount choices. The [React integration guide](/docs/react-integration/) covers choosing between Canvas, Present, and Studio and supplying host renderers. To understand Scenes and Sequences before authoring them, see [Components](/docs/components/) and then continue to [authoring](/docs/authoring/).
