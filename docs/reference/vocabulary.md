# Infoschematics vocabulary

This reference defines the public language used by packages, authored configuration, documentation, and visible interfaces. Product terms describe what is authored; production terms describe how people create and present it. The reasoning for maintaining one vocabulary is recorded in [KDR-INFOSCHEMATICS-001](../decisions/KDR-INFOSCHEMATICS-001-product-vocabulary.md).

## Glossary

### Product

The **product** is an Infoschematic together with its Standalone Scenes, Themes, and Stories.

| Id | Infoschematics term | Also known as |
| --- | --- | --- |
| `infoschematic` | <span id="infoschematic"></span>Infoschematic | schematic, structural diagram |
| `infoschematic-artefact` | <span id="infoschematic-artefact"></span>Infoschematic artefact | element, visual element |
| `region` | <span id="region"></span>Region | lane, zone, swimlane, band, tier, column, segment |
| `fabric` | <span id="fabric"></span>Fabric | backdrop, plane, region, transport |
| `standard-card` | <span id="standard-card"></span>Standard Card | node, box, service box |
| `adapter-card` | <span id="adapter-card"></span>Adapter Card | sidecar, wrapper |
| `flow` | <span id="flow"></span>Flow | connection, connector, link, edge |
| `point` | <span id="point"></span>Point | junction, anchor, endpoint |
| `graphic` | <span id="graphic"></span>Graphic | overlay figure, drawn annotation |
| `route` | <span id="route"></span>Route | geometry, line run |
| `waypoint` | <span id="waypoint"></span>Waypoint | bend, corner, vertex |
| `port` | <span id="port"></span>Port | connection point, attachment point |
| `scene` | <span id="scene"></span>Scene | focus composition, highlight group |
| `standalone-scene` | <span id="standalone-scene"></span>Standalone Scene | reusable Scene |
| `thematic-scene` | <span id="thematic-scene"></span>Thematic Scene | Theme-owned Scene |
| `story-scene` | <span id="story-scene"></span>Story Scene | step |
| `theme` | <span id="theme"></span>Theme | series, collection, deck |
| `story` | <span id="story"></span>Story | walkthrough, narrative |
| `callout` | <span id="callout"></span>Callout | narration card, caption card |

The alternatives help readers recognise a concept; they do not introduce additional public terms.

Each term carries a stable `Id`. Code and documents cite a concept by that id rather than by repeating its name, so a term cannot be reworded or retired without its citations failing. `packages/domain-model/src/option-catalogue.ts` cites these ids from every appearance option.

### Production

**Production** is the coordinated work through which a Producer authors and presents the product to an Audience.

| Id | Infoschematics term | Also known as |
| --- | --- | --- |
| `producer` | <span id="producer"></span>Producer | author, editor, operator |
| `audience` | <span id="audience"></span>Audience | viewer, people watching |
| `present` | <span id="present"></span>Present | viewing, playback |
| `design` | <span id="design"></span>Design | structural editing |
| `direct` | <span id="direct"></span>Direct | presentation editing, directing |
| `infoschematic-panel` | <span id="infoschematic-panel"></span>Infoschematic panel | canvas, main view |
| `producer-controls` | <span id="producer-controls"></span>Producer controls | control surface |
| `details-panel` | <span id="details-panel"></span>Details panel | sidebar, inspector, state |
| `info` | <span id="info"></span>Info | what is currently shown |
| `schematics` | <span id="schematics"></span>Schematics | technical references and interfaces |

### Groupings

Three independent groupings classify what appears in an Infoschematic. None is an artefact and none substitutes for another.

| Id | Infoschematics term | Meaning |
| --- | --- | --- |
| `flow-family` | <span id="flow-family"></span>Flow Family | What a Flow carries and the visual identity associated with it |
| `scope` | <span id="scope"></span>Scope | A selectable architectural grouping of artefacts |
| `domain` | <span id="domain"></span>Domain | A sphere of concern that can classify or visually distinguish Cards |

`family` and `scope` are acceptable shorthand where the surrounding code or prose makes their full meaning unambiguous.

## Infoschematic

An **Infoschematic** is the complete structural diagram. It establishes what exists, where it is placed, and how it is connected.

An Infoschematic contains exactly six primary artefact kinds:

- **Region** — a background panel: an explicit box with an optional frame, an optional fill, and a label treatment.
- **Fabric** — a midground artefact that can participate in Flows and be focused by a Scene.
- **Card** — a box-like foreground artefact. An Adapter Card wraps a Standard Card without taking an independent position.
- **Flow** — a foreground artefact showing movement between Cards and Fabrics.
- **Point** — a foreground junction or labelled anchor that can participate in the same scoped diagram geography.
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
