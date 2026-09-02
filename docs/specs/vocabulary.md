# Infoschematics vocabulary

This specification defines the public language used by packages, configuration, documentation and visible interfaces. Product names describe what is authored; production names describe how people create and present it.

## Product

An **Infoschematic** is a complete structural diagram. It establishes what exists, where it is placed and how it is connected.

An Infoschematic contains six primary artefact kinds:

- **Lane** — a full-width background region.
- **Zone** — a named subdivision of a Lane.
- **Fabric** — a midground artefact that can participate in Flows and be focused by a Scene.
- **Card** — a box-like foreground artefact. An Adapter Card wraps a standard Card without taking an independent position.
- **Flow** — a foreground artefact showing movement between Cards and Fabrics.
- **Graphic** — a foreground artefact normally hidden until a Scene makes it visible.

Routes, waypoints and ports describe Flow geometry. They are not additional artefact kinds.

## Scenes

A **Scene** is a presentation composition over an Infoschematic. It declares which Fabrics, Cards and Flows are in focus, which Graphics are visible and whether explanatory Callout material is present.

- **Standalone Scene** — an independently authored reusable Scene.
- **Thematic Scene** — a Scene owned by a Theme.
- **Story Scene** — a Scene owned by a Story.
- **Callout** — optional explanatory material attached to one Scene. It is not an Infoschematic artefact.

Scenes are deterministic. Entering a Scene must produce the same focus and Graphic visibility regardless of the previously presented Scene.

## Themes and Stories

A **Theme** groups independently owned Thematic Scenes around a shared subject. Its order supports navigation but does not imply a timed narrative.

A **Story** arranges independently owned Story Scenes into a narrative. Timing and automatic progression are Story capabilities.

Themes and Stories may be empty while being authored. Neither may contain another Theme or Story.

## Production

**Production** is the coordinated work of designing an Infoschematic, directing its Scenes, Themes and Stories, and presenting the resulting product.

The two roles are:

- **Producer** — shapes, controls and presents the product.
- **Audience** — experiences the product without receiving editorial capability.

The application has three modes:

- **Present** — the Audience-facing experience and navigation.
- **Design** — edits the Infoschematic and its six artefact kinds.
- **Direct** — edits Standalone Scenes, Themes, Stories, Callouts and Storyboards.

The persistent interface regions are the **Infoschematic panel**, **Producer controls** and **Details panel**. The Details panel exposes Info and Schematics to an Audience and production workspaces to a Producer.

## Code conventions

- `InfoschematicConfig` is the complete host-supplied product definition.
- Types ending `Config` describe authored serialisable data.
- Runtime types are derived from configuration and do not leak into authored definitions.
- Identifiers and renderer keys are stable strings. A renderer key selects host or React-package behaviour without embedding a component in configuration.
- The host owns browser title, mounting, routing, static assets and deployment.
- `@infoschematics/model` owns the public product contract.
- `@infoschematics/core` owns calculations and geometry.
- `@infoschematics/react` owns the React application and runtime adapter.

The terms `topology`, `programme`, `demonstration`, `spotlight`, `vendor`, `play`, `stage`, `lighting`, `book`, `act` and `beat` are not public Infoschematics concepts. Domain prose may still use an ordinary-language term where it genuinely describes its subject; this rule governs product vocabulary, not unrelated content.
