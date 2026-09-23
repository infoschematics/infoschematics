---
id: INFOSCHEMATICS-TOOL-134
area: TOOL
title: A retired word running
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 7d3cee4b342708ff8038f7917414d89e67f5e5db
created_at: 2026-09-23T09:30:00Z
updated_at: 2026-09-23T16:20:00Z
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

It excludes `theme` where it legitimately means something else: the roadmap frontmatter field, the browser `theme-color` meta tag, the visual-treatment sense in the guide, and the light or dark axis, which `INFOSCHEMATICS-TOOL-129` names `mode`.

It also excludes the retained legacy input. `ADR-INFOSCHEMATICS-019` decided that "the compatibility boundary temporarily retains established Theme and Story inputs", so `ThemeConfig` in Domain Model, the `themes` field on `InfoschematicConfig`, and the code that reads them are correctly named after the format they accept. Renaming those would misname the compatibility surface, not fix it.

It excludes `story` in the same sense. A collapsed Sequence is called a Story in exactly the way an expanded one is called a Theme, so `owner: 'story' | 'sequence'` is left uneven on purpose: evening it up means deciding whether Direct still distinguishes the two editing shapes, which is behaviour rather than a rename.

## Current state

The survey is wider than the capture's estimate of eleven files, and it divides cleanly in two.

**Retained legacy input, correctly named.** `packages/domain-model/src/theme.ts` declares `ThemeConfig` and `ThematicSceneConfig`; `InfoschematicConfig.themes` accepts them; `view-model/src/artefact-draft.ts:447` and `compatibility.ts:337` read and write that field. `ADR-INFOSCHEMATICS-019` sanctions all of it. `view-model/src/signals.ts:17` and `render-svg/src/index.ts:449` belong here too rather than with the drift: each declares a `kind: 'theme'` selection _beside_ its own `kind: 'sequence'` one, and resolves it against `config.themes` — so it selects a Scene inside a retained Theme, and is named after the input it reads.

**The retired word naming a canonical Sequence.** `packages/view-studio/src/app/editor/sequence-editing.ts:50` is the tell: `themesForEditing` takes `readonly SequenceConfig[]` and returns `readonly ThemeConfig[]`, so a canonical Sequence is converted _into_ the retired shape purely to be edited, then converted back by `sequencesWithEditorDrafts`. The canonical model is already the source of truth, and the retired type is an internal editing view of it — which is what makes this a rename rather than a migration.

Downstream of that adapter the word is everywhere it should not be. `view-present/src/production.ts` types `DirectTarget` with `kind: 'theme'` and `themeId`, and a Callout target with `owner: 'story' | 'theme'`. `view-present/src/presentation.ts` carries `thematicSceneId`, `step-theme` and `toggle-theme-scene`. `view-model/src/runtime.ts:128` exports `RuntimeThemeScene` and builds `themeLogos` at `:727` by walking `sequences` — canonical data under a retired name. Studio holds `editor/theme-composition.ts`, `editor/use-theme-composition.ts` and `editor/ThemeCompositionPanel.tsx` beside the canonical `editor/sequence-editing.ts`, and `App.tsx`, `DetailsPanel.tsx`, `direct-targets.ts`, `SceneCallout.tsx`, `ShortcutOverlay.tsx` and `styles.css` all read them.

Counting identifiers across the View packages: 187 bare `theme`, 122 `themes`, 78 `Theme`, and a long tail of `themeId`, `ThemeCollection`, `themesForEditing`, `themeCanActivate` and similar.

`scripts/vocabulary-citations.test.ts` walks authored content for unresolved citations, which is why this survived: it checks that a cited term exists, not that code uses the term the vocabulary settled on.

## Steps

- [x] Rename the Studio editing modules and every identifier in them: `theme-composition.ts` to `sequence-composition.ts`, `use-theme-composition.ts` to `use-sequence-composition.ts`, `ThemeCompositionPanel.tsx` to `SequenceCompositionPanel.tsx`, with their tests.
- [x] Give the Studio editor its own draft type rather than importing `ThemeConfig` from Domain Model, so the editing shape stops borrowing the name of the retained legacy input. Structural typing keeps the `config.themes` fallback working unchanged.
- [x] Rename `themesForEditing` to `expandedSequencesForEditing` in `sequence-editing.ts`, where the adapter's own name currently contradicts the file it lives in.
- [x] Rename the `DirectTarget` shape: `kind: 'theme'` to `kind: 'sequence'`, `themeId` to `sequenceId`, and `owner: 'theme'` to `owner: 'sequence'`. Carry it through `view-model/src/signals.ts`, `render-svg/src/index.ts` and every Studio reader.
- [x] Rename the runtime and presentation surface, qualifying with `expanded` where the state genuinely distinguishes an expanded Sequence from a collapsed one: `RuntimeThemeScene` to `RuntimeExpandedScene`, `thematicScenes` to `expandedScenes`, `thematicSceneId` to `expandedSceneId`, `step-theme` to `step-expanded`, `toggle-theme-scene` to `toggle-expanded-scene`. `themeLogos` becomes `sceneLogos`, which is what it actually holds.
- [x] Leave `nextThemeSceneCode`'s `THM-` literal alone while renaming the function. The prefix is authored data that existing documents carry and that the function reads to continue a serial; changing it is a data migration, not a rename.
- [x] Update the prose in `styles.css`, `SceneCallout.tsx` and `ShortcutOverlay.tsx`, including the user-visible shortcut labels.
- [x] Add the check that would have caught this, so the vocabulary's retired words cannot re-enter the code.

## Files touched

`packages/view-present/src/{production,presentation}.ts` and their tests; `packages/view-model/src/{runtime,signals}.ts` and `signals.test.ts`; `packages/render-svg/src/index.ts`; `packages/view-canvas/src/index.ts`; `packages/view-studio/src/app/{App.tsx,direct-targets.ts}`, `src/app/editor/{sequence-editing.ts,theme-composition.ts,use-theme-composition.ts,ThemeCompositionPanel.tsx}` and their tests, `src/app/hooks/use-presentation.ts`, `src/app/panels/{DetailsPanel,SceneCallout,ShortcutOverlay}.tsx`, `src/styles.css`; a new check under `scripts/`.

## Verify

`bun run self:check`.

The rename is only half the job, because nothing stopped it happening the first time. The new check is the other half: a test that reads the non-canonical alternatives out of `docs/reference/vocabulary.md` and fails when one appears as an identifier in the packages, with its own coverage floor so a walk that matches nothing cannot read as a pass. Prove it by reintroducing one.

Studio is the surface that moves most, so look at it: open Studio, compose in Direct, select a Sequence and a Scene Callout, and confirm the panels, the shortcut overlay and the Direct target list still behave. Capture it to `reports/`.

## Dependencies / blocks

Nothing blocks it and it blocks nothing.

`INFOSCHEMATICS-TOOL-131` rewrites `production.ts`, the file that holds `DirectTarget`, replacing `ProductionMode` with two fields. Taking this first means TOOL-131 finds `kind: 'sequence'` already in place and moves a correctly-named `directTarget` onto its Direct workspace. The two do not conflict; they touch the same file in sequence.

## Documentation impact

### Decision Records

None. `ADR-INFOSCHEMATICS-019` already decided that Sequence is the one canonical concept and that Theme is a retained input name. This makes the code agree with a decision that is already current, and the ADR's wording stays accurate.

### Specifications

None. No specification names these identifiers.

### Guides

None. The retired word does not appear in `apps/site/content/`.

### Roadmap

A follow-up for `story`, which is the same drift in the collapsed half and needs a behaviour decision rather than a rename. Capture it when this lands.

## Review

### Delivered

Studio and View Present name a Sequence a Sequence. The retired word survives in exactly one place — the compatibility input `ADR-INFOSCHEMATICS-019` retains — and a check now reads the vocabulary's own list of non-canonical alternatives and fails when one of them re-enters the packages under any other pretext.

The rename found what a survey would not: the retired names were not a parallel set but an overlapping one. `toggle-sequence-scene` and `step-sequence` already existed as canonical actions on the collapsed half, so renaming `toggle-theme-scene` onto them would have silently merged two different actions. They became `toggle-expanded-scene` and `step-expanded` instead, which is what the state they carry actually distinguishes.

### Summary of changes

The three Studio editing modules are renamed with their tests, and the editor now declares its own `SequenceDraft` and `SequenceDraftScene` in `sequence-composition.ts` rather than importing `ThemeConfig` from Domain Model. The shapes stay structurally identical, so the `config.themes` fallback in `use-sequence-composition.ts` still assigns into a draft with no conversion — which is the point of doing it this way rather than with an adapter.

`DirectTarget` carries `kind: 'sequence'`, `sequenceId` and `owner: 'sequence'` through `view-present`, `view-model`, `render-svg`, `view-canvas` and every Studio reader. The runtime and presentation surface takes the `expanded` qualifier where the state genuinely means an expanded Sequence rather than a collapsed one: `RuntimeExpandedScene`, `expandedScenes`, `expandedSceneId`, `step-expanded`, `toggle-expanded-scene`. `themeLogos` became `sceneLogos`, which is what it holds.

Four things were deliberately left alone, each for a stated reason. `nextSequenceSceneCode` keeps its `THM-` literal, because the prefix is authored data existing documents carry and the function reads it to continue a serial. `DetailsPanel.tsx`'s change entry keeps `key: 'themes'`, because its sibling `key: 'standaloneScenes'` shows the field names where an edit lands in the authored document. `App.tsx` keeps reading Callouts from `compatibilityConfig.themes`. And `signals.ts` and `render-svg/src/index.ts` keep their `kind: 'theme'` selection beside their `kind: 'sequence'` one, because it selects a Scene inside a retained Theme.

`scripts/vocabulary-drift.test.ts` is new. It parses the alternatives out of `docs/reference/vocabulary.md` and requires a decision for each — `watched`, `retained`, `ordinary` or `gloss` — checked in both directions, so a new alternative fails until someone classifies it and a dead entry fails rather than sitting there. Only `watched` scans the code; the sanctioned spellings of the retained input are masked out by a table that says why each is allowed, and the eight files that read that input are listed with a reason each and asserted to still match.

### Verification

`bun run self:check` — 48 tasks, 48 successful.

The new check was proven by breaking it, twice. Reintroducing `themeCanActivate` into a Studio module produces `view-studio/…/composition.ts: theme`. A first probe passed when it should have failed, because I probed `themeId`, which the mask itself was hiding — so the global `themeId` mask was dropped, `view-model/src/signals.ts` was listed as a named retained reader instead, and the re-probe failed as it should on `view-present/src/production.ts: theme`. The pattern table is deliberately non-global: a `/g` regex carries `lastIndex` between `test` calls, so the second file scanned would have resumed mid-string and reported a clean pass it had not earned. There is an assertion that runs the same scan twice for exactly that.

`turbo.json` needed no change: `//#self:scripts:test` already declares `scripts/**` and `docs/**`, and appending a newline to `docs/reference/vocabulary.md` turned a warm `cache hit, replaying logs` into `cache miss, executing`.

Studio was looked at in a real browser, per the record's Verify section. `reports/TOOL-134-a-retired-word-running.md` has the account and `reports/tool-134/` the captures: a Sequence Scene running in Present, Direct composing against a Sequence, a Sequence Scene Callout reached through the Callouts tab, and the keyboard overlay reading _While a Sequence is open_ / _Step to the previous or next Sequence Scene_ / _Clear the Sequence_. No page errors, no console errors.

One thing in that browser pass looked like a regression and is not. Direct opens on the **Scenes** kind and the Benchmark offers _No targets yet_ there, because standalone Scenes come from the Sequence with id `OVERVIEW` and the Benchmark declares `STORY-01` and `STORY-02` only. The other four kinds each offer exactly what the document holds.

### Outstanding concerns

`story` is the same drift in the collapsed half — `owner: 'story' | 'sequence'` is uneven on purpose. Evening it up means deciding whether Direct still distinguishes the two editing shapes, which is behaviour, not a rename, so it wants its own record.

The check watches the packages. `apps/`, `examples/` and `scripts/` are outside its walk, which is a defensible floor for where product code lives but not a claim about the whole repository.

### Post-change review

The instructive failure was the drift check passing when it should not have. I reintroduced `themeId` to prove the check bites, it reported clean, and the reason was that `themeId` fell inside a mask written to sanction the retained input. The check was measuring its own permission list rather than the code. Masks that broad are the failure mode of this kind of check generally: each one is a hole, and a hole wide enough to hide the probe is wide enough to hide the drift. The fix narrowed the masks to named spellings and moved the file-level permissions into an explicit list with a reason per entry, asserted to still match — so an exemption that stops being needed fails rather than quietly widening.

The second one is smaller and the same shape. A rename pass guarded on lowercase `config.themes` slipped past `compatibilityConfig.themes` and renamed a retained-input read in `App.tsx`. A guard that matches a spelling rather than a meaning will always have a variant it misses; the typechecker caught this one, but only because the field did not exist under the new name.

### Mini recap

The retired word is gone from the code that names a Sequence, retained only where the compatibility input genuinely is a Theme, with each exception named and its reason recorded. A new check reads the vocabulary itself and holds the line, proven by breaking it. Studio was opened and looked at, and the captures are in `reports/`. Left open deliberately: the matching `story` question, which is a behaviour decision.

## Discussion

Found on 2026-09-22 while checking whether `theme` was free as an identifier. Worth doing on its own terms rather than as a naming favour: two words for one concept in a single directory is how a contributor learns the wrong one, and `DirectTarget` puts the retired word in a type that other packages consume.

Adjacent to `INFOSCHEMATICS-TOOL-131`, which rewrites `production.ts` — the file that holds `DirectTarget`. Taking this immediately after would land both renames in that file once. It is not a blocker either way.

### Adoption

Adopted into Now on 2026-09-23 at the owner's explicit direction, moved from Triage with `do INFOSCHEMATICS-TOOL-134`. Shaped and marked ready in the same pass, since the survey needed doing before the steps could be written and the owner had already approved the work.
