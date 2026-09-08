# Getting started

An Infoschematic turns a system's architecture and the flows that move through it into one live, explorable view — precise enough for the engineer, clear enough to present to anyone.

One serialisable definition drives consistent outputs: a deterministic SVG for documents, an interactive Canvas for exploration, a Present view for an Audience, and a Studio view for Producers. An Infoschematic is a schematic, not assembly instructions: it shows what exists, where it sits, and what moves between it without coupling the definition to React, browser state, or a particular host application.

## The model at a glance

Every product contains one [Infoschematic](/docs/reference/vocabulary/#infoschematic): the structural diagram. It can also contain Scenes, Themes, and Stories that present that structure in different ways.

The diagram has six visible artefact kinds:

- [Region](/docs/reference/vocabulary/#region) establishes background geography with a labelled box, optional fill, and optional frame.
- [Fabric](/docs/reference/vocabulary/#fabric) is a connectable midground plane or backdrop.
- [Card](/docs/reference/vocabulary/#standard-card) is a placed foreground component. A Standard Card stands alone; an Adapter Card wraps another Card.
- [Flow](/docs/reference/vocabulary/#flow) connects Cards and Fabrics through authored endpoints and route geometry.
- [Point](/docs/reference/vocabulary/#point) is a labelled junction or anchor placed directly on the diagram.
- [Graphic](/docs/reference/vocabulary/#graphic) is a renderer-selected overlay, commonly revealed by a Scene.

[Scope](/docs/reference/vocabulary/#scope), [Domain](/docs/reference/vocabulary/#domain), and [Flow Family](/docs/reference/vocabulary/#flow-family) are independent groupings. They classify visibility, concern, and movement respectively; they are not additional shapes.

The [visual guide](/docs/visual-guide/) shows this anatomy in one diagram and lets you try every authored appearance treatment.

## From definition to output

The same data moves through four layers:

1. **Domain Model** defines the serialisable product contract and stable renderer keys.
2. **Domain Core** normalises TypeScript, JSON, or YAML input and validates it against the published schema.
3. **View Model** derives geometry, routes, ports, focus, and editing calculations without choosing a UI framework.
4. **Views and renderers** turn the derived model into Canvas, Present, Studio, or static SVG output.

Applications and examples sit outside those reusable layers. An example owns authored data; a host owns mounting, routes, metadata, assets, and deployment. The [architecture guide](/docs/design/architecture/) explains the dependency direction and package boundaries.

## Create your first definition

Start in the [Playground](/playground/). Its formats are ordered from most portable to most expressive: YAML, JSON, then TypeScript. Each represents the same product contract and produces the same diagram.

Use a Region to establish the drawing area, add one or more Cards or Fabrics, and connect them with a Flow. Then add appearance only where it communicates meaning: a Domain colour, a Flow Family, a Region frame, or selected Card metadata.

For a complete walkthrough, follow the [authoring guide](/docs/guides/authoring/). When integrating a renderer into an application, continue with the [React integration guide](/docs/guides/react-integration/).

## Choose the right output

| Need | Start with |
| --- | --- |
| Embed an explorable diagram | Canvas View |
| Guide an Audience through focus and narrative | Present View |
| Let a Producer design or direct a product | Studio View |
| Export deterministic, framework-neutral output | Static SVG renderer |

All four read the same authored definition. A host can choose the narrowest output it needs without changing ownership of the product data.

## Continue learning

- Use the [visual guide](/docs/visual-guide/) for visible elements, treatments, and presentation-state boundaries.
- Read the [visual-language guide](/docs/design/visual-language/) for composition, colour, routing, motion, and accessibility principles.
- Keep the [vocabulary reference](/docs/reference/vocabulary/) nearby when naming authored concepts.
- Explore the [hosted examples](/examples/) to see complete Infoschematics in operation.
