# Diagram elements — DIAGRAM

The authored visual elements, geography, ports, containment, Scopes, and safe removal relationships. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### DIAGRAM-001 — Port references use compass-side identity

A flow endpoint that terminates on an artefact MUST name a port using `N`, `E`, `S` or `W` followed by a one-based number. The identifier states a side and a position on that side; it does not embed a rendered coordinate.

_Conformance:_ conforming

_Verify:_ inspect `PortId` in `packages/domain-model/src/ports.ts` and flow endpoints in `packages/domain-model/src/flow.ts`. against this requirement.

_Evidence:_ `PortId` in `packages/domain-model/src/ports.ts` and flow endpoints in `packages/domain-model/src/flow.ts`.

### DIAGRAM-002 — A fabric is a first-class artefact

A fabric MUST have authored identity and placement and MUST be available as a flow endpoint. Its appearance MAY use a versioned renderer reference, but its participation in relationships MUST NOT depend on that rendering.

_Conformance:_ conforming

_Verify:_ inspect `packages/domain-model/src/fabric.ts` and `packages/domain-model/src/flow.ts`. against this requirement.

_Evidence:_ `packages/domain-model/src/fabric.ts` and `packages/domain-model/src/flow.ts`.

### DIAGRAM-003 — Regions state geography

Regions MUST be authored independently from the artefacts placed over them. Regions describe geography; they MUST NOT be treated as containment fences for artefacts, and the model MUST record no containment between Regions — nesting is read from the geometry, and authored order is paint order.

An artefact MAY cross a Region boundary. Its placement, rather than membership in any collection, determines where it appears.

_Conformance:_ conforming

_Verify:_ inspect `packages/domain-model/src/region.ts` and `packages/domain-model/src/infoschematic.ts`. against this requirement.

_Evidence:_ `packages/domain-model/src/region.ts` and `packages/domain-model/src/infoschematic.ts`.

### DIAGRAM-004 — Placed artefacts belong to the Infoschematic geography

Cards and fabrics MUST carry explicit placement within the Infoschematic coordinate space. A fabric MAY span Regions, but its placement MUST remain interpretable against the authored Regions and view box.

_Conformance:_ conforming

_Verify:_ inspect `packages/domain-model/src/card.ts`, `packages/domain-model/src/fabric.ts` and `packages/domain-model/src/infoschematic.ts`. against this requirement.

_Evidence:_ `packages/domain-model/src/card.ts`, `packages/domain-model/src/fabric.ts` and `packages/domain-model/src/infoschematic.ts`.

### DIAGRAM-005 — Containment is an authored relationship

A card that adapts or wraps another card MUST name the card it wraps. That relationship MUST be represented in domain data rather than inferred from visual proximity. A flow between wrapper and wrapped card SHOULD NOT be required merely to restate containment.

_Conformance:_ conforming

_Verify:_ inspect `wraps` in `packages/domain-model/src/card.ts`. against this requirement.

_Evidence:_ `wraps` in `packages/domain-model/src/card.ts`.

### DIAGRAM-006 — Scopes control applicability without changing identity

Artefacts MAY belong to one or more scopes and MAY require either any or all named scopes to be active. Filtering by scope MUST NOT alter authored identifiers, codes or relationships.

_Conformance:_ conforming

_Verify:_ inspect `scopes` and `scopeRule` in `packages/domain-model/src/artefact.ts`. against this requirement.

_Evidence:_ `scopes` and `scopeRule` in `packages/domain-model/src/artefact.ts`.

### DIAGRAM-007 — Editable kinds retain distinct authored collections

Region, Fabric, Card, Flow and Overlay MUST remain distinct authored kinds, each with its own ordered collection in the Infoschematic definition. Reordering one kind MUST NOT imply cross-kind layering.

_Conformance:_ conforming

_Verify:_ inspect collections in `packages/domain-model/src/infoschematic.ts` and `packages/domain-model/src/region.ts`. against this requirement.

_Evidence:_ collections in `packages/domain-model/src/infoschematic.ts` and `packages/domain-model/src/region.ts`.

### DIAGRAM-008 — Applied removal leaves valid authored references

An applied configuration change MUST NOT retain a Flow whose source or target artefact was removed. Removing a Card MUST also remove Adapter Cards that directly or transitively wrap it before dependent Flows are retained. Removing a Region MUST NOT cascade to any other artefact.

An Overlay referenced directly by a Sequence Scene MUST either block the authored removal before application or clear the Sequence Scene reference atomically. Focus collections in Standalone Scenes and Sequence Scenes MUST NOT retain the removed Overlay after an applied cleanup.

_Conformance:_ conforming

_Verify:_ inspect relationships in `packages/domain-model/src/card.ts`, `packages/domain-model/src/flow.ts`, `packages/domain-model/src/scene.ts` and `packages/domain-model/src/sequence.ts` against this requirement.

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
