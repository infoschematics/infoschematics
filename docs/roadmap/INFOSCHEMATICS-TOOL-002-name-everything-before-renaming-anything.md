---
id: INFOSCHEMATICS-TOOL-002
area: TOOL
title: Settle vocabulary before renaming
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 53c81f4d6c0b9f002b86d05030e37005c706d8ec
---

> Moved from `5g-emerge-ibc-2026` (as `IBC2026-DBD-019`) on 2026-09-02, when the tool's source moved to this repository and the dashboard became a host. Paths in this record predate the workspace split: read `src/diagram/` as `workspaces/core/src/`, and any other `src/` path as `workspaces/app/src/`. Cross-references to IBC2026 decision records and specs resolve in the [5g-emerge-ibc-2026 repository](https://github.com/5g-emerge/5g-emerge-ibc-2026).

## Goal

Settle one vocabulary across the whole system before mapping or renaming anything.

The work has two ordered parts:

1. **Naming** settles the concepts, their boundaries, the areas they belong to and the preferred words for them without reference to today's implementation names.
2. **Mapping** classifies today's documents, interface and code against those settled concepts without renaming them.

Only after both parts are agreed does rollout change `docs/specs/vocabulary.md` or code.

Product and production are deliberately distinct:

- **Product** is the Infoschematic together with its Standalone Scenes, Themes and Stories.
- **Production** is how the Producer authors and presents the product to the Audience.

## Context

The naming and mapping analysis below captures the vocabulary already agreed and the remaining gaps that must be resolved before rollout.

## Naming

Naming defines the product and production on their own terms. It answers what each concept means before asking where that concept lives today.

### Product

The product comprises an **Infoschematic**, independently reusable **Standalone Scenes**, lightweight **Themes** and narrative **Stories**. The Infoschematic defines the persistent visual world; Scenes compose focus over it; Themes group owned Scenes for exploration; Stories arrange owned Scenes into a narrative.

The way an Infoschematic is displayed may vary, but that does not change what the Infoschematic means or which artefacts it contains.

```text
Product
├── Infoschematic
│   └── Artefacts
│       ├── Background
│       │   ├── Lanes
│       │   └── Zones
│       ├── Midground
│       │   └── Fabrics → focusable
│       └── Foreground
│           ├── Flows → focusable
│           ├── Cards → focusable
│           │   ├── Standard cards
│           │   └── Adapter cards
│           └── Graphics → visibility controlled by Scenes
├── Standalone Scenes
├── Themes
│   └── Thematic Scenes → navigational order
└── Stories
    └── Story Scenes → narrative order
```

#### Infoschematic

- **Infoschematic** — the complete structural diagram within the product. It establishes what exists and how it is laid out and connected.
- **Infoschematic artefact** — any independently identifiable and controllable visual element instantiated in an Infoschematic. The Infoschematic artefact type is the union of all six primary artefact types.

An Infoschematic has six primary artefact types:

- **Lane** — a full-width background region of the Infoschematic.
- **Zone** — a named subdivision of a Lane forming part of the Infoschematic background.
- **Fabric** — a midground artefact that may participate in Flows and be focused within a Scene.
- **Card** — a box-like foreground artefact. A **standard card** is the uniform card itself; an **adapter card** wraps a standard card to adapt it without taking an independent position.
- **Flow** — a foreground artefact showing movement, particularly information, between Cards, between a Card and a Fabric, or between Fabrics.
- **Graphic** — a foreground artefact drawn above the structural Infoschematic and normally hidden until a Scene makes it visible. Graphics express visual material such as the existing gap and cycle figures that focus alone cannot show. _Infoschematic Graphic_ is the formal name; _Graphic_ and _Graphics_ are the shorter product and interface terms.

Every Infoschematic artefact is conceptually placeable, movable, resizable and orderable, although each artefact type requires a different geometric treatment. Lanes and Zones use region bounds, Fabrics and Cards use box bounds, Flows use routes, endpoints and route extent, and Graphics use visual bounds.

Depth and stacking are related but distinct:

- **Depth** groups artefacts into background, midground and foreground.
- **Kind order** supplies the default order of artefact types within a depth.
- **Stack order** determines the order of individual artefacts within the same kind. Producers may reorder artefacts only within their kind; kind boundaries remain fixed.

The default bottom-to-top kind order is Lanes, Zones, Fabrics, Flows, Cards and Graphics. This lets Flows run behind Cards where necessary and keeps Graphics above the structural foreground. Fabrics, Flows, Cards and Graphics each require explicit internal stack order; an adapter wrapper stays immediately behind the standard Card it wraps rather than floating independently in the Card stack.

A Flow's **route**, **waypoints** and **ports** control its geometry and attachment. They are details of a Flow, not additional primary Infoschematic artefacts.

Labels and other persistent controllable figures belong to the artefact they describe unless mapping demonstrates a need for independent artefact identity. Graphics are persistent Infoschematic artefacts whose visibility is controlled by Scenes; Callouts remain directorial material rather than Infoschematic artefacts.

#### Scenes

- **Scene** — a presentation composition over an Infoschematic. It says which Fabrics, Cards and Flows are in focus and which recede, which Graphics are visible and whether a Callout is present.
- **Standalone Scene** — an independently authored and reusable Scene that does not belong to a Theme or Story.
- **Thematic Scene** — a Scene independently owned by a Theme.
- **Story Scene** — a Scene independently owned by a Story.

Lanes and Zones remain background context and cannot be focused by a Scene. Graphics are switched on or off rather than focused. The focusable artefact type is therefore the union of Fabric, Card and Flow rather than the complete Infoschematic artefact union.

A Scene declaratively records its focused artefact set and visible Graphic set. Artefacts outside the focus set recede and Graphics outside the visible set remain hidden, so navigating directly to any Scene always produces the same result regardless of the previously presented Scene.

Every Standalone, Thematic or Story Scene may have exactly one optional Callout. Its placement is either automatic or directed; no responsive override is required because the Infoschematic has a fixed layout. A Scene may be empty, focus nothing and show no Graphics.

A Producer may compose a Thematic Scene or Story Scene directly inside its container without first creating a Standalone Scene. Adding a Standalone Scene to a Theme or Story copies it into an independently owned Scene with no link or provenance back to its source.

#### Themes

- **Theme** — a lightweight grouping of independently owned Thematic Scenes around a shared subject. Its Scene order supports navigation but does not claim narrative progression. The Theme replaces the earlier _act_: a themed collection of Scenes rather than a narrative arrangement.

A Theme has a title and optional short description that provide context on each Thematic Scene Callout. Its Callout presentation is extensible: the realised Partners Theme uses a split panel with the vendor logo and blurb alongside the common Callout. A Theme may be empty, may be composed directly or created from Standalone Scenes, and cannot contain another Theme or Story. In Present, starting a Theme lets the Audience navigate manually through its Thematic Scenes.

#### Stories

- **Story** — independently owned Story Scenes arranged into a particular narrative. Narrative describes the explanatory progression created by the arrangement; it is not another product part alongside the Story.

A Story may be empty, may be composed directly or created from Standalone Scenes, and cannot contain another Story or Theme. A Story Scene may add narrative and timing to its presentation composition; timing is exclusively a Story capability. In Present, a Story supports both manual navigation and timed automatic progression.

### Production

**Production** is the coordinated work of presenting the product, designing its Infoschematic, and directing its Scenes, Themes and Stories. It names how the product is created and used, not the product itself.

```text
Production
├── Roles
│   ├── Producer
│   └── Audience
└── App
    ├── Modes
    │   ├── Present → Audience experience and navigation
    │   ├── Design → Infoschematic, six artefact kinds, Library and stacking
    │   └── Direct → Scenes, Themes, Stories, Storyboard, Graphic visibility and Callouts
    └── Panels
        ├── Infoschematic panel
        ├── Producer controls
        └── Details panel
            ├── Info
            ├── Schematics
            └── Production
                ├── Design
                ├── Scenes
                ├── Themes
                └── Stories
```

#### Roles

Production has two primary roles around the product:

- **Producer** — the person or role that shapes and controls the product across Present, Design and Direct.
- **Audience** — the people who consume the product. _Consumer_ is a possible alternative, but Audience is preferred because it names the recipient of a media product without implying a commercial customer or software operator.

The Producer uses Design and Direct to author the product and initiates Present when it is ready to be shown. The Audience receives Present and does not receive editorial capabilities.

#### App

##### Modes

The App directly models three modes, in the order Present, Design and Direct:

- **Present** — the non-editorial, Audience-facing mode. It owns no authored product state. The Producer may select a Standalone Scene or start a Theme or Story, after which the Audience can navigate the container's elements.
- **Design** — the editorial mode that owns the Infoschematic and all six artefact types, including their creation, selection, placement, movement, size, connections and stacking. Its **Library** contains reusable templates for Cards, Fabrics and Flows, predominantly Fabrics at present. Using a template creates an independent artefact with no link back to its template.
- **Direct** — the editorial mode that owns Standalone Scenes, Themes and Stories. It composes Scene focus and Graphic visibility, copies Standalone Scenes into containers, arranges Thematic and Story Scenes, edits their Callouts, and previews the result. Its **Storyboard** is the production view through which the Producer sees, arranges and edits the Story Scenes in a Story.

> Present lets the Audience experience the product. Design changes the Infoschematic. Direct changes how Scenes, Themes and Stories focus and explain it.

Design and Direct are the two editorial modes; Present is not editorial.

Present preserves these existing behaviours:

- Start and stop a Theme or Story.
- Navigate to the previous or next Thematic or Story Scene.
- Show the current position and total Scene count.
- Apply Scene focus and Graphic visibility and display its Callout.
- Use cyclic navigation where the container permits it.
- Advance a Story manually or automatically using its timing.
- Navigate a Theme manually without implying narrative timing.
- Return to the unfocused Infoschematic when the presentation ends.

##### Mode controls

Control ownership follows the capabilities already implemented where possible:

- **All modes** retain Scope and Family visibility, fullscreen and panel-collapse controls.
- **Present** owns Story and Theme selection and navigation, Story automatic progression, the annotation overlay with its key takeaways, Callout presentation, and the Info and Schematics views.
- **Design** owns structural selection and movement, Card and adapter creation, Flow creation, endpoints, ports, routes, waypoints, labels, text, grid, snapping, undo, redo and discard. It expands later to all six artefact types and explicit stacking.
- **Direct: Standalone Scenes** owns Scene creation, removal, naming, description, focus, Graphic visibility, Callout editing and preview.
- **Direct: Themes** owns Theme creation, Thematic Scene composition and ordering, Theme context, extensible Callouts and manual-navigation preview. This workspace is not implemented today.
- **Direct: Stories** owns Story Scene composition and ordering, narrative, timing, focus, Graphic visibility, Callout editing, and manual or automatic preview.

The current Producer controls remain mounted while editing, so Story and Partner execution is technically available in the present editors. In the settled boundary, execution belongs to Present and equivalent preview controls belong to Direct; Design does not own Story or Theme execution.

##### Callouts

- **Callout** — optional directorial material attached to a Standalone, Thematic or Story Scene. Each Scene has at most one Callout; a Callout is not an Infoschematic artefact.

Callout placement is automatic unless the Producer directs a position in Direct. A directed position is stored relative to the fixed Infoschematic rather than responsive screen layouts. Story Callouts carry narrative information; Theme Callouts carry the Theme title and optional short description and may add extensible content such as the Partners logo-and-blurb split panel. Standalone Callouts carry their Scene's independent explanatory material.

The common Callout contract must preserve everything available today:

- Story title, caption, takeaways, timing and navigation.
- Theme title and optional short description.
- Vendor headline, logo, blurb or profile, and takeaways.
- Wide and split-panel presentation.
- Previous, next and exit controls.
- Automatic or directed placement.
- Standalone Scene explanatory content.

The implementation may use optional regions, variants or extensible payloads; the settled requirement is one Callout per Scene without losing current Story or Partner presentation features.

##### Panels

The App has three persistent panels. The selected mode changes what the panels expose and allow, but does not change their identity:

- **Infoschematic panel** — the primary visual area in which the Infoschematic is displayed and worked with.
- **Producer controls** — the lower control surface. In Present it selects and navigates Standalone Scenes, Themes and Stories and controls visibility. In Design it supports selection, visibility and structural work. In Direct it selects and previews the material being directed.
- **Details panel** — the right-hand contextual area for information about the current Infoschematic and selected Infoschematic artefacts. Its Audience-facing views are Info and Schematics; its Production state exposes Design, Scenes, Themes and Stories.
- **Info** — descriptive information about the Infoschematic or current selection.
- **Schematics** — structural and technical information about the Infoschematic or current selection. It completes the expression **Info + Schematics = Infoschematic**.
- **Production** — the Producer-facing state of the Details panel. It exposes Design plus the Scenes, Themes and Stories workspaces belonging to Direct; it does not introduce another conceptual mode alongside Present, Design and Direct.

## Mapping

Mapping takes the vocabulary settled in Naming and identifies what each present term, document, interface surface and code structure means. It records genuine exceptions and ambiguities before proposing any rename; resemblance between words is not enough.

This inventory covers authored identifiers and data under `src/play/`, product types and derived data under `src/model/`, generic diagram mechanics under `src/diagram/`, reusable visual definitions under `src/library/`, the presentation descriptors at the root of `src/`, App state and components under `src/app/`, visible interface labels, accessibility labels and CSS area names.

### Product mapping

#### Infoschematic and its artefacts

- **`topology` / `Topology*` → realised Infoschematic vocabulary.** `TopologyDiagram`, `TopologyComponentEntry`, `TopologyFlowEntry`, `topologyLanes`, `topologyComponents`, `topologyFabricRegions`, `topologyFlowRegistry` and related identifiers describe this product's Infoschematic. _Topology_ remains a valid technical description, but it is not the product name.
- **`diagram` → generic diagram machinery or an Infoschematic, by layer.** `src/diagram/` contains reusable geometry, editing, placement, routing, ports, guides and waypoints and should retain a generic technical name. `TopologyDiagram` and `EditableDiagram` use that machinery to display or edit an Infoschematic. A global `diagram` → `Infoschematic` replacement would therefore be wrong.
- **`model` → product-model layer, not a synonym for Infoschematic.** `src/model/` declares and derives the shapes used to realise the product. The rendered data represents an Infoschematic, but _model_ still correctly describes the software responsibility.
- **`play` → authored product data.** `src/play/` currently contains Infoschematic instances, Standalone Scenes, Stories, the realised Theme, product metadata and supporting resources. It does not map to one settled concept and should eventually be divided by responsibility rather than renamed wholesale. The word _play_ is retired with the theatre register this naming replaces; the directory keeps today's name only until rollout divides it.
- **`component` → Card or Fabric in the current model.** `TopologyComponentId` is the union of service-card and Fabric identifiers, and `topologyPlaceables` combines Cards and Fabric regions. The current term is broader than Card but narrower than Infoschematic artefact because it excludes Lanes, Zones, Flows and Graphics.
- **`service` → standard Card.** Services in `TopologyComponentEntry` and `topologyServices` are the standard box-like Cards.
- **`adapter` / `wraps` → adapter Card.** Created and authored Cards record the standard Card they wrap; this maps cleanly to the settled adapter-card distinction.
- **`transport region` / `fabric region` / `network` → Fabric.** `topologyFabricRegions`, `topologyFabrics` and the present `network` variable names all express the midground Fabric concept.
- **`lane` and `zone` → Lane and Zone.** `TopologyLane`, `TopologyZone` and `topologyLanes` already use the settled terms and preserve their background relationship.
- **`flow` / `line` → Flow.** Product types and authored data predominantly use Flow; several editor and panel names still use Line for the same foreground artefact.
- **Registry and array order → implicit stack order.** The current realisation already depends on authored and rendered ordering, particularly for Flows, but does not expose stacking as a consistent Infoschematic capability within all six artefact kinds.
- **`route`, `waypoint`, `port`, `named point` and label position → Flow or layout controls.** They express geometry, attachment or annotation details and do not earn additional primary artefact types.
- **`interface` → Schematics data.** `TopologyInterface` and `topologyInterfaces` describe the interfaces that Cards offer and Flows carry. They are contextual technical information about the Infoschematic, not a seventh primary artefact type.
- **`specification` and `contract` → real technical documents when used in the data layer.** `TopologySpecificationGroup`, `TopologyInterfaceDocument`, `src/app/panels/contracts.ts` and `SpecificationOverlay` read or describe published contracts. These uses remain specification and contract even though the visible Details-panel view maps to Schematics.
- **`taxonomy`, `scope` and `family` → classifications and visibility controls.** Scopes classify Cards and Fabrics; families classify Flows. They control what is visible but are not Infoschematic artefacts or modes.
- **`overlay`, `gap`, `cycle` and `StageOverlay` → the first realised Graphics.** They are currently named directly by an optional singular field on a Story Scene and drawn without an Infoschematic Graphic registry. The settled model moves their identity into the Infoschematic and lets every Scene declare a visible Graphic set.
- **`ShortcutOverlay` and `SpecificationOverlay` → generic interface overlays, not Graphics.** These components temporarily cover interface content and retain the ordinary software meaning of overlay. Renaming the Infoschematic artefact to Graphic prevents a product-model collision with them.

#### Scenes, Themes and Stories

- **`Spotlight` / `spotlights` → Standalone Scene / Standalone Scenes.** `src/play/spotlights.ts`, `Spotlight` and the exported `spotlights` contain named focus compositions that exist independently of Stories.
- **`highlight`, `lit`, `lighting` and `spotlight` as operations → Scene focus treatment.** `useStage`, `TopologyDiagram` and the CSS use these words for the visual effect that brings Fabrics, Cards and Flows into focus and lets the rest recede. Their omission of Lanes, Zones and Graphics is intentional: Graphics use visibility rather than focus.
- **`SceneLibrary` → Standalone Scenes workspace, not the Design Library.** `SceneLibraryPanel`, `useSceneLibrary` and `scene-library.ts` manage the focus compositions authored as `spotlights`. Their use of _Library_ conflicts with the settled Design Library, which contains artefact templates.
- **`Demonstration` / `demonstrations` → Story / Stories.** Each `Demonstration` has an ordered `steps` sequence, a question and narrative captions and is exposed to users under the visible label Stories. _Demonstration_ is therefore a live implementation term, not merely a discussion alternative.
- **`DemonstrationStep` / story `Scene` / beat / step → Story Scene.** A step owns narrative text, timing, focus, a possible Callout and optional singular Graphic identified by the current `overlay` field. `scenes.ts` already names `DemonstrationStep` as `Scene`, but the current model does not distinguish its independent Story ownership from a Standalone Scene.
- **`scene` reference on a `DemonstrationStep` → Standalone Scene used as a Story Scene source.** `presentation.ts` resolves an optional Standalone Scene identifier into the Story Scene's focus lists. The settled model treats addition as a copy with independent ownership rather than a continuing live relationship.
- **`caption`, `title`, `takeaways`, `hold`, `callout` and `anchor` → Story Scene direction.** These fields say what the Story Scene explains, for how long, and where its Callout appears. `anchor` is a Callout focal Card here; geometric anchors elsewhere must remain technical geometry terms.
- **`Vendor` / `vendors` / Partners → Theme / Thematic Scenes.** The non-cover Vendor entries are independently navigable focus compositions under the shared Partners subject. The visible label Partners names this realised Theme; neither Vendor nor Partner is a role alongside Producer and Audience.
- **The Vendor cover → a current stand-in for Theme context backed by product metadata.** The settled Theme has no separate introduction: its title and optional short description appear with each Thematic Scene Callout. The present cover remains a mapping exception rather than a preferred Theme element.
- **`programme` → product identity and introductory metadata.** It is neither an Infoschematic, a Theme, a Story nor Production.
- **`presentation.ts`, `presentation-types.ts` and `presentation.test.ts` → mixed product assembly.** They type, validate and resolve Standalone Scenes, Stories and the Partners Theme and provide Story timing helpers. The module name does not mean the Present mode.
- **`narrative` → a descriptive property of a Story.** The word occurs in code comments and visible styling, but no separate narrative model exists or is needed.
- **`act` and `beat` → retired by Theme and Story Scene.** The comment-level model in `src/presentation-types.ts` — an act is scenes in order, a beat plays one — carries no identifiers. The themed Scene collection, the Theme, replaces the act; a Story's beats are its Story Scenes.

### Production and App mapping

#### Roles and modes

- **`editor`, `editing` and `author` → Producer activity in Design or Direct.** `useEditor`, `EditorPanel`, `EditorTools` and related names cover structural editing as well as Scene and Story editing. They do not establish an Editor role separate from Producer; ordinary edit and author verbs can remain verbs.
- **`EditorMode = 'stage' | 'scene' | 'story' | null` → Design, Direct, Direct and Present respectively.** The `stage` value changes the Infoschematic, while `scene` and `story` change explanatory product material. `null` is the non-editorial state reached on the Audience-facing side. No current value represents Theme editing.
- **`backstage` / `front of house` → the present editorial boundary.** `useStage` holds a `backstage` boolean, and `TitleBar` exposes Open editors / Leave editors. Backstage selects the Producer-facing workspaces; front of house exposes the Audience-facing views. This state is not yet a direct model of the three settled modes.
- **`Stage` / `useStage` → mixed production state.** The hook currently owns visibility filters, Scene focus, Story execution, Theme selection, Present options and the backstage boundary. It cannot map to a single preferred term.
- **`presentation` and `performance` in App comments → Present activity.** These uses describe the Audience-facing experience, whereas the root presentation modules contain authored product data. The same word currently crosses the product/production boundary.
- **`playing`, `run`, `step`, `auto-advance` and `hold` → Present execution of a Story.** They are runtime controls and state, not additional product parts or preferred mode names.
- **`vendor`, `stepVendor` and Partner navigation → Present navigation of a Theme.** Current Partner navigation manually moves between Thematic Scenes and wraps through the collection.

#### Present behaviour to preserve

- **Story navigation.** `startDemonstration`, `stepDemonstration`, `stopDemonstration`, `autoAdvance`, the Story Callout controls and the current step counter already provide start, stop, previous, next, timed progression and position.
- **Theme navigation.** `toggleVendor`, `stepVendor`, `lightNothing` and the shared Callout provide selection, previous, next, cyclic navigation and exit for the realised Partners Theme.
- **Shared Scene treatment.** Story Scenes, Partner Thematic Scenes and Standalone Scenes all use the same focus calculation, so changing the container does not change how its Scene focuses the Infoschematic.
- **Unfocused return.** Clearing the current Story, Theme or Standalone Scene returns the Infoschematic to its unfocused state.

These behaviours are capabilities to retain through mapping and renaming, not legacy terminology to remove.

#### Panels and visible labels

- **`stage-panel`, `stage-column`, `TopologyDiagram` and the visible topology area → Infoschematic panel.** The area displays and edits the Infoschematic. _Stage_ is not required as a settled concept.
- **`Lighting`, `lighting-panel`, `lighting-bank`, `PanelRail` and `control-room` → Producer controls.** Their Scopes and Families control visibility, Stories start Story execution, and Partners select a Theme. _Lighting_ describes only the focus treatment, not everything this panel controls.
- **`Book`, `book-panel`, `state-panel` and “What is showing” → Details panel.** These identifiers name the right-hand contextual area across both Audience and Producer states.
- **Info / `showing` → Info.** The visible label already uses the settled term; the internal tab identifier `showing` is an older description of the state.
- **Specifications / `specifications` → Schematics only at the panel-view boundary.** The visible tab and tab state map to Schematics. The actual interface specifications and contracts presented inside it retain their technical names.
- **Stage tab / `mode === 'stage'` → Design.** This workspace changes Cards, Fabrics, Flows and their layout and therefore maps to the Design mode and Design section of the Details panel.
- **Scenes tab / `mode === 'scene'` → Direct: Standalone Scenes.** `SceneLibraryPanel` edits focus compositions that exist independently of a Theme or Story.
- **Themes → missing Direct workspace.** The Partners Theme can be navigated in Present but has no equivalent Theme authoring tab or model.
- **Stories tab / `mode === 'story'` → Direct: Stories and Storyboard.** `SceneListPanel` selects a Story and displays, inserts, removes and orders its Story Scenes. It is the current implementation closest to the Storyboard tool, although neither the component nor the model uses that name.
- **`ModelRegister`, `InterfaceLines`, `contracts` and `SpecificationOverlay` → Schematics content.** These are Details-panel contents rather than additional panels.
- **`DemonstrationCallout` → current shared Story and Theme Callout presentation.** The same component presents Story Scene direction, Partner Thematic Scene material and the present Theme-cover exception. The settled Callout also supports Standalone Scenes and an extensible Theme split panel, so the current name and shape are narrower than its responsibility.

#### Library and supporting resources

- **`src/library/` → part of the Design Library.** It contains reusable React/SVG realisations for Fabrics such as Internet, mobile, satellite and telemetry, plus shared Fabric definitions. It currently provides one artefact-template family rather than templates across Cards, Fabrics and Flows.
- **Partner logos and scope icons → production resources.** `src/play/partners/`, `logos.ts` and `scope-icons.ts` support how the product is displayed and controlled; they are not Infoschematic artefacts merely because they are visual assets in the repository.

### Discussion-only and domain-language terms

The source audit distinguishes terms that influenced the discussion from terms that actually carry implementation meaning:

- **Absent from source:** Infoschematic, artefact, Graphic, Theme, blueprint, playwriting, Director, Producer, Storyboard and playout. They are preferred or considered vocabulary, not current code terms.
- **Audience is not yet an App role.** Its source occurrences are ordinary prose about audiences and viewers in programme or partner copy, plus comments; no Audience type, state or interface concept exists.
- **Consumer is domain language, not the preferred role.** It appears in identifiers such as consumer content steering and in media-delivery copy. Those occurrences must not be renamed to Audience.
- **Asset is domain copy, not the product model.** Its live occurrence describes live/VOD media assets in partner prose rather than Infoschematic artefacts.
- **Rehearsal is comment-only.** It explains one choice about takeaways and does not establish a mode or workflow concept.
- **Plot, subplot and script are absent.** They do not earn product concepts at this stage.
- **Rendering is generic implementation prose.** It does not establish a separate product or production concept.

### Mapping gaps

1. **The canonical vocabulary is not represented at the top level.** Nothing in source yet names Infoschematic, Producer, Audience, Present, Design, Direct, Theme or Storyboard as the settled concepts.
2. **Stage is overloaded.** It names the main panel and CSS, a tab and editor mode, the `useStage` state container, the `Stage` return type and informal runtime surface. These uses map to Infoschematic panel, Design, mixed Production state and Present respectively and cannot share one replacement.
3. **Story Scene ownership is not explicit.** Some `DemonstrationStep` entries resolve a Standalone Scene while most compose focus inline. The implementation does not model the common result as an independently owned Story Scene with no continuing source relationship.
4. **Scene means two different structures.** `scene-library.ts` uses Scene for a reusable `Spotlight`, while `scenes.ts` uses Scene for a `DemonstrationStep` whose identity is its position in a Story. They map to Standalone Scene and Story Scene respectively.
5. **Theme has no explicit model.** The Partner/Vendor sequence realises Theme navigation but combines Theme identity, Thematic Scene content and a programme-backed cover in one `Vendor` sequence. The preferred Theme carries title and optional description context on each Callout rather than a separate introduction.
6. **Library is overloaded.** `src/library/` is the beginning of the settled Design Library; `SceneLibrary` means Standalone Scenes. The latter maps to the Scenes workspace rather than competing for the same preferred noun.
7. **Presentation crosses the product/production boundary.** Root presentation modules assemble authored Scenes, Stories and the Partners Theme, while App comments and runtime state use presentation for Present. The two responsibilities need separate destinations.
8. **Component obscures the artefact union.** It combines Cards and Fabrics, while generic diagram and editor APIs also use Component for placeable boxes. No current umbrella identifier covers all six Infoschematic artefact types, and no focusable union names the intended Fabric, Card and Flow subset.
9. **The App does not model the three modes directly.** It combines `backstage` with three editor values. Design and two Direct workspaces are represented, Present is inferred from the absence of an editor, and Theme editing is absent.
10. **Specifications has a necessary split mapping.** The Details-panel label maps to Schematics, but specification and contract remain correct for the external documents and interface metadata shown inside it.
11. **Callout ownership is implicit.** Story and Partner material share `DemonstrationCallout`, Standalone Scenes have no Callout presentation, placement fields live on Story steps and Theme content follows a different shape. The one-Callout-per-Scene rule, automatic-or-directed placement and extensible content remain to be expressed.
12. **Graphic identity and Scene visibility are implicit.** `gap` and `cycle` are a closed singular `overlay` union on Story steps rather than registered Infoschematic Graphics. No current Scene model declares a deterministic visible Graphic set.

### Capability gaps exposed by the mapping

These gaps describe what the settled model says the product should be able to do but the current App cannot yet do consistently. They are not instructions to implement those capabilities as part of this naming item.

- **Editorial control over every Infoschematic artefact.** Design needs consistent creation, selection, movement, resizing and ordering capabilities across Lanes, Zones, Fabrics, Cards, Flows and Graphics, with type-appropriate geometry.
- **Fabric geometry.** Fabrics specifically need direct movement and resizing so the Producer can enlarge, contract and position their regions.
- **Explicit stacking.** Design needs controls and persisted data for per-kind stack order, including Flow overlap, Cards above Flows, adapter wrappers immediately behind their Cards and Graphics above Cards. Reordering remains within each fixed kind.
- **Complete Design Library.** The present Fabric renderers need to become part of a Library contract that can also support Card and Flow templates. Instantiation creates an independent artefact with no link or provenance back to its template.
- **Theme authoring.** Direct needs creation and editing of Themes and their Thematic Scenes rather than relying on authored Partner/Vendor data.
- **Independent Scene composition.** Direct needs to create Standalone Scenes and to compose Thematic and Story Scenes directly or copy them from Standalone Scenes without retaining a link or provenance.
- **Scene Graphic control.** The Infoschematic needs a Graphic registry, and every Scene needs a declarative visible Graphic set so direct navigation, backward navigation and automatic Story progression produce the same state. This replaces the current singular Story-only `overlay` field.
- **Graphic authoring.** Design eventually needs to create, select, move, resize and order Graphics within their kind. The existing fixed gap and cycle Graphics remain the initial capability until that future enhancement is delivered.
- **Callout direction.** Direct needs one optional Callout for each Standalone, Thematic or Story Scene, automatic or visually directed placement, and extensible Theme content such as the vendor logo-and-blurb split panel.
- **Present session semantics.** One future roadmap item must define what happens to active presentation state across mode transitions, enforce one active Standalone Scene, Theme or Story source, settle Scope and Family visibility precedence over Scene focus, and prevent an empty Theme or Story from starting while still allowing it to exist and be edited.
- **Explicit App modes.** App state and controls need to represent Present, Design and Direct directly, including the mode-specific Producer controls identified in Naming.

## Boundary

This item settles vocabulary, maps the current implementation, and prepares a coherent rename rollout. It does not implement the capability gaps discovered by the mapping or change visible behaviour while terminology is being aligned.

## Current state

The canonical vocabulary is now documented and applied across the public model, React runtime, component names, editor modes, visible copy, accessibility copy and CSS hooks. Host applications pass one complete serialisable `InfoschematicConfig` into React; authored data contains renderer keys rather than React components or derived runtime singletons. Compatibility-only storage keys retain their historical strings so an upgrade does not silently discard a user's saved preferences.

Capability gaps discovered by the mapping are retained separately in `INFOSCHEMATICS-TOOL-005`, `INFOSCHEMATICS-TOOL-006` and `INFOSCHEMATICS-TOOL-007`. Package consumption and release readiness is retained in `INFOSCHEMATICS-TOOL-004`.

## Steps

- [x] Define the product and production vocabulary.
- [x] Map current implementation terms to the settled concepts.
- [x] Resolve the remaining mapping gaps and explicit alternatives.
- [x] Update vocabulary documentation and execute dependency-ordered rename tranches.
- [x] Capture capability gaps as separate roadmap items rather than implementing them here.

## Files touched

- This roadmap record and any follow-on records it explicitly creates
- Vocabulary, architecture, and contributor documentation affected by the settled terms
- `workspaces/core/src/**` and `workspaces/app/src/**` identifiers named by the approved rollout

## Verify

- The roadmap audit passes with reciprocal dependencies and valid lifecycle metadata.
- Vocabulary terms have one preferred meaning across documentation, public types, visible labels, accessibility labels, and CSS hooks.
- Type-checking, tests, and dependency-boundary checks pass after each rename tranche.

## Dependencies / blocks

This item coordinates with `INFOSCHEMATICS-TOOL-001` wherever separation requires a settled public name, but it does not block ownership moves that retain current terminology. It has no local work-item dependency of its own; cross-repository references remain context rather than local lifecycle dependencies.

## Documentation impact

### Decision Records

Update existing naming decisions when their settled vocabulary changes; create a new decision only for a material boundary not already owned elsewhere.

### Specifications

Apply the approved vocabulary to the canonical specification in one coherent pass.

### Guides

Update architecture, contributor, and end-user guidance so product and production terms remain consistent.

### Roadmap

Create separate work items for capability gaps and keep `INFOSCHEMATICS-TOOL-001` aligned with the approved names.

## Review

### Delivered

Delivered the settled vocabulary, implementation mapping, documentation and dependency-ordered rename rollout against baseline `53c81f4d6c0b9f002b86d05030e37005c706d8ec`. The change remains terminology-only: capability gaps were recorded separately and visible behaviour was preserved.

### Summary of changes

Added the canonical vocabulary specification and repository guidance; aligned public Model and React seams; renamed React runtime members, components, files, editor modes, visible copy, accessibility copy and CSS hooks; and captured publication, production-mode, artefact-editing and renderer-registry follow-ons as `INFOSCHEMATICS-TOOL-004` through `INFOSCHEMATICS-TOOL-007`. Historical local-storage keys remain readable compatibility details and are documented as such.

### Verification

`bun install --frozen-lockfile` completed without changes. `bun run check` passed 87 tests in nine files, TypeScript checks for Core, Model, React, the blank example and the site, dependency-cruiser across 89 modules and 198 dependencies, and the production site build. `rumdl check` passed all changed guidance and roadmap files; the authoring audit passed.

### Outstanding concerns

None within this item's naming boundary. Remaining capability work is explicit in the follow-on records rather than hidden in this review.

### Post-change review

The public seam and internal implementation now use the same product and production language. Compatibility strings cannot leak through exports or visible copy, and regression tests assert that retired public members remain absent. The item is ready for human acceptance review.

### Mini recap

Infoschematics now has one vocabulary from authored configuration through React presentation, with capability gaps preserved as independently shapeable work. Verification is green and no new durable learning needs promotion beyond the repository guidance and specification added here.

## Discussion

### Rollout

First complete and agree this mapping without renaming anything. Then update `docs/specs/vocabulary.md` in one coherent pass and prepare exact rename recipes in dependency order: conceptual ownership, product data, App state, panels, types, components, identifiers, visible labels, accessibility labels and CSS hooks.

This naming retires the theatre register wholesale — stage, lighting, book, play, playwriting, performance, spotlighting and act stop being the settled words. The rollout pass therefore covers every document that states that register as settled, not only the vocabulary spec: `docs/specs/vocabulary.md` (TERM-011 and kin), `ADR-IBC2026-005`'s directory prose, `IBC2026-DBD-018`'s named parts, the `docs/design/` documents and `AGENTS.md` — one pass, so no two records disagree about which vocabulary is current.

The Naming section is also the bootstrap for the end-user documentation: the product and production described on their own terms, before any implementation vocabulary, is exactly what a reader new to the tool needs first, so end-user docs start from this text rather than being written fresh.

Capability gaps should become separate follow-on work rather than expanding this naming item into implementation. Present session semantics should be extracted as one cohesive future roadmap item; after extraction, DBD-019 retains this summary and links to that item so the naming rationale remains traceable.

Each implementation change must preserve the product-versus-production distinction and the existing Present navigation behaviours settled here and pass focused verification, so the codebase adopts the vocabulary once rather than debating it one rename at a time.
