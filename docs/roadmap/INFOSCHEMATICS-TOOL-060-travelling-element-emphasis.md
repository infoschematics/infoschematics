---
id: INFOSCHEMATICS-TOOL-060
area: TOOL
title: Travelling element emphasis
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-059]
baseline_ref: null
created_at: 2026-09-15T08:50:00Z
updated_at: 2026-09-16T10:45:00Z
---

# Travelling element emphasis

## Goal

Let an emphasis travel around the element it names — a mark running the perimeter of a Card or Region — so a presenter can point at one thing on a live slide and have the eye follow it, rather than the whole outline brightening at once.

## Context

Raised while reviewing the delivered Diagram Dynamics work against the IBC 2026 5G-EMERGE walkthrough. That item was `INFOSCHEMATICS-TOOL-055`, since pruned; its delivery is commit `02bcb675` and its durable record is [ADR-INFOSCHEMATICS-026](../decisions/ADR-INFOSCHEMATICS-026-name-dynamics-in-the-document.md) together with `DYNAMIC-001` to `DYNAMIC-006` in [the Diagram Dynamics specification](../specs/diagram-dynamics.md). The ask there was described as "a big circular arrow runs around it": movement along the element's own geometry, not a change of state in place.

`emphasise-elements` as delivered outlines the whole element and animates the outline as one object. That reads as "this element matters now", which is the right statement for most uses and the wrong one when the point is direction — a loop, a cycle, a path being walked.

This is a treatment question rather than a vocabulary question. The authored declaration already names an element and a meaning; what a renderer may do with that element's geometry is what is unsettled.

## Boundary

This item does not introduce authored durations, easing, keyframes, offsets, speeds, or path data. It does not let a document choose a motion technique, and it does not add a Dynamic kind whose meaning is "animate" rather than something a reader would say out loud. It does not make travelling the default treatment for `emphasise-elements`, and it does not require every element type to support it if the geometry cannot carry it honestly. It does not change how long an occurrence lasts, which is [Held element emphasis](INFOSCHEMATICS-TOOL-059-held-element-emphasis.md).

## Current state

The mechanism a travelling mark needs already exists in the Canvas, for Flows. `packages/view-canvas/src/InfoschematicDiagram.tsx:1576-1579` renders a `<circle className="infoschematic-flow-signal-pulse">` carrying SMIL `<animate attributeName="opacity">` and `<animateMotion dur={...} path={flow.d} />`, so a mark already travels along a path string at the Flow signal duration. Nothing equivalent exists for element emphasis, and the reason is geometric rather than technical: `animateMotion` needs a path, and the emphasis outline is not one.

The emphasis outline is a rectangle, built twice from the same tokens with no shared helper. `packages/view-canvas/src/InfoschematicDiagram.tsx:204-213` defines `emphasisTokens` and `boxEmphasis`, returning `{ x, y, width, height, rx }` outset by `inset` with corner radius `radius`, consumed at `:1817-1826`. `packages/render-svg/src/index.ts:174-219` independently defines `EmphasisShape`, `boxEmphasis` (a `rect` with the same outset and `rx`), `pointEmphasis` (a `circle` of `pointRadius + inset`), and `routeEmphasis` (a `path` along `flow.d`), consumed at `:296-304`. The two `boxEmphasis` functions are unrelated code computing the same thing, and `scripts/visual-treatment-parity.test.ts` asserts nothing about emphasis or Dynamics at all — its cases cover Cards, Regions, Flow arrowheads, grids, and ink — so they can diverge without any run turning red.

Geometry coverage already differs between the two renderers, and both differ from what validation and the published guidance promise. `packages/domain-core/src/model.ts:396-412` builds `elementIds` from Regions, Cards, Fabrics, Points, Flows, and Overlays, and `:454-455` accepts any of those six as an `emphasise-elements` target; `apps/site/content/authoring.md:149` promises all six to a reader. But the static renderer covers Regions, Cards, Fabrics, Graphics that have bounds, Points, and Flows (`packages/render-svg/src/index.ts:299-304`), while the Canvas covers Regions, `infoschematicPlaceables`, and Flows (`packages/view-canvas/src/InfoschematicDiagram.tsx:1818-1826`). `infoschematicPlaceables` is Cards and Fabrics only (`packages/view-model/src/runtime.ts:414-459`), the Canvas draws no Points at all, and `shownElementIds` in `packages/view-canvas/src/Canvas.tsx:88-98` contains Flow ids, Region ids, visible Card ids, and visible Fabric ids — so an occurrence naming a Point or an Overlay Graphic is filtered out at the Canvas boundary while the static renderer draws an outline for it.

The emphasis layer is deliberately inert and must stay so. `packages/view-canvas/src/styles.css:453-456` sets `pointer-events: none`; `:458-463` supplies `fill: none` and the token stroke; `:465-468` adds the Flow-route line cap and join; `packages/view-canvas/src/InfoschematicDiagram.tsx:1827-1845` marks each group `aria-hidden="true"` with `data-artefact-id`, `data-dynamic-id`, and `data-occurrence-key`; and `:2650` mounts the whole layer last inside `<g className="infoschematic-emphasis">`. The static renderer mirrors this at `packages/render-svg/src/index.ts:931-950`.

Reduced motion is handled by class, not by slowing anything, because CSS cannot stop SMIL. Inside the `@media (prefers-reduced-motion: reduce)` block opened at `packages/view-canvas/src/styles.css:479`, the travelling Flow pulse is switched off outright with `.infoschematic-flow-signal-pulse { display: none }` at `:480-482` and the still Flow path is faded in instead at `:484-486`, while element emphasis drops its animation for a flat `opacity: 0.9` at `:489-492`. A travelling emphasis owes the same shape of answer.

Every shared measurement is generated. `packages/view-model/src/tokens.ts:61-68` holds the whole `canvas.emphasis` group — `duration: '900ms'`, `inset: 6`, `radius: 14`, `stroke: '#f2a63b'`, `strokeWidth: 3` — and `scripts/generate-visual-tokens.ts` flattens it into `packages/view-model/src/tokens.generated.css:3-7`. `bun run self:tokens:generate` writes that file, `bun run self:verify:visual-tokens` fails if it is stale, and `packages/view-canvas/src/tokens.test.tsx:12-33` fails if the Canvas stylesheet references a custom property the generator does not emit. `packages/view-model/package.json` publishes it as `./tokens.css`; `packages/view-canvas/src/styles.css:2` imports it; `packages/view-present/src/styles.css:1` imports the Canvas stylesheet and `packages/view-studio/src/styles.css:2` imports Present's, so one treatment authored in the Canvas stylesheet reaches all three views. `packages/view-present/src/Present.tsx:20` and `:156` pass `dynamics` straight through to `Canvas` and add nothing.

`//#self:verify:visual-tokens` already lists `packages/view-model/src/**` in its `turbo.json` inputs, so adding a token needs no `inputs` change; a new root-level check would.

## Steps

1. Record the surface as a Decision Record under `docs/decisions/` before writing any code: travelling as a renderer-chosen second interpretation of `emphasise-elements`, or a distinct authored meaning that happens to travel. State the relationship to `ADR-INFOSCHEMATICS-026`, which kept motion technique out of the document, and say why a renderer-chosen path treatment is not authored animation. Verify: the record exists, `status: current`, with `decision_depends_on` naming `ADR-INFOSCHEMATICS-026`.
2. Give the emphasis outline one shared perimeter path instead of two independently built rectangles. Add a rounded-rectangle perimeter path builder to View Model — a new module beside `packages/view-model/src/region-geometry.ts`, exported from the package the way `./tokens` and `./geometry` already are — and have `packages/view-canvas/src/InfoschematicDiagram.tsx:207-213` and `packages/render-svg/src/index.ts:184-196` both consume it. Verify: `bun run --cwd packages/view-model test` on the new builder, plus a new emphasis case in `scripts/visual-treatment-parity.test.ts` asserting the two renderers emit the same perimeter for the same box, run by `bun run self:verify:repo`.
3. Travel a mark along that path in the Canvas, mirroring the Flow signal mechanism at `packages/view-canvas/src/InfoschematicDiagram.tsx:1576-1579`: `<animateMotion>` over the shared perimeter path, at a duration read from `canvas.emphasis`. Add any new measurement to `packages/view-model/src/tokens.ts:61-68` and run `bun run self:tokens:generate`; never hand-write a custom property. Verify: `bun run self:verify:visual-tokens` and `bun run --cwd packages/view-canvas test:browser`, asserting the mark's computed position changes over time and that it is inside the perimeter's bounding box.
4. Name the geometries that carry a travelling mark and make the rest fall back to the finite outline rather than draw nothing. The six accepted target kinds, the Canvas's four and the static renderer's six are set out in `## Current state`; a Point has no perimeter, an Overlay Graphic is unreachable from the Canvas today, a Flow may already carry a signal treatment on the same channel, and a Region's perimeter crosses nothing but its own children stay inside it. Verify: a case per decided kind in `packages/view-canvas/src/Canvas.dynamics.test.tsx` and `packages/render-svg/src/index.test.ts`, including one asserting an excluded kind still receives the finite outline.
5. Give it a reduced-motion interpretation in the block at `packages/view-canvas/src/styles.css:479-493`, following the pattern the Flow pulse already uses at `:480-486`: switch the travelling mark off by class rather than slow it, and leave a steady treatment visible. Verify: `bun run --cwd packages/view-canvas test:browser` with reduced motion emulated, asserting the travelling mark is absent and something is still painted.
6. Give it a still interpretation in `packages/render-svg/src/index.ts:174-219` and `:931-950` — either a deterministic direction marker on the perimeter that differs visibly from the finite outline, or the recorded decision from step 1 that the still case deliberately cannot distinguish them. Output must stay byte-identical with no occurrences supplied and must not vary with the occurrence key (`DYNAMIC-004`). Verify: `bun run --cwd packages/render-svg test`, with quiet-baseline and key-independence cases.
7. Leave the announcement exactly as it is: one utterance per occurrence stating the Dynamic's label, from the second `role="status"` region at `packages/view-canvas/src/Canvas.tsx:214-228`. Verify: the existing announcement cases in `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx` pass unchanged.
8. Prove the treatment still changes nothing about the element it names. The layer stays last, `aria-hidden`, and `pointer-events: none` (`packages/view-canvas/src/styles.css:453-456`, `InfoschematicDiagram.tsx:1827-1845`, mounted at `:2650`), and the travelling mark must not enlarge a hit target or obscure the element's own text. Verify: a case in `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` clicking through the mark's position to the element beneath it.
9. Amend `DYNAMIC-006` in `docs/specs/diagram-dynamics.md` with the travelling treatment's obligations and its geometry coverage, and `DYNAMIC-003` if coverage per renderer is now stated. Every `_Verify:_` and `_Evidence:_` path must resolve. Verify: `bun run self:verify:repo`, which runs `scripts/specification-evidence.test.ts`.
10. Render the result and look at it, exactly as `## Verify` sets out. Nothing above can see whether a mark follows a perimeter or cuts a corner.

## Files touched

- `packages/view-canvas/src/InfoschematicDiagram.tsx` — exists; `boxEmphasis` at `:207-213`, `emphasisGeometry` at `:1817-1826`, the emphasis groups at `:1827-1845`, and the Flow pulse to mirror at `:1576-1579`.
- `packages/view-canvas/src/styles.css` — exists; `:453-468` and the reduced-motion block at `:479-493`.
- `packages/render-svg/src/index.ts` — exists; the emphasis shapes at `:174-219`, the per-element map at `:296-304`, and the emitted groups at `:931-950`.
- A new perimeter-path module under `packages/view-model/src/` — new file, beside the existing `geometry.ts` and `region-geometry.ts`, with a matching `*.test.ts` and an `exports` entry in `packages/view-model/package.json` if it is consumed by subpath the way `./tokens` is.
- `packages/view-model/src/tokens.ts` — exists; the `canvas.emphasis` group at `:61-68`, only if a new measurement is needed. `packages/view-model/src/tokens.generated.css` is generated by `bun run self:tokens:generate`, never edited.
- `scripts/visual-treatment-parity.test.ts` — exists; gains its first emphasis case.
- `docs/specs/diagram-dynamics.md` — exists.
- A new Decision Record under `docs/decisions/` — new file; the next free `ADR-INFOSCHEMATICS-0NN` slot after `ADR-INFOSCHEMATICS-027`. `docs/decisions/README.md` exists and indexes it.
- `packages/view-canvas/src/Canvas.dynamics.test.tsx`, `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx`, `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx`, `packages/render-svg/src/index.test.ts` — all exist.
- Not touched: `packages/view-present/` and `packages/view-studio/` need no change, because Present passes `dynamics` straight through (`packages/view-present/src/Present.tsx:156`) and both inherit the Canvas stylesheet by import.

## Verify

Targeted, in this order: `bun run --cwd packages/view-model test`, `bun run --cwd packages/view-canvas test`, `bun run --cwd packages/view-canvas test:browser`, `bun run --cwd packages/render-svg test`, `bun run --cwd packages/view-present test`, then `bun run self:verify:visual-tokens` and `bun run self:verify:repo`. The full gate is `bun run self:check`, owned by whoever commits.

Then render it and look at it, because none of the above can see whether the mark follows the element.

Motion, at more than one size and aspect ratio: `bun run self:dev`, then open `http://localhost:4173/playground/?preset=media-pipeline`. The seed at `apps/site/src/playground/seeds/media-pipeline.yaml:91-104` declares `playback-stalled` as `emphasise-elements` over the Card `PLAYER` and the Flow `VIEWED`, and Studio's Producer controls render a Dynamics bank button per declared Dynamic (`packages/view-studio/src/app/panels/ProducerControls.tsx:72-84`). Press "Playback has stalled" and watch for five things: the mark stays on the outline rather than cutting across a corner; it rounds the corners at the token radius rather than turning square; it completes exactly one circuit in the declared duration rather than drifting or jumping at the seam; it never crosses the Card's own label or code text; and the Flow `VIEWED` still reads as a route treatment rather than acquiring a second competing mark. Then edit the Playground source pane to give the Card a tall narrow box and a wide flat box and press the button again — a mark derived from a wrong perimeter is most obvious at an extreme aspect ratio. Repeat with the operating system's reduce-motion setting on, and confirm the mark is gone and a steady treatment remains.

Pointer safety: with the mark visible, click the Card where the mark passes over it, and confirm the Card is selected rather than the click being swallowed.

Still output: the CLI has no occurrence flag (`packages/cli/src/options.ts:25-44`) and `bun run self:examples:render` renders the quiet document, so render the still treatment directly and open the file.

```bash
mkdir -p reports && bun -e "
import { readFile, writeFile } from 'node:fs/promises'
import { parseInfoschematic } from './packages/domain-core/src/index.ts'
import { renderInfoschematicSvg } from './packages/render-svg/src/index.ts'
const source = 'examples/is-system/infoschematic.yaml'
const parsed = parseInfoschematic(await readFile(source, 'utf8'), { pathname: source })
if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues))
await writeFile('reports/travelling-emphasis.svg', renderInfoschematicSvg(parsed.model, {
  dynamics: [{ dynamicId: 'view-revised', occurrenceKey: 'look-1' }]
}))
" && open reports/travelling-emphasis.svg
```

`examples/is-system/infoschematic.yaml:103-115` declares `view-revised` as `emphasise-elements` over the Card `SEE-04`, and this command produces exactly one emphasis group. Look for a direction marker that a reader could interpret without having seen the motion, no animation markup anywhere in the file, and a visible difference from the finite outline the same command produces today. `reports/` is gitignored.

## Dependencies / blocks

The Dynamics contract this builds on is delivered: commit `02bcb675`, `ADR-INFOSCHEMATICS-026`, and `DYNAMIC-001` to `DYNAMIC-006`. `INFOSCHEMATICS-TOOL-055` has been pruned, so do not treat it as a live dependency.

Overlaps [Held element emphasis](INFOSCHEMATICS-TOOL-059-held-element-emphasis.md) on four edit regions: the emphasis rules in `packages/view-canvas/src/styles.css:453-505`, `DYNAMIC-006` in `docs/specs/diagram-dynamics.md`, the Decision Record extending `ADR-INFOSCHEMATICS-026`, and the authored surface files if either needs one. The two must not be delivered concurrently in one checkout, and step 1's surface decision must be taken once for both rather than twice. A held travelling mark is the combination the IBC walkthrough actually wants, so whichever lands second must prove they compose.

Adjacent but independent: [Cross-feature interaction coverage](INFOSCHEMATICS-TOOL-057-cross-feature-interaction-coverage.md) owns the question of which cross-renderer parity cases the gate should hold, and step 2 adds the first emphasis case to `scripts/visual-treatment-parity.test.ts`.

## Documentation impact

### Decision Records

Expected, and it is step 1. `ADR-INFOSCHEMATICS-026` kept motion technique out of the document and named a finite kind vocabulary as the deliberate cost, so a travelling treatment needs a new `architecture` record under `docs/decisions/` — next free number after `ADR-INFOSCHEMATICS-027` — with `decision_depends_on` naming `ADR-INFOSCHEMATICS-026`, arguing why a renderer-chosen path treatment is not the authored animation that record refused. Add it to `docs/decisions/README.md`. If TOOL-059 is delivered in the same change, one record covers both.

### Specifications

Expected, in `docs/specs/diagram-dynamics.md`, and it stays with the feature rather than becoming a follow-up. `DYNAMIC-006` must gain the travelling treatment's full-motion, reduced-motion, and still obligations; `DYNAMIC-003` should gain the per-renderer geometry coverage step 4 decides, since "only what a renderer drew" currently hides a real difference between the Canvas and the static renderer. `DYNAMIC-001` changes only if step 1 chose an authored surface. Cited `_Verify:_` and `_Evidence:_` paths are checked mechanically by `scripts/specification-evidence.test.ts`. No new spec file and no change to `docs/specs/index.md`.

### Guides

None in this change. The consumer-facing prose is site-owned — `apps/site/content/authoring.md:149` currently promises emphasis over all six element kinds, `present.md:45-47` and `react-integration.md:169` describe the treatment as an outline, and `static-rendering.md:86` describes the still case — and site content is deliberately deferred out of feature items so it is not written against a moving target. `docs/guides/` has nothing on Dynamics and needs nothing.

### Roadmap

Expected: one follow-up record for the site content above, captured as Triage, and it matters more here than usual because `apps/site/content/authoring.md:149` is already inaccurate about Canvas coverage. Capture belongs to `ki-next`, not to this item's delivery.

### Vocabulary

None expected. `diagram-dynamic` is already a canonical term at `docs/reference/vocabulary.md:30`; a travelling treatment is an interpretation of it, not a new concept. If step 1 chooses a distinct authored meaning, that adds a term and `scripts/vocabulary-terms.test.ts` and `scripts/vocabulary-citations.test.ts` will hold the change to the house form.

## Discussion

### Who owns the perimeter

`animateMotion` needs a path string, and the emphasis outline is a `<rect rx>` built twice — once in `packages/view-canvas/src/InfoschematicDiagram.tsx:207-213` and once in `packages/render-svg/src/index.ts:184-196` — with no shared code and no parity case in `scripts/visual-treatment-parity.test.ts` to catch them drifting. Step 2 moves that into View Model, but it leaves a genuinely open question: if View Model owns the perimeter, does it also own the still direction marker's position on it? Putting the marker position in View Model makes both renderers place it identically and makes the still case a calculation rather than a drawing decision, which is the repository's stated preference; keeping it in `render-svg` keeps View Model free of treatment choices, which is the boundary the architecture guide draws. The answer decides whether the new module exports a path or a path plus an ordered set of positions along it, and that is not a detail to discover during step 6.

### Geometry that cannot carry it

A Point has no perimeter. A Flow may already have a signal treatment running along it, so a second travelling mark competes on the same channel. A Region containing other elements would have the mark cross nothing, but an Overlay Graphic is not reachable from the Canvas at all today even though validation accepts it and `apps/site/content/authoring.md:149` promises it. The boundary already permits not supporting every kind; this item should name which kinds it excludes and why, because degrading silently is worse than refusing.

### The still interpretation is the hard half

Static output has no time, so travelling has to mean something in a single frame, and it has to differ from the finite emphasis or the two are indistinguishable in print. A direction marker on the perimeter is one answer. Stating that the still case deliberately cannot distinguish them is another, but it is a decision to record, not an omission to leave.
