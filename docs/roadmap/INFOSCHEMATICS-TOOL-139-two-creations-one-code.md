---
id: INFOSCHEMATICS-TOOL-139
area: TOOL
title: Two creations, one code
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: f92606c39d7bbfda82596899aec9fbe49cfa7bc1
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-10-04T21:05:00Z
---

# Two creations, one code

## Goal

Making two [Cards](../reference/vocabulary.md#standard-card) in [Design](../reference/vocabulary.md#design) without saving in between produces two Cards.

## Context

It currently produces one. `createCard` allocates a new Card's code from the **authored** register, so a second creation made before the first has been committed reissues the same code, and `recordArtefactOperation` treats the second as superseding the first rather than as a new element. The pending creation is silently replaced.

The allocator is the whole of it. Placement is exonerated: the browser evidence taken under `INFOSCHEMATICS-TOOL-125` shows the second creation being offered a different position from the first, so the placement search did consult the pending box and the operations layer did know both existed. Only code issuing looked at the authored document alone.

## Boundary

Where a new artefact's code comes from while creations are pending, and nothing about the creation route itself, which `INFOSCHEMATICS-TOOL-112` and [ADR-INFOSCHEMATICS-038](../decisions/ADR-INFOSCHEMATICS-038-a-creation-reaches-the-document-by-one-route.md) settled.

It does not change what a code looks like. [ADR-INFOSCHEMATICS-003](../decisions/ADR-INFOSCHEMATICS-003-authored-identity-codes.md) authors human-readable codes rather than deriving them from order, and that stays: the defect is which register is consulted, not what the register contains.

Whether the same fault reaches other artefact kinds is open and should be established before anything is fixed for Cards alone.

## Current state

Studio issues a new coded element's code in three places, and each composes its own register:

- **The element controls' Card and Adapter** (`createCard` in `packages/view-studio/src/app/App.tsx`) read `infoschematicRegister.all` alone, so a second Card made before the first is written is offered the first one's code. Because the creation's `id` is its code (`EDIT-024`), `recordArtefactOperation` matches the two by `sameArtefact` and the second supersedes the first. This is the defect as reported.
- **The Library** (`detailsArtefactContexts` in `packages/view-studio/src/app/panels/DetailsPanel.tsx`) already reads the authored codes together with the codes the pending artefact operations name, so two Library Cards, Points or Flows in a row do not collide. It does not read the lines drawn between ports, which are held in the editor draft's separate `creations` map rather than as operations.
- **A line drawn between two ports** (the `FamilyChoice` handler in `App.tsx`) reads the authored Flows and the `creations` keys, but not the pending operations, so a Flow made from the Library and a line drawn before either is written can be issued the same Flow code.

The identifier-only allocator the artefact factories use for Regions and Graphics (`createFactoryIdentityAllocator`) already avoids every pending operation's `id`, and the Library's `id` allocation does the same; neither issues a code. Scenes, Stories and Sequences are not coded artefacts and are not created through artefact operations.

So the fault reaches Flows as well as Cards, across the two pending stores rather than within one, and the Library's composition is the one that was nearly right.

### Decisions

- **One view of pending codes, read by every allocator.** `pendingArtefactCodes` in `packages/view-studio/src/app/editor/artefact-operations.ts` names every code a pending edit has claimed - the codes the pending artefact operations target, and the codes of the lines drawn and not yet written - and the Card control, the Library and the drawn-line family choice each add it to the authored register they already read. This is the single view the Discussion below anticipated, in the same module as `pendingArtefactBoxes`, which gives placement the equivalent. Decided under delegated autonomy (2026-10-04), reversible: one helper and three call sites.
- **Flows are fixed in the same change rather than recorded as a follow-up.** The Boundary asks whether the fault reaches other kinds before Cards are fixed alone; it reaches Flows by the same mechanism, and the fix is the same composition at one more call site. Decided under delegated autonomy (2026-10-04), reversible.
- **A pending removal keeps its code claimed.** `ADR-INFOSCHEMATICS-003` keeps the gap a removal leaves, and an allocator that offered a code back while its removal is still pending would hand out a name a change set under review is still talking about. This holds for authored elements only: a creation discarded before it is written leaves no operation, so its code is released, since nothing written ever named it. Decided under delegated autonomy (2026-10-04), reversible.
- **Out of scope: whether an Adapter may wrap a Card whose Adapter is still pending.** `canWrap` reads the authored register too, so a second Adapter can be offered for a Card whose first Adapter is unwritten. That is a question about what may be made, not what it is called; it now receives a distinct code under this change, and is left for a separate record if it matters. Decided under delegated autonomy (2026-10-04), reversible.

## Steps

- [x] Give `pendingArtefactCodes` the drawn-line `creations` as well as the pending operations, keeping each code once, and cover it in `artefact-operations.test.ts`: every pending creation's code, a pending removal's code kept, drawn lines included, two creations under distinct codes both standing, and nothing when nothing is pending.
- [x] Read it in `createCard`, in the `FamilyChoice` handler, and in `detailsArtefactContexts`, so each allocator composes the authored register with the same pending view.
- [x] Extend `App.browser.test.tsx`'s second-creation case to assert both Cards are drawn, as `SCOPE-01` and `SCOPE-02`.
- [x] Amend `EDIT-024` in `docs/specs/design-editing.md` to require the allocator's register to include pending creations, and update its Verify and Evidence.

## Files touched

- `packages/view-studio/src/app/editor/artefact-operations.ts` and `artefact-operations.test.ts`
- `packages/view-studio/src/app/App.tsx`
- `packages/view-studio/src/app/App.browser.test.tsx`
- `packages/view-studio/src/app/panels/DetailsPanel.tsx`
- `docs/specs/design-editing.md`
- This record

Not touched: the creation route (`INFOSCHEMATICS-TOOL-112`, `ADR-INFOSCHEMATICS-038`), the shape of a code (`ADR-INFOSCHEMATICS-003`), placement, and Site content, which `AGENTS.md` routes to a follow-up record.

## Verify

`bun run test` and `bun run test:browser` in `packages/view-studio` pass, including the extended browser case: two Cards made from the control without writing between them are both drawn, as `SCOPE-01` and `SCOPE-02`, and the second sits clear of the first. Reverting the `createCard` composition makes that case fail. The unit cases for `pendingArtefactCodes` pass. `bun run self:check` passes.

## Dependencies / blocks

None. `INFOSCHEMATICS-TOOL-112` and `INFOSCHEMATICS-TOOL-125`, which this builds on, are done.

## Documentation impact

### Decision Records

None. `ADR-INFOSCHEMATICS-003` (what a code looks like) and `ADR-INFOSCHEMATICS-038` (one creation route) are both unchanged; this corrects which register an allocator reads.

### Specifications

`EDIT-024` in `docs/specs/design-editing.md` gains the requirement that the register an allocator reads includes the codes pending creations have already named, with its Verify and Evidence updated.

### Guides

None here. Any Site mention is a follow-up record under `AGENTS.md`.

### Roadmap

None.

## Review

### Delivered

Within the approved boundary: every Studio surface that issues a code - the element controls' Card and Adapter, the Library, and the family choice that codes a line drawn between ports - now reads the authored register together with one view of the codes pending creations have claimed. Two Cards made from the control before either is written are two Cards, `SCOPE-01` and `SCOPE-02`; a Library Flow and a drawn line pending together cannot be issued the same Flow code. Excluded as planned: the creation route, the shape of a code, placement, the Adapter `canWrap` question, and Site content. Baseline `f92606c39d7bbfda82596899aec9fbe49cfa7bc1`; the result is the implementation commit that lands this packet.

### Change Summary

- `packages/view-studio/src/app/editor/artefact-operations.ts`: `pendingArtefactCodes(operations, drawnLines)` names, once each, every code a pending artefact operation targets (a pending removal's included) and every drawn line's code.
- `packages/view-studio/src/app/App.tsx`: `createCard` and the `FamilyChoice` handler add it to the register they read; `editor.creations` joins `createCard`'s dependencies.
- `packages/view-studio/src/app/panels/DetailsPanel.tsx`: `DetailsPanelEditor` carries `creations`, and `detailsArtefactContexts` reads the same helper for the Library allocator; the memo depends on it. `DetailsPanel.artefacts.test.tsx`'s editor fixture gains `creations: {}`.
- Tests: `artefact-operations.test.ts` covers the helper; `App.browser.test.tsx`'s second-creation case now asserts both Cards are drawn as `SCOPE-01` and `SCOPE-02`, clear of each other.
- `docs/specs/design-editing.md`: `EDIT-024` requires the allocator's register to include pending creations, operations and drawn lines alike, with Verify and Evidence updated.
- No deviation from the plan. Partial work drafted earlier in the session (the helper, the Card and Library call sites, the browser case and the spec text) was reviewed and kept; the drawn-line half was added.

### Verification

- `bunx vitest run src/app/editor/artefact-operations.test.ts src/app/panels/DetailsPanel.artefacts.test.tsx` in `packages/view-studio`: 29 passed.
- `bunx vitest run --config vitest.browser.config.ts src/app/App.browser.test.tsx`: 29 passed. With `createCard`'s pending composition removed, the second-creation case fails (`expected 1 to be 2`), so the case measures the fix.
- `bun run self:check`: 52 tasks successful.
- `bunx biome ci --diagnostic-level=error .`: clean. `ki repo audit --repo .`: PASS across 23 skills.

### Outstanding concerns

- `canWrap` reads the authored register alone, so a second Adapter can be offered for a Card whose first Adapter is still pending. It now receives a distinct code; whether it should be offered at all is outside this item and has no record yet.
- No browser case drives the Library-Flow-then-drawn-line collision end to end; it is covered at the helper and by the shared call sites.

### Post-change review

The goal holds: the reported fault is fixed and proved by a case that fails without the fix, and the same fault in Flows is fixed by the same composition rather than by a second mechanism. Scope held to code allocation. Regression risk is low: the allocators only see more codes, so the worst case is a skipped serial, which `ADR-INFOSCHEMATICS-003` already tolerates. Ready for acceptance review.

### Mini recap

Delivered one pending-codes view read by all three code allocators, with unit and browser evidence and the `EDIT-024` amendment; full gate and audit green. Concerns: the Adapter `canWrap` question and the absent end-to-end Flow case. Learning route: none proposed beyond this record - `pendingArtefactCodes` beside `pendingArtefactBoxes` is the reusable shape for any future allocator.

## Done

Accepted 2026-10-04 on the review packet above after an independent Fable review returned ACCEPT: every code-issuing allocator (the Card control, the Library and the drawn-line family choice) now reads the authored register together with `pendingArtefactCodes`, which covers both the artefact operations and the drawn-line store, and the two-Card browser case fails without the fix. Following a non-blocking finding, the helper comment and the removal decision now state that only a removal of an authored element keeps its code; a creation discarded before writing releases it. The Adapter question and the missing end-to-end Library-Flow-then-drawn-line browser case remain as recorded. Decided by the Fable reviewer under delegated autonomy (2026-10-04), reversible.

## Discussion

Found on 2026-09-24 while delivering `INFOSCHEMATICS-TOOL-125`, which deliberately did not absorb it — that item was about where a Card lands, this is about what it is called, and the two were equally true before it.

The likely shape is that the allocator has to see the authored register and the pending operations as one namespace, which is the same composition the placement search already does for boxes. If so, the two want the same view of pending state and that view is worth having once rather than twice.

Adopted 2026-10-04 under the owner's delegated estate-push authority, moved from Triage to Now and shaped to Ready in the same change. Partial implementation drafted earlier in the session was reviewed against this plan before delivery.
