# Specification realisations — REALISE

Additive specification claims and the user-visible tree used to inspect and highlight their realising elements. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### REALISE-001 — Relationship semantics and geometry are separate facts

A Flow MUST state its Family and the two things it joins independently of the points used to draw it. A Specification, Interface, or Operation MAY name that Flow in `realisedBy`; conformance MUST remain an explicit semantic relationship rather than be inferred from route geometry.

_Conformance:_ conforming

_Verify:_ inspect `Flow` and the specification hierarchy in `packages/domain-model/src/model.ts`. against this requirement.

_Evidence:_ `Flow` and the specification hierarchy in `packages/domain-model/src/model.ts`.

### REALISE-002 — Component and flow conformance are distinct

A Specification, Interface, or Operation MAY name an artefact that realises it. It MAY separately name a Flow whose carried interaction realises it. These claims MUST NOT be merged: an artefact realising a capability and a Flow realising a conformance point describe different facts.

_Conformance:_ conforming

_Verify:_ inspect `realisedBy` in the specification hierarchy in `packages/domain-model/src/model.ts`. against this requirement.

_Evidence:_ `realisedBy` in the specification hierarchy in `packages/domain-model/src/model.ts`.

### REALISE-003 — Specification selection reveals detail

The Studio Specifications tab MUST place the specification tree above the selected-node detail and MUST show documents, description, operations, and realising elements available at that node.

_Conformance:_ conforming

_Verify:_ render the Specifications tab, select group, specification, interface, and operation nodes, and inspect the detail pane.

_Evidence:_ `packages/view-studio/src/app/panels/SpecificationTree.tsx` and `DetailsPanel.tsx` render the stacked selection and detail panes.

### REALISE-004 — Specification hover highlights realisations

Hovering a specification-tree node MUST highlight the Diagram elements it directly or transitively realises; a group MUST use the descendant union and an operation MUST use only its own claims.

_Conformance:_ conforming

_Verify:_ hover every tree level and compare the active Canvas highlight with the node realisation set.

_Evidence:_ `packages/view-studio/src/app/App.tsx` derives the Canvas highlight through `specificationDiagramHighlight`.
