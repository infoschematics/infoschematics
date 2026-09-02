# Domain Model specification

The Domain Model is the serialisable authored contract for an Infoschematic. It describes what exists, how things relate and the geography in which they are presented. It does not calculate routes, render a view or hold an editing session.

## Identity

### DOMAIN-001 — Authored things have stable identity

Every authored artefact and flow MUST carry an identifier and a display code. Identifiers used by relationships MUST name an authored thing that exists. Identity MUST be stable across ordering, filtering and rendering.

_Provenance: IBC TOPO-001 and TOPO-019._

_Implementation surface: `workspaces/domain-model/src/artefact.ts`, `workspaces/domain-model/src/flow.ts` and `workspaces/domain-model/src/point.ts`._

### DOMAIN-002 — Codes are authored, not inferred from position

A code MUST be part of the authored model rather than derived from array position or the number of preceding entries. Removing an entry MUST NOT renumber the remaining entries. A host MAY apply its own code-family conventions, but those conventions MUST NOT be imposed by the generic Domain Model.

_Provenance: IBC TOPO-019, generalised to remove IBC scope and flow-family prefixes._

_Implementation surface: the `code` fields in `workspaces/domain-model/src/artefact.ts`, `workspaces/domain-model/src/flow.ts`, `workspaces/domain-model/src/point.ts`, `workspaces/domain-model/src/scene.ts` and `workspaces/domain-model/src/story.ts`._

### DOMAIN-003 — Port references use compass-side identity

A flow endpoint that terminates on an artefact MUST name a port using `N`, `E`, `S` or `W` followed by a one-based number. The identifier states a side and a position on that side; it does not embed a rendered coordinate.

_Provenance: IBC TOPO-004._

_Implementation surface: `PortId` in `workspaces/domain-model/src/ports.ts` and flow endpoints in `workspaces/domain-model/src/flow.ts`._

## Authored data

### DOMAIN-004 — Authored definitions are data

An Infoschematic definition MUST be expressible as serialisable data. It MUST NOT contain React components, runtime stores, browser state or derived registries. Renderer extension points MUST be stable string keys with serialisable properties.

_Provenance: IBC TOPO-022, adapted from its former `src/play` layout to the package boundary._

_Verification: `workspaces/domain-model/src/modules.test.ts` checks the public module surface; dependency direction is checked by the repository `check:deps` script._

### DOMAIN-005 — Authored data and calculations have separate owners

The Domain Model MUST declare data shapes without importing View Model or view packages. Calculations that turn authored data into routes, ports, placements or rendering state belong outside Domain Model.

_Provenance: IBC TOPO-022._

_Verification: the repository `check:deps` script enforces the Domain Model dependency boundary._

### DOMAIN-006 — A fabric is a first-class artefact

A fabric MUST have authored identity and placement and MUST be available as a flow endpoint. Its appearance MAY use a renderer key, but its participation in relationships MUST NOT depend on that rendering.

_Provenance: IBC TOPO-005 and TOPO-023, without IBC-specific fabric kinds or editing presentation._

_Implementation surface: `workspaces/domain-model/src/fabric.ts` and `workspaces/domain-model/src/flow.ts`._

## Geography

### DOMAIN-007 — Lanes and zones state geography

Lanes and their zones MUST be authored independently from the artefacts placed over them. Zones within a lane describe contiguous geographic regions; they MUST NOT be treated as containment fences for artefacts.

An artefact MAY cross a zone boundary. Its placement, rather than membership in a zone collection, determines where it appears.

_Provenance: IBC TOPO-009._

_Implementation surface: `workspaces/domain-model/src/lane.ts`, `workspaces/domain-model/src/zone.ts` and `workspaces/domain-model/src/infoschematic.ts`._

### DOMAIN-008 — Placed artefacts belong to the Infoschematic geography

Cards and fabrics MUST carry explicit placement within the Infoschematic coordinate space. A fabric MAY span zones, but its placement MUST remain interpretable against the authored lanes and view box.

_Provenance: IBC TOPO-017, generalised from its lane-specific audit._

_Implementation surface: `workspaces/domain-model/src/card.ts`, `workspaces/domain-model/src/fabric.ts` and `workspaces/domain-model/src/infoschematic.ts`._

## Relationships

### DOMAIN-009 — Relationship semantics and geometry are separate facts

A flow MUST state its family and the two things it joins independently from the points used to draw it. Optional operation, conformance and transport references MUST remain semantic properties rather than being inferred from route geometry.

_Provenance: IBC TOPO-008 and TOPO-021._

_Implementation surface: `FlowConfig` in `workspaces/domain-model/src/flow.ts`._

### DOMAIN-010 — Component and flow conformance are distinct

An artefact MAY name specifications that it offers. A flow MAY separately name specifications to which the carried interaction conforms. These claims MUST NOT be merged: an artefact capability and a relationship conformance describe different facts.

_Provenance: IBC TOPO-024 and TOPO-008._

_Implementation surface: `conformsTo` in `workspaces/domain-model/src/artefact.ts` and `workspaces/domain-model/src/flow.ts`._

### DOMAIN-011 — Containment is an authored relationship

A card that adapts or wraps another card MUST name the card it wraps. That relationship MUST be represented in domain data rather than inferred from visual proximity. A flow between wrapper and wrapped card SHOULD NOT be required merely to restate containment.

_Provenance: IBC TOPO-018._

_Implementation surface: `wraps` in `workspaces/domain-model/src/card.ts`._

### DOMAIN-012 — Scopes control applicability without changing identity

Artefacts MAY belong to one or more scopes and MAY require either any or all named scopes to be active. Filtering by scope MUST NOT alter authored identifiers, codes or relationships.

_Provenance: IBC TOPO-013 and TOPO-014, generalised from architecture-scope filtering._

_Implementation surface: `scopes` and `scopeRule` in `workspaces/domain-model/src/artefact.ts`._

## Gaps

- The package exposes the required data shapes but does not yet validate uniqueness of identifiers or codes, the existence of relationship targets, port availability, lane and zone continuity, or placement within geography.
- Code-family policies are intentionally host-defined; a reusable validator extension point has not yet been specified.
- The distinction between a card's singular `scope` and its plural `scopes` remains inherited from the extraction and needs a deliberate contract decision.
- Serialisability and stable renderer-key properties are architectural requirements but do not yet have a dedicated automated test.
