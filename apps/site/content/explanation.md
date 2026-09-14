# Explanation

An Infoschematic keeps its structural Diagram stable while changing what the Audience sees and what the Producer says about it. [Scopes](/docs/reference/vocabulary/#scope), [Scenes](/docs/reference/vocabulary/#scene), [Sequences](/docs/reference/vocabulary/#sequence), [Callouts](/docs/reference/vocabulary/#callout), and [Overlays](/docs/reference/vocabulary/#graphic) provide that explanatory layer.

## Start with a stable Diagram

Explanation does not move Cards, Regions, Fabrics, Points, or Flow routes. The Audience can change focus without losing its spatial memory of the system, and a still rendering remains understandable without interaction or motion.

Scopes decide which grouped artefacts are applicable. Card Collections and Flow Families classify what Cards and Flows mean and may supply their visual identity, but do not create additional boxes on the Diagram.

## Use Scenes for one moment

A Scene describes one focused reading of the Diagram. It can bring named artefacts and Flows forward, reveal supporting Overlays, and show one Callout. Everything else remains in place and recedes visually.

There are two ways to use a Scene:

- A **Standalone Scene** is an independent moment.
- A **Sequence Scene** is one owned step in a Sequence.

Only one Scene is active for focus. Activating a Standalone Scene or Sequence Scene clears the other focus source.

## Choose Sequence presentation

A Sequence owns ordered Scenes and independently chooses how the Audience selects and advances them. Use `display: expanded` when every Scene should be directly selectable, or `display: collapsed` when the Sequence should appear as one entry. Use `timed: true` for automatic progression or `timed: false` for manual progression.

These switches support expanded manual exploration, expanded playback, a collapsed manual walkthrough, and a collapsed timed walkthrough without changing the Diagram.

Set `callouts: true` when the Sequence's authored Scene Callouts should render, independently of display and timing. A timed Scene may carry a duration, while previous and next actions keep the Audience in control.

Every Sequence owns its Scenes directly. Reusing a Scene is a Studio copy operation, so changing one copy never changes another Sequence at a distance.

## Add a Callout or Overlay

A Callout explains the current Scene. It belongs to the Scene, stays separate from Diagram geometry, and can be positioned in an authored slot without moving the elements beneath it.

An Overlay is renderer-selected visual material with serialisable properties. It can stay hidden until a Scene needs it, making it useful for annotations, keys, charts, and other material that would clutter the base Diagram.

## Understand presentation state

Filtering is subtractive: it decides what remains visible. Scene focus is emphatic: it brings part of what remains forward. Flow signals are temporary emphasis. These states never rewrite the authored Diagram.

The [Present View guide](/docs/present/) covers Audience controls, Sequence playback, keyboard interaction, and reduced-motion behaviour. The [Authoring guide](/docs/authoring/#add-presentation-material) shows the corresponding serialisable data.

## Where next

Return to [Components](/docs/components/) for the visible Diagram parts, continue to [Present View](/docs/present/) for the Audience experience, or open [Studio View](/docs/studio/) to direct explanation material visually.
