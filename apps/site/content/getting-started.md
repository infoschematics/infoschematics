# Getting started

An [Infoschematic](/docs/reference/vocabulary/#infoschematic) combines a diagrammatic representation, using shapes and lines to show the main parts and connections of a system, with supplemental information directly in the diagram. It shows what exists, how things interrelate, and what moves between them.

This simple diagram is then turned into a live, explorable view that can be tailored to multiple audiences and is clear enough to present to anyone.

## What makes up an Infoschematic

The diagram itself is built from five visual element types:

- [**Region**](/docs/reference/vocabulary/#region) establishes background geography with a labelled box, optional fill, and optional frame.
- [**Fabric**](/docs/reference/vocabulary/#fabric) is a connectable midground plane or backdrop.
- [**Card**](/docs/reference/vocabulary/#standard-card) is a placed foreground component.
- [**Flow**](/docs/reference/vocabulary/#flow) connects Cards and Fabrics through authored endpoints and route geometry.
- [**Graphic**](/docs/reference/vocabulary/#graphic) is a renderer-selected visual, commonly revealed by a Scene.

An Infoschematic is more than its diagram. [**Scenes**](/docs/reference/vocabulary/#scene) focus or reveal parts of it, [**Themes**](/docs/reference/vocabulary/#theme) and [**Stories**](/docs/reference/vocabulary/#story) arrange those Scenes for explanation and presentation, and [**Scopes**](/docs/reference/vocabulary/#scope) control what is applicable for a given audience. Everything is one serialisable definition — plain data a host application selects and mounts.

## From definition to output

The same data moves through four layers:

1. **Domain Model** defines the serialisable product contract and stable renderer keys.
2. **Domain Core** normalises TypeScript, JSON, or YAML input and validates it against the published schema.
3. **View Model** derives geometry, routes, ports, focus, and editing calculations without choosing a UI framework.
4. **Views and renderers** turn the derived model into Canvas, Present, Studio, or static SVG output.

One definition therefore drives consistent outputs: static renderings for documents, an interactive Canvas for exploration, a Present view for an audience, and a Studio view for producers.

## How this guide is organised

Each step builds on the one before it:

1. **Getting started** — this page: what an Infoschematic is and how its parts fit together.
2. [Visual guide](/docs/visual-guide/) — the diagram's visible anatomy and every authored appearance treatment, shown live.
3. [Capabilities](/docs/capabilities/) — Scenes, Themes, Stories, and Scopes: the machinery beyond the diagram.
4. [Authoring](/docs/authoring/) — write a complete definition, in TypeScript or as a YAML or JSON document.
5. [Present view](/docs/present/) — show an Infoschematic to an audience with filtering, focus, and Story playback.
6. [Studio view](/docs/studio/) — design the diagram and direct its presentation material in a structured editor.
7. [Static rendering](/docs/static-rendering/) — export deterministic SVG for documents and pipelines.
8. [React integration](/docs/react-integration/) — mount any of the views in your own application.

To experiment before reading further, open the [Playground](/playground/) — its formats are ordered from most portable to most expressive: YAML, JSON, then TypeScript — or explore the [hosted examples](/examples/) to see complete Infoschematics in operation.
