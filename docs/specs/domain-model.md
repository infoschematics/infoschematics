# Domain Model specification

The Domain Model is the serialisable authored contract for an Infoschematic. It describes what exists, how things relate and the geography in which they are presented. It does not calculate routes, render a view or hold an editing session.

## Identity

### DOMAIN-001 — Authored things have stable identity

Every authored artefact and flow MUST carry an identifier and a display code. Identifiers used by relationships MUST name an authored thing that exists. Identity MUST be stable across ordering, filtering and rendering.

_Implementation surface: `packages/domain-model/src/artefact.ts`, `packages/domain-model/src/flow.ts` and `packages/domain-model/src/point.ts`._

### DOMAIN-002 — Codes are authored, not inferred from position

A code MUST be part of the authored model rather than derived from array position or the number of preceding entries. Removing an entry MUST NOT renumber the remaining entries. A host MAY apply its own code-family conventions, but those conventions MUST NOT be imposed by the generic Domain Model.

_Implementation surface: the `code` fields in `packages/domain-model/src/artefact.ts`, `packages/domain-model/src/flow.ts`, `packages/domain-model/src/point.ts`, `packages/domain-model/src/scene.ts` and `packages/domain-model/src/story.ts`._

### DOMAIN-003 — Port references use compass-side identity

A flow endpoint that terminates on an artefact MUST name a port using `N`, `E`, `S` or `W` followed by a one-based number. The identifier states a side and a position on that side; it does not embed a rendered coordinate.

_Implementation surface: `PortId` in `packages/domain-model/src/ports.ts` and flow endpoints in `packages/domain-model/src/flow.ts`._

## Authored data

### DOMAIN-004 — Authored definitions are data

An Infoschematic definition MUST be expressible as serialisable data. It MUST NOT contain React components, runtime stores, browser state or derived registries. Renderer extension points MUST be stable string keys with serialisable properties.

_Verification: `packages/domain-model/src/modules.test.ts` checks the public module surface; dependency direction is checked by the repository `check:deps` script._

### DOMAIN-005 — Authored data and calculations have separate owners

The Domain Model MUST declare data shapes without importing View Model or view packages. Calculations that turn authored data into routes, ports, placements or rendering state belong outside Domain Model.

_Verification: the repository `check:deps` script enforces the Domain Model dependency boundary._

### DOMAIN-006 — A fabric is a first-class artefact

A fabric MUST have authored identity and placement and MUST be available as a flow endpoint. Its appearance MAY use a renderer key, but its participation in relationships MUST NOT depend on that rendering.

_Implementation surface: `packages/domain-model/src/fabric.ts` and `packages/domain-model/src/flow.ts`._

### DOMAIN-013 — Renderer references remain serialisable

An authored Fabric, Graphic, or Callout MAY select a host visual implementation by stable renderer key. Its properties MUST remain serialisable scalar data. Authored configuration MUST NOT contain React components, JSX, callbacks, validators, runtime stores, or derived registries.

Renderer availability MUST NOT determine an artefact's identity, relationships, placement, or Audience content. A host or output that does not implement a compatible renderer MUST retain the product fallback.

_Implementation surface: renderer references in `packages/domain-model/src/fabric.ts`, `packages/domain-model/src/graphic.ts`, and `packages/domain-model/src/scene.ts`._

### DOMAIN-014 — Editable kinds retain distinct authored collections

Lane, Zone, Fabric, Card, Flow and Graphic MUST remain distinct authored kinds. A Zone MUST belong to exactly one Lane's ordered `zones` collection. Every other kind MUST retain its own ordered collection in the Infoschematic definition. Reordering one kind MUST NOT imply cross-kind layering or move a Zone to another Lane.

_Implementation surface: collections in `packages/domain-model/src/infoschematic.ts` and nested Zones in `packages/domain-model/src/lane.ts`._

### DOMAIN-015 — Applied removal leaves valid authored references

An applied configuration change MUST NOT retain a Flow whose source or target artefact was removed. Removing a Card MUST also remove Adapter Cards that directly or transitively wrap it before dependent Flows are retained. Removing a Lane MUST remove its owned Zones.

A Graphic referenced directly by a Story Scene MUST either block the authored removal before application or clear the Story Scene reference atomically. Focus collections in Standalone Scenes, Thematic Scenes and Story Scenes MUST NOT retain the removed Graphic after an applied cleanup.

_Implementation surface: relationships in `packages/domain-model/src/card.ts`, `packages/domain-model/src/flow.ts`, `packages/domain-model/src/lane.ts`, `packages/domain-model/src/scene.ts` and `packages/domain-model/src/story.ts`._

## Geography

### DOMAIN-007 — Lanes and zones state geography

Lanes and their zones MUST be authored independently from the artefacts placed over them. Zones within a lane describe contiguous geographic regions; they MUST NOT be treated as containment fences for artefacts.

An artefact MAY cross a zone boundary. Its placement, rather than membership in a zone collection, determines where it appears.

_Implementation surface: `packages/domain-model/src/lane.ts`, `packages/domain-model/src/zone.ts` and `packages/domain-model/src/infoschematic.ts`._

### DOMAIN-008 — Placed artefacts belong to the Infoschematic geography

Cards and fabrics MUST carry explicit placement within the Infoschematic coordinate space. A fabric MAY span zones, but its placement MUST remain interpretable against the authored lanes and view box.

_Implementation surface: `packages/domain-model/src/card.ts`, `packages/domain-model/src/fabric.ts` and `packages/domain-model/src/infoschematic.ts`._

## Appearance

### DOMAIN-016 — Authored appearance is serialisable intent

An Infoschematic MAY author a neutral or blueprint surface, no grid or one of the standard grid treatments, and Card compactness and metadata-visibility defaults. A Lane or Zone MAY author a frame treatment and an optional label at one of nine compass placements. Appearance MUST remain typed serialisable data and MUST NOT contain CSS, callbacks, renderer components, free coordinates, or derived geometry.

Omitted appearance MUST normalise to a neutral surface, no authored grid, non-compact Cards, and hidden optional Card identity, stereotype, and description. Region defaults are resolved by View Model so every renderer receives the same treatment.

_Implementation surface: `packages/domain-model/src/appearance.ts`, `packages/domain-model/src/infoschematic.ts`, `packages/domain-model/src/lane.ts`, `packages/domain-model/src/zone.ts`, and `packages/domain-core/src/index.ts`._

### DOMAIN-017 — Domain classification is independent of Scope applicability

An Infoschematic MAY declare Domains with stable identifiers, labels, semantic colours, and fills. A Card MAY reference one Domain and MAY carry a stereotype. Domain classifies the Card for semantic presentation; Scope controls applicability and filtering. A renderer or filter MUST NOT infer either relationship from the other.

Domain identifiers MUST be unique within an Infoschematic. A Card Domain reference MUST identify a declared Domain. Normalisation MUST reject duplicate Domain identifiers and unresolved Card Domain references independently of Scope validation.

_Implementation surface: `packages/domain-model/src/domain.ts`, `packages/domain-model/src/card.ts`, `packages/domain-model/src/infoschematic.ts`, and `packages/domain-core/src/index.ts`._

### DOMAIN-018 — Renderer invariants are not authored options

Shared corner geometry, notch padding, type scales, line widths, fallback colours, and similar renderer invariants MUST NOT be added to authored appearance merely to theme one output. Values whose meaning must agree across renderers belong to View Model visual tokens or renderer-neutral geometry calculations.

An output MAY override whether Card identity, stereotype, and description are visible. Such an override MUST NOT alter the authored data or become part of `InfoschematicConfig`.

## Relationships

### DOMAIN-009 — Relationship semantics and geometry are separate facts

A flow MUST state its family and the two things it joins independently from the points used to draw it. Optional operation, conformance and transport references MUST remain semantic properties rather than being inferred from route geometry.

_Implementation surface: `FlowConfig` in `packages/domain-model/src/flow.ts`._

### DOMAIN-010 — Component and flow conformance are distinct

An artefact MAY name specifications that it offers. A flow MAY separately name specifications to which the carried interaction conforms. These claims MUST NOT be merged: an artefact capability and a relationship conformance describe different facts.

_Implementation surface: `conformsTo` in `packages/domain-model/src/artefact.ts` and `packages/domain-model/src/flow.ts`._

### DOMAIN-011 — Containment is an authored relationship

A card that adapts or wraps another card MUST name the card it wraps. That relationship MUST be represented in domain data rather than inferred from visual proximity. A flow between wrapper and wrapped card SHOULD NOT be required merely to restate containment.

_Implementation surface: `wraps` in `packages/domain-model/src/card.ts`._

### DOMAIN-012 — Scopes control applicability without changing identity

Artefacts MAY belong to one or more scopes and MAY require either any or all named scopes to be active. Filtering by scope MUST NOT alter authored identifiers, codes or relationships.

_Implementation surface: `scopes` and `scopeRule` in `packages/domain-model/src/artefact.ts`._

## Gaps

- The package exposes the required data shapes but does not yet validate uniqueness of identifiers or codes, the existence of relationship targets, port availability, lane and zone continuity, or placement within geography.
- Code-family policies are intentionally host-defined; a reusable validator extension point has not yet been specified.
- The relationship between a Card's singular `scope` and plural `scopes` is not yet explicit and needs a deliberate contract decision.
- Renderer references have an explicit serialisability contract; source-boundary verification must continue to prevent executable host values entering authored examples.
