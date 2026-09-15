# Infoschematics vocabulary

This reference defines the public language used by packages, authored configuration, documentation, and visible interfaces. Product terms describe what is authored; production terms describe how people create and present it.

## Glossary

### Product

The **product** is one Infoschematic: its structural Diagram plus optional Scopes, Specifications and Sequences.

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
| `overlay` | <span id="overlay"></span>Overlay | foreground figure, drawn annotation |
| `graphic` | <span id="graphic"></span>Graphic | established compatibility name for Overlay |
| `route` | <span id="route"></span>Route | geometry, line run |
| `waypoint` | <span id="waypoint"></span>Waypoint | bend, corner, vertex |
| `port` | <span id="port"></span>Port | connection point, attachment point |
| `scene` | <span id="scene"></span>Scene | focus composition, highlight group |
| `sequence-scene` | <span id="sequence-scene"></span>Sequence Scene | step, thematic scene |
| `sequence` | <span id="sequence"></span>Sequence | theme, story, walkthrough, deck |
| `callout` | <span id="callout"></span>Callout | narration card, caption card |
| `diagram-dynamic` | <span id="diagram-dynamic"></span>Diagram Dynamic | animation, transition, motion effect |

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
| `interaction-layer` | <span id="interaction-layer"></span>Interaction layer | selectable kind, layer filter |
| `selection-anchor` | <span id="selection-anchor"></span>Selection anchor | primary selection, first held element |
| `info` | <span id="info"></span>Info | what is currently shown |
| `schematics` | <span id="schematics"></span>Schematics | technical references and interfaces |

### Groupings

Card Collections and Flow Families classify Diagram elements and supply their semantic visual identity. Architectural Scopes are presentation selections over element ids rather than Diagram classifications.

| Id | Infoschematics term | Meaning |
| --- | --- | --- |
| `card-collection` | <span id="card-collection"></span>Card Collection | Kind and semantic visual identity shared by Cards |
| `domain` | <span id="domain"></span>Domain | established compatibility name for Card Collection |
| `flow-family` | <span id="flow-family"></span>Flow Family | Kind and semantic visual identity shared by Flows |
| `scope` | <span id="scope"></span>Architectural Scope | Selectable presentation grouping over Diagram elements |

`collection`, `family` and `scope` are acceptable shorthand where the surrounding code or prose makes the full meaning unambiguous.

## Infoschematic

An **Infoschematic** is the complete structural diagram. It establishes what exists, where it is placed, and how it is connected.

An Infoschematic contains exactly six visible element types:

- **Region** — authored diagram geography such as a lane, tier or boundary.
- **Fabric** — background component or plane that Flows may cross and connect to.
- **Card** — box-like component that originates, transforms or consumes Flows.
- **Point** — lightweight visible source, sink or junction.
- **Flow** — connection between ports on Cards, Fabrics or Points.
- **Overlay** — foreground figure or annotation normally shown by a Scene.

Routes, Waypoints and Ports describe Flow geometry; they are not additional element types. Regions establish geography rather than connectable components. Behaviour determines an artefact kind, not merely how it looks.

Every independently identifiable element has one stable, code-like `id`, such as `SRC`. Its human-readable `label`, such as `Source`, may change without changing references.

## Scenes

A **Scene** is a deterministic presentation composition owned by one Sequence. It declares Diagram elements or Architectural Scopes to show, hide or focus, and may carry an explanatory Callout. A Callout is presentation content, not a Diagram element.

Entering a Scene produces the same focus and Overlay visibility regardless of the previously presented Scene. Reusing a Scene is a Studio copy operation: the copied Scene becomes independently owned data rather than retaining a source relationship.

## Sequences

A **Sequence** owns an ordered collection of Scenes. Its required presentation settings independently choose whether every Scene is expanded as a selector or the Sequence is collapsed behind one selector, whether progression is timed or manual, and whether Scene Callouts render.

Sequences may be empty while being authored and may not contain another Sequence. Reusing a Scene is a Studio copy operation rather than inheritance or a domain reference.

## Diagram Dynamics

A **Diagram Dynamic** is a named semantic change an Audience should perceive: a record delivered, a service degraded, a view revised. A Diagram declares the Dynamics it can express, each with a stable id, a label, and one finite kind — signalling named Flows, or briefly emphasising named elements.

A Dynamic is not an animation. It says what changed and what the change is about, never how to depict it: no duration, easing, colour, selector, or timer is authored. A host says only that a named Dynamic occurred, by id and a host-owned occurrence key; each renderer then chooses a treatment, including a still one for reduced motion and for static output, and states the Dynamic's own label to assistive technology.

## Roles and modes

A **Producer** shapes, controls, and presents the product. An **Audience** experiences the product without receiving editorial capability.

The application has three modes:

- **Present** — Audience-facing experience and navigation.
- **Design** — edits the Infoschematic and its six artefact kinds.
- **Direct** — edits Sequences, their Scenes, Callouts and Storyboards.

Its persistent regions are the **Infoschematic panel**, **Producer controls**, and **Details panel**. A region keeps its identity as the selected mode changes what it exposes.

Design divides its elements into one **Interaction layer** per artefact kind. A layer is a filter over what answers the Producer, not over what the Diagram draws: closing one leaves its elements exactly as authored and exactly where they were, and stops them taking a press or a keystroke meant for something else. It is session state, chosen by the Producer for the sitting and never written to authored source.

## Code conventions

- `Infoschematic` is the canonical complete host-supplied product definition; `DefinedInfoschematic` is its normalised form.
- `InfoschematicConfig` is the established compatibility input accepted at public boundaries.
- Canonical authored data uses one stable code-like `id`; runtime compatibility aliases do not create a second domain identity.
- Runtime types derive from canonical authored data and do not leak into authored definitions.
- Identifiers and renderer keys are stable strings.
- A renderer reference selects a registered key and property-schema version without embedding a component in configuration; a scalar compatibility key requests version `1`.
- The host owns mounting, page metadata, routing, static assets and deployment.

Package ownership and dependency direction are defined by [the architecture guide](../design/architecture.md) and its linked decision records, rather than repeated here.
