---
id: INFOSCHEMATICS-TOOL-004
area: TOOL
title: Publish consumable packages
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-008]
baseline_ref: null
---

## Goal

Publish Domain Model, View Model and Studio View as independently consumable packages with stable build artefacts, export maps and release guidance.

## Context

The monorepo currently exposes TypeScript source and resolves matching package versions through Bun workspaces. That is enough for local hosts, examples and the public site, but external consumers still need path overrides. Publication should make the existing package boundary usable without copying source or depending on this repository's layout.

## Boundary

This item does not change the product model, add renderers, publish the site as a library, or introduce application-specific content. The initial publication targets are `@infoschematics/domain-model`, `@infoschematics/domain-core`, `@infoschematics/view-model` and `@infoschematics/view-studio`; later view and renderer packages join through their own delivery work.

## Shaping

Define one repeatable build, pack and release path for independently consumable packages, beginning with the framework-neutral packages and extending to the additive View surfaces once `INFOSCHEMATICS-TOOL-008` has stabilised them. Before promotion, settle compiled versus source distribution, declaration and export-map output, peer dependency ranges, coordinated versioning, provenance, registry authority, and an isolated packed-consumer smoke test.

## Discussion

### Release contract

The work should decide source versus compiled distribution, declaration output, peer dependency ranges, provenance and coordinated versioning. A package smoke test should install the packed artefacts into an isolated consumer and render a title-only Infoschematic before any registry release.
