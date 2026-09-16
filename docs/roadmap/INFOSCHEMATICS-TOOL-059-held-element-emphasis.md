---
id: INFOSCHEMATICS-TOOL-059
area: TOOL
title: Held element emphasis
theme: tool
horizon: now
status: done
blocks: [INFOSCHEMATICS-TOOL-060]
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T07:25:00Z
updated_at: 2026-09-16T16:49:00Z
---

# Held element emphasis

## Goal

Let a Dynamic emphasise an element for as long as a state lasts, so a presenter can say "this stage is the one we are on" and have the treatment stay rather than fire once and vanish.

## Context

Raised while reviewing the delivered Diagram Dynamics work against a real presentation. That item was `INFOSCHEMATICS-TOOL-055`, since pruned; its delivery is commit `02bcb675` and its durable record is [ADR-INFOSCHEMATICS-026](../decisions/ADR-INFOSCHEMATICS-026-name-dynamics-in-the-document.md) together with `DYNAMIC-001` to `DYNAMIC-006` in [the Diagram Dynamics specification](../specs/diagram-dynamics.md). The IBC 2026 5G-EMERGE walkthrough wants the final step's element to keep pulsating while that step is on screen, which is a different statement from "something just happened here".

Every Dynamic occurrence is finite. An `emphasise-elements` occurrence outlines its targets for one token-owned duration and retires itself, and the only way to prolong it is to keep supplying new occurrence keys. That produces a stutter rather than a hold, makes the announcement repeat, and puts a timing loop in the host for something the document could state once.

[Scene signal treatments](INFOSCHEMATICS-TOOL-023-scene-signal-treatments.md) chooses when and how often a Dynamic plays from a Scene, and its own Steps include a `repeat` and `continuous` playback policy. This item is the other half: what a renderer does when asked to sustain one, which is a contract question rather than a playback policy. If TOOL-023 lands first, `continuous` will have nothing to hold.

## Boundary

This item does not introduce authored durations, easing, keyframes, timelines, offsets, or callbacks, and does not make a held treatment the default. It does not create persistent authored state: a held emphasis remains a runtime occurrence whose life the host or Scene still owns, and withdrawing the occurrence must end it. It does not change the finite kinds, and it does not make motion the only carrier of the state it depicts. It does not change the travelling question, which is [Travelling element emphasis](INFOSCHEMATICS-TOOL-060-travelling-element-emphasis.md).

## Current state

The authored surface is a closed two-kind union with no notion of duration or persistence. `packages/domain-model/src/model.ts:187-212` declares `DiagramDynamicIdentity`, `SignalFlowDynamic`, `EmphasiseElementsDynamic`, and their `DiagramDynamic` union; `packages/domain-core/src/model.ts:356-359` canonicalises each target list sorted and `:439-455` rejects duplicate ids, empty target lists, unknown targets, and a target field belonging to the other kind. Nothing in the declaration can say "this is a state".

Resolution is equally duration-free. `packages/view-model/src/dynamics.ts:19-40` defines `DynamicOccurrence`, `ElementEmphasis` (exactly `dynamicId`, `elementId`, `occurrenceKey`), and `ResolvedDynamics`; `resolveDiagramDynamics` at `:51-80` deduplicates on `[kind, target, occurrenceKey]` and says nothing about how long anything lasts. A renderer therefore cannot currently tell a held occurrence from a finite one.

Two independent places bound the life of an emphasis, and both read the same constant. `packages/view-canvas/src/Canvas.tsx:176-185` runs a `window.setTimeout` that retires `activeEmphasis` after `elementEmphasisDuration`, and `packages/view-studio/src/app/App.tsx:567-570` runs its own `window.setTimeout` that withdraws the Studio rehearsal occurrence after the same `elementEmphasisDuration`, imported from `@infoschematics/view-canvas` at `:9`. Changing only the Canvas produces a Canvas holding a treatment for an occurrence Studio has already withdrawn. `elementEmphasisDuration` itself is `Number.parseInt(visualTokens.canvas.emphasis.duration, 10)` at `packages/view-canvas/src/element-emphasis.ts:11`, so the timer and the stylesheet retire together by construction.

The lifecycle helpers are shared with Flow signals and are not emphasis-specific. `packages/view-canvas/src/occurrences.ts:39-70` holds `reconcileOccurrences`, and `:86-93` holds `advanceOccurrenceAnnouncement`, which bumps the revision only for newly accepted occurrences and returns `undefined` once nothing is active. `packages/view-canvas/src/element-emphasis.ts:30-66` wraps those as `retireElementEmphasis`, `reconcileElementEmphasis`, and `advanceElementEmphasisAnnouncement`. Announce-once is therefore already correct; what is missing is any way to not retire.

The treatment is one CSS rule with a single-pass animation. `packages/view-canvas/src/styles.css:2` imports `@infoschematics/view-model/tokens.css`; `:453-456` makes `.infoschematic-element-emphasis` pointer-transparent; `:458-463` sets `animation: infoschematic-element-emphasis var(--infoschematic-canvas-emphasis-duration) ease-out both` with the stroke and stroke width from tokens; `:489-492` replaces that with `animation: none; opacity: 0.9` inside the `@media (prefers-reduced-motion: reduce)` block opened at `:479`; and `:495-505` defines the keyframes as one `0% → 20% → 70% → 100%` opacity pass. There is no iteration count, no infinite variant, and no second class.

The token pipeline is generated and gate-checked. `packages/view-model/src/tokens.ts:61-68` holds the whole `canvas.emphasis` group — `duration: '900ms'`, `inset: 6`, `radius: 14`, `stroke: '#f2a63b'`, `strokeWidth: 3`. `scripts/generate-visual-tokens.ts` flattens it to kebab-case custom properties and writes `packages/view-model/src/tokens.generated.css`, where `:3-7` are the five emphasis properties; `bun run self:tokens:generate` writes it and `bun run self:tokens:verify` fails if it is stale. `packages/view-model/package.json` publishes it as `./tokens.css` from `dist/tokens.generated.css`. `packages/view-canvas/src/tokens.test.tsx:12-33` asserts every `var(--infoschematic-canvas-*)` reference in the Canvas stylesheet resolves to a generated declaration, so a hand-written custom property fails.

View Present owns no emphasis treatment of its own. `packages/view-present/src/styles.css:1` is `@import "@infoschematics/view-canvas/styles.css";` and `packages/view-present/src/Present.tsx:20` declares `dynamics?: CanvasProps['dynamics']`, passed straight through to `Canvas` at `:156`. View Studio likewise imports Present's stylesheet at `packages/view-studio/src/styles.css:2`. One held treatment authored in the Canvas stylesheet therefore reaches Canvas, Present, and Studio; Studio's own rehearsal timer is the only additional Studio-side change.

Static output already has the right answer for a held state. `packages/render-svg/src/index.ts:174-219` builds `boxEmphasis`, `pointEmphasis`, and `routeEmphasis` from geometry and the same tokens, `:296-304` maps them per drawn element, and `:931-950` emits the outline groups last with no notion of elapsed time.

Nothing in the gate compares the Canvas and static emphasis treatments: `scripts/visual-treatment-parity.test.ts` covers Cards, Regions, Flow arrowheads, grids, and ink, and mentions neither emphasis nor Dynamics.

## Steps

1. Record the authored surface as a Decision Record under `docs/decisions/` before writing any code: a held interpretation of `emphasise-elements`, a third kind, or a property on the declaration. State its relationship to `ADR-INFOSCHEMATICS-026`, which both fixed the vocabulary as deliberately finite and excluded persistent presentation state, and say why a hold whose life the host still owns is not that exclusion. Verify: the record exists, `status: current`, with `decision_depends_on` naming `ADR-INFOSCHEMATICS-026`.
2. If step 1 chose an authored surface, carry it through the contract: add it to `packages/domain-model/src/model.ts:194-212`, canonicalise it at `packages/domain-core/src/model.ts:356-359`, validate it at `:439-455`, and regenerate the schema with `bun run self:schema:generate`. Verify: `bun run self:schema:verify` and `bun run --cwd packages/domain-core test`, with a rejection case for the wrong kind carrying the new field.
3. Extend `ElementEmphasis` in `packages/view-model/src/dynamics.ts:30-34` so a renderer can distinguish a held occurrence from a finite one, and keep `resolveDiagramDynamics` at `:51-80` pure, framework-neutral, and deduplicated on target identity. Verify: `bun run --cwd packages/view-model test`.
4. Stop bounding a held occurrence at both places that bound it today — the Canvas retirement effect at `packages/view-canvas/src/Canvas.tsx:176-185` and the Studio rehearsal withdrawal at `packages/view-studio/src/app/App.tsx:567-570` — and leave the finite path untouched. Verify: a node case in `packages/view-canvas/src/Canvas.dynamics.test.tsx` proving a held occurrence survives past `elementEmphasisDuration`, and a Studio case in `packages/view-studio/src/app/App.browser.test.tsx` proving the rehearsal occurrence is not withdrawn under it.
5. Give the held treatment its full-motion and reduced-motion interpretations from the existing `canvas.emphasis` tokens: a sustained variant of the rule at `packages/view-canvas/src/styles.css:458-463`, and a steady rather than slower treatment in the reduced-motion block at `:479-493`. If a new measurement is genuinely needed, add it to `packages/view-model/src/tokens.ts:61-68` and run `bun run self:tokens:generate`; never hand-write a custom property. Verify: `bun run self:tokens:verify` and `bun run --cwd packages/view-canvas test`, which runs `tokens.test.tsx`.
6. Decide and implement what the live region says when a hold ends. `advanceOccurrenceAnnouncement` at `packages/view-canvas/src/occurrences.ts:86-93` already announces only newly accepted occurrences and already returns `undefined` when nothing is active, so announce-once needs no change; what needs a decision is whether clearing a state is itself worth saying, implemented in `advanceElementEmphasisAnnouncement` at `packages/view-canvas/src/element-emphasis.ts:53-66` and the second `role="status"` region at `Canvas.tsx:214-228`. Verify: `bun run --cwd packages/view-canvas test:browser`, asserting the announcement text does not change while the hold persists.
7. Prove every existing ending still ends a hold: host withdrawal, a changed occurrence key replacing it, `shownElementIds` scope filtering at `packages/view-canvas/src/Canvas.tsx:88-98`, and a Scene change. Verify: cases in `packages/view-canvas/src/Canvas.dynamics.test.tsx` and `packages/view-present/src/Present.dynamics.test.tsx`.
8. Amend `DYNAMIC-006` in `docs/specs/diagram-dynamics.md` with the held obligations, and `DYNAMIC-001`, `DYNAMIC-002`, or `DYNAMIC-005` if step 1 changed the declaration, the occurrence contract, or Studio rehearsal. Every `_Verify:_` and `_Evidence:_` path must resolve. Verify: `bun run self:scripts:test`, which runs `scripts/specification-evidence.test.ts` against the corpus.
9. Render the result and look at it, exactly as `## Verify` sets out. A green suite is not evidence that a hold looks like a hold.

## Files touched

- `packages/view-canvas/src/Canvas.tsx` — exists; the retirement effect at `:176-185` and the emphasis live region at `:214-228`.
- `packages/view-canvas/src/element-emphasis.ts` — exists; `elementEmphasisDuration` at `:11` and `advanceElementEmphasisAnnouncement` at `:53-66`.
- `packages/view-canvas/src/styles.css` — exists; `:453-463`, the reduced-motion block at `:479-493`, and the keyframes at `:495-505`.
- `packages/view-studio/src/app/App.tsx` — exists; the rehearsal withdrawal timer at `:567-570`. Not previously named in this record, and the change is incomplete without it.
- `packages/view-model/src/dynamics.ts` — exists; `ElementEmphasis` at `:30-34`.
- `packages/view-canvas/src/occurrences.ts` — exists; touched only if the end-of-hold announcement needs the shared helper changed, in which case Flow signals are affected too.
- `packages/domain-model/src/model.ts` and `packages/domain-core/src/model.ts` — exist; only if step 1 chose an authored surface. `packages/domain-core/schema/infoschematic.schema.json` is generated, never edited by hand.
- `packages/view-model/src/tokens.ts` — exists; only if a new measurement is needed. `packages/view-model/src/tokens.generated.css` is generated by `bun run self:tokens:generate`.
- `packages/render-svg/src/index.ts` — exists; `:174-219` and `:931-950`, touched only if step 1 decided the still treatment must distinguish held from finite.
- `docs/specs/diagram-dynamics.md` — exists.
- A new Decision Record under `docs/decisions/` — new file; the next free `ADR-INFOSCHEMATICS-0NN` slot after `ADR-INFOSCHEMATICS-027`. `docs/decisions/README.md` exists and indexes it.
- `packages/view-canvas/src/Canvas.dynamics.test.tsx`, `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx`, `packages/view-present/src/Present.dynamics.test.tsx`, `packages/view-studio/src/app/App.browser.test.tsx` — all exist.

## Verify

Targeted, in this order: `bun run --cwd packages/view-model test`, `bun run --cwd packages/domain-core test` (only if the surface changed), `bun run --cwd packages/view-canvas test`, `bun run --cwd packages/view-canvas test:browser`, `bun run --cwd packages/view-present test`, `bun run --cwd packages/view-studio test:browser`, `bun run --cwd packages/render-svg test`, then `bun run self:tokens:verify`, `bun run self:schema:verify`, and `bun run self:scripts:test`. The full gate is `bun run self:check`, owned by whoever commits.

Then render it and look at it, because none of the above can see the treatment.

Motion and reduced motion in a real host: `bun run self:dev`, then open `http://localhost:4173/playground/?preset=media-pipeline`. The seed at `apps/site/src/playground/seeds/media-pipeline.yaml:91-104` declares `playback-stalled` as `emphasise-elements` over `PLAYER` and `VIEWED`, and Studio's Producer controls render a Dynamics bank button per declared Dynamic (`packages/view-studio/src/app/panels/ProducerControls.tsx:72-84`). Press "Playback has stalled" and watch for four things: the amber outline is still painted well past 900 ms; it sits outset from the Card rather than on its border; the Flow `VIEWED` is outlined along its route and not merely brightened; and the outline disappears when the hold is ended rather than lingering. Repeat with the operating system's reduce-motion setting on, and confirm the held treatment is steady and visible rather than a slower pulse or nothing at all. The Dynamics bank button is momentary today, so if step 1 did not make rehearsal a toggle, exercise the hold from `Canvas.dynamics.browser.test.tsx` in headed mode instead of the Playground.

Still output: the CLI has no occurrence flag (`packages/cli/src/options.ts:25-44`) and `bun run self:examples:render` renders the quiet document, so render the still treatment directly and open the file.

```bash
mkdir -p reports && bun -e "
import { readFile, writeFile } from 'node:fs/promises'
import { parseInfoschematic } from './packages/domain-core/src/index.ts'
import { renderInfoschematicSvg } from './packages/render-svg/src/index.ts'
const source = 'examples/is-system/infoschematic.yaml'
const parsed = parseInfoschematic(await readFile(source, 'utf8'), { pathname: source })
if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues))
await writeFile('reports/held-emphasis.svg', renderInfoschematicSvg(parsed.model, {
  dynamics: [{ dynamicId: 'view-revised', occurrenceKey: 'look-1' }]
}))
" && open reports/held-emphasis.svg
```

`examples/is-system/infoschematic.yaml:103-115` declares `view-revised` as `emphasise-elements` over the Card `SEE-04`, and this command produces exactly one emphasis group. Look for an outline that reads as a layer over the Card rather than part of it, no animation markup in the file, and — if step 1 said held and finite must differ in print — a visible difference from the same command run against a finite Dynamic. `reports/` is gitignored.

## Dependencies / blocks

The Dynamics contract this builds on is delivered: commit `02bcb675`, `ADR-INFOSCHEMATICS-026`, and `DYNAMIC-001` to `DYNAMIC-006`. `INFOSCHEMATICS-TOOL-055` has been pruned, so do not treat it as a live dependency.

Composes with [Scene signal treatments](INFOSCHEMATICS-TOOL-023-scene-signal-treatments.md) rather than replacing any part of it; that item's `continuous` playback policy has nothing to sustain until this one exists.

Overlaps [Travelling element emphasis](INFOSCHEMATICS-TOOL-060-travelling-element-emphasis.md) on four edit regions: the emphasis rules in `packages/view-canvas/src/styles.css:453-505`, `DYNAMIC-006` in `docs/specs/diagram-dynamics.md`, the Decision Record extending `ADR-INFOSCHEMATICS-026`, and the authored surface files if either needs one. The two must not be delivered concurrently in one checkout, and the surface decision in step 1 must be taken once for both rather than twice.

## Documentation impact

### Decision Records

Expected, and it is step 1. `ADR-INFOSCHEMATICS-026` both fixed the Dynamic vocabulary as deliberately finite and excluded persistent presentation state, so a held treatment needs a new `architecture` record under `docs/decisions/` — next free number after `ADR-INFOSCHEMATICS-027` — with `decision_depends_on` naming `ADR-INFOSCHEMATICS-026`, and it must argue why a host-owned hold is not the persistence that record ruled out. Add it to `docs/decisions/README.md`. If TOOL-060 is delivered in the same change, one record covers both.

### Specifications

Expected, in `docs/specs/diagram-dynamics.md`, and it stays with the feature rather than becoming a follow-up. `DYNAMIC-006` must gain the held treatment's full-motion, reduced-motion, and still obligations and its announcement behaviour. `DYNAMIC-001` changes only if the declaration changed, `DYNAMIC-002` only if the occurrence contract changed, and `DYNAMIC-005` only if Studio rehearsal became a toggle. Cited `_Verify:_` and `_Evidence:_` paths are checked mechanically by `scripts/specification-evidence.test.ts`. No new spec file and no change to `docs/specs/index.md`.

### Guides

None in this change. The consumer-facing prose is site-owned — `apps/site/content/authoring.md:131-151`, `present.md:45-47`, and `react-integration.md:147-171` all describe `emphasise-elements` as brief — and site content is deliberately deferred out of feature items so it is not written against a moving target. `docs/guides/` has nothing on Dynamics and needs nothing.

### Roadmap

Expected: one follow-up record for the site content above, captured as Triage. Capture belongs to `ki-next`, not to this item's delivery.

## Review

### Delivered

An authored `emphasise-elements` Dynamic can now say that it depicts a **state** rather than an event, and a state's emphasis is held: it sustains while the host keeps the occurrence, and ends only when the host withdraws it, replays it under a new key, or stops drawing the element. Nothing about an event changed — not its markup, not its resolved shape, not its timing.

All nine steps delivered. Step 1's answer is recorded in `docs/decisions/ADR-INFOSCHEMATICS-029-author-what-an-emphasis-means.md`, and it is the decision the Discussion's second tension asked for: a Dynamic may state **what the change is**, including whether it is an event or a state, and may not state **how a renderer carries it**. The dividing test is whether a Producer would say the thing out loud — "playback is stalled" is something they would say, "outline it in amber, breathing" is not. That is why the depiction is authored on the declaration rather than passed per occurrence by the host (a document that cannot say "this is a state" cannot be read as one), and why the kind list stays at two: `depicts` says more about the meaning, not a second way of saying how it is drawn. The same frame decides `INFOSCHEMATICS-TOOL-060` without a second record: a travelling mark is a renderer's interpretation of the same authored emphasis, so it has no authored surface at all and extends this record rather than contradicting it.

Step 6 needed no code: `advanceElementEmphasisAnnouncement` and `advanceOccurrenceAnnouncement` already announce once on acceptance and say nothing on retirement, which is exactly the behaviour a hold wants. It is now asserted rather than assumed.

### Summary of changes

`packages/domain-model/src/model.ts` — new `DiagramDynamicDepiction = 'event' | 'state'`, and `EmphasiseElementsDynamic` gains optional `depicts`. Optional, never defaulted: absence is the event reading.

`packages/domain-core/src/schema.ts`, `src/model.ts`, `src/serialise.ts`, `schema/infoschematic.schema.json` — the zod `emphasise-elements` member accepts `depicts`; the `signal-flow` member does not, so `strictObject` rejects it there, and canonical validation raises `… is a signal-flow Dynamic and cannot declare depicts` for the same claim reaching it another way. `'depicts'` enters `fieldOrder` after `'elements'`. The JSON schema is regenerated by `bun run self:schema:generate`, never by hand.

`packages/view-model/src/dynamics.ts` — `ElementEmphasis` gains optional `depicts`; new `dynamicDepictsState` and `emphasisDepictsState` are the only readers of the value anywhere. Resolution pushes the field **only** for a state, so an event's resolved emphasis has no `depicts` key at all. Deduplication identity is unchanged (`[kind, target, occurrenceKey]`), so where two declarations name one element in one occurrence the first declaration supplied still owns it — its depiction as much as its label.

`packages/view-canvas/src/Canvas.tsx` — the retirement effect now filters states out of the batch it schedules; with nothing finite in flight it schedules no timer at all. Every other path that ends an emphasis is untouched, which is what keeps a hold host-owned: `reconcileElementEmphasis` still ends it on withdrawal, on a replaced key, and on the element leaving the drawn set.

`packages/view-canvas/src/InfoschematicDiagram.tsx` — one attribute, `data-depicts`, present only for a state. This file is not named in `## Files touched` and the change cannot be made without it: the treatment has to be selectable from the markup. `TOOL-063` and `TOOL-060` also edit this file; the edit is one attribute and a comment inside the existing emphasis group.

`packages/view-canvas/src/styles.css` — a sustained rule for `[data-depicts="state"]`, on the same `--infoschematic-canvas-emphasis-duration` token as the finite treatment, `infinite alternate` rather than `both`; new `infoschematic-element-emphasis-held` keyframes running `0.55 → 0.9` and never reaching transparency; and the held rule **restated** inside the `prefers-reduced-motion` block. The restatement is load-bearing: a media query adds no specificity, so the inherited `.infoschematic-element-emphasis > *` reset would have lost to a class plus an attribute and the hold would have gone on animating for a reader who asked it not to. No new visual token was needed.

`packages/view-studio/src/app/App.tsx` — rehearsal answers the Discussion's first tension the smaller way: the withdrawal timer skips a state-depicting Dynamic, and pressing an already-pressed control withdraws the occurrence. `ProducerControls.tsx` needed no change, because `aria-pressed={playingDynamicId === dynamic.id}` already means the right thing once the occurrence stops expiring underneath it.

`docs/specs/diagram-dynamics.md` — `DYNAMIC-001` gains the declaration surface and the `signal-flow` rejection; `DYNAMIC-002` gains the occurrence contract for a hold and restates that an event still retires itself; `DYNAMIC-003` requires the depiction to be carried and an event's resolution to stay byte-identical with no field present; `DYNAMIC-004` records that still output does **not** distinguish a state from an event; `DYNAMIC-005` gains the rehearsal toggle; `DYNAMIC-006` gains the sustained-and-never-transparent obligation, the steady reduced-motion treatment, and the fact that a hold's ending is silent.

`docs/decisions/ADR-INFOSCHEMATICS-029-author-what-an-emphasis-means.md`, `docs/decisions/README.md` — the record and its index entry, inserted at 35 after `ADR-INFOSCHEMATICS-028`, with the Repository-operation section renumbered 36–39.

Tests: new cases in `packages/domain-core/src/model.test.ts` and `src/authoring.test.ts` (canonicalisation and YAML round trip, plus rejection of `depicts` on `signal-flow` and of an unknown value), `packages/view-model/src/dynamics.test.ts` (carried state, absent field for an event, the `signal-flow` guard, and the dedupe ownership), `packages/view-canvas/src/Canvas.dynamics.test.tsx` (markup, every ending route, and the stylesheet obligations), `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx` (the hold in a real browser), `packages/view-studio/src/app/App.browser.test.tsx` (rehearsal as a hold), `packages/view-present/src/Present.dynamics.test.tsx` (pass-through and no residue), and `packages/render-svg/src/index.test.ts` (still output identical for a state and an event, modulo the Dynamic id).

`packages/render-svg/src/index.ts`, `packages/view-canvas/src/element-emphasis.ts`, `packages/view-canvas/src/occurrences.ts`, `packages/view-model/src/tokens.ts` — deliberately unchanged, each for a reason the decision record states.

### Verification

| Gate | Outcome |
| --- | --- |
| `bun run --cwd packages/domain-core test` | 8 files, 52 tests passed |
| `bun run --cwd packages/view-model test` | 15 files, 186 tests passed |
| `bun run --cwd packages/view-canvas test` | 11 files, 77 tests passed |
| `bun run --cwd packages/view-canvas test:browser` | 4 files, 27 tests passed (baseline 26) |
| `bun run --cwd packages/view-present test` | 6 files, 43 tests passed |
| `bun run --cwd packages/view-studio test:browser` | 2 files, 16 tests passed (baseline 15) |
| `bun run --cwd packages/render-svg test` | 1 file, 18 tests passed |
| `bun run self:check` | 43 successful, 43 total |
| `bun run self:check` forced† | 43 successful, 43 total |

† `turbo run … --force --concurrency=1`, so no task in the ledger is a replay.

Five assertions were proved red by reverting the implementation piece each one rests on, then restoring it:

- Canvas retirement filter removed → the browser hold case failed at `expected undefined to be defined`, three seconds in.
- The sustained CSS rule deleted → the same case failed with `animationName` reading `infoschematic-element-emphasis` instead of `…-held`.
- Studio's withdrawal guard removed → the rehearsal case failed at `expected null not to be null` after the wait.
- Studio's toggle-off branch removed → the second press never ended the hold, `Matcher did not succeed in time`.
- The domain-core `signal-flow` rejection is asserted both ways round, by message in `model.test.ts` and as `parseInfoschematic(...).ok === false` in `authoring.test.ts`.

One of these proofs started out worthless and had to be rewritten. The first Studio case pressed the event control and the held control in the same tick, so React batched them, the event occurrence never rendered at all, and the poll waiting for its emphasis to disappear returned instantly — the case then asserted the hold was still standing at roughly zero milliseconds and passed with the guard removed. It now rehearses the event alone first, watches it retire, and only then starts the hold and waits a real three seconds.

`self:boundaries:verify` is **not** cited here as evidence for anything (`INFOSCHEMATICS-TOOL-074`).

### Post-change review

Rendered and looked at, because none of the above can see the treatment. `bun run self:dev`, Chromium at 1440×900 through Playwright, `http://localhost:4173/playground/` on the `Live media pipeline` preset with the panel dock opened. The Playground's seed declares no state-depicting Dynamic, so `Playback has stalled` was marked `depicts: state` **locally and temporarily** for the look and the edit reverted afterwards; nothing about the seed is in this change.

- **Held, full motion, three seconds after the press.** The Player Card carries a bright amber outline, outset from the Card and reading as a layer over it rather than part of it, and the `VIEWED` Flow into it is painted along its route. Computed `animation-name` is `infoschematic-element-emphasis-held`, `animation-iteration-count` is `infinite`, computed opacity sampled `0.8097`. The `Playback has stalled` control is still highlighted, `aria-pressed="true"`.
- **Held, 450 ms later.** Visibly dimmer amber, still unmistakably present — the breathe between `0.55` and `0.9`, with no moment at which the outline is absent. That is the property that makes it read as a state rather than a pulse that happens to repeat, and it is the reason the keyframes never reach `0`.
- **Held, reduced motion** (`reducedMotion: 'reduce'`). A steady amber outline, `animation-name: none`, computed opacity exactly `0.9` — the same outline the static renderer draws. A reader who asked for no motion sees that the state is on, and is not told that it is _live_ rather than drawn; the decision record accepts that cost by name.
- **Released, both motion modes.** Second press, and the outline and the Flow treatment are gone with no residue: the Cards and the `VIEWED` arrow are pixel-identical to the quiet preset, and `aria-pressed` reads `false`.

Two things seen while looking, neither introduced here:

- Studio renders `InfoschematicDiagram` directly rather than through `Canvas` (`packages/view-studio/src/app/App.tsx:1034`), so its surface has **no live region at all** — the Playground page contains no `role="status"` element in any of `present`, `design` or `direct` mode. Studio rehearsal therefore shows the treatment and announces nothing, for Flow signals as much as for Dynamics, and `DYNAMIC-006`'s announcement obligation is met by Canvas and Present only. Pre-existing and untouched by this change; it wants a Triage record.
- On the emphasised `VIEWED` Flow the route is repainted amber while the Flow keeps its own violet arrowhead, so the head does not match the line it sits on. That is the existing emphasis-route treatment and looks the same during a finite event; recorded only because it is visible in the held screenshots for three seconds instead of for one.

### Outstanding concerns

`apps/site/src/playground/seeds/media-pipeline.yaml` is the only host surface where a reader could meet a hold, and it declares no state-depicting Dynamic, so the item's own Playground recipe cannot show one without an edit. `Playback has stalled` is the natural candidate — a Producer would say it out loud, which is this record's own dividing test. Left out of this change deliberately: it is authored host content, `INFOSCHEMATICS-TOOL-069` is live in the same seed file, and the decision is the owner's rather than mine.

The still-output recipe in `## Verify` cannot be run as written. `examples/is-system/infoschematic.yaml` declares `view-revised` as a plain `emphasise-elements` Dynamic, and nothing in the example corpus depicts a state, so the snippet renders the finite treatment. It does not matter for the decision taken — still output is identical for both by design, and that identity is now asserted in `packages/render-svg/src/index.test.ts` — but the recipe would mislead a later reader.

`bun run self:examples:render` takes `--out`, `--png`, `--width` and `--annotations`, not `--scale`/`--output`, and it has no occurrence flag at all, so no rasterised held image can come from it. The look above went through the Playground instead, which is the only surface that can show motion anyway.

Site content is deferred, as this repository's convention has it: `apps/site/content/authoring.md`, `present.md` and `react-integration.md` all describe `emphasise-elements` without depiction, and the follow-up belongs to `ki-next` rather than to this item.

`INFOSCHEMATICS-TOOL-060` should extend `ADR-INFOSCHEMATICS-029` rather than open a record: the decision is framed so that a travelling mark is a renderer interpretation with no authored surface, which is an addition to this record, not a contradiction of it.

### Mini recap

The document now says whether an emphasis reports something that happened or describes something that is the case, and nothing else changed hands: no third kind, no host flag, no authored treatment, no new token, and byte-identical behaviour for every document that says nothing. The work that mattered was not the hold itself — one filter and one CSS rule — but the two places where a green would have been unearned: a media query that adds no specificity and would have kept a hold animating under `prefers-reduced-motion`, and a batched pair of clicks that made a browser case assert its hold had survived a wait it never actually waited.

## Discussion

### Rehearsal has no stop

`DYNAMIC-005` requires Studio to offer a Producer one control per declared Dynamic, and it is built as a momentary play: `packages/view-studio/src/app/App.tsx:558-570` stamps a new occurrence key and then withdraws the occurrence 900 ms later, while `packages/view-studio/src/app/panels/ProducerControls.tsx:72-84` sets `aria-pressed={playingDynamicId === dynamic.id}` — a pressed state that is true for exactly that 900 ms. A held Dynamic has no stop, so either the Producer cannot rehearse the very treatment this item adds, or the control becomes a genuine toggle and `aria-pressed` starts meaning what it claims. The second is better and is also a `DYNAMIC-005` amendment, a Studio behaviour change, and a new browser case; it is not obviously inside this item's boundary, which says the hold's life stays host-owned. Resolve this before step 4, because it decides whether `packages/view-studio/src/app/App.tsx` loses a timer or gains a state machine.

### A kind, or a property of an occurrence

A held variant of `emphasise-elements` lengthens the kind list for something that is not a different statement — the presenter is still saying "this one matters", only for longer. An occurrence-level statement that the host is describing a state is the smaller surface, but it moves the distinction into the host binding where the document cannot see it, and a document that cannot express "this is a state" cannot be read as one. That tension is the decision, and step 1 should not be taken without resolving it.

### Reduced motion for something that persists

A finite pulse degrades to a still outline that then disappears. A held emphasis has nowhere to degrade except a steady treatment, which is the still treatment — so under reduced motion, held and still converge. That is probably acceptable, but it should be confirmed as a decision rather than discovered in implementation, because it means reduced-motion users get no signal that the state is live rather than drawn.
