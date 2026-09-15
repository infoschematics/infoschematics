---
id: INFOSCHEMATICS-TOOL-051
area: TOOL
title: Inline browser verification
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-15T05:10:00Z
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

- [ ] Add a host fixture browser suite that mounts two independent inline Canvases over different authored Infoschematics in one document.
- [ ] Exercise hover and selection on each instance and assert the other instance's rendered state is unaffected.
- [ ] Assert that the authored artefact identity required by `STATIC-010` stays stable per instance and does not collide across instances sharing one document.
- [ ] Assert accessible naming resolves per instance rather than resolving to the first mounted Canvas.
- [ ] Unmount one instance, confirm the survivor keeps its listeners and rendered state, then remount and confirm the restored instance behaves as a fresh mount.
- [ ] Record the resulting browser evidence against the requirement that owns rendered inline verification.

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
