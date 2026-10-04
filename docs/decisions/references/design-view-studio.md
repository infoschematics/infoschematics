# Studio view design intent

Studio adds [Producer](/docs/reference/vocabulary/#producer)-facing [Design](/docs/reference/vocabulary/#design) and [Direct](/docs/reference/vocabulary/#direct) capability to Present. It is a structured Infoschematic authoring environment, not a general drawing tool: every control changes something the domain model can express, and every constraint is enforced at the point of editing.

The destination is stated here so isolated editing affordances grow into one coherent production workflow. Most of it is now built, and what is built is claimed by the specifications rather than here: where this document and a specification disagree, the specification and the Decision Record behind it govern.

## Purpose

Studio supports two closely related loops:

- **Design** shapes the Infoschematic: its artefacts, geography, identity, layout, ports and Flows.
- **Direct** shapes its presentation material: Standalone Scenes, Sequences, Callouts and Overlays.

Both loops should provide immediate visual feedback while keeping the authored Infoschematic serialisable and reviewable, whether a host passes it as a canonical model or as a source-retaining document. Studio derives runtime state from that value; it does not make browser state or React components part of the product.

## The two production axes and state ownership

The application holds two transient axes. Whether it is producing is a capability boundary: the Producer's tools are out, or what is on screen is what the Audience gets. Which workspace the Producer is in — `design` or `direct` — is an arrangement of those tools over the same document. A new session and every reload begin not producing, even when an editing draft has been retained, and the workspace is kept across that so presenting a drawing and coming back resumes where the Producer left.

Neither axis collapses all interaction into one state object. Audience preferences and filters, active presentation focus and playback, and Producer editing state remain separate. Taking up the Producer's tools stops playback and clears the active Standalone or Sequence Scene without discarding the Audience's Scope and Flow-family filters. Putting them down reuses those filters but never resumes a Sequence or restores presentation focus automatically.

The Scope and Flow-family filters hold on either axis, because which content is drawn is a question about the Diagram rather than about presenting it. Design keeps every editable artefact reachable by showing which Scopes and families are hidden and letting the Producer restore them on its own Canvas. Scene focus and playback stay with Present. Direct derives a separate draft preview from its active authoring target, so navigating or editing production material cannot accidentally change what Present had focused.

## Structured editing

Studio offers choices the Infoschematic model already understands. It selects a Region, chooses a Flow family, moves a waypoint or changes a renderer key; it does not expose arbitrary rotation, per-object paint, unrestricted shapes, fonts or z-order.

Where the model constrains a value, Studio prevents an invalid choice rather than accepting it and warning later. Where a value is derived, Studio changes the authored input from which it is derived.

This makes adding a new artefact kind deliberate. The model, vocabulary and renderer contract gain the concept before Studio gains a control for it.

## Artefact capabilities

Design uses one discriminated capability contract for the six authored kinds: Region, Fabric, Card, [Point](/docs/reference/vocabulary/#point), Flow and [Overlay](/docs/reference/vocabulary/#overlay). A capability means the operation is available through the shared draft pipeline; the geometry role still determines what that operation may change. `DESIGN-014` in [the design-session specification](../../specs/design-session.md) states which kind may do what, and `artefactCapabilities` in View Model holds it.

Every selected element carries `kind`, stable `id`, geometry role and nullable authored `code`. This prevents a stale identifier from being interpreted against the wrong collection and lets Canvas, Properties and Changes share one selection value.

Regions, Fabrics, Cards and Overlays use box geometry and move and resize on both axes, down to the minimums View Model declares; an authored Region corner radius survives the change. A Point is a coordinate rather than a box, so it moves but has no extent to resize. Flow geometry belongs to endpoint, waypoint and route operations rather than a generic box gesture.

Reordering changes authored array order only within the selected kind. The operation never introduces cross-family z-order or lets an object move between the fixed geographic, artefact, Flow and Overlay depths.

## Grid and Canvas

Design uses one presentation grid for Cards, Flow waypoints, ports and labels. A finer rule and a stronger major rule make alignment readable by eye without competing with the Infoschematic.

The grid fills the Canvas coordinate system exactly and sits above geographic fills but below the artefacts it helps align. It is the only thing a placement is drawn towards: a pointer placement rounds to the grid, so every artefact shares one rhythm rather than each one being drawn towards whatever happens to be beside it. Numeric entry stays exact, and an authored grid size of zero stops rounding altogether. Aligning or distributing a group is a deliberate command measured against the selection anchor, not a pull the grid or a neighbour exerts.

The Canvas has an explicit boundary distinct from any Region. Moving an artefact towards that edge should make the available extent clear.

Grid interval and Canvas extent belong to the Diagram, not to a selection. The interval is the Diagram's authored `gridSize`, and Studio offers it as one Design control that writes a document edit, never beside ordinary placement, where it would make it easy to invalidate the system used by routes and ports.

## Selection

Design holds one ordered selection. Its first element is the [selection anchor](/docs/reference/vocabulary/#selection-anchor), a single selection is the one-element case of the same thing, and every control that acts on the selection acts on the anchor; only group geometry operations, align and distribute, look past it, as [ADR-INFOSCHEMATICS-025](../ADR-INFOSCHEMATICS-025-one-ordered-selection-with-an-anchor.md) records. The anchor's kind determines which structured controls appear. A Producer may also close an [interaction layer](/docs/reference/vocabulary/#interaction-layer) per kind, so its elements stop answering the pointer and keyboard without changing what is drawn.

- Selecting a Region exposes its extent and geographic role.
- Selecting a Fabric or Card exposes identity, text, placement, renderer properties and ports.
- Selecting a Flow exposes identity, endpoints, family, label and route.
- Selecting a waypoint exposes its position and route operations.
- Selecting a Standalone Scene or Sequence exposes its owned presentation material in Direct.

Clicking an artefact selects it; a short movement threshold separates that action from dragging. Clicking the empty Canvas or pressing Escape clears the selection. When labels overlap larger targets, the smaller explicit target takes precedence.

The properties surface leads with the selected identity and kind once. Controls then answer three questions in a stable order: what it is, where it sits and what meets or belongs to it.

The Canvas itself should remain the primary way to find visual artefacts. A parallel tree or register earns its place only when it solves a real reachability problem, such as selecting something currently hidden by the view.

## Position and geography

Every selected visual artefact reports its position in Canvas units, even where only part of its extent is editable. Numeric entry and dragging are two inputs to the same placement operation and should produce the same derived result.

Regions are geography, not freely moving foreground artefacts. A Card sits over whatever Regions its position places it in: the position is the claim, and there is no membership declaration to drift from it.

Moving a Card carries the things structurally attached to it:

- its Adapter Card;
- labels whose placement derives from it;
- the terminal points of Flows meeting its ports;
- the nearest route points needed to keep terminal runs orthogonal.

The rest of an authored route remains stable unless the edit explicitly changes it. Placement should not silently redraw a route into a different argument.

## Cards and Fabrics

A standard Card exposes its title, optional description, optional stereotype or Card Collection, renderer properties, scope, placement and ports according to the model it satisfies.

An Adapter Card wraps one standard Card and derives its placement from that relationship. Creating or moving the Adapter independently would contradict its meaning, so Studio works through the wrapped Card.

A Fabric may look like a background illustration, but Studio treats it as an addressable artefact: it has identity and bounds, can expose ports and can be a Flow endpoint. Rich artwork stays inside its stable geometric frame.

Creation starts with a valid minimal artefact and then exposes its editable properties. Removal remains visible as a pending authored change until applied, including the dependent Flows that would otherwise lose an endpoint.

## Library

The Library offers reusable Card, Fabric, Flow and Point starting points, not linked instances. Instantiation deep-copies the serialisable seed, allocates one fresh code that is also its `id`, takes its Card Collection from the document and its Scope or selected Flow endpoints from the Producer's context, places it clear of what is already drawn, and produces the same create operation as any other Design creation, by the one route [ADR-INFOSCHEMATICS-038](../ADR-INFOSCHEMATICS-038-a-creation-reaches-the-document-by-one-route.md) records. Template metadata and provenance never enter the authored document.

A Flow template is available only when the Producer has selected two valid, distinct ports and a Flow family. Its copied route begins and ends at those ports and is orthogonal before it enters the draft.

## Ports

Ports divide a Card, Fabric or Point side into named attachment positions. Their identifiers and drawing order follow the canonical side-and-number convention; their coordinates derive from the artefact bounds and the count configured for that side.

Studio shows ports while designing and distinguishes available, occupied, pointed-at and selected states. A dragged Flow end previews the port it would take before release.

Changing a side's port count preserves geometric intent. Existing Flow ends move to the nearest resulting port rather than retaining a number whose position has changed. Counts respect the available side length, the presentation grid and minimum endpoint spacing.

## Flows and waypoints

A Flow is edited as relationships plus geometry:

- its endpoints identify Cards, Fabrics or Points and their ports;
- its family and metadata describe what it means;
- its route is an ordered collection of points from which renderer output is derived;
- its label is positioned along that route.

Creating a Flow begins at one available port and completes at another. Studio establishes a valid orthogonal route and asks for semantic choices, such as Flow family, before the authored Flow is complete.

Selecting a Flow reveals its waypoints. A Producer can insert, move and remove a waypoint, or drag an interior route run perpendicular to itself. Each operation preserves orthogonality and normalises redundant collinear points.

Dragging an endpoint changes the attachment. Existing interior waypoints remain stable where possible, with a corner inserted when necessary to preserve the direction in which the route leaves its new port. Dragging a waypoint near an endpoint bends the route rather than pulling the endpoint away from its port.

A label moves along its own route, not freely across the Canvas. Its authored position is a proportion of route length so that it remains meaningful when the route changes.

## Directing presentation material

Direct uses the same Canvas to edit the product's presentation composition.

- A Scene declares deterministic focus, which Overlays it shows or hides, optional Callout material, and the Diagram Dynamics it cues, in ordered stages where it has more than one.
- A Sequence owns an ordered collection of Scenes and explicitly selects expanded or collapsed display, manual or timed progression, and Callout visibility.

Direct should distinguish editing the current Scene from merely navigating Present. Changing one Scene must not inherit accidental visibility or focus from whichever Scene was previously active.

The active Direct target is an explicit discriminated choice rather than a generic selected tab. It identifies one Standalone Scene, Sequence, Callout or Storyboard and carries the stable identity needed for that kind. A Callout target also identifies its owning Sequence Scene. Switching targets changes the authoring context only; it does not activate the target in Present.

Sequence authoring begins with an empty ordered collection when that is the clearest valid draft. Empty Sequences remain editable, undoable and reviewable in Direct, but Present cannot activate them until they contain a valid Scene. A Callout storyboard belongs to its selected presentation owner and previews Callout content and placement without becoming a second presentation-focus source.

Graphics and Callouts remain serialisable authored material selected by renderer keys and properties. Studio previews them through the host registry owned by Canvas and Present, including the same validation, diagnostics and accessible fallbacks. It does not embed implementations in configuration or create a Studio-only registration seam.

## Authored-source handoff

Studio accumulates adjustments into a coherent change set. Applying that set is a deliberate handoff rather than an invisible write to source, a service or an arbitrary runtime store. Where the host supplies a source-retaining document, each completed gesture is projected into one validated document change the host may accept, and the change pane accounts for every line the host took; where it supplies a model, the set waits to be copied out.

The handoff should describe model fragments keyed by stable identity and be readable in review. A Producer should be able to understand the resulting Cards, Flows, routes and presentation material without reconstructing a stream of pointer events.

Related consequences travel together. Moving a Card includes the affected route geometry; removing one names the dependent Flows; changing a port count includes endpoint reseating. Repeated edits to the same property consolidate into one final authored change.

Changes can be discarded individually or together. Undo and redo operate on whole gestures, so one drag is one step regardless of the pointer events it produced. Snapshot history is appropriate while Studio state remains small, serialisable data.

Once a new configuration already contains a pending value, Studio drops the corresponding draft instead of offering the same change forever.

One serialisable draft contains typed artefact operations alongside the established route, attachment, label, port and text edits. The persisted draft, in-memory history snapshot and rendered change set therefore describe the same atomic state. A pointer gesture contributes one history step; a discrete command contributes one step.

Change rows use deterministic phase and dependency order: creates precede updates, updates precede removals; containers precede dependants during creation and dependants precede owners during removal. Updates retain fixed kind depth and stable owner, authored index, field and identity ordering. Arrival timing does not become source order.

Removal planning and materialisation keep relationships safe. Applied Card removal also removes wrapping Adapter Cards and every Flow ending on any removed Card; applied Fabric removal removes its endpoint Flows; applied Region removal cascades to nothing. Studio blocks an explicit Overlay removal while a Sequence Scene directly references it so the Producer can resolve the narrative choice. The framework-neutral materialiser also clears Overlay references and focus entries if it receives such an operation directly, keeping preview and handoff total rather than emitting a dangling reference.

Design renders authored content, narrowed only by the Scope and Flow-family filters the Producer can see and change, with the materialised draft layered into a derived runtime. Creates, movement, resize, property replacement, authored reordering and safe removal are visible before handoff without mutating the host configuration. Existing component-offset, route and waypoint drafts remain the final transient overlay. Present continues to resolve its active Sequence Overlay independently.

## Source panel

When a host supplies an opaque authored document, Studio adds Source as another panel view for a reader and in both Producer workspaces. The panel shows the exact retained YAML, allows copying, and holds invalid replacement text with addressed diagnostics while the diagram continues to use the last valid document.

Structured document edits and validated whole-source replacements advance one session-local document timeline. Undo and redo select a validated document from that timeline and ask the host to accept it. Studio does not write files or resolve conflicts; the host feeds an accepted document back through the `document` prop.

## Session boundary

Draft changes can survive an accidental reload without making Studio the default experience for a newly opened Audience session. Both production axes, the active Direct target, selection, presentation focus and playback are transient; reload always returns to a not-producing session with no active focus or running Sequence. Undo history can remain session-local even where drafts persist.

Persistence keys belong to the host or an explicitly identified Infoschematic. A configuration without an identity must not accidentally share production state with another blank or embedded instance.

## Non-goals

Studio is not intended to provide free rotation, arbitrary primitives, unconstrained colour, font selection or manual z-order. An Infoschematic remains a view of a structured model rather than a picture that happens to resemble one.

Studio also does not make deployment or source ownership part of the product. Hosts decide how an approved change set reaches authored configuration and how the resulting Infoschematic is published.
