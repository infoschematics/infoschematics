---
id: INFOSCHEMATICS-SITE-015
area: SITE
title: Homepage preview spacing
theme: site-experience
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
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

- [ ] Capture baseline desktop and narrow screenshots that show the top and bottom frame loss.
- [ ] Adjust the Site-owned preview wrapper spacing and vertical mask stops so the outer framing remains readable without exposing a hard rectangular SVG edge.
- [ ] Change authored overview geometry or view-box padding only if the same clipping remains when the SVG is viewed outside the homepage treatment.
- [ ] Extend the homepage regression coverage for the selected wrapper and mask contract.
- [ ] Inspect the final homepage at desktop and narrow widths, including the transition into surrounding copy and footer.

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

## Discussion

### Ownership

The fade belongs to the homepage outlet, so wrapper or mask spacing is the default home. Change authored diagram geometry only if the diagram is intrinsically cramped outside the homepage.

### Visual acceptance

Inputs and Outputs labels and their top and bottom frames should remain readable at desktop and narrow widths, while the preview should still feel embedded rather than boxed.
