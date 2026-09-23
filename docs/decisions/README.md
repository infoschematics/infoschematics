# Decision records

Decision Records explain why Infoschematics has its current shape. They are ordered as the product was revealed rather than by subject: the foundation first, then the document and the layers that own it, then what each outlet decides for itself, then the outputs, the Producer's surfaces, and the whole drawing. Every record depends only on records above it, so reading top to bottom never asks you to take a later decision on trust. Each is a concise living decision; delivery history belongs in roadmap records and Git.

Supporting material lives in [`references/`](references/), inside this directory so a record cites it as a sibling rather than reaching outside the collection. It holds surveys, evidence tables, and anything else a record wants to point at — the survey of adjacent projects is there under [`related-tools.md`](references/related-tools.md). Those files are not Decision Records and are not entries in the list below: every record still reads completely without following a link to one. PDR-INFOSCHEMATICS-003, listed below, governs what the survey is for.

## Product foundation

1. [GDR-INFOSCHEMATICS-001](GDR-INFOSCHEMATICS-001-adopt-decision-records.md) — separate why, what, how, facts, design, and delivery into their owning instruments.
2. [PDR-INFOSCHEMATICS-001](PDR-INFOSCHEMATICS-001-an-infoschematic-is-an-authored-definition-not-a-drawing.md) — name the product, and treat an Infoschematic as one canonical definition embedded wherever it is read rather than a picture that was drawn.
3. [KDR-INFOSCHEMATICS-001](KDR-INFOSCHEMATICS-001-product-vocabulary.md) — use one canonical vocabulary across model, production, code, and documentation.
4. [PDR-INFOSCHEMATICS-002](PDR-INFOSCHEMATICS-002-product-messaging.md) — govern the product promise and tone from one record.
5. [PDR-INFOSCHEMATICS-003](PDR-INFOSCHEMATICS-003-adjacent-projects-inform-rather-than-supply.md) — read adjacent projects for the trade-offs they make visible, and keep the survey beside the records rather than inside them.

## The authored document

6. [ADR-INFOSCHEMATICS-001](ADR-INFOSCHEMATICS-001-routes-authored-as-points.md) — author Flow routes as points and derive renderer paths.
7. [ADR-INFOSCHEMATICS-002](ADR-INFOSCHEMATICS-002-undo-by-snapshot.md) — undo a complete Producer gesture through one authored-state snapshot.
8. [ADR-INFOSCHEMATICS-003](ADR-INFOSCHEMATICS-003-authored-identity-codes.md) — author stable human-readable identities rather than deriving them from order.

## Ownership and layering

9. [ADR-INFOSCHEMATICS-004](ADR-INFOSCHEMATICS-004-source-sorted-by-ownership.md) — sort source by who owns behaviour before its implementation form.
10. [ADR-INFOSCHEMATICS-005](ADR-INFOSCHEMATICS-005-host-owned-configuration.md) — let the host select complete serialisable authored data and own runtime composition.
11. [ADR-INFOSCHEMATICS-006](ADR-INFOSCHEMATICS-006-additive-views-and-renderers.md) — compose interactive Views additively and keep static renderers parallel.
12. [ADR-INFOSCHEMATICS-007](ADR-INFOSCHEMATICS-007-site-as-public-outlet.md) — use Site as the public outlet without making it the reusable product owner.
13. [ADR-INFOSCHEMATICS-008](ADR-INFOSCHEMATICS-008-ownership-based-monorepo-roots.md) — separate consumable packages, deployable applications, and authored examples physically.
14. [ADR-INFOSCHEMATICS-009](ADR-INFOSCHEMATICS-009-host-provided-versioned-renderers.md) — let hosts supply validated renderer extensions without executable authored data.
15. [ADR-INFOSCHEMATICS-010](ADR-INFOSCHEMATICS-010-coordinated-package-release-contract.md) — publish the dependency-closed package set under one coordinated release contract.

## What is authored, and what is derived

16. [ADR-INFOSCHEMATICS-011](ADR-INFOSCHEMATICS-011-separate-authored-appearance-from-output-detail.md) — keep semantic authored identity separate from output-detail policy.
17. [ADR-INFOSCHEMATICS-012](ADR-INFOSCHEMATICS-012-keep-flow-signals-transient.md) — model Flow signals as accessible runtime occurrences rather than authored state.
18. [ADR-INFOSCHEMATICS-013](ADR-INFOSCHEMATICS-013-validation-mirrors-the-contract.md) — validate preferred YAML and compatible JSON against a runtime mirror of the canonical types.
19. [ADR-INFOSCHEMATICS-014](ADR-INFOSCHEMATICS-014-site-owned-user-guide.md) — let Site own the interactive consumer-guide journey while repository documents remain canonical.
20. [ADR-INFOSCHEMATICS-015](ADR-INFOSCHEMATICS-015-specifications-own-realisations.md) — keep the Diagram self-contained by placing realisation claims in the optional Specifications overlay.
21. [ADR-INFOSCHEMATICS-016](ADR-INFOSCHEMATICS-016-region-geometry-is-stated-not-derived.md) — state a Region's geometry in the document and resolve its label metrics deterministically, rather than computing either from what the document does not contain.

## Outputs, examples, and the command line

22. [ADR-INFOSCHEMATICS-017](ADR-INFOSCHEMATICS-017-the-renderer-command-is-thin-and-its-input-is-inert.md) — publish document rendering as a thin Node command over canonical libraries, and keep its input inert data the command never executes.
23. [ADR-INFOSCHEMATICS-018](ADR-INFOSCHEMATICS-018-unify-presentation-sequences.md) — express expanded or collapsed, timed or manual presentation through one Sequence concept.
24. [ADR-INFOSCHEMATICS-019](ADR-INFOSCHEMATICS-019-preserve-authored-source-through-validated-edits.md) — retain authored YAML choices through stable-ID, transactional, host-owned edits.
25. [ADR-INFOSCHEMATICS-020](ADR-INFOSCHEMATICS-020-generate-example-exports-from-authored-yaml.md) — author every example as YAML and generate its typed export from that document.
26. [ADR-INFOSCHEMATICS-021](ADR-INFOSCHEMATICS-021-keep-example-packages-copyable-rather-than-published.md) — keep example packages copyable and unpublished rather than members of the coordinated release.
27. [ADR-INFOSCHEMATICS-022](ADR-INFOSCHEMATICS-022-rasterise-with-a-native-resvg-binding.md) — rasterise PNG output through a pinned native resvg binding named in the command's dependency allowlist.
28. [ADR-INFOSCHEMATICS-023](ADR-INFOSCHEMATICS-023-keep-the-preview-server-local-and-in-memory.md) — bind the development preview to loopback, serve it from memory, and keep it on the standard library.

## Motion, selection, and the surfaces that carry them

29. [ADR-INFOSCHEMATICS-024](ADR-INFOSCHEMATICS-024-name-dynamics-in-the-document.md) — let a document name the Dynamics it can express and leave every occurrence to the host.
30. [ADR-INFOSCHEMATICS-025](ADR-INFOSCHEMATICS-025-one-ordered-selection-with-an-anchor.md) — make the Design selection one ordered set and measure every group operation from its anchor.
31. [ADR-INFOSCHEMATICS-026](ADR-INFOSCHEMATICS-026-panels-follow-the-mode.md) — split whether a Producer is producing from which workspace they are in, and let the panels follow both.
32. [ADR-INFOSCHEMATICS-027](ADR-INFOSCHEMATICS-027-author-what-an-emphasis-means-not-how-it-is-played.md) — let a Dynamic say whether it depicts an event or a state, and leave every treatment choice to the renderer.
33. [ADR-INFOSCHEMATICS-028](ADR-INFOSCHEMATICS-028-a-point-is-its-own-artefact-kind.md) — make a Point a sixth artefact kind carrying a coordinate rather than a box, created from the Library and standing alone.
34. [ADR-INFOSCHEMATICS-029](ADR-INFOSCHEMATICS-029-a-diagram-host-mounts-the-announcement-surface.md) — make announcing a Dynamic an obligation of every host that mounts the Diagram, over one shared surface.
35. [ADR-INFOSCHEMATICS-030](ADR-INFOSCHEMATICS-030-a-composition-is-its-own-requirement.md) — state each cross-feature composition as its own requirement in its own area, rather than as a clause inside the newer feature.

## Artwork, scenes, and reviewing the whole drawing

36. [ADR-INFOSCHEMATICS-031](ADR-INFOSCHEMATICS-031-the-product-offers-renderer-artwork-as-data.md) — offer a standard catalogue of named treatments as serialisable artwork data every outlet draws, reached only where a host registers nothing.
37. [ADR-INFOSCHEMATICS-032](ADR-INFOSCHEMATICS-032-an-adapter-card-is-positioned-by-what-it-holds.md) — derive an Adapter Card's position from the Card it holds in every renderer, so its authored bounds do not position it.
38. [ADR-INFOSCHEMATICS-033](ADR-INFOSCHEMATICS-033-an-authored-overlay-is-drawn-wherever-the-diagram-is.md) — draw an authored Overlay wherever the Diagram is drawn, making a Scene's Graphic an addition to that set and scene scoping an option rather than the default.
39. [ADR-INFOSCHEMATICS-034](ADR-INFOSCHEMATICS-034-a-scene-cues-a-dynamic-and-a-view-owns-the-cadence.md) — let a Scene cue named Dynamics with a bounded `once` or `repeat` policy, keeping every timer in the View that plays it.
40. [ADR-INFOSCHEMATICS-035](ADR-INFOSCHEMATICS-035-a-sequence-paces-a-cascade-and-a-declaration-never-does.md) — let a Scene cue an ordered cascade in either kind of Sequence, paced by the Sequence's own stepping rather than by anything the document counts.
41. [ADR-INFOSCHEMATICS-036](ADR-INFOSCHEMATICS-036-a-checker-measures-a-drawing-and-never-repairs-it.md) — review a drawing by measuring it and reporting findings a reader can act on, never by moving anything or choosing a repair.
42. [ADR-INFOSCHEMATICS-037](ADR-INFOSCHEMATICS-037-a-palette-belongs-to-a-colour-scheme-not-an-outlet.md) — attach a palette to a colour scheme rather than to the outlet drawing it, resolved by the browser for an interactive drawing and once by the renderer for a still.
43. [ADR-INFOSCHEMATICS-038](ADR-INFOSCHEMATICS-038-a-creation-reaches-the-document-by-one-route.md) — make every element by one route, a create operation the projection carries to the document, so a defect in creation is one defect rather than one per surface.

## Repository operation

44. [GDR-INFOSCHEMATICS-002](GDR-INFOSCHEMATICS-002-delegated-mechanical-work.md) — retain judgment centrally while delegating bounded, disjoint mechanical work.
45. [GDR-INFOSCHEMATICS-003](GDR-INFOSCHEMATICS-003-root-build-tsconfig-is-base-not-shape.md) — keep shared build policy at the root and compiled-build shape in each package.
46. [GDR-INFOSCHEMATICS-004](GDR-INFOSCHEMATICS-004-promise-the-oldest-supported-node-line.md) — promise the oldest Node line still in support, and type against the same line.
47. [GDR-INFOSCHEMATICS-005](GDR-INFOSCHEMATICS-005-name-commands-by-owner-then-subject-then-verb.md) — name every command owner first, then subject, then verb, and hold the surface in one test.
