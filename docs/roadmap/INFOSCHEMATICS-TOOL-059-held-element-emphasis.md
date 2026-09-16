---
id: INFOSCHEMATICS-TOOL-059
area: TOOL
title: Held element emphasis
theme: tool
horizon: now
status: ready
blocks: [INFOSCHEMATICS-TOOL-060]
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T07:25:00Z
updated_at: 2026-09-16T10:45:00Z
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

## Discussion

### Rehearsal has no stop

`DYNAMIC-005` requires Studio to offer a Producer one control per declared Dynamic, and it is built as a momentary play: `packages/view-studio/src/app/App.tsx:558-570` stamps a new occurrence key and then withdraws the occurrence 900 ms later, while `packages/view-studio/src/app/panels/ProducerControls.tsx:72-84` sets `aria-pressed={playingDynamicId === dynamic.id}` — a pressed state that is true for exactly that 900 ms. A held Dynamic has no stop, so either the Producer cannot rehearse the very treatment this item adds, or the control becomes a genuine toggle and `aria-pressed` starts meaning what it claims. The second is better and is also a `DYNAMIC-005` amendment, a Studio behaviour change, and a new browser case; it is not obviously inside this item's boundary, which says the hold's life stays host-owned. Resolve this before step 4, because it decides whether `packages/view-studio/src/app/App.tsx` loses a timer or gains a state machine.

### A kind, or a property of an occurrence

A held variant of `emphasise-elements` lengthens the kind list for something that is not a different statement — the presenter is still saying "this one matters", only for longer. An occurrence-level statement that the host is describing a state is the smaller surface, but it moves the distinction into the host binding where the document cannot see it, and a document that cannot express "this is a state" cannot be read as one. That tension is the decision, and step 1 should not be taken without resolving it.

### Reduced motion for something that persists

A finite pulse degrades to a still outline that then disappears. A held emphasis has nowhere to degrade except a steady treatment, which is the still treatment — so under reduced motion, held and still converge. That is probably acceptable, but it should be confirmed as a decision rather than discovered in implementation, because it means reduced-motion users get no signal that the state is live rather than drawn.
