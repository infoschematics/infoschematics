---
id: INFOSCHEMATICS-SITE-001
area: SITE
title: Explain Infoschematics visually
theme: site-experience
horizon: soon
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-008]
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

## Shaping

Author the self-describing definition as a new `examples/is-infoschematics` workspace, keep its configuration independent of React, and let Site mount it through the narrowest additive View package that supports the intended experience. `INFOSCHEMATICS-TOOL-008` must first establish that package surface. Before promotion, settle the narrative scope, representative artefacts and Scenes, Site route, and assertions that keep the example valid and serialisable.

## Discussion

### Role of the example

The homepage introduces the idea, the blank example establishes the minimum contract, and the self-describing Infoschematic will demonstrate a substantial authored definition. Keeping those roles separate lets each example remain legible and prevents the public site from becoming the product model.
