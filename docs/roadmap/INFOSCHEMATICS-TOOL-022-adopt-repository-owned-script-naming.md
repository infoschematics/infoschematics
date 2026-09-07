---
id: INFOSCHEMATICS-TOOL-022
area: TOOL
title: Adopt repository-owned script naming
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Make every Infoschematics-owned package command identify its repository ownership directly while preserving command behaviour and the established capability-owned website surface.

## Context

The engineering standard now reserves `ki:` scripts for exact claims published by resolved capabilities and sanctions `self:` for repository-owned scripts. Twelve root commands still use unclaimed `ki:` names and are listed in `[skills.ki-engineering].script_exclusions`, so the focused engineering audit reports one `SCR-3` failure.

The rename map is exact and retains every suffix: `ki:check`, `ki:dev`, `ki:examples:render`, `ki:packages:build`, `ki:packages:check-versions`, `ki:packages:clean`, `ki:packages:pack-smoke`, `ki:release:verify`, `ki:tokens:generate`, `ki:verify:depcruise`, `ki:verify:typecheck`, and `ki:verify:visual-tokens` become the corresponding `self:` names. Capability-owned `ki:deps:update` and `ki:site:*` commands remain unchanged.

## Boundary

Rename only the twelve locked repository-owned scripts, their internal invocations, and tracked live references in the approved file set; remove the now-empty exclusion declaration. Do not alter command bodies beyond their invoked names, product behaviour, public APIs, `ki:site:*`, dependencies, generated output, external settings, or the pre-existing unstaged `apps/site/src/styles.css`; do not close, prune, push, deploy, publish, or contact external systems.

## Current state

Receiver baseline `0dacf9cc2be690520fd8332fc24c49b1a281a80c` is on `main`. The only pre-existing dirty path is unstaged `apps/site/src/styles.css`; the index is empty and the approved touched-path set is disjoint. Work and roadmap audits pass. Focused engineering and full repository audits fail only on the twelve unclaimed `ki:` exclusions.

## Steps

- [ ] Rename the twelve locked `package.json` keys and every internal invocation to the same suffix under `self:` without changing command behaviour.
- [ ] Remove the now-empty `script_exclusions` declaration and its obsolete comment from `.ki.toml` while preserving all other parsed configuration.
- [ ] Update scoped live references in repository instructions, README, workflows, guides, script diagnostics, and active roadmap verification commands.
- [ ] Verify JSON, YAML, and TOML parsing; search scoped live surfaces for stale old names; run the required repository and executable gates.
- [ ] Add the canonical review packet and bound batch run evidence, then stop at `awaiting-review` with the stylesheet untouched and unstaged.

## Files touched

- `.ki.toml`
- `package.json`
- `AGENTS.md`
- `README.md`
- `.github/workflows/ci.yml`
- `.github/workflows/release-npm.yml`
- `docs/guides/react-integration.md`
- `docs/guides/releasing-packages.md`
- `scripts/render-example.ts`
- `scripts/generate-visual-tokens.ts`
- `scripts/release/check-versions.ts`
- `scripts/release/pack-smoke.ts`
- `docs/roadmap/_ISSUES.md`
- `docs/roadmap/INFOSCHEMATICS-TOOL-022-adopt-repository-owned-script-naming.md`
- `docs/roadmap/INFOSCHEMATICS-TOOL-019-declutter-design-mode.md`
- `docs/roadmap/INFOSCHEMATICS-SITE-003-dotted-grid-treatment.md`
- `docs/roadmap/INFOSCHEMATICS-SITE-004-homepage-real-rendering.md`
- `+/_AUTHORISATIONS/INFOSCHEMATICS-BATCH-003.md`

## Verify

- Confirm the package script mapping is exactly twelve `ki:` to `self:` key renames with corresponding internal references and otherwise equivalent command bodies.
- Confirm `.ki.toml` parses and differs semantically only by removal of `script_exclusions`.
- Parse `package.json`, both changed workflow YAML files, and `.ki.toml`.
- Search scoped live-reference files for any of the twelve former names.
- Run `ki repo audit --skill ki-engineering --repo .`.
- Run `ki repo audit --repo .` and `ki repo audit --skill ki-work-roadmap --repo .`.
- Run `bun run self:check` and `bun run self:release:verify`.
- Run `git diff --check` and confirm `apps/site/src/styles.css` retains its preflight diff unchanged and unstaged.

## Dependencies / blocks

The portable script-ownership contract and shared-tree batch preflight are available from the approved harness rollout packet. No local work dependency or external coordination blocks this change. A new staged path, moved `HEAD`, overlap with the pre-existing stylesheet, or required-gate failure stops execution.

## Documentation impact

### Decision Records

No decision record change is needed; the harness engineering decision owns the namespace contract and this item applies it without a receiver-specific policy choice.

### Specifications

No behaviour-level specification changes are needed because script implementations and product behaviour remain unchanged.

### Guides

Update the two scoped guides so their executable command references use the repository-owned names.

### Roadmap

Create this receiver-owned rollout record, allocate `TOOL-022`, and update the three scoped active verification references whose commands are renamed.

## Discussion

### Ownership boundary

These twelve scripts aggregate Infoschematics-specific package, release, token, example, and verification operations; no resolved capability claims them. The existing `ki:site:*` and `ki:deps:update` commands remain the capability-owned seam.

### Shared tree

The stylesheet modification predates this work and belongs to another actor. It is not a blocker under the current batch preflight because the approved touched paths are disjoint, but it must remain byte-for-byte unchanged and unstaged through both serialized commit windows.
