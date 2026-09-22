---
id: INFOSCHEMATICS-TOOL-134
area: TOOL
title: A retired word running
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-23T09:30:00Z
updated_at: 2026-09-23T09:30:00Z
---

# A retired word running

## Goal

Studio and View Present call a [Sequence](../reference/vocabulary.md#sequence) a Sequence, so the canonical term is the only one a contributor meets in the code.

## Context

`docs/reference/vocabulary.md:28` makes **Sequence** canonical and lists _theme_ among the non-canonical alternatives it replaced. Eleven files still use the retired word, and not only in prose: `packages/view-present/src/production.ts` types a `DirectTarget` with `kind: 'theme'` and a `themeId`, and a Callout target distinguishes `owner: 'story' | 'theme'`. Studio carries `editor/theme-composition.ts`, `use-theme-composition.ts` and `ThemeCompositionPanel.tsx` beside the canonical `editor/sequence-editing.ts`, so both names sit in one directory describing one concept.

`scripts/vocabulary-citations.test.ts` walks authored content for unresolved citations, which is why this survived: it checks that a cited term exists, not that code uses the term the vocabulary settled on.

It came up while choosing a name for a drawing's light or dark rendering. `theme` looked like the obvious identifier until this turned up, and the axis went to `mode` instead — so the drift has already cost one naming decision, and would keep doing so.

## Boundary

The retired word where it names a Sequence: the `DirectTarget` shape, the three Studio module names and their identifiers, and the tests and panels that read them. Renames only — no change to what a Sequence is or how Direct composes one.

It excludes `theme` where it legitimately means something else, notably the roadmap frontmatter field, and it excludes the light/dark axis, which `INFOSCHEMATICS-TOOL-129` names `mode`.

## Discussion

Found on 2026-09-22 while checking whether `theme` was free as an identifier. Worth doing on its own terms rather than as a naming favour: two words for one concept in a single directory is how a contributor learns the wrong one, and `DirectTarget` puts the retired word in a type that other packages consume.

Adjacent to `INFOSCHEMATICS-TOOL-131`, which rewrites `production.ts` — the file that holds `DirectTarget`. Taking this immediately after would land both renames in that file once. It is not a blocker either way.
