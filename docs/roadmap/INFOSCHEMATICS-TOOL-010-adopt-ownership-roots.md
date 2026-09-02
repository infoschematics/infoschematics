---
id: INFOSCHEMATICS-TOOL-010
area: TOOL
title: Adopt ownership roots
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 5c9cce879f06b51f7782efef91f7c09bfa0df8c6
---

## Goal

Make the monorepo's physical layout communicate ownership so consumable packages, deployable applications, and authored Infoschematic examples can evolve under distinct rules without losing Bun workspace integration.

## Context

All current packages, the Site, and the blank authored example live below `workspaces/`. The shared parent explains their package-manager mechanism but obscures their different publication and deployment responsibilities. [ADR-INFOSCHEMATICS-008](../decisions/ADR-INFOSCHEMATICS-008-ownership-based-monorepo-roots.md) settles `packages/`, `apps/`, and `examples/` as the durable roots.

## Boundary

This item changes physical ownership paths and the tooling that resolves them. It does not perform the Canvas, Present, Studio, or SVG package extraction in `INFOSCHEMATICS-TOOL-008`, publish packages, redesign the Site, or create the future `is-infoschematics` example.

## Current state

The repository has six Bun workspaces under one generic root: four consumable packages, one authored example, and one deployable site. Root scripts, dependency rules, repository configuration, and documentation name those paths directly.

## Steps

- [x] Record the ownership-root decision and its package, application, and example responsibilities.
- [x] Move reusable libraries from `workspaces/` to `packages/` without changing their package names or public APIs.
- [x] Move the public website to `apps/site` and update local development, build, deployment, and repository-site configuration.
- [x] Move authored `is-*` definitions to `examples/` without introducing view or application dependencies.
- [x] Update Bun workspace discovery, TypeScript checks, tests, dependency rules, and source-relative paths.
- [x] Update repository guidance, consumer documentation, specifications, decisions, and roadmap records that state current paths.
- [x] Confirm the shared website skills support `apps/site` as the conventional application root while retaining explicit override capability.

## Files touched

- workspace directories below `workspaces/`, moving to `packages/`, `apps/`, and `examples/`;
- root package, TypeScript, Vite, dependency, lockfile, and repository configuration;
- repository guidance and documentation that state workspace ownership;
- shared website-skill guidance only where the conventional Site default is currently hard-coded elsewhere.

## Verify

`bun install --frozen-lockfile`, `bun run check`, the Dependency Cruiser boundary gate, repository and roadmap audits, and a stale-path search must all pass. The Site must build from `apps/site`, and package names and exports must remain unchanged.

## Dependencies / blocks

The ownership rule is agreed and has no unresolved local dependency. Canonical shared skills live outside this repository; any required cross-repository skill change must be reviewed and committed in its owning repository rather than copied locally.

## Delegation

One worker owns mechanical directory moves and code/configuration path repair. One owns repository-documentation path repair. One audits the shared website skills and reports any canonical change needed. The coordinator owns the decision, lifecycle record, integration, cross-repository boundary, final verification, and commits.

## Documentation impact

### Decision Records

Add the ownership-root decision and update current decision text that names the old generic root.

### Specifications

Update only current physical paths; package names and behavioural requirements remain unchanged.

### Guides

Update development, architecture, consumer, and Site guidance to use the ownership roots.

### Roadmap

Keep `INFOSCHEMATICS-TOOL-008` focused on additive package extraction and record this layout migration independently.

## Review

### Delivered

Delivered the agreed ownership-based monorepo layout from baseline `5c9cce879f06b51f7782efef91f7c09bfa0df8c6`: consumable libraries now live under `packages/`, the deployable website lives at `apps/site`, and authored Infoschematic examples live under `examples/`.

### Summary of changes

Moved all six existing Bun workspaces without changing their package names or public exports; updated root scripts, lockfile, Vitest discovery, TypeScript gates, Dependency Cruiser rules, Site configuration, repository guidance, specifications, decisions, guides, and current roadmap paths. Added ADR-INFOSCHEMATICS-008. The canonical Knowledge Islands skills now default websites to `apps/site`, support safe explicit `site-root` alternatives, discover nested application manifests and configuration, and retain root-owned `ki:site:*` aliases over site-local lifecycle commands in harness commit `ad6d406e`.

### Verification

`bun install --frozen-lockfile` and `bun run check` pass. Website core, app, and Cloudflare repository audits pass against the migrated repository, as do authoring and roadmap audits. The canonical harness passes its focused website and repository context suites, full TypeScript check, `ki-skills` audit, formatting checks, and diff check with unrelated stopped-agent work isolated.

### Outstanding concerns

None within this item. `INFOSCHEMATICS-TOOL-008` still owns the additive Canvas, Present, Studio and SVG package extraction; `INFOSCHEMATICS-SITE-001` still owns the future `examples/is-infoschematics` definition.

### Post-change review

Ready for human acceptance. The public package names and behaviour are unchanged while physical paths now communicate ownership and the shared skills enforce the same convention.

### Mini recap

Infoschematics and the shared repository skills now agree on one reusable monorepo shape: packages are consumable, apps are deployable, and examples are independently authored.

## Discussion

### Why not a views root

Canvas, Present, and Studio are independently consumable packages. Keeping them with the other libraries makes publication ownership clearer than grouping them by their React implementation form.

### General Site convention

`apps/site` gives deployable websites a predictable composition root without forcing every repository to use it. Shared skills should use it as a conventional default and continue to accept an explicit `site-root` for existing or exceptional layouts.
