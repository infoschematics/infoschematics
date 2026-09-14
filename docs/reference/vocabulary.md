# Infoschematics vocabulary

This reference defines the public language used by packages, authored configuration, documentation, and visible interfaces. Product terms describe what is authored; production terms describe how people create and present it.

## Glossary

### Product

The **product** is an Infoschematic together with its Standalone Scenes and Sequences.

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
| `sequence-scene` | <span id="sequence-scene"></span>Sequence Scene | step, thematic scene |
| `sequence` | <span id="sequence"></span>Sequence | theme, story, walkthrough, deck |
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
- A **Sequence Scene** is owned by one Sequence.
- A **Callout** is optional explanatory material attached to one Scene. It is not an Infoschematic artefact.

Entering a Scene produces the same focus and Overlay visibility regardless of the previously presented Scene. Copying a Standalone Scene into a Sequence creates independently owned material rather than a hidden runtime link.

## Sequences

A **Sequence** owns an ordered collection of Scenes. Its required presentation settings independently choose whether every Scene is expanded as a selector or the Sequence is collapsed behind one selector, whether progression is timed or manual, and whether Scene Callouts render.

Sequences may be empty while being authored and may not contain another Sequence. Reusing a Scene is a Studio copy operation rather than inheritance or a domain reference.

## Roles and modes

A **Producer** shapes, controls, and presents the product. An **Audience** experiences the product without receiving editorial capability.

The application has three modes:

- **Present** — Audience-facing experience and navigation.
- **Design** — edits the Infoschematic and its six artefact kinds.
- **Direct** — edits Standalone Scenes, Sequences, Callouts, and Storyboards.

Its persistent regions are the **Infoschematic panel**, **Producer controls**, and **Details panel**. A region keeps its identity as the selected mode changes what it exposes.

## Code conventions

- `InfoschematicConfig` is one complete host-supplied product definition.
- Types ending in `Config` describe authored serialisable data.
- Runtime types derived from configuration do not leak into authored definitions.
- Identifiers and renderer keys are stable strings.
- A renderer reference selects a registered key and property-schema version without embedding a component in configuration; a scalar compatibility key requests version `1`.
- The host owns mounting, page metadata, routing, static assets, and deployment.

Package ownership and dependency direction are defined by [the architecture guide](../design/architecture.md) and its linked decision records, rather than repeated here.
