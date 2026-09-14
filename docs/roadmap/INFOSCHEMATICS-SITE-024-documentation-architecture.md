---
id: INFOSCHEMATICS-SITE-024
area: SITE
title: Documentation architecture
theme: site-experience
horizon: now
status: done
blocks: [INFOSCHEMATICS-SITE-026]
blocked_by: []
baseline_ref: 067bcb41ed3e574ef0d891f40dab408fe5555b1b
created_at: 2026-09-14T07:05:25Z
updated_at: 2026-09-14T07:37:12Z
---

# Documentation architecture

## Goal

Give readers a visual introduction before they enter the component catalogue, and make Components a distinct documentation area without weakening the practical user-guide journey.

## Context

The labelled whole Infoschematic currently opens the monolithic Components page even though it explains the overall idea. Components is also presented as a synthetic User guide entry rather than a first-class catalogue. The approved direction moves the self-describing diagram and legend into Overview, retains a concise practical journey, and prepares nested component reference pages.

## Boundary

This item changes Site-owned documentation composition, routing, navigation, links, and responsive presentation only. It does not change reusable package behavior, introduce component-page demos, add model fields, or rename the canonical thematic `Theme` concept.

## Current state

Overview is mostly prose. The whole labelled example, anatomy legend, every component specimen, and future notation share one long Components page. The left navigation places Components under User guide and has no component catalogue hierarchy.

## Steps

- [x] Extract the whole labelled Infoschematic and legend into a reusable Site component and place it in Overview with concise reader-facing copy.
- [x] Remove the duplicate anatomy section and internal-facing Point explanation from the Components page.
- [x] Introduce a first-class Components documentation section and a concise catalogue hub that can own nested component routes.
- [x] Preserve the practical journey through Overview, Installation, the Components hub, Authoring, representation, explanation, presentation, Studio, static rendering, and React integration.
- [x] Update Site-owned links, active navigation, mobile navigation, outlines, and route tests for the new information architecture.
- [x] Inspect Overview and Components at desktop and narrow widths for readable hierarchy and overflow.

## Files touched

- `apps/site/content/getting-started.md`
- `apps/site/src/routes.ts`
- `apps/site/src/DocsSidebar.tsx`
- `apps/site/src/DocumentPage.tsx`
- `apps/site/src/VisualGuide.tsx`
- New Site-owned anatomy or components-hub modules
- Site tests and `apps/site/src/styles.css`

## Verify

Run focused Site route, document, sidebar, guide-journey, and Components tests; run Site type checking and build; then run `bun run self:check`. Inspect Overview and Components in a browser at desktop and 390-pixel widths with no console errors or horizontal overflow.

## Dependencies / blocks

No build dependency. This item establishes the navigation and composition foundation used by `INFOSCHEMATICS-SITE-026`.

## Delegation

A bounded lower-cost worker may implement the Site information architecture inside `apps/site`, using the approved route order and existing authored anatomy specimen. The primary agent retains shared-route integration, visual review, verification, lifecycle evidence, and commits.

## Documentation impact

### Decision Records

No decision record is needed because the change preserves the existing Site-outlet and package-ownership boundaries.

### Specifications

No behavior-level contract changes. Navigation and documentation composition remain Site-owned.

### Guides

Move the labelled introduction into Overview and reorganize Components as a distinct reference area.

### Roadmap

Unblock the dedicated component-page work in `INFOSCHEMATICS-SITE-026`.

## Review

### Delivered

Overview now contains the labelled whole Infoschematic and legend. Components is a first-class documentation section with stable hub and child routes, and the practical user-guide journey continues through the hub without placing every component page in that journey.

### Summary of changes

Added reusable Overview composition, moved the homepage structure pathway to it, removed the duplicate anatomy and internal Point wording from Components, introduced component route metadata, and taught desktop and mobile navigation about the catalogue hierarchy.

### Verification

At result `4de2cbe3fb9f4f54db5ce82f57052cfdf15493fe`, 37 focused Site tests, Site TypeScript checking, and the production Site build passed in a clean detached worktree. Overview and Components were inspected at desktop and 390-pixel widths with no horizontal overflow or broken navigation layout.

### Outstanding concerns

The child routes intentionally use the existing Components implementation until `INFOSCHEMATICS-SITE-026` gives each destination its focused page. The reusable demo frame is delivered separately by `INFOSCHEMATICS-SITE-025`.

### Post-change review

The labelled example is now a visual introduction rather than the first specimen in a long reference page. Its legend uses the full available content width and no longer carries numbered side labels.

### Mini recap

Baseline `067bcb41ed3e574ef0d891f40dab408fe5555b1b`; result `4de2cbe3fb9f4f54db5ce82f57052cfdf15493fe`. The change remained inside Site-owned routing, composition, content, and tests.

## Done

Accepted 2026-09-14 by Kris Brown under `INFOSCHEMATICS-BATCH-011` closure authority on the review packet above.

## Discussion

### Journey and reference

The practical journey should introduce purpose and ways of working. The component catalogue is a reusable reference area, but its hub remains one bridge in the journey so a new reader sees the visual vocabulary before authoring.

### Overview composition

Render the anatomy as a real Site component beside authored Markdown rather than placing React placeholders inside Markdown. The homepage and Overview should reinforce one another without duplicating the same explanatory prose.

### Catalogue hierarchy

The Components section needs a hub and stable child destinations. Individual child pages remain outside the onboarding sequence and use catalogue navigation instead.
