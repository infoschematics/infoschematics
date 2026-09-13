---
id: INFOSCHEMATICS-TOOL-040
area: TOOL
title: Repository conformance pass
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 7646468507d3bc10e80b414a8f1d5661d7a82346
---

# Repository conformance pass

## Goal

Produce one evidence-backed conformance review of the declared Knowledge Islands repository standard, apply safe mechanical corrections, and turn material product or governance findings into separately prioritised work.

## Context

Routine delivery runs the product verification gate and focused governance audits, but the earlier post-delivery review requested one complete audit-and-conform cycle across the declared standard. Mechanical success alone is insufficient because several skills carry judgment criteria that need repository evidence and explicit conclusions.

## Boundary

This item does not implement unrelated product findings, change the adapter or repository type, enable new skills, push, release, publish, or apply semantic corrections whose scope requires a separate decision or work record. Conform operations remain within each skill's declared authority.

## Current state

The repository declares 18 resolved skills spanning repository shape, documentation, engineering, source control, website ownership, runtime context, and work management. The complete audit and focused documentation audits pass, and `bun run self:check` is green.

## Steps

- [x] Resolve the current declared skill set from `.ki.toml` and map each skill's audit, conform, and judgment responsibilities.
- [x] Run one full repository audit, retain a concise result inventory, and separate failures, warnings, and judgment criteria.
- [x] Gather focused repository evidence for Git practice, documentation placement, website ownership, toolchain, tokenomics, roadmap, and specification quality.
- [x] Inspect applicable mechanical corrections and apply only safe changes within the item's boundary.
- [x] Re-run the complete audit, focused audits for changed governance paths, and the product gate; record outcomes and external-authority limits in the review packet.

## Files touched

- `package.json`
- `knip.json`
- `apps/site/src/routes.ts`
- `docs/decisions/README.md`
- `docs/roadmap/INFOSCHEMATICS-TOOL-040-repository-conformance-pass.md`

## Verify

Run `ki repo audit --repo .` before and after the bounded correction pass, focused audits for changed governance paths, and `bun run self:check`. The review must name every declared skill, mechanical outcome, judgment-family conclusion, changed path, and deferred material finding.

## Dependencies / blocks

The repository is bootstrapped and all configured skills resolve locally. No external service, publication, or deployment authority is required.

## Documentation impact

### Decision Records

No new decision was required. The existing decision index was restored to canonical serial order.

### Specifications

No product contract changed. The consolidated feature specifications and their conformance evidence passed the complete audit.

### Guides

No guide correction was required; guide placement, index, and practical-content checks passed.

### Roadmap

No separate material finding was created. Existing major dependency holds in `.ki.toml` remain deliberate future work rather than conformance failures.

## Review

### Delivered

Completed the approved repository-wide conformance pass from baseline `7646468507d3bc10e80b414a8f1d5661d7a82346`. Safe corrections landed in `6f53607f`, and this record captures the final audit and judgment evidence.

### Summary of changes

Sorted root package scripts, declared the root View Model development dependency used by scripts, normalised managed exclusions in `knip.json`, restored decision-index ordering, and removed two unused Site route exports. No repository type, skill selection, product contract, or external setting changed.

### Verification

`ki repo audit --repo .` passed all 18 declared skills with no failures or warnings. Focused decision-record, specification, guide, and roadmap audits passed. `bun run self:check` passed 535 tests, every workspace type-check, dependency validation, generated-artefact checks, package builds, and the production Site build.

### Outstanding concerns

No unresolved conformance finding remains. Major TypeScript, Vite, React plugin, and Node type upgrades stay explicitly held in `.ki.toml`; they are planned migrations, not audit defects. GitHub and Cloudflare changes were outside this local, non-publishing boundary, and the audit did not require either.

### Post-change review

The repository configuration now matches actual root-script dependencies and managed-tool ownership. Documentation and work records are discoverable through their required indexes, the Site remains an outlet rather than the owner of reusable product behaviour, and the product gate exercises the declared package boundaries.

### Mini recap

All 18 configured Knowledge Islands skills resolve and pass. Five paths received bounded mechanical corrections, and no material follow-on finding was hidden or improvised.

## Done

Accepted 2026-09-13 by the project owner on the review packet above.

## Discussion

### Declared skill inventory

- Repository and documentation: `ki-repo`, `ki-repo-project`, `ki-authoring`, `ki-decision-records`, `ki-guides`, and `ki-specs`.
- Engineering and source control: `ki-engineering`, `ki-git`, and `ki-housekeeping-claude`.
- Website outlet: `ki-repo-website`, `ki-repo-website-app`, and `ki-repo-website-cloudflare`.
- Runtime context: `ki-tokenomics`, `ki-tokenomics-claude`, and `ki-tokenomics-codex`.
- Work management: `ki-work`, `ki-work-roadmap`, and `ki-agora`.

### Judgment evidence

`.ki.toml` supplies the selected repository shape, outlets, adapters, runtime support, and dependency holds. `AGENTS.md` and `docs/design/architecture.md` establish ownership and dependency direction. Documentation indexes and feature-area specifications provide progressive reveal and accepted-contract evidence. `package.json`, workspace TypeScript projects, dependency-cruiser configuration, generated-artefact checks, tests, and the production build provide engineering evidence. Scoped commits and exact-path staging provide local Git evidence.

### Change boundary

Repository-wide inspection did not authorise repository-wide semantic rewriting. Product, architecture, release, deployment, and external configuration changes remain separately governed.

### Execution economy

The complete audit ran once per material state. Focused audits were used after relevant changes, followed by one complete product gate.
