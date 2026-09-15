---
id: INFOSCHEMATICS-TOOL-051
area: TOOL
title: Inline browser verification
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-15T07:20:00Z
---

# Inline browser verification

## Goal

Complete a real-browser host-lifecycle check for inline Canvas rendering so integration behaviour has direct interaction evidence in addition to automated server-rendering coverage.

## Context

Inline SVG integration has automated host-lifecycle, server-rendering, identity, and accessibility evidence. Its attempted browser-control review could not run because the browser integration failed to initialise, so hover, selection, mounting, and unmounting were not manually exercised in an embedding host.

## Boundary

This item does not reopen the accepted inline-rendering contract, duplicate automated coverage without purpose, or broaden into general Canvas editing regression work. Any defect found becomes a separately scoped repair only when it falls outside this verification item.

## Current state

The blocking condition recorded when this item was captured has cleared: `vitest.browser.config.ts` runs a headless Chromium instance through the Playwright provider, `bun run test:browser` passes six suites, and its include globs already cover `packages/*/src/**/*.browser.test.tsx`.

`packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` exercises pointer lifecycle, drag cancellation, and unmount, and `packages/view-canvas/src/InfoschematicDiagram.responsive.browser.test.tsx` covers viewport response. What no suite covers is an embedding host holding two independent inline Canvases at once: cross-instance identity isolation, per-instance hover and selection, and remount after one instance is torn down are still unverified in a real browser.

## Steps

- [x] Add a host fixture browser suite that mounts two independent inline Canvases over different authored Infoschematics in one document.
- [x] Exercise hover and selection on each instance and assert the other instance's rendered state is unaffected.
- [x] Assert that the authored artefact identity required by `STATIC-010` stays stable per instance and does not collide across instances sharing one document.
- [x] Assert accessible naming resolves per instance rather than resolving to the first mounted Canvas.
- [x] Unmount one instance, confirm the survivor keeps its listeners and rendered state, then remount and confirm the restored instance behaves as a fresh mount.
- [x] Record the resulting browser evidence against the requirement that owns rendered inline verification.

## Files touched

- `packages/view-canvas/src/` for the new host-fixture browser suite
- `docs/specs/static-rendering.md` or `docs/specs/design-session.md` for the evidence entry, whichever owns inline host verification
- `docs/guides/integrating-renderers.md` where host mounting guidance needs the confirmed behaviour

## Verify

Run `bun run test:browser` and `bun run self:check`. The new suite must fail if either instance's identity, accessible naming, or listener lifecycle leaks across instances; confirm that by temporarily sharing an identity prefix between the two fixtures before landing the work.

## Dependencies / blocks

No dependency remains. This item deliberately does not block on [Design interaction layers](INFOSCHEMATICS-TOOL-045-design-interaction-layers.md); both extend the browser matrix, but this one verifies host embedding rather than Design behaviour.

## Documentation impact

### Decision Records

None expected. This item produces evidence for an accepted contract and does not change it.

### Specifications

Attach the browser evidence to the requirement owning rendered inline verification, or add one sibling quality requirement if host embedding is not Design-session behaviour. Do not restate the accepted inline-rendering contract.

### Guides

Update host mounting guidance only where the verified multi-instance behaviour contradicts or under-specifies what the guide currently claims.

### Roadmap

Any defect found that falls outside completing this check becomes a separate record rather than growing this item.

## Discussion

### Evidence boundary

The missing evidence is browser interaction, not another static snapshot. A passing run should demonstrate host lifecycle and instance isolation through observable DOM behaviour.

### Defect handling

Fix a narrow defect inside this work only when the repair is required to complete the stated browser check and does not change the accepted integration contract.

## Review

### Delivered

A Chromium host-fixture suite that mounts two independent inline Canvases in one document and verifies instance isolation through observable DOM behaviour, plus `DESIGN-017` recording the verified contract. The check also found a real cross-instance defect that is outside this item's boundary; it is captured as [Scoped renderer definition identity](INFOSCHEMATICS-TOOL-058-scoped-renderer-definition-identity.md).

### Summary of changes

`packages/view-canvas/src/InfoschematicDiagram.host.browser.test.tsx` is new. Both fixtures deliberately author the same codes — `CARD-A`, `CARD-B`, `FLOW-A` — because an embedding host has no say over what two independently authored documents call their Cards; a suite giving each fixture unique codes would pass whether or not instances were isolated. Five tests cover authored identity resolving per instance, accessible naming per instance, hover leaving the sibling unpointed, selection leaving the sibling unselected, and unmount-while-live followed by a remount that starts clean.

`docs/specs/design-session.md` gains `DESIGN-017`, a quality property for embedded-instance independence. Host embedding is not Design-session behaviour in the narrow sense, so it is a sibling requirement rather than an addition to `DESIGN-015`; it carries an explicit known exception for the renderer-internal identifier defect below.

`docs/roadmap/INFOSCHEMATICS-TOOL-058-scoped-renderer-definition-identity.md` is new, in Triage, and `docs/roadmap/_ISSUES.md` reserves through `058`.

### Verification

`bun run test:browser` — 8 files, 24 tests, all passing. `bun run self:check` passed.

The identity and naming assertions were mutation-tested as the Verify section required: giving both fixtures the same title and Card labels failed exactly those two tests and left the other three passing. The lifecycle assertions were not mutation-tested the same way, because there is no one-line edit that makes a remount dirty; they rest on asserting an empty event log and no selected class on the remounted instance.

### Outstanding concerns

The defect found is worth stating plainly, because it is the collision class this consolidation was looking for. Every Canvas emits fixed, document-global SVG `defs` identifiers — `infoschematic-arrow-<family>` and four `infoschematic-grid-*` patterns — and every Flow references its arrowhead as `url(#infoschematic-arrow-<family>)`. SVG resolves that to the first match in the document, so the second Canvas on a page renders with the first one's arrowhead colour, and a second Diagram with a different authored `gridSize` paints the first one's grid. A browser fixture with a purple family above a red one confirmed it directly. The static renderer already solved this with `STATIC-015`'s `resourceIdPrefix`; Canvas has no equivalent. `TOOL-058` carries the repair, since fixing it here would mean changing rendered identifiers, a stylesheet rule, and three unit suites — not the narrow repair this item's boundary permits.

`docs/guides/integrating-renderers.md` was left unchanged. It makes no multi-instance claim for the verified behaviour to contradict, and documenting the identifier defect in a host guide would be worse than fixing it in `TOOL-058`.

### Post-change review

Hover is a host-controlled prop, so the fixture holds `hovered` state and feeds it back; that is what makes the `pointed` class assertion evidence of routing rather than of the component talking to itself. React derives enter and leave from bubbling `pointerover`/`pointerout`, so the suite dispatches those rather than the non-bubbling `pointerenter` — the first draft dispatched `pointerenter` and silently recorded nothing.

### Mini recap

Two Canvases, one page, same authored codes: interaction, identity, naming, and lifecycle are all correctly isolated, now with browser evidence and `DESIGN-017`. Arrowheads and grid patterns are not, which is `TOOL-058`.
