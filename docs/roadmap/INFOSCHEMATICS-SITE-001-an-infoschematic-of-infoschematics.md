---
id: INFOSCHEMATICS-SITE-001
area: SITE
title: Explain Infoschematics visually
theme: site-experience
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
transferred_from: INFOSCHEMATICS-WEB-SITE-001
---

## Goal

Author an Infoschematic of Infoschematics so the public website explains the product architecture in its own medium.

## Context

The website is now part of this repository as the public outlet for the packages, guidance and examples. Its designed homepage already uses a small schematic-like sequence to explain the idea, while `@infoschematics/is-blank` proves the Studio view accepts a valid title-only configuration.

The future example should replace neither of those. It should be a complete authored product that demonstrates the Domain Model contract, an appropriate View package and the vocabulary without becoming hidden application state.

## Boundary

This item does not reintroduce 5G-EMERGE content, add domain-specific renderers to the reusable packages, or make the website the source of product types. It does not remove the designed homepage or the blank example.

## Current state

`examples/is-blank` is the only authored example and proves the minimum title-only contract. `apps/site` exposes that example at `/examples/blank/` through the current Studio View, while the homepage explains the idea with bespoke website composition. No complete authored Infoschematic currently explains the package architecture, dependency direction, View choices or host boundary.

## Steps

- [ ] Define the self-describing narrative around Domain Model, Domain Core, View Model, Canvas, Present, Studio, renderers, authored examples and hosts without introducing repository mechanics as product concepts.
- [ ] Create `examples/is-infoschematics` as a framework-neutral workspace depending only on Domain Core and exporting one complete serialisable definition.
- [ ] Use Lanes and Zones for ownership boundaries, Cards for packages and hosts, Flows for allowed dependency direction, and Scenes plus one concise Story to explain the architecture progressively.
- [ ] Add model-level tests for stable identifiers, valid references, serialisability, complete Scene focus and the absence of React, browser state and callbacks from the definition.
- [ ] Add a Site route at `/examples/infoschematics/`, a host component that owns page metadata, and navigation that keeps the homepage and blank example unchanged.
- [ ] Mount the example through the narrowest available public View: Present when the additive packages exist, otherwise the current Studio compatibility surface without enabling Producer controls by default.
- [ ] Add Site tests for direct routing, document title, representative rendered content and production build inclusion.
- [ ] Update public guidance to distinguish the homepage introduction, blank contract example and substantial self-describing example.

## Files touched

- new `examples/is-infoschematics/package.json`, `tsconfig.json` and `src/**` definition and tests;
- `package.json` and `bun.lock` only for workspace verification wiring;
- `apps/site/src/routes.ts`, `main.tsx`, a new example host component, navigation and focused tests;
- `docs/guides/authoring.md`, `docs/guides/react-integration.md` and `docs/design/architecture.md` where they link to representative examples.

## Verify

The authored-example tests must prove `JSON.stringify` succeeds, every referenced artefact and Scene exists, and the workspace imports no View or Site module. Site tests must prove both slash variants route directly, the document title comes from the definition, and representative package labels and dependency Flows render. `bun run check` is the final pass/fail gate.

## Dependencies / blocks

There is no hard dependency on the additive-view extraction: the current Studio View is a valid host surface, and the example definition remains framework-neutral whichever View is available. If `INFOSCHEMATICS-TOOL-008` lands first, Site uses Present directly; otherwise its later migration is mechanical and does not change the authored definition.

## Documentation impact

### Decision Records

No new decision is expected. ADR-INFOSCHEMATICS-005 and ADR-INFOSCHEMATICS-007 already govern host-owned configuration and the Site outlet.

### Specifications

No behaviour-level specification change is expected; tests exercise the existing Domain and View contracts with a substantial example.

### Guides

Link the example from authoring and React integration guidance and explain the three distinct public-example roles.

### Roadmap

Remove the example's forward-work record only through normal acceptance and pruning. Capture genuine reusable capability gaps separately rather than hiding them in Site code.

## Discussion

### Role of the example

The homepage introduces the idea, the blank example establishes the minimum contract, and the self-describing Infoschematic will demonstrate a substantial authored definition. Keeping those roles separate lets each example remain legible and prevents the public site from becoming the product model.
