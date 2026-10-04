---
id: INFOSCHEMATICS-SITE-032
area: SITE
title: First document from prose
theme: site-experience
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-10-04T12:07:49Z
updated_at: 2026-10-04T12:07:49Z
---

# First document from prose

## Goal

The consumer guide shows a newcomer how to get a first [Infoschematic](../reference/vocabulary.md#infoschematic) from a plain-language description with the `infoschematics-authoring` skill, and treats correcting it in Studio as the expected next step rather than a sign of failure.

## Context

`INFOSCHEMATICS-TOOL-107` delivered the skill at `skills/infoschematics-authoring/` and recorded it as [PDR-INFOSCHEMATICS-004](../decisions/PDR-INFOSCHEMATICS-004-an-authoring-skill-starts-a-document-and-names-what-it-leaves.md). The repository `README.md` describes it for a contributor. The Site-owned journey under `apps/site/content/` does not mention it: `getting-started.md` and `authoring.md` still begin from a blank definition.

`AGENTS.md` captures Site output as its own record once the behaviour has settled, so the consumer prose was left out of the feature item.

## Boundary

Consumer prose only: where the on-ramp sits in the guide journey, how a reader installs the skill in their runtime, what it produces and leaves unresolved, and the hand-off into the Playground's Source and Design views. It does not change the skill, the checker, or the Playground.

## Discussion

Captured on 2026-10-04 while delivering `INFOSCHEMATICS-TOOL-107`. `apps/site/content/authoring.md` was being changed concurrently by `INFOSCHEMATICS-TOOL-129`, which is a second reason the feature item did not touch it.
