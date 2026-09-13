---
id: INFOSCHEMATICS-TOOL-040
area: TOOL
title: Repository conformance pass
theme: tool
horizon: next
status: in-progress
blocks: []
blocked_by: []
baseline_ref: 7646468507d3bc10e80b414a8f1d5661d7a82346
---

# Repository conformance pass

## Goal

Produce one evidence-backed conformance review of every declared Knowledge Islands repository standard, apply safe mechanical corrections, and turn material product or governance findings into separately prioritised work.

## Context

Routine delivery runs the product verification gate and focused governance audits, but the earlier post-delivery review requested one complete audit and conform cycle across every declared standard. Mechanical success alone is insufficient because several skills carry judgment criteria that need repository evidence and explicit conclusions.

## Boundary

This item does not implement unrelated product findings, change adapter or repository type, enable new skills, push, release, publish, or apply semantic corrections whose scope requires a separate decision or work record. Conform operations must remain within each skill's declared authority.

## Current state

The repository declares product, website, Cloudflare, engineering, Git, housekeeping, tokenomics, work, roadmap, Agora, specifications, and authoring governance. Focused ki-work and ki-work-roadmap audits pass, and bun run self:check is green. There is no single retained review showing every declared mechanical result and judgment conclusion together.

## Steps

- [ ] Resolve the current declared skill set from .ki.toml and map each skill to its audit, conform, and judgment responsibilities.
- [ ] Run one full repository audit, retain a concise result inventory, and separate failures, warnings, and unevaluated judgment criteria.
- [ ] Gather focused repository evidence for each judgment criterion, including Git working practice, documentation placement, website ownership, toolchain, tokenomics, roadmap, and specification quality.
- [ ] Run each applicable conform operation in dry-run mode where supported, inspect proposed paths, and apply only safe mechanical corrections within the item's boundary.
- [ ] Re-run affected audits once after all corrections and record explicit exclusions or unsupported remote checks.
- [ ] Capture any material semantic change, external-authority action, or independent product defect as a separate roadmap record rather than absorbing it into the audit pass.
- [ ] Run the complete product gate and summarise the final clean mechanical state and judgment outcomes in the review packet.

## Files touched

- .ki.toml only for confirmed presentation corrections that do not change semantics
- .editorconfig and .rumdl.toml only through their owning conformer
- AGENTS.md, ROADMAP.md, and repository documentation identified by authorised conformers
- governance-owned configuration files identified by the audit
- docs/roadmap/ for separately captured material findings

## Verify

Run ki repo audit --repo . before and after the bounded conform pass, run focused audits again only for skills whose owned paths changed, then run bun run self:check. The review must name every declared skill, its mechanical outcome, the evidence and conclusion for each judgment family, every changed path, and every deferred material finding.

## Dependencies / blocks

The repository is bootstrapped, all configured skills resolve locally, and current focused roadmap audits pass. No external service or publication authority is required.

## Documentation impact

### Decision Records

Do not add a decision record for ordinary conformance. Capture a separate decision only if a material governance choice is discovered and approved.

### Specifications

Product specifications change only through a separately scoped finding; this audit may correct mechanical formatting but not product behaviour.

### Guides

Correct broken ownership or navigation guidance only when an owning audit identifies a deterministic conformance issue.

### Roadmap

Create distinct records for material findings that exceed safe mechanical conformance, with no inferred implementation priority.

## Discussion

### Judgment evidence

A zero-exit audit does not decide human review prompts. The review packet must connect each conclusion to concrete files, commands, history, or rendered output and say when evidence is unavailable.

### Change boundary

Repository-wide inspection does not authorise repository-wide semantic rewriting. Mechanical corrections may land here; product, architecture, release, and external configuration changes remain separate work.

### Execution economy

Run the full audit once per state and focused audits only after relevant changes. Run the complete product gate once at the end.
