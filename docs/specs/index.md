# Specifications

This corpus states the accepted user-observable behaviour and quality properties of Infoschematics. Decisions explain why in [`docs/decisions/`](../decisions/README.md), guides explain how in [`docs/guides/`](../guides/README.md), and roadmap records track delivery in [`docs/roadmap/`](../roadmap/).

## Reading a requirement

Each requirement has a stable `<PREFIX>-NNN` identity, one BCP-14 statement, and lifecycle fields:

- `_Conformance:_ conforming | pending | divergent` states how the implementation relates to the accepted contract now.
- `_Verify:_` names the check capable of deciding conformance.
- `_Evidence:_` names current proof and is required when conforming.

Requirements are grouped as **user-observable behaviours** or **quality properties**. A numbered requirement remains accepted while pending or divergent. Unnumbered Gaps are candidates not yet accepted.

IDs are append-only within their registered prefix and are never reused. The one-time migration from the former package-shaped corpus is recorded in [Specification ID migration](../reference/specification-id-migration.md).

## Areas

| File                          | Prefix    | Covers                                                                                                          |
| ----------------------------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| authoring.md                  | `AUTHOR`  | Canonical document formats, identity, normalisation, validation, and serialisable authoring boundaries.         |
| diagram-elements.md           | `DIAGRAM` | The authored visual elements, geography, ports, containment, Scopes, and safe removal relationships.            |
| specification-realisations.md | `REALISE` | Additive specification claims and the user-visible tree used to inspect and highlight their realising elements. |
| appearance.md                 | `APPEAR`  | Authored semantic identity, output-detail policy, shared visual tokens, and accessible renderer parity.         |
| routing-and-placement.md      | `ROUTE`   | Flow routes, ports, snapping, labels, overlays, and Card-internal layout in diagram coordinates.                |
| static-rendering.md           | `STATIC`  | Deterministic, accessible, framework-neutral SVG output from the canonical model and View Model.                |
| renderer-extensions.md        | `EXTEND`  | Host-provided visual implementations, compatibility, validation, and accessible generic fallbacks.              |
| flow-signals.md               | `SIGNAL`  | Finite runtime Flow occurrences, replay, cancellation, announcements, and reduced-motion treatment.             |
| presentation.md               | `PRESENT` | Audience-facing focus, filtering, controls, information, viewport use, zoom, pan, and overview navigation.      |
| scenes-and-callouts.md        | `SCENE`   | Activatable Scenes, ordered presentation, Callout placement, custom Callouts, timing, and playback stability.   |
| design-session.md             | `DESIGN`  | Producer mode state, selection, hover, editing visibility, inspection, and rendered Studio verification.        |
| directing.md                  | `DIRECT`  | Producer control of Scenes and their containing presentation material.                                          |
| design-editing.md             | `EDIT`    | Geometry, route, attachment, creation, removal, appearance, and complete preview behaviour in Design mode.      |
| change-management.md          | `CHANGE`  | Atomic drafts, undo, reviewable change sets, consolidation, and selective dropping of pending changes.          |
| runtime-model.md              | `RUNTIME` | Framework-neutral derivation and immutable materialisation of typed selection and draft operations.             |
