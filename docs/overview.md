# Getting started

An Infoschematic combines a diagrammatic representation, using shapes and lines to show the main parts and connections of a system, with supplemental information directly in the diagram. It shows what exists, how things interrelate, and what moves between them.

This simple diagram is then turned into a live, explorable view that can be tailored to multiple audiences and is clear enough to present to anyone.

One serialisable definition drives consistent outputs: static renderings for documents, including SVG and PNG; an interactive Canvas for exploration; a Present view for an audience; and a Studio view for producers.

## What appears in an Infoschematic

An Infoschematic comprises five visual element types. Scenes can focus or reveal parts of that diagram, while Themes and Stories can arrange those Scenes for explanation and presentation.

- **Region** establishes background geography with a labelled box, optional fill, and optional frame.
- **Fabric** is a connectable midground plane or backdrop.
- **Card** is a placed foreground component.
- **Flow** connects Cards and Fabrics through authored endpoints and route geometry.
- **Overlay** is a renderer-selected visual, commonly revealed by a Scene.

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

The [authoring guide](/docs/guides/authoring/) is the complete walkthrough: what to place first, how far to take appearance, and how the same definition reads as YAML, JSON, or TypeScript. When mounting the result in an application, continue with the [React integration guide](/docs/guides/react-integration/).

## Choose the right output

| Need | Start with |
| --- | --- |
| Embed an explorable diagram | Canvas View |
| Guide an Audience through focus and narrative | Present View |
| Let a Producer design or direct a product | Studio View |
| Export deterministic, framework-neutral output | Static SVG renderer |

All four read the same authored definition. A host can choose the narrowest output it needs without changing ownership of the product data.

## Continue learning

- Read the [visual-language guide](/docs/design/visual-language/) for composition, colour, routing, motion, and accessibility principles.
- Keep the [terminology reference](/docs/reference/vocabulary/) nearby when naming authored concepts.
- Explore the [hosted examples](/examples/) to see complete Infoschematics in operation.
