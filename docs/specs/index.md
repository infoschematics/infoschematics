# Specifications

This corpus states the accepted user-observable behaviour and quality properties of Infoschematics. Decisions explain why in [`docs/decisions/`](../decisions/README.md), guides explain how in [`docs/guides/`](../guides/README.md), and roadmap records track delivery in [`docs/roadmap/`](../roadmap/).

## Reading a requirement

Each requirement has a stable `<PREFIX>-NNN` identity, one BCP-14 statement, and lifecycle fields:

- `_Conformance:_ conforming | pending | divergent` states how the implementation relates to the accepted contract now.
- `_Verify:_` names the check capable of deciding conformance: an action a reader can take — a command to run, a suite to run, a render to look at, a comparison to make — written so someone who doubts the requirement can settle it.
- `_Evidence:_` names current proof and is required when conforming: where the proof already sits, rather than what to do.

The two lines carry different jobs and must not restate each other. A `_Verify:_` line that repeats its `_Evidence:_` line names the requirement's artefacts twice and calls one of them a method, which leaves the requirement with no verification instruction at all; `scripts/specification-evidence.test.ts` refuses both that and the bolted-on "against this requirement." tail it used to hide behind. Where the honest method is a suite that does not exist, say so and set `_Conformance:_` accordingly rather than inventing one.

Requirements are grouped as **user-observable behaviours** or **quality properties**. A numbered requirement remains accepted while pending or divergent. Unnumbered Gaps are candidates not yet accepted.

IDs are append-only within their registered prefix and are never reused. The one-time migration from the former package-shaped corpus is recorded in [Specification ID migration](../reference/specification-id-migration.md).

## Areas

| File                          | Prefix    | Covers                                                                                                          |
| ----------------------------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| authoring.md                  | `AUTHOR`  | Canonical document formats, identity, normalisation, validation, and serialisable authoring boundaries.         |
| diagram-elements.md           | `DIAGRAM` | The authored visual elements, geography, ports, containment, Scopes, and safe removal relationships.            |
| specification-realisations.md | `REALISE` | Additive specification claims and the user-visible tree used to inspect and highlight their realising elements. |
| appearance.md                 | `APPEAR`  | Authored semantic identity, output-detail policy, shared visual tokens, and accessible renderer parity.         |
| routing-and-placement.md      | `ROUTE`   | Flow routes, ports, grid rounding, labels, overlays, and Card-internal layout in diagram coordinates.           |
| static-rendering.md           | `STATIC`  | Deterministic, accessible, framework-neutral SVG output from the canonical model and View Model.                |
| diagnostics.md                | `DRAW`    | What a valid document still gets wrong about its drawing: rule codes, measured findings, severity, and gating.   |
| command-line-rendering.md     | `CLI`     | Portable YAML and JSON input, SVG streams, diagnostics, exit status, and publishable command boundaries.        |
| renderer-extensions.md        | `EXTEND`  | Host-provided visual implementations, compatibility, validation, and accessible generic fallbacks.              |
| flow-signals.md               | `SIGNAL`  | Finite runtime Flow occurrences, replay, cancellation, announcements, and reduced-motion treatment.             |
| diagram-dynamics.md           | `DYNAMIC` | Named authored Dynamics, host-owned occurrences, occurrence resolution, and non-motion interpretations.         |
| presentation.md               | `PRESENT` | Audience-facing focus, filtering, controls, information, viewport use, zoom, pan, and overview navigation.      |
| scenes-and-callouts.md        | `SCENE`   | Activatable Scenes, ordered presentation, Callout placement, custom Callouts, timing, and playback stability.   |
| design-session.md             | `DESIGN`  | Producer workspace state, selection, hover, editing visibility, inspection, and rendered Studio verification.   |
| directing.md                  | `DIRECT`  | Producer control of Scenes and their containing presentation material.                                          |
| design-editing.md             | `EDIT`    | Geometry, route, attachment, creation, removal, appearance, and preview behaviour in the Design workspace.      |
| change-management.md          | `CHANGE`  | Atomic drafts, undo, reviewable change sets, consolidation, and selective dropping of pending changes.          |
| runtime-model.md              | `RUNTIME` | Framework-neutral derivation and immutable materialisation of typed selection and draft operations.             |
| composition.md                | `COMPOSE` | What two features must still promise when they are used together, one requirement per contended resource.      |
