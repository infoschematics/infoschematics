# Overview

An Infoschematic turns a system's architecture and the flows that move through it into one live, explorable view — precise enough for the engineer, clear enough to present to anyone.

An Infoschematic is a schematic, not assembly instructions: it shows what a system does and what moves through it, not how to put it together. One serialisable definition drives every output, from a static SVG in a document to a fully interactive view an audience can explore.

## What an Infoschematic is

An authored Infoschematic combines structural artefacts — Cards on Regions over a Surface — with the Flows that move between them, then layers Scenes, Themes, and Stories over that structure so the same definition can be presented, designed, and directed. The [vocabulary reference](reference/vocabulary.md) defines every product term precisely.

Definitions are plain data. They can be written in TypeScript, JSON, or YAML, validated against one published schema, and rendered without executing anything.

## The pieces

- **Domain Model and Domain Core** own the authored contract: the types a definition is written against, and the normalisation and validation every consumer shares.
- **View Model** derives geometry — placement, routes, ports — that every renderer consumes identically.
- **The views**: an interactive canvas, an audience-facing Present view, a Studio editing view, and a deterministic static SVG renderer, all reading the same derived model.

The [architecture guide](design/architecture.md) explains the boundaries and the dependency direction between them.

## Where to start

- Follow [the authoring guide](guides/authoring.md) to write a definition from scratch.
- Open [the playground](/playground/) to edit a live definition in TypeScript, JSON, or YAML and watch it render.
- Browse [the visual guide](/docs/visual-guide/) to see every appearance option as a rendered specimen.
- Explore [the hosted examples](/examples/) to see complete Infoschematics in operation.
- Mounting one in an application? Read [the React integration guide](guides/react-integration.md).
