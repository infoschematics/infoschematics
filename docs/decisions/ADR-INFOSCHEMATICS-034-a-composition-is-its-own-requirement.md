---
id: ADR-INFOSCHEMATICS-034
title: A composition is its own requirement
date: 2026-09-17
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-033]
---

# ADR-INFOSCHEMATICS-034: A composition is its own requirement

## Context

The Specifications corpus verifies features in isolation. Every one of its requirements can be individually conforming and the whole suite green while two correct features combine into a worse experience, because no requirement is written about the combination and no check reads one.

Three requirements already carry a cross-feature constraint, each as a clause inside one owning requirement. `DESIGN-015` requires that at least one movement case run while zoomed and panned, inside a flat `MUST exercise` matrix; `DESIGN-018` requires a Card port to follow the Flow's interaction layer rather than its host's; `DESIGN-020` requires an element whose interaction layer closes to leave a held group exactly as it leaves a single selection. That is a working precedent in one area and no rule for the corpus.

`INFOSCHEMATICS-TOOL-064` is the proof that the gap is not hypothetical. A held-group treatment was written in Canvas, reached the element, passed the whole suite, and was still not drawn, because Studio's own stylesheet shadowed it. The defect lived in the composition of two correct things, and the check written to catch it — `scripts/stylesheet-shadowing.test.ts` — defends a property no requirement states.

Two questions had to be settled before anything could be written, and this record settles both: what instrument states a composition, and what owns it when neither feature is the newer one.

## Decision

**A composition is its own requirement, with its own conformance state and its own evidence line, and all of them live in one area: `docs/specs/composition.md`, prefix `COMPOSE`.**

The matrix clause is rejected as the instrument. `DESIGN-015` shows its cost: its second paragraph lists twenty-odd behaviours one rendered matrix must exercise, carries one `_Conformance:_` value for all of them, and cites two browser files as evidence for the lot. A pair that regresses inside that list is invisible — the requirement stays conforming, the cited paths still resolve, and `scripts/specification-evidence.test.ts` has nothing to catch. A composition is exactly the kind of property that regresses quietly, so it gets the one shape the corpus can address individually: a requirement of its own.

Delivery order is rejected as the siting rule. The three existing clauses each sit in the newer of their two features, which works only while a pair has a clear newer member and makes ownership an accident of what landed last. It has no answer at all for the first composition this corpus has to write down: a treatment reaching a second Diagram host belongs to neither Canvas nor Studio but to the stylesheet chain between them, and its check is a `scripts/` file rather than a package. So the composition area owns every one of them, and each requirement names the two owning requirement ids in its own text — which is how a reader arriving from either feature can find it, and how the two features stay readable as features.

Three rules keep the area from becoming a second copy of the corpus.

A `COMPOSE` requirement states only the property that emerges from the pair. It MUST NOT restate what either feature promises alone; the feature areas keep those, and a composition that can be stated without naming both claimants is not a composition.

A pair already covered by a clause inside one owning requirement stays there. `DESIGN-018` and `DESIGN-020` are not re-sited, because moving them would buy nothing and cost their readers the context they were written in. The area is for compositions with no home, which is all of the ones this decision was needed for.

Each touched feature area names in its `## Gaps` section the pairs it takes part in that are not yet verified, so a reader of the feature learns that the composition exists and where it is recorded.

### The contended resources

Pairs are derived from resources with two live claimants today — the same screen region, document geometry, keyboard route, live-region channel, or visibility decision — rather than from the feature list, which would multiply features that never meet.

| Shared resource | Claimants | Surface a case runs on | Sited |
| --- | --- | --- | --- |
| The stylesheet cascade a Diagram treatment resolves through | `APPEAR-009`, `DESIGN-015` | Studio, `App.treatments.browser.test.tsx` | `COMPOSE-001` |
| Derived route geometry after a committed geometry edit | `EDIT-018`, `ROUTE-001` | Studio, `App.browser.test.tsx` | `COMPOSE-002` |
| Renderable geometry for a document the contract accepts | `AUTHOR-005`, `ROUTE-001` | Command line, `packages/cli/src/index.test.ts` | `COMPOSE-003` |
| The polite live-region channel for one occurrence | `DYNAMIC-006`, `PRESENT-003` | Present and Canvas browser suites | `COMPOSE-004` |
| Window keyboard while a host's own text field has focus | `PRESENT-010`, `EDIT-018` | Studio, `App.browser.test.tsx` | `COMPOSE-005` |
| Which elements a resolved occurrence may be drawn on | `DYNAMIC-003`, `PRESENT-003` | Present browser suite | `DYNAMIC-003` clause |
| The interaction-layer set against the held selection set | `DESIGN-018`, `DESIGN-020` | Studio, `App.browser.test.tsx` | `DESIGN-020` clause |
| Document-global `defs` identifiers across two hosts on one page | `DESIGN-017`, `STATIC-015` | Site, embedded-instance cases | `DESIGN-017`, divergent |

The last three rows are enumerated and not re-sited: two are already owned by a clause, and the third is a recorded divergence tracked by `INFOSCHEMATICS-TOOL-058`. Their presence in the table is the point — the enumeration is of resources, so a pair that already has a home is visible here as covered rather than missing.

## Consequences

The corpus gains an area whose requirements are all about pairs, and a rule that answers where the next one goes without a debate. `scripts/specification-evidence.test.ts` reads them exactly as it reads the rest, so a composition's conformance state and evidence paths are checked rather than trusted.

Three of the five sited compositions are recorded `divergent` on arrival. That is the instrument doing its job on its first outing: each was found by driving the rendered surfaces, each is a defect no feature area could see, and each now has a property stated in the corpus and an item to fix it. A matrix clause would have recorded them as prose inside a requirement that stayed conforming.

The cost is real and accepted. Every composition is one more requirement to keep true, and the area will grow faster than the features do, because pairs outnumber features. The three rules above are what hold that growth down: only emergent properties, no re-siting of pairs already owned, and a `## Gaps` line rather than a requirement for a pair nobody has verified yet.
