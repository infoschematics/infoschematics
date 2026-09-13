# Getting started

An Infoschematic combines a structural diagram with the information needed to explain, tailor and present it. It shows what exists, how the parts relate and what moves between them, then lets one authored definition serve a still document, an interactive exploration, an audience presentation or a Studio session.

## What goes into an Infoschematic

The diagram is built from visible artefacts:

- **Regions** establish labelled geography behind the composition.
- **Fabrics** provide connectable planes or backdrops.
- **Cards** show placed components with identity and meaning.
- **Flows** connect artefacts with authored direction and routes.
- **Points** mark labelled junctions or anchors.
- **Graphics** add renderer-selected explanatory material.

The same definition also carries Scopes, Scenes, Themes, Stories and Callouts. These tailor what an audience sees and how an explanation unfolds without moving the underlying diagram.

The [visual guide](/docs/visual-guide/) shows these parts together before you need to learn their exact schema names.

## From definition to output

One serialisable definition moves through four layers:

1. **Domain Model** defines the plain-data product contract and stable renderer keys.
2. **Domain Core** normalises TypeScript, JSON or YAML input and validates it against the published schema.
3. **View Model** derives geometry, routes, ports, focus and editing calculations without choosing a UI framework.
4. **Views and renderers** turn the result into Canvas, Present, Studio or deterministic SVG output.

Your host application chooses the surface and supplies any runtime renderers. The authored definition never contains React components, browser state or callbacks.

## Follow the guide

Each step has one job:

1. **Getting started** — understand the overall model and choose a route through the guide.
2. [Installation](/docs/installation/) — choose the smallest package for the output you need.
3. [Visual guide](/docs/visual-guide/) — see the anatomy, groupings, treatments and presentation concepts.
4. [Authoring](/docs/authoring/) — write a complete definition in TypeScript, YAML or JSON.
5. [Present](/docs/present/) — guide an audience with filtering, focus and Story playback.
6. [Studio](/docs/studio/) — design the diagram and direct its presentation material.
7. [Static rendering](/docs/static-rendering/) — create deterministic SVG for documents and pipelines.
8. [React integration](/docs/react-integration/) — mount Canvas, Present or Studio in a host application.

Try the [Playground](/playground/) when you want to inspect and edit a complete definition. Use the [canonical terminology](/docs/reference/vocabulary/) when you need exact contract language rather than a guided introduction.
