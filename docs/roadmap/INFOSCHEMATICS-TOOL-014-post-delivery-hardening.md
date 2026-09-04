---
id: INFOSCHEMATICS-TOOL-014
area: TOOL
title: Post-delivery hardening
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Consolidate the operational, compatibility, and visual follow-ups from the initial product delivery into one proportionate hardening pass, including a complete judgment-led repository audit and conform cycle.

## Context

The initial roadmap delivery met its stated goals and passed the canonical repository gate. Review identified four worthwhile residuals that do not block acceptance: performing the first registry publication when external authority is available, selecting a serialisable renderer schema version, improving dense diagrams at narrow widths, and deciding how compact Cards handle long text. The homepage default-treatment switch, a fifth residual, received its visual-parity approval separately and moved to its own item, `SITE-004`. Browser observation of the accepted Site, visual-treatment, and normal and reduced-motion signalling work is deferred into the same visual hardening pass.

The repository also needs a full audit and conform pass across its declared Knowledge Islands standards. That pass must assess and record the judgment criteria as well as running the mechanical commands; a mechanically clean CLI result alone is not completion evidence.

## Boundary

This item does not publish packages or change trusted-publishing configuration without the required human and external authority. It does not assume truncation is the right long-text policy or introduce an incompatible renderer contract without an explicit compatibility decision. The residuals remain one record unless implementation reveals a materially independent outcome that cannot be reviewed safely within this boundary.

## Shaping

The intended pass will:

- Prepare and, only with explicit release authority, execute the verified seven-package registry publication operation.
- Define a serialisable renderer schema-version selection contract and its compatibility behavior.
- Improve whole-diagram density and responsive detail at narrow widths without weakening authored geometry or accessibility.
- Establish and test an explicit compact-Card policy for long identity, stereotype, and description text.
- Run repository-wide audit and conform for every declared applicable standard, evaluate each judgment rubric against concrete evidence, record exclusions and decisions, apply approved corrections, and finish with clean mechanical audits and `bun run check`.

Known dependencies are npm scope ownership, trusted-publishing setup, and explicit release authority. Before promotion to Next, confirm which external conditions are available, capture the renderer compatibility decision, define visual acceptance fixtures for desktop and narrow layouts, and enumerate the applicable judgment rubrics and their evidence format.

## Discussion

### One follow-up record

These concerns share one post-delivery review context and one final repository verification surface. Keeping them together avoids paperwork while retaining an explicit boundary around external operations and public-contract decisions. If one concern later requires a distinct authority window or incompatible delivery cadence, reshape this record before execution rather than silently expanding it.

### Judgment evidence

Audit completion means more than a zero-exit mechanical command. The delivery review must identify the declared standards examined, the evidence used for each judgment criterion, any explicit exclusions, the conform changes approved and applied, and the final clean mechanical and repository gates.
