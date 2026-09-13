# Specification ID migration

The package-shaped specification draft used implementation package prefixes without registering them and had never passed the Specifications audit. The feature-oriented migration made those accepted requirements conform to the canonical identity scheme once. This table is the permanent lookup from every former identifier to its replacement; future identifiers are append-only and MUST NOT be renumbered.

| Former ID     | Current ID    | Requirement                                                          | Area file                     |
| ------------- | ------------- | -------------------------------------------------------------------- | ----------------------------- |
| `DOMAIN-001`  | `AUTHOR-001`  | Authored things have stable identity                                 | authoring.md                  |
| `DOMAIN-002`  | `AUTHOR-002`  | Codes are authored, not inferred from position                       | authoring.md                  |
| `CORE-002`    | `AUTHOR-003`  | YAML and JSON are the authored formats                               | authoring.md                  |
| `CORE-004`    | `AUTHOR-004`  | An unknown key is a fault, not something to ignore                   | authoring.md                  |
| `CORE-005`    | `AUTHOR-005`  | Rejection is a result, not an exception                              | authoring.md                  |
| `DOMAIN-004`  | `AUTHOR-007`  | Authored definitions are data                                        | authoring.md                  |
| `DOMAIN-005`  | `AUTHOR-008`  | Authored data and calculations have separate owners                  | authoring.md                  |
| `DOMAIN-013`  | `AUTHOR-009`  | Renderer references remain serialisable                              | authoring.md                  |
| `CORE-001`    | `AUTHOR-010`  | Normalisation is total over well-typed input                         | authoring.md                  |
| `CORE-003`    | `AUTHOR-011`  | The schema mirrors the contract and cannot drift from it             | authoring.md                  |
| `CORE-006`    | `AUTHOR-012`  | The published JSON Schema comes from the validating schema           | authoring.md                  |
| `DOMAIN-003`  | `DIAGRAM-001` | Port references use compass-side identity                            | diagram-elements.md           |
| `DOMAIN-006`  | `DIAGRAM-002` | A fabric is a first-class artefact                                   | diagram-elements.md           |
| `DOMAIN-007`  | `DIAGRAM-003` | Regions state geography                                              | diagram-elements.md           |
| `DOMAIN-008`  | `DIAGRAM-004` | Placed artefacts belong to the Infoschematic geography               | diagram-elements.md           |
| `DOMAIN-011`  | `DIAGRAM-005` | Containment is an authored relationship                              | diagram-elements.md           |
| `DOMAIN-012`  | `DIAGRAM-006` | Scopes control applicability without changing identity               | diagram-elements.md           |
| `DOMAIN-014`  | `DIAGRAM-007` | Editable kinds retain distinct authored collections                  | diagram-elements.md           |
| `DOMAIN-015`  | `DIAGRAM-008` | Applied removal leaves valid authored references                     | diagram-elements.md           |
| `DOMAIN-009`  | `REALISE-001` | Relationship semantics and geometry are separate facts               | specification-realisations.md |
| `DOMAIN-010`  | `REALISE-002` | Component and flow conformance are distinct                          | specification-realisations.md |
| `DOMAIN-016`  | `APPEAR-001`  | Authored appearance is serialisable intent                           | appearance.md                 |
| `DOMAIN-017`  | `APPEAR-002`  | Collections and Families supply shared identity                      | appearance.md                 |
| `DOMAIN-019`  | `APPEAR-003`  | Authored appearance options are catalogued                           | appearance.md                 |
| `CANVAS-006`  | `APPEAR-004`  | Canvas resolves authored appearance through View Model               | appearance.md                 |
| `DOMAIN-018`  | `APPEAR-005`  | Renderer invariants are not authored options                         | appearance.md                 |
| `VIEW-017`    | `APPEAR-006`  | Shared visual semantics have one source                              | appearance.md                 |
| `VIEW-018`    | `APPEAR-007`  | CSS projection is deterministic                                      | appearance.md                 |
| `VIEW-019`    | `APPEAR-008`  | Renderer values remain consistent                                    | appearance.md                 |
| `CANVAS-005`  | `APPEAR-009`  | Shared Canvas semantics use generated tokens                         | appearance.md                 |
| `CANVAS-007`  | `APPEAR-010`  | Visual reduction preserves accessible meaning                        | appearance.md                 |
| `CANVAS-010`  | `APPEAR-011`  | Card internals use the shared layout                                 | appearance.md                 |
| `CANVAS-011`  | `APPEAR-012`  | Visual elements expose authored identity                             | appearance.md                 |
| `PRESENT-007` | `APPEAR-013`  | Component-scale shapes share the radius token                        | appearance.md                 |
| `VIEW-001`    | `ROUTE-001`   | Routes are orthogonal                                                | routing-and-placement.md      |
| `VIEW-002`    | `ROUTE-002`   | Route edits preserve anchored ends                                   | routing-and-placement.md      |
| `VIEW-003`    | `ROUTE-003`   | Waypoint edits preserve route validity                               | routing-and-placement.md      |
| `VIEW-004`    | `ROUTE-004`   | Route normalisation removes redundant points                         | routing-and-placement.md      |
| `VIEW-005`    | `ROUTE-005`   | Ports lie on their declared edge                                     | routing-and-placement.md      |
| `VIEW-006`    | `ROUTE-006`   | A side is subdivided rather than filled from one end                 | routing-and-placement.md      |
| `VIEW-007`    | `ROUTE-007`   | A side offers every count it can place safely                        | routing-and-placement.md      |
| `VIEW-008`    | `ROUTE-008`   | Unspecified port counts use one declared default                     | routing-and-placement.md      |
| `VIEW-009`    | `ROUTE-009`   | Port audits expose collisions and mismatches                         | routing-and-placement.md      |
| `VIEW-010`    | `ROUTE-010`   | The editing grid uses diagram coordinates                            | routing-and-placement.md      |
| `VIEW-011`    | `ROUTE-011`   | Alignment guides come from the scene                                 | routing-and-placement.md      |
| `VIEW-012`    | `ROUTE-012`   | Each axis snaps independently                                        | routing-and-placement.md      |
| `VIEW-013`    | `ROUTE-013`   | A flow label belongs to its route                                    | routing-and-placement.md      |
| `VIEW-014`    | `ROUTE-014`   | Automatic label placement avoids occupied space                      | routing-and-placement.md      |
| `VIEW-015`    | `ROUTE-015`   | Floating overlays remain within the view                             | routing-and-placement.md      |
| `VIEW-025`    | `ROUTE-016`   | Card internals are placed from the Card's own box                    | routing-and-placement.md      |
| `VIEW-026`    | `ROUTE-017`   | Card text is fitted to the Card it is drawn on                       | routing-and-placement.md      |
| `SVG-003`     | `STATIC-001`  | Scene visibility is explicit                                         | static-rendering.md           |
| `SVG-004`     | `STATIC-002`  | Scope visibility is explicit                                         | static-rendering.md           |
| `SVG-005`     | `STATIC-003`  | Overlays remain serialisable                                         | static-rendering.md           |
| `SVG-007`     | `STATIC-004`  | Static output honours resolved visual treatments                     | static-rendering.md           |
| `SVG-008`     | `STATIC-005`  | Explicit signals have deterministic still treatment                  | static-rendering.md           |
| `SVG-009`     | `STATIC-006`  | Flow annotations are opt-in and deterministic                        | static-rendering.md           |
| `SVG-010`     | `STATIC-007`  | Ink resolves from the fill it sits on                                | static-rendering.md           |
| `SVG-011`     | `STATIC-008`  | A dots grid treatment renders intersection marks                     | static-rendering.md           |
| `SVG-012`     | `STATIC-009`  | Card internals use the shared layout                                 | static-rendering.md           |
| `SVG-013`     | `STATIC-010`  | Visual elements expose authored identity                             | static-rendering.md           |
| `SVG-001`     | `STATIC-011`  | Output is deterministic                                              | static-rendering.md           |
| `SVG-002`     | `STATIC-012`  | Text and attributes are safe                                         | static-rendering.md           |
| `SVG-006`     | `STATIC-013`  | Static output uses shared visual semantics                           | static-rendering.md           |
| `CANVAS-003`  | `EXTEND-001`  | Extension failure retains product behaviour                          | renderer-extensions.md        |
| `CANVAS-004`  | `EXTEND-002`  | Renderer compatibility is explicit                                   | renderer-extensions.md        |
| `EDIT-073`    | `EXTEND-003`  | Fabrics retain a generic fallback                                    | renderer-extensions.md        |
| `EDIT-074`    | `EXTEND-004`  | Story Overlays resolve through authored data                         | renderer-extensions.md        |
| `CANVAS-001`  | `EXTEND-005`  | The host supplies an immutable renderer registry                     | renderer-extensions.md        |
| `CANVAS-002`  | `EXTEND-006`  | Renderer definitions are versioned and validated                     | renderer-extensions.md        |
| `EDIT-072`    | `EXTEND-007`  | Hosts supply visual implementations                                  | renderer-extensions.md        |
| `CANVAS-008`  | `SIGNAL-001`  | Signals are finite keyed occurrences                                 | flow-signals.md               |
| `PRESENT-015` | `SIGNAL-002`  | Scene entry can signal focused Flows once                            | flow-signals.md               |
| `PRESENT-016` | `SIGNAL-003`  | Scene changes cancel obsolete signals                                | flow-signals.md               |
| `CANVAS-009`  | `SIGNAL-004`  | Signal meaning survives motion preferences                           | flow-signals.md               |
| `PRESENT-011` | `PRESENT-001` | Production mode is explicit and transient                            | presentation.md               |
| `PRESENT-012` | `PRESENT-002` | Mode changes preserve preferences, not presentation activity         | presentation.md               |
| `PRESENT-001` | `PRESENT-003` | Filter banks are individually controlled                             | presentation.md               |
| `PRESENT-002` | `PRESENT-004` | No Scene means full-strength rendering                               | presentation.md               |
| `PRESENT-003` | `PRESENT-005` | Focus does not change geometry                                       | presentation.md               |
| `PRESENT-013` | `PRESENT-006` | Visibility is resolved before focus                                  | presentation.md               |
| `PRESENT-006` | `PRESENT-007` | Info is derived from the model                                       | presentation.md               |
| `PRESENT-008` | `PRESENT-008` | Keyboard help reflects presentation controls                         | presentation.md               |
| `PRESENT-009` | `PRESENT-009` | The Infoschematic can take the available canvas                      | presentation.md               |
| `PRESENT-004` | `SCENE-001`   | A running Story can be steered                                       | scenes-and-callouts.md        |
| `PRESENT-014` | `SCENE-002`   | Only activatable presentation material can own focus                 | scenes-and-callouts.md        |
| `PRESENT-005` | `SCENE-003`   | Automatic Callout placement is deterministic                         | scenes-and-callouts.md        |
| `PRESENT-010` | `SCENE-004`   | Custom Callouts retain the Audience contract                         | scenes-and-callouts.md        |
| `EDIT-001`    | `DESIGN-001`  | Production mode is session state                                     | design-session.md             |
| `EDIT-002`    | `DESIGN-002`  | Studio does not write authored source                                | design-session.md             |
| `EDIT-064`    | `DESIGN-003`  | Reasserting the current mode changes nothing                         | design-session.md             |
| `EDIT-075`    | `DESIGN-004`  | Mode transitions clean up presentation activity                      | design-session.md             |
| `EDIT-076`    | `DESIGN-005`  | Producer modes use complete authored content                         | design-session.md             |
| `EDIT-005`    | `DESIGN-006`  | Editing aids appear only while editing                               | design-session.md             |
| `EDIT-034`    | `DESIGN-007`  | Selection does not imply mutation                                    | design-session.md             |
| `EDIT-035`    | `DESIGN-008`  | Selection can be cleared                                             | design-session.md             |
| `EDIT-036`    | `DESIGN-009`  | The editor identifies the selected kind                              | design-session.md             |
| `EDIT-061`    | `DESIGN-010`  | Hover and selection use related, distinct treatments                 | design-session.md             |
| `EDIT-030`    | `DESIGN-011`  | A flow is selectable by its route                                    | design-session.md             |
| `EDIT-041`    | `DESIGN-012`  | A selected flow exposes both attachments                             | design-session.md             |
| `EDIT-050`    | `DESIGN-013`  | Fabrics participate as artefacts                                     | design-session.md             |
| `EDIT-079`    | `DESIGN-014`  | Design exposes the six-kind capability contract                      | design-session.md             |
| `EDIT-059`    | `DESIGN-015`  | The rendered editor is tested                                        | design-session.md             |
| `EDIT-077`    | `DIRECT-001`  | Direct has a discriminated active target                             | directing.md                  |
| `EDIT-078`    | `DIRECT-002`  | Empty Themes and Stories remain authorable                           | directing.md                  |
| `EDIT-008`    | `EDIT-001`    | A diagram supplies its editing rules                                 | design-editing.md             |
| `EDIT-011`    | `EDIT-002`    | Keyboard nudging is exact                                            | design-editing.md             |
| `EDIT-017`    | `EDIT-003`    | Every route change is represented                                    | design-editing.md             |
| `EDIT-018`    | `EDIT-004`    | Port counts are editable per side                                    | design-editing.md             |
| `EDIT-013`    | `EDIT-005`    | A port shows whether it is used                                      | design-editing.md             |
| `EDIT-042`    | `EDIT-006`    | A flow end can be reattached to an offered port                      | design-editing.md             |
| `EDIT-031`    | `EDIT-007`    | Flow waypoints can be edited deliberately                            | design-editing.md             |
| `EDIT-080`    | `EDIT-008`    | Artefact geometry follows kind constraints                           | design-editing.md             |
| `EDIT-067`    | `EDIT-009`    | Removal remains reviewable                                           | design-editing.md             |
| `EDIT-068`    | `EDIT-010`    | A flow can be created between ports                                  | design-editing.md             |
| `EDIT-069`    | `EDIT-011`    | A card can be created with a valid default                           | design-editing.md             |
| `EDIT-071`    | `EDIT-012`    | Moving a component carries attached presentation                     | design-editing.md             |
| `EDIT-082`    | `EDIT-013`    | Library creation produces independent authored values                | design-editing.md             |
| `EDIT-083`    | `EDIT-014`    | Design previews the complete materialised draft                      | design-editing.md             |
| `EDIT-084`    | `EDIT-015`    | Removal plans make consequences explicit                             | design-editing.md             |
| `EDIT-085`    | `EDIT-016`    | Authored treatments are editable, and an optional one can be cleared | design-editing.md             |
| `EDIT-086`    | `EDIT-017`    | Port-count edits preserve attachments                                | design-editing.md             |
| `EDIT-087`    | `EDIT-018`    | Placement inputs have equivalent semantics                           | design-editing.md             |
| `EDIT-088`    | `EDIT-019`    | Created artefacts enter the complete editing lifecycle               | design-editing.md             |
| `EDIT-028`    | `CHANGE-001`  | Every draft edit can be undone                                       | change-management.md          |
| `EDIT-040`    | `CHANGE-002`  | Change actions form one control group                                | change-management.md          |
| `EDIT-029`    | `CHANGE-003`  | Undo history is not persisted                                        | change-management.md          |
| `EDIT-060`    | `CHANGE-004`  | Drafts already reflected by the model are dropped                    | change-management.md          |
| `EDIT-081`    | `CHANGE-005`  | Typed operations share one atomic draft lifecycle                    | change-management.md          |
| `EDIT-019`    | `CHANGE-006`  | Changes accumulate in one set                                        | change-management.md          |
| `EDIT-052`    | `CHANGE-007`  | One pending change can be dropped                                    | change-management.md          |
| `EDIT-056`    | `CHANGE-008`  | A change names what it describes                                     | change-management.md          |
| `EDIT-058`    | `CHANGE-009`  | Changes are consolidated by property                                 | change-management.md          |
| `VIEW-016`    | `RUNTIME-001` | Runtime derivation is framework-neutral                              | runtime-model.md              |
| `VIEW-020`    | `RUNTIME-002` | Selection and capabilities are discriminated by kind                 | runtime-model.md              |
| `VIEW-021`    | `RUNTIME-003` | Geometry operations preserve kind constraints                        | runtime-model.md              |
| `VIEW-022`    | `RUNTIME-004` | Draft materialisation is immutable and deterministic                 | runtime-model.md              |
| `VIEW-023`    | `RUNTIME-005` | Removal materialisation preserves references                         | runtime-model.md              |
| `VIEW-024`    | `RUNTIME-006` | Draft preview derives a complete runtime                             | runtime-model.md              |
