# Studio view design intent

Studio adds Producer-facing Design and Direct capability to Present. It is a structured Infoschematic authoring environment, not a general drawing tool: every control changes something the domain model can express, and every constraint is enforced at the point of editing.

The destination is stated here so isolated editing affordances grow into one coherent production workflow. This document describes intent rather than claiming what is implemented today.

## Purpose

Studio supports two closely related loops:

- **Design** shapes the Infoschematic: its artefacts, geography, identity, layout, ports and Flows.
- **Direct** shapes its presentation material: Standalone Scenes, Themes, Stories, Callouts and Graphics.

Both loops should provide immediate visual feedback while keeping the authored `InfoschematicConfig` serialisable and reviewable. Studio derives runtime state from that configuration; it does not make browser state or React components part of the product.

## Production modes and state ownership

The application exposes one transient `ProductionMode`: `present`, `design` or `direct`. Present belongs to the Audience; Design and Direct belong to the Producer. A new session and every reload begin in Present, even when an editing draft has been retained.

Mode does not collapse all interaction into one state object. Audience preferences and filters, active presentation focus and playback, and Producer editing state remain separate. Entering Design or Direct stops playback and clears the active Standalone Scene, Thematic Scene or Story without discarding the Audience's Scope and Flow-family filters. Returning to Present reuses those filters but never resumes a Story or restores presentation focus automatically.

Design and Direct use the complete authored Infoschematic rather than the filtered Audience projection. Design therefore keeps every editable artefact reachable. Direct derives a separate draft preview from its active authoring target, so navigating or editing production material cannot accidentally change what Present had focused.

## Structured editing

Studio offers choices the Infoschematic model already understands. It selects a Lane or Zone, chooses a Flow family, moves a waypoint or changes a renderer key; it does not expose arbitrary rotation, per-object paint, unrestricted shapes, fonts or z-order.

Where the model constrains a value, Studio prevents an invalid choice rather than accepting it and warning later. Where a value is derived, Studio changes the authored input from which it is derived.

This makes adding a new artefact kind deliberate. The model, vocabulary and renderer contract gain the concept before Studio gains a control for it.

## Grid and Canvas

Design uses one presentation grid for Cards, Flow waypoints, ports and labels. A finer rule and a stronger major rule make alignment readable by eye without competing with the Infoschematic.

The grid fills the Canvas coordinate system exactly and sits above geographic fills but below the artefacts it helps align. Alignment guides remain separate: the grid establishes rhythm, while guides align the edited item with a particular edge, centre, boundary or label.

The Canvas has an explicit boundary distinct from any Lane or Zone. Moving an artefact towards that edge should make the available extent clear.

Grid interval and Canvas extent are product-level configuration or source decisions, not casual per-selection controls. Exposing them alongside ordinary placement would make it easy to invalidate the system used by routes and ports.

## Selection

Studio has one primary selection unless a concrete operation requires more. The selected kind determines which structured controls appear.

- Selecting a Lane or Zone exposes its extent and geographic role.
- Selecting a Fabric or Card exposes identity, text, placement, renderer properties and ports.
- Selecting a Flow exposes identity, endpoints, family, label and route.
- Selecting a waypoint exposes its position and route operations.
- Selecting a Scene, Theme or Story exposes its owned presentation material in Direct.

Clicking an artefact selects it; a short movement threshold separates that action from dragging. Clicking the empty Canvas or pressing Escape clears the selection. When labels overlap larger targets, the smaller explicit target takes precedence.

The properties surface leads with the selected identity and kind once. Controls then answer three questions in a stable order: what it is, where it sits and what meets or belongs to it.

The Canvas itself should remain the primary way to find visual artefacts. A parallel tree or register earns its place only when it solves a real reachability problem, such as selecting something currently hidden by the view.

## Position and geography

Every selected visual artefact reports its position in Canvas units, even where only part of its extent is editable. Numeric entry and dragging are two inputs to the same placement operation and should produce the same derived result.

Lanes and Zones are geography, not freely moving foreground artefacts. A Card remains within its Lane while it can move between Zones where the authored model permits. The useful rule is: clamp to the Lane and derive the Zone from the resulting position.

Moving a Card carries the things structurally attached to it:

- its Adapter Card;
- labels whose placement derives from it;
- the terminal points of Flows meeting its ports;
- the nearest route points needed to keep terminal runs orthogonal.

The rest of an authored route remains stable unless the edit explicitly changes it. Placement should not silently redraw a route into a different argument.

## Cards and Fabrics

A standard Card exposes its title, optional description, optional stereotype or family, renderer properties, scope, placement and ports according to the model it satisfies.

An Adapter Card wraps one standard Card and derives its placement from that relationship. Creating or moving the Adapter independently would contradict its meaning, so Studio works through the wrapped Card.

A Fabric may look like a background illustration, but Studio treats it as an addressable artefact: it has identity and bounds, can expose ports and can be a Flow endpoint. Rich artwork stays inside its stable geometric frame.

Creation starts with a valid minimal artefact and then exposes its editable properties. Removal remains visible as a pending authored change until applied, including the dependent Flows that would otherwise lose an endpoint.

## Ports

Ports divide a Card or Fabric side into named attachment positions. Their identifiers and drawing order follow the canonical side-and-number convention; their coordinates derive from the artefact bounds and the count configured for that side.

Studio shows ports while designing and distinguishes available, occupied, pointed-at and selected states. A dragged Flow end previews the port it would take before release.

Changing a side's port count preserves geometric intent. Existing Flow ends move to the nearest resulting port rather than retaining a number whose position has changed. Counts respect the available side length, the presentation grid and minimum endpoint spacing.

## Flows and waypoints

A Flow is edited as relationships plus geometry:

- its endpoints identify Cards or Fabrics and their ports;
- its family and metadata describe what it means;
- its route is an ordered collection of points from which renderer output is derived;
- its label is positioned along that route.

Creating a Flow begins at one available port and completes at another. Studio establishes a valid orthogonal route and asks for semantic choices, such as Flow family, before the authored Flow is complete.

Selecting a Flow reveals its waypoints. A Producer can insert, move and remove a waypoint, or drag an interior route run perpendicular to itself. Each operation preserves orthogonality and normalises redundant collinear points.

Dragging an endpoint changes the attachment. Existing interior waypoints remain stable where possible, with a corner inserted when necessary to preserve the direction in which the route leaves its new port. Dragging a waypoint near an endpoint bends the route rather than pulling the endpoint away from its port.

A label moves along its own route, not freely across the Canvas. Its authored position is a proportion of route length so that it remains meaningful when the route changes. Guides are offered only on the axis the label can actually move along.

## Directing presentation material

Direct uses the same Canvas to edit the product's presentation composition.

- A Scene declares deterministic focus, visible Graphics and optional Callout material.
- A Theme owns an ordered collection of Thematic Scenes without adding timing or narrative claims.
- A Story owns ordered Story Scenes and can add narrative timing.

Direct should distinguish editing the current Scene from merely navigating Present. Changing one Scene must not inherit accidental visibility or focus from whichever Scene was previously active.

The active Direct target is an explicit discriminated choice rather than a generic selected tab. It identifies one Standalone Scene, Theme, Story, Callout or Storyboard and carries the stable identity needed for that kind. A Callout target also identifies its owning Theme or Story Scene. Switching targets changes the authoring context only; it does not activate the target in Present.

Theme and Story authoring begins with an empty ordered collection when that is the clearest valid draft. Empty Themes and Stories remain editable, undoable and reviewable in Direct, but Present cannot activate them until they contain a valid Scene. A Callout storyboard belongs to its selected presentation owner and previews Callout content and placement without becoming a second presentation-focus source.

Graphics and Callouts remain serialisable authored material selected by renderer keys and properties. Studio previews them through the host registry owned by Canvas and Present, including the same validation, diagnostics and accessible fallbacks. It does not embed implementations in configuration or create a Studio-only registration seam.

## Authored-source handoff

Studio accumulates adjustments into a coherent change set. Applying that set is a deliberate handoff rather than an invisible write to source, a service or an arbitrary runtime store.

The handoff should describe model fragments keyed by stable identity and be readable in review. A Producer should be able to understand the resulting Cards, Flows, routes and presentation material without reconstructing a stream of pointer events.

Related consequences travel together. Moving a Card includes the affected route geometry; removing one names the dependent Flows; changing a port count includes endpoint reseating. Repeated edits to the same property consolidate into one final authored change.

Changes can be discarded individually or together. Undo and redo operate on whole gestures, so one drag is one step regardless of the pointer events it produced. Snapshot history is appropriate while Studio state remains small, serialisable data.

Once a new configuration already contains a pending value, Studio drops the corresponding draft instead of offering the same change forever.

## Session boundary

Draft changes can survive an accidental reload without making Studio the default experience for a newly opened Audience session. The `ProductionMode`, active Direct target, selection, presentation focus and playback are transient; reload always returns to Present with no active focus or running Story. Undo history can remain session-local even where drafts persist.

Persistence keys belong to the host or an explicitly identified Infoschematic. A configuration without an identity must not accidentally share production state with another blank or embedded instance.

## Non-goals

Studio is not intended to provide free rotation, arbitrary primitives, unconstrained colour, font selection or manual z-order. An Infoschematic remains a view of a structured model rather than a picture that happens to resemble one.

Studio also does not make deployment or source ownership part of the product. Hosts decide how an approved change set reaches authored configuration and how the resulting Infoschematic is published.
