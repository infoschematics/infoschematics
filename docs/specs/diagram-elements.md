# Diagram elements — DIAGRAM

The authored visual elements, geography, ports, containment, Scopes, and safe removal relationships. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### DIAGRAM-001 — Port references use compass-side identity

A flow endpoint that terminates on an artefact MUST name a port using `N`, `E`, `S` or `W` followed by a one-based number. The identifier states a side and a position on that side; it does not embed a rendered coordinate.

_Conformance:_ conforming

_Verify:_ Read `PortId` in `packages/domain-model/src/ports.ts` and the endpoint types in `packages/domain-model/src/flow.ts`: the identifier is a compass letter and a number, and nothing in it holds a coordinate. Then resolve the same endpoint against two different element geometries and confirm the identifier is unchanged while the rendered point moves. Falsified by an endpoint that can be read as a position without consulting its element, or by a port numbered from zero.

_Evidence:_ `PortId` in `packages/domain-model/src/ports.ts` and flow endpoints in `packages/domain-model/src/flow.ts`.

### DIAGRAM-002 — A fabric is a first-class artefact

A fabric MUST have authored identity and placement and MUST be available as a flow endpoint. Its appearance MAY use a versioned renderer reference, but its participation in relationships MUST NOT depend on that rendering.

_Conformance:_ conforming

_Verify:_ Read `packages/domain-model/src/fabric.ts` and `packages/domain-model/src/flow.ts`: a Fabric declares its own identity and placement, and a flow endpoint may name it on the same terms as any other artefact. Then author a Fabric with no renderer reference and confirm it can still be a flow endpoint, and author one whose renderer key is unknown and confirm its relationships are unaffected. Falsified by participation in a relationship that depends on a Fabric being renderable.

_Evidence:_ `packages/domain-model/src/fabric.ts` and `packages/domain-model/src/flow.ts`.

### DIAGRAM-003 — Regions state geography

Regions MUST be authored independently from the artefacts placed over them. Regions describe geography; they MUST NOT be treated as containment fences for artefacts, and the model MUST record no containment between Regions — nesting is read from the geometry, and authored order is paint order.

An artefact MAY cross a Region boundary. Its placement, rather than membership in any collection, determines where it appears.

_Conformance:_ conforming

_Verify:_ Read `packages/domain-model/src/region.ts` and `packages/domain-model/src/infoschematic.ts`: Regions are their own authored collection, and no field records containment between a Region and an artefact or between two Regions. Then place a Card so that it straddles a Region boundary and confirm it renders where its placement puts it, and nest two Regions by geometry and confirm the nesting is read from the boxes and the authored paint order rather than from a parent field. Falsified by any membership collection that decides where an artefact appears.

_Evidence:_ `packages/domain-model/src/region.ts` and `packages/domain-model/src/infoschematic.ts`.

### DIAGRAM-004 — Placed artefacts belong to the Infoschematic geography

Cards and fabrics MUST carry explicit placement within the Infoschematic coordinate space. A fabric MAY span Regions, but its placement MUST remain interpretable against the authored Regions and view box.

_Conformance:_ conforming

_Verify:_ Read `packages/domain-model/src/card.ts`, `packages/domain-model/src/fabric.ts`, and `packages/domain-model/src/infoschematic.ts`: every Card and Fabric carries an explicit placement in Infoschematic coordinates, not an implied slot. Then author a Fabric spanning two Regions and confirm its placement is still interpretable against the authored Regions and the view box — the same numbers put it in the same place with the Regions removed. Falsified by a placement that only means something relative to a Region.

_Evidence:_ `packages/domain-model/src/card.ts`, `packages/domain-model/src/fabric.ts` and `packages/domain-model/src/infoschematic.ts`.

### DIAGRAM-005 — Containment is an authored relationship

A card that adapts or wraps another card MUST name the card it wraps. That relationship MUST be represented in domain data rather than inferred from visual proximity. A flow between wrapper and wrapped card SHOULD NOT be required merely to restate containment.

_Conformance:_ conforming

_Verify:_ Read `wraps` in `packages/domain-model/src/card.ts`: an Adapter Card names the Card it wraps in authored data. Then move the wrapper away from the Card it wraps and confirm the relationship survives the distance, and place two unrelated Cards on top of each other and confirm no containment is inferred. Falsified by containment read out of proximity, or by a Flow that has to exist merely to restate a wrap.

_Evidence:_ `wraps` in `packages/domain-model/src/card.ts`.

### DIAGRAM-006 — Scopes control applicability without changing identity

Artefacts MAY belong to one or more scopes and MAY require either any or all named scopes to be active. Filtering by scope MUST NOT alter authored identifiers, codes or relationships.

_Conformance:_ conforming

_Verify:_ Read the scope fields in `packages/domain-model/src/artefact.ts`, then filter a document by scope both ways — requiring any of the named scopes and requiring all of them — and diff the surviving artefacts against the authored ones: identifiers, codes, and relationships must be unchanged, and only visibility may differ. Falsified by a filtered document whose identity or relationships differ from the authored one.

_Evidence:_ `scopes` and `scopeRule` in `packages/domain-model/src/artefact.ts`.

### DIAGRAM-007 — Editable kinds retain distinct authored collections

Region, Fabric, Card, Flow and Overlay MUST remain distinct authored kinds, each with its own ordered collection in the Infoschematic definition. Reordering one kind MUST NOT imply cross-kind layering.

_Conformance:_ conforming

_Verify:_ Read `packages/domain-model/src/infoschematic.ts` and `packages/domain-model/src/region.ts`: Region, Fabric, Card, Flow, and Overlay each have their own ordered collection. Then reorder one kind and confirm the painted layering of the other four is unchanged — a reorder within a kind says nothing about which kind sits on top. Falsified by a single mixed collection, or by cross-kind layering that follows an authored index.

_Evidence:_ collections in `packages/domain-model/src/infoschematic.ts` and `packages/domain-model/src/region.ts`.

### DIAGRAM-008 — Applied removal leaves valid authored references

An applied configuration change MUST NOT retain a Flow whose source or target artefact was removed. Removing a Card MUST also remove Adapter Cards that directly or transitively wrap it before dependent Flows are retained. Removing a Region MUST NOT cascade to any other artefact.

An Overlay referenced directly by a Sequence Scene MUST either block the authored removal before application or clear the Sequence Scene reference atomically. Focus collections in Standalone Scenes and Sequence Scenes MUST NOT retain the removed Overlay after an applied cleanup.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-model`, then apply removals to a document built for it: remove a Card that an Adapter Card wraps transitively and confirm the wrappers go with it before any dependent Flow is kept; confirm no applied configuration retains a Flow whose source or target is gone; remove a Region and confirm nothing else follows; remove an Overlay a Sequence Scene references directly and confirm the change either refuses before application or clears that reference in the same step. Then read the focus collections of every Standalone and Sequence Scene and confirm the removed Overlay is in none of them.

_Evidence:_ relationships in `packages/domain-model/src/card.ts`, `packages/domain-model/src/flow.ts`, `packages/domain-model/src/scene.ts` and `packages/domain-model/src/sequence.ts`.

### DIAGRAM-009 — Region bounds stay explicit

Every authored Region MUST own complete `bounds`; the canonical model MUST NOT derive any axis from another Region. An authoring tool MAY copy, align, or distribute Region geometry, but it MUST materialise the result as complete bounds on every affected Region.

_Conformance:_ conforming

_Verify:_ parse and render Regions with repeated axes, move or remove one Region, and assert no other Region geometry changes.

_Evidence:_ `packages/domain-model/src/model.ts` requires complete Region `bounds`; `packages/domain-core/src/schema.ts` validates them independently; both renderers consume resolved independent Region boxes.

### DIAGRAM-010 — Diagram grid size is authored and required

Every canonical Diagram MUST declare `gridSize` as a non-negative integer alongside `bounds`, and a document that omits it MUST be rejected rather than resolved to a default. A value of `0` MUST disable grid geometry and grid rounding, `1` MUST permit unit placement, and any greater value MUST define a coarser lattice. The established `InfoschematicConfig` compatibility boundary MAY supply `10` so existing programmatic callers stay source-compatible, but that default MUST NOT weaken the canonical requirement.

Grid size MUST remain diagram geometry. It MUST NOT be merged with the authored grid appearance treatment, which independently decides whether a lattice is drawn, and a non-zero size MUST NOT by itself make a grid visible outside Design.

_Conformance:_ conforming

_Verify:_ parse a Diagram omitting `gridSize` and assert rejection; parse `0`, `1`, and a custom value and assert editing and rendered geometry follow the authored value; resolve an `InfoschematicConfig` and assert it yields `10`.

_Evidence:_ `packages/domain-model/src/model.ts` declares the required field and `packages/domain-core/src/schema.ts` validates it as a non-negative integer; `packages/domain-core/src/schema.test.ts` asserts rejection of an omitted and a negative value and acceptance of `0` and `1`; `packages/view-model/src/tokens.ts` supplies the compatibility default; `packages/view-studio/src/app/App.browser.test.tsx` exercises the rendered Design grid control.

### DIAGRAM-011 — An authored Overlay is drawn wherever the Diagram is

An authored [Overlay](../reference/vocabulary.md#overlay) MUST be drawn wherever the Diagram is drawn, not only in a Producer editing mode. A [Scene](../reference/vocabulary.md#scene)'s own Graphic MUST add to the authored set rather than replace it, and the union MUST be deduplicated by identifier so a Scene naming an authored Overlay draws it once. A Scene's focus MUST express itself as dimming or hiding rather than as absence from the drawn set.

[`ADR-INFOSCHEMATICS-037`](../decisions/ADR-INFOSCHEMATICS-037-an-authored-overlay-is-drawn-wherever-the-diagram-is.md) records the reversal. [Present](../reference/vocabulary.md#present) needs nothing of its own: it keeps supplying the active Sequence Scene's Graphic, and the authored declaration reaches an audience because the Diagram draws it.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-present` and `bun run self:scripts:test`, then author a document with one Overlay and no Scene at all, open it outside Design, and see it. Hand the same Overlay over as a Scene's Graphic as well and confirm the drawing is unchanged rather than doubled. Ask interactive Canvas for `scene` Graphic visibility and confirm no Graphic without an active Scene, only that Scene's Graphic while active, and every authored Graphic still available in Design. Restoring the `editing ?` gate or the parity case MUST fail.

_Evidence:_ `packages/view-canvas/src/InfoschematicDiagram.tsx` defaults to the union of `config.diagram.overlays` and the Scene's Graphic, deduplicated by id, and exposes explicit `all`, `scene`, and `none` host policy; `packages/view-present/src/Present.test.tsx` shows an authored Overlay to an audience; `scripts/visual-treatment-parity.test.ts` draws each standard Overlay treatment in both renderers from the document alone and asserts a Scene's Graphic adds nothing.
