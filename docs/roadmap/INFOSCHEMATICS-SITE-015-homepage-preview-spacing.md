---
id: INFOSCHEMATICS-SITE-015
area: SITE
title: Homepage preview spacing
theme: site-experience
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 9922258aaeb2351e60b34b2f3912687988e7aabd
---

# Homepage preview spacing

## Goal

Give the homepage Infoschematic enough vertical breathing room that its Inputs and Outputs framing remains legible while the preview still dissolves naturally into the page.

## Context

The homepage displays a 1268 by 408 static SVG behind a vertical edge mask. The authored Regions begin close to the view-box edge, so their labels and upper and lower frames enter the fade before the diagram's central content and can appear clipped or lost.

## Boundary

This item does not redesign the homepage composition, change its copy, alter the Infoschematic's concepts, or introduce a reusable renderer treatment unless visual inspection shows the issue originates below Site.

## Current state

The homepage image uses a 1268 by 408 authored view box and applies horizontal and vertical masks in Site CSS. The vertical mask reaches full opacity seven percent into the image, while the outer Region labels and frames begin near the SVG boundary. The underlying static output is otherwise visually accepted.

## Steps

- [x] Capture baseline desktop and narrow screenshots that show the top and bottom frame loss.
- [x] Adjust the Site-owned preview wrapper spacing and vertical mask stops so the outer framing remains readable without exposing a hard rectangular SVG edge.
- [x] Change authored overview geometry or view-box padding only if the same clipping remains when the SVG is viewed outside the homepage treatment.
- [x] Extend the homepage regression coverage for the selected wrapper and mask contract.
- [x] Inspect the final homepage at desktop and narrow widths, including the transition into surrounding copy and footer.

## Files touched

- apps/site/src/styles.css
- apps/site/src/App.test.tsx
- examples/is-infoschematics/src/overview.ts and its focused tests only if authored view-box padding is required

## Verify

Run bunx vitest run apps/site/src/App.test.tsx examples/is-infoschematics/src/overview.test.ts, bun run --cwd apps/site build, and bun run self:check. Inspect the built homepage at a representative desktop width and at 390 pixels, confirming Inputs and Outputs labels and their upper and lower frames remain readable while all four image edges still dissolve into the page.

## Dependencies / blocks

The accepted homepage overview and its static renderer output have landed. This is a Site-owned presentation adjustment with no build dependency.

## Documentation impact

### Decision Records

No decision record is needed because this work tunes one outlet treatment without changing ownership or public behaviour.

### Specifications

No behaviour-level specification changes are needed; acceptance is visual and Site-specific.

### Guides

No guide changes are needed because the adjustment does not change authoring or integration.

### Roadmap

Record any renderer-level spacing defect as a separate Tool item rather than expanding this Site item.

## Review

### Delivered

From baseline `9922258aaeb2351e60b34b2f3912687988e7aabd`, commit `466cf593` added Site-owned vertical breathing room and softened the vertical fade without changing the authored overview or renderer contract. The pre-change treatment was reconstructed from the baseline CSS for comparison, and the resulting homepage was inspected at desktop and a true 390-pixel CSS viewport.

### Summary of changes

- Added responsive block padding around the shared homepage preview.
- Moved the vertical mask's opaque stops from 7/93 percent to 3/97 percent so the outer framing remains legible.
- Added a focused regression assertion for the wrapper and mask contract.

### Verification

`bunx vitest run apps/site/src/App.test.tsx examples/is-infoschematics/src/overview.test.ts`, `bun run --cwd apps/site build`, and `bun run self:check` pass. Chromium inspection at 1440 by 1000 and through a 390 by 844 DevTools device-metric override confirmed readable Inputs and Outputs framing, dissolved edges, correct wrapping, and no horizontal document overflow.

### Outstanding concerns

None. The narrow visual comparison must use device emulation because headless Chrome otherwise enforces a 500-pixel minimum window and produces a misleading cropped screenshot.

### Post-change review

The change remains within the homepage outlet, leaves the accepted 1268 by 408 authored geometry intact, and preserves the frameless blueprint treatment. The focused CSS assertion and rendered inspection cover the regression risk, so the item is ready for acceptance review.

### Mini recap

The homepage preview now has enough space for its input and output framing to read clearly at desktop and narrow widths. No renderer-level defect or follow-up was found.

## Discussion

### Ownership

The fade belongs to the homepage outlet, so wrapper or mask spacing is the default home. Change authored diagram geometry only if the diagram is intrinsically cramped outside the homepage.

### Visual acceptance

Inputs and Outputs labels and their top and bottom frames should remain readable at desktop and narrow widths, while the preview should still feel embedded rather than boxed.
