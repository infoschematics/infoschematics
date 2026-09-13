# Explanation

An Infoschematic keeps its structural diagram stable while changing what an audience sees and what the author says about it. [Scopes](/docs/reference/vocabulary/#scope), [Scenes](/docs/reference/vocabulary/#scene), [Themes](/docs/reference/vocabulary/#theme), [Stories](/docs/reference/vocabulary/#story), [Callouts](/docs/reference/vocabulary/#callout), and [Graphics](/docs/reference/vocabulary/#graphic) provide that explanatory layer.

## Start with the stable diagram

Explanation does not move Cards, Regions, Fabrics, Points, or Flow routes. The audience can change focus without losing its spatial memory of the system, and a still rendering remains understandable without interaction or motion.

Scopes decide which scoped artefacts are applicable. Domain and Flow Family classify what Cards and Flows mean; they may supply colour, but they do not create additional boxes on the diagram.

## Use Scenes for one moment

A Scene describes one focused reading of the diagram. It can bring named artefacts and Flows forward, reveal supporting Graphics, and show one Callout. Everything else remains in place and recedes visually.

There are three ways to use a Scene:

- a **Standalone Scene** is an independent moment;
- a **Thematic Scene** belongs to a Theme and can be explored with related moments;
- a **Story Scene** is a step in an ordered Story.

Only one Scene has active focus. Story focus takes precedence over Thematic Scene focus, which takes precedence over Standalone Scene focus.

## Group exploration with Themes

A Theme collects related Scenes without imposing an order. It is useful when readers should choose which aspect of the system to explore, such as security, data movement, or operational ownership.

A Theme does not duplicate the diagram. Its Scenes refer to the stable IDs of existing content.

## Guide an audience with Stories

A Story puts Scenes into a deliberate sequence. Each step can carry a duration for automatic playback, while ordinary previous and next actions keep the audience in control.

Use a Story when order matters: establish context, focus on a component, trace a Flow, then reveal the consequence. Use a Theme when the reader should choose the route.

## Add Callouts and Graphics

A Callout is explanatory content placed over the composition. It belongs to a Scene, stays separate from diagram geometry, and can be positioned in an authored slot without moving the elements beneath it.

A Graphic is a renderer-selected visual with serialisable properties. It can stay hidden until a Scene needs it, which makes it useful for annotations, keys, charts, or other material that would clutter the base diagram.

## Understand presentation state

Filtering is subtractive: it decides what remains visible. Scene focus is emphatic: it brings part of what remains forward. Flow signals are temporary emphasis. These states never rewrite the authored diagram.

The [Present view guide](/docs/present/) covers the audience controls, focus precedence, Story playback, keyboard interaction, and reduced-motion behaviour. The [Authoring guide](/docs/authoring/#add-presentation-material) shows the corresponding serialisable data.

## Where next

Return to [Components](/docs/components/) for the visible diagram parts, continue to [Present view](/docs/present/) to use the audience experience, or open [Studio view](/docs/studio/) to direct explanation material visually.
