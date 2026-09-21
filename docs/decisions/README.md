# Decision records

Decision Records explain why Infoschematics has its current shape. Read them in this reveal order: product intent first, then model and interaction choices, then ownership and outputs, and finally repository operation. Each record is a concise living decision; delivery history belongs in roadmap records and Git.

## Product foundation

1. [GDR-INFOSCHEMATICS-001](GDR-INFOSCHEMATICS-001-adopt-decision-records.md) — separate why, what, how, facts, design, and delivery into their owning instruments.
2. [PDR-INFOSCHEMATICS-001](PDR-INFOSCHEMATICS-001-framework-neutral-library.md) — keep the reusable product model independent of hosts, examples, and UI frameworks.
3. [PDR-INFOSCHEMATICS-002](PDR-INFOSCHEMATICS-002-a-structured-editor-not-a-drawing-tool.md) — make Studio a structured Infoschematic editor rather than a general drawing tool.
4. [PDR-INFOSCHEMATICS-003](PDR-INFOSCHEMATICS-003-infoschematic.md) — name one complete authored product an Infoschematic.
5. [KDR-INFOSCHEMATICS-001](KDR-INFOSCHEMATICS-001-product-vocabulary.md) — use one canonical vocabulary across model, production, code, and documentation.
6. [PDR-INFOSCHEMATICS-004](PDR-INFOSCHEMATICS-004-product-messaging.md) — govern the product promise and tone from one record.

## Model and interaction

7. [ADR-INFOSCHEMATICS-001](ADR-INFOSCHEMATICS-001-routes-authored-as-points.md) — author Flow routes as points and derive renderer paths.
8. [ADR-INFOSCHEMATICS-002](ADR-INFOSCHEMATICS-002-undo-by-snapshot.md) — undo a complete Producer gesture through one authored-state snapshot.
9. [ADR-INFOSCHEMATICS-003](ADR-INFOSCHEMATICS-003-authored-identity-codes.md) — author stable human-readable identities rather than deriving them from order.

## Ownership and outputs

10. [ADR-INFOSCHEMATICS-004](ADR-INFOSCHEMATICS-004-source-sorted-by-ownership.md) — sort source by who owns behaviour before its implementation form.
11. [ADR-INFOSCHEMATICS-005](ADR-INFOSCHEMATICS-005-host-owned-configuration.md) — let the host select complete serialisable authored data and own runtime composition.
12. [ADR-INFOSCHEMATICS-006](ADR-INFOSCHEMATICS-006-additive-views-and-renderers.md) — compose interactive Views additively and keep static renderers parallel.
13. [ADR-INFOSCHEMATICS-007](ADR-INFOSCHEMATICS-007-site-as-public-outlet.md) — use Site as the public outlet without making it the reusable product owner.
14. [ADR-INFOSCHEMATICS-008](ADR-INFOSCHEMATICS-008-ownership-based-monorepo-roots.md) — separate consumable packages, deployable applications, and authored examples physically.
15. [ADR-INFOSCHEMATICS-009](ADR-INFOSCHEMATICS-009-host-provided-versioned-renderers.md) — let hosts supply validated renderer extensions without executable authored data.
16. [ADR-INFOSCHEMATICS-010](ADR-INFOSCHEMATICS-010-coordinated-package-release-contract.md) — publish the dependency-closed package set under one coordinated release contract.
17. [ADR-INFOSCHEMATICS-011](ADR-INFOSCHEMATICS-011-separate-authored-appearance-from-output-detail.md) — keep semantic authored identity separate from output-detail policy.
18. [ADR-INFOSCHEMATICS-012](ADR-INFOSCHEMATICS-012-keep-flow-signals-transient.md) — model Flow signals as accessible runtime occurrences rather than authored state.
19. [ADR-INFOSCHEMATICS-013](ADR-INFOSCHEMATICS-013-validation-mirrors-the-contract.md) — validate preferred YAML and compatible JSON against a runtime mirror of the canonical types.
20. [ADR-INFOSCHEMATICS-014](ADR-INFOSCHEMATICS-014-site-owned-user-guide.md) — let Site own the interactive consumer-guide journey while repository documents remain canonical.
21. [ADR-INFOSCHEMATICS-015](ADR-INFOSCHEMATICS-015-specifications-own-realisations.md) — keep the Diagram self-contained by placing realisation claims in the optional Specifications overlay.
22. [ADR-INFOSCHEMATICS-016](ADR-INFOSCHEMATICS-016-keep-region-bounds-explicit.md) — keep each Region's geometry independent and explicit.
23. [ADR-INFOSCHEMATICS-017](ADR-INFOSCHEMATICS-017-use-deterministic-region-label-metrics.md) — keep Region label geometry deterministic and name its shared metrics.
24. [ADR-INFOSCHEMATICS-018](ADR-INFOSCHEMATICS-018-keep-renderer-command-thin.md) — publish document rendering as a thin Node command over canonical libraries.
25. [ADR-INFOSCHEMATICS-019](ADR-INFOSCHEMATICS-019-unify-presentation-sequences.md) — express expanded or collapsed, timed or manual presentation through one Sequence concept.
26. [ADR-INFOSCHEMATICS-020](ADR-INFOSCHEMATICS-020-preserve-authored-source-through-validated-edits.md) — retain authored YAML choices through stable-ID, transactional, host-owned edits.
27. [ADR-INFOSCHEMATICS-021](ADR-INFOSCHEMATICS-021-keep-command-line-input-inert.md) — keep command-line input inert and leave TypeScript execution with the consumer.
28. [ADR-INFOSCHEMATICS-022](ADR-INFOSCHEMATICS-022-generate-example-exports-from-authored-yaml.md) — author every example as YAML and generate its typed export from that document.
29. [ADR-INFOSCHEMATICS-023](ADR-INFOSCHEMATICS-023-keep-example-packages-copyable-not-published.md) — keep example packages copyable and unpublished rather than members of the coordinated release.
30. [ADR-INFOSCHEMATICS-024](ADR-INFOSCHEMATICS-024-rasterise-with-a-native-resvg-binding.md) — rasterise PNG output through a pinned native resvg binding named in the command's dependency allowlist.
31. [ADR-INFOSCHEMATICS-025](ADR-INFOSCHEMATICS-025-keep-the-preview-server-local-and-in-memory.md) — bind the development preview to loopback, serve it from memory, and keep it on the standard library.
32. [ADR-INFOSCHEMATICS-026](ADR-INFOSCHEMATICS-026-name-dynamics-in-the-document.md) — let a document name the Dynamics it can express and leave every occurrence to the host.
33. [ADR-INFOSCHEMATICS-027](ADR-INFOSCHEMATICS-027-one-ordered-selection-with-an-anchor.md) — make the Design selection one ordered set and measure every group operation from its anchor.
34. [ADR-INFOSCHEMATICS-028](ADR-INFOSCHEMATICS-028-panels-follow-the-mode.md) — keep the collapsed rail a Present affordance and open the panel dock on entry to a Producer mode.
35. [ADR-INFOSCHEMATICS-029](ADR-INFOSCHEMATICS-029-author-what-an-emphasis-means.md) — let a Dynamic say whether it depicts an event or a state, and leave every treatment choice to the renderer.
36. [ADR-INFOSCHEMATICS-031](ADR-INFOSCHEMATICS-031-a-point-is-its-own-artefact-kind.md) — make a Point a sixth artefact kind with a coordinate geometry role rather than a part of the Flow that owns it.
37. [ADR-INFOSCHEMATICS-032](ADR-INFOSCHEMATICS-032-a-point-is-created-from-the-library.md) — create a Point from the Library path, alone rather than with a Flow, reversing `ADR-INFOSCHEMATICS-031`'s non-creatability consequence.
38. [ADR-INFOSCHEMATICS-033](ADR-INFOSCHEMATICS-033-a-diagram-host-mounts-the-announcement-surface.md) — make announcing a Dynamic an obligation of every host that mounts the Diagram, over one shared surface.
39. [ADR-INFOSCHEMATICS-034](ADR-INFOSCHEMATICS-034-a-composition-is-its-own-requirement.md) — state each cross-feature composition as its own requirement in its own area, rather than as a clause inside the newer feature.
40. [ADR-INFOSCHEMATICS-035](ADR-INFOSCHEMATICS-035-the-product-offers-renderer-artwork-as-data.md) — offer a standard catalogue of named treatments as serialisable artwork data every outlet draws, reached only where a host registers nothing.
41. [ADR-INFOSCHEMATICS-036](ADR-INFOSCHEMATICS-036-an-adapter-is-positioned-by-what-it-holds.md) — derive an Adapter Card’s position from the Card it holds in every renderer, so its authored bounds do not position it.
42. [ADR-INFOSCHEMATICS-037](ADR-INFOSCHEMATICS-037-an-authored-overlay-is-drawn-wherever-the-diagram-is.md) — draw an authored Overlay wherever the Diagram is drawn, making a Scene’s Graphic an addition to that set and scene scoping an option rather than the default.
43. [ADR-INFOSCHEMATICS-038](ADR-INFOSCHEMATICS-038-a-scene-cues-a-dynamic-and-a-view-owns-the-cadence.md) — let a Scene cue named Dynamics with a bounded `once` or `repeat` policy, keeping every timer in the View that plays it.
44. [ADR-INFOSCHEMATICS-039](ADR-INFOSCHEMATICS-039-a-sequence-paces-a-cascade-and-a-declaration-never-does.md) — let a Scene cue an ordered cascade in either kind of Sequence, paced by the Sequence's own stepping rather than by anything the document counts.

## Repository operation

39. [GDR-INFOSCHEMATICS-002](GDR-INFOSCHEMATICS-002-delegated-mechanical-work.md) — retain judgment centrally while delegating bounded, disjoint mechanical work.
40. [GDR-INFOSCHEMATICS-003](GDR-INFOSCHEMATICS-003-root-build-tsconfig-is-base-not-shape.md) — keep shared build policy at the root and compiled-build shape in each package.
41. [GDR-INFOSCHEMATICS-004](GDR-INFOSCHEMATICS-004-promise-the-oldest-supported-node-line.md) — promise the oldest Node line still in support, and type against the same line.
42. [GDR-INFOSCHEMATICS-005](GDR-INFOSCHEMATICS-005-command-naming.md) — name every command owner first, then subject, then verb, and hold the surface in one test.
