---
id: INFOSCHEMATICS-SITE-014
area: SITE
title: Scope site development
theme: site-experience
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: bd9b6c3be8c5514ff06b9181c9044532d6b3d037
---

# INFOSCHEMATICS-SITE-014 — Scope site development

## Goal

Expose the website development command through the governed `ki:site:dev` capability key at both the repository root and selected application package.

## Context

The website application package currently exposes a bare `dev` script while the root `ki:site:dev` and `self:dev` scripts delegate to that bare key. The website standard now requires the selected package to own `ki:site:dev`, allowing both root commands to delegate to the capability-owned package key without a naming exception.

## Boundary

This change does not alter the package-local `build` or `clean` lifecycle scripts, Cloudflare deployment commands, application code, compatibility aliases, or the unrelated baseline Knip finding.

## Current state

The root `ki:site:dev` and `self:dev` commands run `bun run --cwd apps/site dev`, and `apps/site/package.json` defines `dev` as `vite`. The immutable baseline also fails KNIP-2 because `scripts/visual-treatment-parity.test.ts` imports an unlisted `@infoschematics/view-model` dependency.

## Steps

- [x] Rename the selected package's bare `dev` script to `ki:site:dev`.
- [x] Delegate the root `ki:site:dev` and `self:dev` commands to the selected package's same key.
- [x] Confirm no further direct references require migration and run the repository gates.
- [x] Commit only the bounded receiver changes and prepare the review packet.

## Files touched

The root and selected-site `package.json` files, this roadmap record, and the roadmap issue ledger.

## Verify

Run the engineering, website-core, app-site, roadmap, stale-reference, production build, repository `self:check`, and Git whitespace gates. Confirm the approved pre-existing KNIP-2 exception is unchanged.

## Dependencies / blocks

The receiver applies the website contract committed in `ki-agentic-harness` at `e1b2595dbbbecfa2d838d82edb339153c9ba0357`. The coordinator explicitly authorised the unchanged baseline KNIP-2 finding as a recorded exception for this delivery.

## Documentation impact

### Decision Records

No receiver-local decision record is needed because this is a direct conformance migration to the approved website contract.

### Specifications

No product behaviour changes; the application development command continues to run Vite.

### Guides

No guide change is needed because the public root command remains `bun run ki:site:dev` and the repository-owned `self:dev` command remains available.

### Roadmap

This record preserves the receiver-local implementation, approved baseline exception, and review evidence.

## Review

### Delivered

Against immutable baseline `bd9b6c3be8c5514ff06b9181c9044532d6b3d037`, the selected application package now owns `ki:site:dev`, and both root commands delegate to that same key. Build, clean, Cloudflare, application, compatibility-alias, and unrelated Knip work remained excluded.

### Summary of changes

Renamed `apps/site/package.json` script `dev` to `ki:site:dev`, updated the direct root `ki:site:dev` and `self:dev` delegation targets, allocated `INFOSCHEMATICS-SITE-014`, and recorded this review packet. No further direct references required migration.

### Verification

The focused roadmap audit passed at baseline, while the website-core and app-site audits reported only the development-key gap this item repairs. After implementation, the authoring, roadmap, website-core, and app-site audits passed; Biome accepted both changed manifests; the package-manifest stale-reference search found no bare development key; `bun run ki:site:build` and `bun run self:check` completed successfully; and `git diff --check` passed. The focused engineering audit retains exactly one failure: KNIP-2 reports unlisted `@infoschematics/view-model` at `scripts/visual-treatment-parity.test.ts:4`, unchanged from baseline.

### Outstanding concerns

The immutable baseline and final focused engineering audit both fail KNIP-2 because `scripts/visual-treatment-parity.test.ts:4` imports unlisted dependency `@infoschematics/view-model`. The coordinator authorised this delivery to proceed without touching that unrelated finding. The production build also retains its existing warning for chunks larger than 500 kB; both concerns are outside the approved boundary.

### Post-change review

The change meets the capability-key goal without changing runtime behaviour. Its file scope is limited to the two manifests and lifecycle evidence, and regression risk is confined to command naming verified through the website audits, production build, and repository check. It is ready for human acceptance review with the approved baseline exception recorded.

### Mini recap

The repository and selected app package now share the `ki:site:dev` key, and the necessary `self:dev` reference follows the rename. All scoped gates pass; the known baseline Knip defect and existing bundle-size warning remain explicit future maintenance routes.

## Discussion

### Capability-owned package seam

Using the same key at both manifest levels makes delegation explicit while leaving the command implementation package-local. The bare `dev` alias is intentionally removed rather than retained as a compatibility path.

### Baseline exception

The pre-existing KNIP-2 failure is unrelated to website command naming. Coordinator authority permits recording it as an unchanged exception for this receiver rather than widening scope into dependency maintenance.
