# Infoschematics vocabulary

This reference defines the public language used by packages, authored configuration, documentation, and visible interfaces. Product terms describe what is authored; production terms describe how people create and present it. The reasoning for maintaining one vocabulary is recorded in [KDR-INFOSCHEMATICS-001](../decisions/KDR-INFOSCHEMATICS-001-product-vocabulary.md).

## Glossary

### Product

The **product** is an Infoschematic together with its Standalone Scenes, Themes, and Stories.

| Id | Infoschematics term | Also known as |
| --- | --- | --- |
| `infoschematic` | Infoschematic | schematic, structural diagram |
| `infoschematic-artefact` | Infoschematic artefact | element, visual element |
| `region` | Region | lane, zone, swimlane, band, tier, column, segment |
| `fabric` | Fabric | backdrop, plane, region, transport |
| `standard-card` | Standard Card | node, box, service box |
| `adapter-card` | Adapter Card | sidecar, wrapper |
| `flow` | Flow | connection, connector, link, edge |
| `graphic` | Graphic | overlay figure, drawn annotation |
| `route` | Route | geometry, line run |
| `waypoint` | Waypoint | bend, corner, vertex |
| `port` | Port | connection point, attachment point |
| `scene` | Scene | focus composition, highlight group |
| `standalone-scene` | Standalone Scene | reusable Scene |
| `thematic-scene` | Thematic Scene | Theme-owned Scene |
| `story-scene` | Story Scene | step |
| `theme` | Theme | series, collection, deck |
| `story` | Story | walkthrough, narrative |
| `callout` | Callout | narration card, caption card |

The alternatives help readers recognise a concept; they do not introduce additional public terms.

Each term carries a stable `Id`. Code and documents cite a concept by that id rather than by repeating its name, so a term cannot be reworded or retired without its citations failing. `packages/domain-model/src/option-catalogue.ts` cites these ids from every appearance option.

### Production

**Production** is the coordinated work through which a Producer authors and presents the product to an Audience.

| Id | Infoschematics term | Also known as |
| --- | --- | --- |
| `producer` | Producer | author, editor, operator |
| `audience` | Audience | viewer, people watching |
| `present` | Present | viewing, playback |
| `design` | Design | structural editing |
| `direct` | Direct | presentation editing, directing |
| `infoschematic-panel` | Infoschematic panel | canvas, main view |
| `producer-controls` | Producer controls | control surface |
| `details-panel` | Details panel | sidebar, inspector, state |
| `info` | Info | what is currently shown |
| `schematics` | Schematics | technical references and interfaces |

### Groupings

Three independent groupings classify what appears in an Infoschematic. None is an artefact and none substitutes for another.

| Id | Infoschematics term | Meaning |
| --- | --- | --- |
| `flow-family` | Flow Family | What a Flow carries and the visual identity associated with it |
| `scope` | Scope | A selectable architectural grouping of artefacts |
| `domain` | Domain | A sphere of concern that can classify or visually distinguish Cards |

`family` and `scope` are acceptable shorthand where the surrounding code or prose makes their full meaning unambiguous.

## Infoschematic

An **Infoschematic** is the complete structural diagram. It establishes what exists, where it is placed, and how it is connected.

An Infoschematic contains exactly six primary artefact kinds:

- **Region** — a background panel: an explicit box with an optional frame, an optional fill, and a label treatment.
- **Fabric** — a midground artefact that can participate in Flows and be focused by a Scene.
- **Card** — a box-like foreground artefact. An Adapter Card wraps a Standard Card without taking an independent position.
- **Flow** — a foreground artefact showing movement between Cards and Fabrics.
- **Graphic** — a foreground artefact normally hidden until a Scene makes it visible.

Routes, Waypoints, and Ports describe Flow geometry; they are not additional artefact kinds. Regions establish geography rather than connectable components. Behaviour determines an artefact kind, not merely how it looks.

Every independently identifiable artefact has a stable machine identifier. Human-readable codes are authored discussion handles and do not change merely because an item moves within a list.

## Scenes

A **Scene** is a deterministic presentation composition over an Infoschematic. It declares which Fabrics, Cards, and Flows are in focus, which Graphics are visible, and whether explanatory Callout material is present.

- A **Standalone Scene** is independently authored and reusable.
- A **Thematic Scene** is owned by a Theme.
- A **Story Scene** is owned by a Story.
- A **Callout** is optional explanatory material attached to one Scene. It is not an Infoschematic artefact.

Entering a Scene produces the same focus and Graphic visibility regardless of the previously presented Scene. Copying a Standalone Scene into a Theme or Story creates independently owned material rather than a hidden runtime link.

## Themes and Stories

A **Theme** groups independently owned Thematic Scenes around a shared subject. Its order supports navigation without implying timed narrative progression.

A **Story** arranges independently owned Story Scenes into a narrative. Timing and automatic progression are Story capabilities.

Themes and Stories may be empty while being authored. Neither may contain another Theme or Story.

## Roles and modes

A **Producer** shapes, controls, and presents the product. An **Audience** experiences the product without receiving editorial capability.

The application has three modes:

- **Present** — Audience-facing experience and navigation.
- **Design** — edits the Infoschematic and its six artefact kinds.
- **Direct** — edits Standalone Scenes, Themes, Stories, Callouts, and Storyboards.

Its persistent regions are the **Infoschematic panel**, **Producer controls**, and **Details panel**. A region keeps its identity as the selected mode changes what it exposes.

## Code conventions

- `InfoschematicConfig` is one complete host-supplied product definition.
- Types ending in `Config` describe authored serialisable data.
- Runtime types derived from configuration do not leak into authored definitions.
- Identifiers and renderer keys are stable strings.
- A renderer key selects registered behaviour without embedding a component in configuration.
- The host owns mounting, page metadata, routing, static assets, and deployment.

Package ownership and dependency direction are defined by [the architecture guide](../design/architecture.md) and its linked decision records, rather than repeated here.
