---
id: INFOSCHEMATICS-TOOL-060
area: TOOL
title: Travelling element emphasis
theme: tool
horizon: now
status: done
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-059]
baseline_ref: null
created_at: 2026-09-15T08:50:00Z
updated_at: 2026-09-16T16:49:00Z
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

Every shared measurement is generated. `packages/view-model/src/tokens.ts:61-68` holds the whole `canvas.emphasis` group — `duration: '900ms'`, `inset: 6`, `radius: 14`, `stroke: '#f2a63b'`, `strokeWidth: 3` — and `scripts/generate-visual-tokens.ts` flattens it into `packages/view-model/src/tokens.generated.css:3-7`. `bun run self:tokens:generate` writes that file, `bun run self:tokens:verify` fails if it is stale, and `packages/view-canvas/src/tokens.test.tsx:12-33` fails if the Canvas stylesheet references a custom property the generator does not emit. `packages/view-model/package.json` publishes it as `./tokens.css`; `packages/view-canvas/src/styles.css:2` imports it; `packages/view-present/src/styles.css:1` imports the Canvas stylesheet and `packages/view-studio/src/styles.css:2` imports Present's, so one treatment authored in the Canvas stylesheet reaches all three views. `packages/view-present/src/Present.tsx:20` and `:156` pass `dynamics` straight through to `Canvas` and add nothing.

`//#self:tokens:verify` already lists `packages/view-model/src/**` in its `turbo.json` inputs, so adding a token needs no `inputs` change; a new root-level check would.

## Steps

1. Record the surface as a Decision Record under `docs/decisions/` before writing any code: travelling as a renderer-chosen second interpretation of `emphasise-elements`, or a distinct authored meaning that happens to travel. State the relationship to `ADR-INFOSCHEMATICS-026`, which kept motion technique out of the document, and say why a renderer-chosen path treatment is not authored animation. Verify: the record exists, `status: current`, with `decision_depends_on` naming `ADR-INFOSCHEMATICS-026`.
2. Give the emphasis outline one shared perimeter path instead of two independently built rectangles. Add a rounded-rectangle perimeter path builder to View Model — a new module beside `packages/view-model/src/region-geometry.ts`, exported from the package the way `./tokens` and `./geometry` already are — and have `packages/view-canvas/src/InfoschematicDiagram.tsx:207-213` and `packages/render-svg/src/index.ts:184-196` both consume it. Verify: `bun run --cwd packages/view-model test` on the new builder, plus a new emphasis case in `scripts/visual-treatment-parity.test.ts` asserting the two renderers emit the same perimeter for the same box, run by `bun run self:scripts:test`.
3. Travel a mark along that path in the Canvas, mirroring the Flow signal mechanism at `packages/view-canvas/src/InfoschematicDiagram.tsx:1576-1579`: `<animateMotion>` over the shared perimeter path, at a duration read from `canvas.emphasis`. Add any new measurement to `packages/view-model/src/tokens.ts:61-68` and run `bun run self:tokens:generate`; never hand-write a custom property. Verify: `bun run self:tokens:verify` and `bun run --cwd packages/view-canvas test:browser`, asserting the mark's computed position changes over time and that it is inside the perimeter's bounding box.
4. Name the geometries that carry a travelling mark and make the rest fall back to the finite outline rather than draw nothing. The six accepted target kinds, the Canvas's four and the static renderer's six are set out in `## Current state`; a Point has no perimeter, an Overlay Graphic is unreachable from the Canvas today, a Flow may already carry a signal treatment on the same channel, and a Region's perimeter crosses nothing but its own children stay inside it. Verify: a case per decided kind in `packages/view-canvas/src/Canvas.dynamics.test.tsx` and `packages/render-svg/src/index.test.ts`, including one asserting an excluded kind still receives the finite outline.
5. Give it a reduced-motion interpretation in the block at `packages/view-canvas/src/styles.css:479-493`, following the pattern the Flow pulse already uses at `:480-486`: switch the travelling mark off by class rather than slow it, and leave a steady treatment visible. Verify: `bun run --cwd packages/view-canvas test:browser` with reduced motion emulated, asserting the travelling mark is absent and something is still painted.
6. Give it a still interpretation in `packages/render-svg/src/index.ts:174-219` and `:931-950` — either a deterministic direction marker on the perimeter that differs visibly from the finite outline, or the recorded decision from step 1 that the still case deliberately cannot distinguish them. Output must stay byte-identical with no occurrences supplied and must not vary with the occurrence key (`DYNAMIC-004`). Verify: `bun run --cwd packages/render-svg test`, with quiet-baseline and key-independence cases.
7. Leave the announcement exactly as it is: one utterance per occurrence stating the Dynamic's label, from the second `role="status"` region at `packages/view-canvas/src/Canvas.tsx:214-228`. Verify: the existing announcement cases in `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx` pass unchanged.
8. Prove the treatment still changes nothing about the element it names. The layer stays last, `aria-hidden`, and `pointer-events: none` (`packages/view-canvas/src/styles.css:453-456`, `InfoschematicDiagram.tsx:1827-1845`, mounted at `:2650`), and the travelling mark must not enlarge a hit target or obscure the element's own text. Verify: a case in `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` clicking through the mark's position to the element beneath it.
9. Amend `DYNAMIC-006` in `docs/specs/diagram-dynamics.md` with the travelling treatment's obligations and its geometry coverage, and `DYNAMIC-003` if coverage per renderer is now stated. Every `_Verify:_` and `_Evidence:_` path must resolve. Verify: `bun run self:scripts:test`, which runs `scripts/specification-evidence.test.ts`.
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

Targeted, in this order: `bun run --cwd packages/view-model test`, `bun run --cwd packages/view-canvas test`, `bun run --cwd packages/view-canvas test:browser`, `bun run --cwd packages/render-svg test`, `bun run --cwd packages/view-present test`, then `bun run self:tokens:verify` and `bun run self:scripts:test`. The full gate is `bun run self:check`, owned by whoever commits.

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

## Review

### Delivered

An emphasis now travels. Where an element has a closed perimeter, the interactive renderer sends a filled disc once round the line its own outline is drawn from, at the `canvas.emphasis` period; where the emphasis depicts a state, the disc keeps going round for as long as the host holds the occurrence. Every other geometry keeps the finite outline it already had. The still renderer draws that same perimeter and nothing travelling on it. All ten steps are delivered, two of them reshaped by a decision that was already taken.

Step 1 extended `ADR-INFOSCHEMATICS-029` rather than opening a second record, as the batch allocation requires. The record had already settled that a travelling mark is not authored, so there is no `technique` value, no third Dynamic kind, and no new authored field anywhere in this change: the whole feature is renderer-internal. What the extension adds is the part being a renderer's choice does not license — which geometries are offered a mark and why the others are declined, what full motion costs, what reduced motion does, and what the still frame deliberately cannot say.

Step 6 took the second of the two options the step allowed: the recorded decision that a still frame cannot distinguish a travelling emphasis from a finite one, rather than a deterministic direction marker. The reason is the record's own: the direction a mark traces is chosen from the element's geometry, not from anything the document states, so a start marker or a frozen disc would show a reader a movement the document never asserts. That also answers the `## Discussion` question about who owns the perimeter, which the item said was not a detail to discover during step 6. Because the still case declines a direction, the shared calculation is a path and nothing else — no ordered positions along it, no start angle, no sense of rotation — which keeps View Model free of treatment choices while still making the perimeter one calculation rather than two.

### Summary of changes

`packages/view-model/src/perimeter.ts` — new. `roundedRectanglePath(box, radius)` returns one closed, clockwise, rounded-rectangle path whose last point is its first, and `emphasisPerimeterPath(box)` outsets a box by the emphasis inset and rounds it at the emphasis radius. The radius is fitted to the box, so an extreme aspect ratio draws a stadium rather than arcs that overshoot and cross. It answers only where the perimeter is: nothing about what is drawn on it, which way round it is travelled, or where anything rests along it. `roundedOutline` in `./geometry.ts` was read first and is not reused — it walks an arbitrary run of corners with a per-run radius clamp, and reusing it would change region-frame output.

`packages/view-model/src/perimeter.test.ts` — new. Five cases: the closed clockwise path and its seam, radius fitting at flat, tall and square extremes with every arc coordinate proved inside the box, a zero-extent box, the emphasis outset matching the `rect` both renderers drew before, and an element too small to carry the full radius.

`packages/view-model/package.json` — a `./perimeter` export between `./placement` and `./ports`.

`packages/view-model/src/region-geometry.ts` — the private 20-line `roundedFrame` is now the shared perimeter. A judgement call beyond the literal step text, flagged under `### Outstanding concerns`.

`packages/view-canvas/src/InfoschematicDiagram.tsx` — `boxEmphasis` becomes `emphasisTreatment`, which draws the outline as a path and, where the geometry travels, one `circle` carrying an `animateMotion` whose `path` is the identical string. `repeatCount="indefinite"` only where the occurrence depicts a state. The geometry map now answers `{ d, travels }`: Regions, Cards, Fabrics and bounded Graphics travel; a Flow keeps `infoschematic-element-emphasis-route` and no mark. No `defs` element was needed, so `svgResourcePrefix` is not involved and two mounted Canvases cannot resolve each other's.

`packages/view-canvas/src/styles.css` — `.infoschematic-element-emphasis-mark` fills from the existing emphasis stroke token, introducing no new custom property, so neither the generator nor `tokens.test.tsx` needed anything. Inside the reduced-motion block the mark is `display: none`.

`packages/render-svg/src/index.ts` — `boxEmphasis` emits a `path` whose `d` is `emphasisPerimeterPath(box)` rather than a `rect` stated locally. `pointEmphasis` and `routeEmphasis` are unchanged, and nothing travels.

`docs/decisions/ADR-INFOSCHEMATICS-029-author-what-an-emphasis-means.md` — five paragraphs before `## Consequences` and two additions to its closing paragraph.

`docs/specs/diagram-dynamics.md` — `DYNAMIC-003` gains the shared-calculation obligation and the right to decline a geometry without drawing nothing; `DYNAMIC-004` gains the requirement that still output not distinguish travelling from finite and not invent a direction; `DYNAMIC-006` gains the travelling treatment's full-motion, pointer and reduced-motion obligations, including that a reduced-motion rule must be restated per selector because a media query adds no specificity. Every `_Verify:_` and `_Evidence:_` path resolves.

Tests: four new cases in `packages/view-canvas/src/Canvas.dynamics.test.tsx`, two in `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx` and `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx`, the first emphasis case in `scripts/visual-treatment-parity.test.ts`, and extended still-output assertions in `packages/render-svg/src/index.test.ts`. The `059` case asserting a state is the only difference between two renderings was widened honestly: `repeatCount` is a second difference, and it is a consequence of the same state.

### Verification

Targeted, in the item's order: `view-model` 191 passed, `view-canvas` 82 passed (from 78), `view-canvas test:browser` 29 passed (from 27), `render-svg` 18 passed, `view-present` unchanged, `self:tokens:verify` clean with no regeneration needed, `self:scripts:test` 78 passed (from 77).

Full gate: `bun run self:check` 44/44, then the same task list under `turbo run … --force` at 44/44 with 0 cached, because a replay is not a fresh result.

`turbo.json` needed no change, and that was proved rather than assumed: `//#self:scripts:test` replayed `FULL TURBO` on an unchanged tree, then re-ran when `packages/view-model/src/perimeter.ts` was edited, so the existing `packages/*/src/**` input genuinely covers the new module.

Layering was argued by reading imports, because `self:boundaries:verify` reports `0 modules, 0 dependencies cruised` and is evidence of nothing. `perimeter.ts` imports one type from `@infoschematics/domain-model/geometry` and its own `./tokens.ts`. Its consumers are `view-canvas`, `render-svg`, `view-model`'s own `region-geometry.ts`, and the parity script — all of which already depended on View Model. No new package edge and no upward import.

Eight assertions were proved able to fail, each restored by the inverse edit rather than by discarding a file:

1. Reduced-motion `display: none` weakened to `opacity: 0.9` — the node reduced-motion case went red, the browser suite stayed green, exactly the trap `059` set.
2. The still renderer's perimeter shifted one unit — the `render-svg` still case and the new parity case both went red.
3. `repeatCount` dropped — the held-mark node case went red.
4. A Flow allowed to travel — the geometry-coverage case went red.
5. `pointer-events: none` changed to `all` — the new pointer-safety browser case went red.
6. `animateMotion path` parked at `M0 0` — the new moving-mark browser case went red.
7. The still emphasis tag changed to `animateMotion` — the still case's negative assertion went red, so it is live rather than vacuous.
8. The radius clamp removed — three perimeter cases went red.

### Post-change review

The suite cannot see whether a mark follows a perimeter, so the result was rendered and watched. A page was built from the server-rendered Canvas with the real stylesheet inlined, and driven in Chromium at two viewport sizes over four box shapes at once: a wide flat Card (240×44), a tall narrow Card (90×170), a Fabric (260×34), and a Region (640×240), with a Flow and a Point also emphasised.

What I saw, frame by frame across one 900 ms circuit. Each mark sits centred on its own outline and stays there; at the third of six frames every mark had reached the far edge of its box and by the fifth had wrapped back to the top, so one circuit completes in the declared period and the wrap shows no jump — which the closed path's last-point-equals-first-point assertion is the reason for. On a tight crop of one corner the disc is visibly riding the rounded arc, and in the next frame it has come off the arc onto the straight edge; it does not cut the corner. Because the perimeter is outset, no mark ever crosses a Card's label or code text. The emphasised Flow reads as a route treatment — a thickened amber line along the route — and carries no disc, so it cannot be mistaken for a signal travelling the same line.

Under `reducedMotion: 'reduce'` there is no disc anywhere and the steady outlines remain at full strength; six frames 150 ms apart are byte-identical files, so nothing is moving. That is the picture still output draws, which is the convergence the record claims.

The still check the item names was run against `examples/is-system/infoschematic.yaml` with `view-revised` occurring. One emphasis group, no animation markup of any kind, no mark class, byte-identical across two different occurrence keys, and the quiet baseline unchanged. Opened and looked at: one amber rounded outline outset round the `SEE-04` Card and nothing else — no direction marker, and no visible difference from the finite outline the same command produced before, which is the recorded decision rather than a gap.

### Outstanding concerns

`INFOSCHEMATICS-TOOL-080` is visible in the render and was left alone: the emphasised Flow repaints its route in the emphasis colour while keeping its family-coloured arrowhead, so an amber line arrives at a purple head. It is parked and not this item's, and it is not caused by this change — the Flow's route treatment is the same path and the same class as before.

The interactive Canvas draws no Point at all, so an emphasis over a Point reaches nothing there while the still renderer rings it. That is pre-existing and is the existing rule about reaching only what a renderer drew, not a refusal introduced here; the record now says so plainly rather than implying a Canvas outline a reader would never see. Worth an owner's eye as a renderer-coverage gap, but deliberately not touched.

Reduced motion has no browser-level evidence in the gate. Every reduced-motion assertion in this repository is a stylesheet-text assertion in a node suite, and adding `page.emulateMedia` machinery would mean changing `scripts/vitest-workspace.ts`, which every workspace shares — not a change to make mid-batch. So the `display: none` rule is held by an assertion, and the browser-level confirmation is the hand-driven screenshot run described above rather than something the gate repeats.

Folding `region-geometry.ts`'s private `roundedFrame` into the shared perimeter goes beyond the literal step text. It was done because leaving two identical rounded-rectangle builders in the same package is the condition under which they drift; the output is proved unchanged by the existing 191-case View Model suite, and only the notched frame remains that module's own. Reversible in isolation if the reviewer would rather it were not part of this change.

The site-content follow-up the item anticipates is still outstanding: `apps/site/content/authoring.md:149` promises emphasis over all six element kinds, which was already inaccurate about Canvas coverage before this change and is now also silent about travelling. The item places that capture in `ki-next` rather than in this delivery, so no roadmap record was opened here.

### Mini recap

One perimeter calculation, owned by View Model, drawn by both renderers, and travelled by the interactive one. The travelling mark is unauthored and stays that way; what the extended record adds is what a renderer owes a reader once it makes that choice. Reduced motion removes the mark rather than stilling it, because declarative SVG motion is beyond the reach of any CSS animation property — the medium-level analogue of the specificity trap `059` left behind. The still frame draws the perimeter and states no direction, because the document states none either.

## Discussion

### Who owns the perimeter

`animateMotion` needs a path string, and the emphasis outline is a `<rect rx>` built twice — once in `packages/view-canvas/src/InfoschematicDiagram.tsx:207-213` and once in `packages/render-svg/src/index.ts:184-196` — with no shared code and no parity case in `scripts/visual-treatment-parity.test.ts` to catch them drifting. Step 2 moves that into View Model, but it leaves a genuinely open question: if View Model owns the perimeter, does it also own the still direction marker's position on it? Putting the marker position in View Model makes both renderers place it identically and makes the still case a calculation rather than a drawing decision, which is the repository's stated preference; keeping it in `render-svg` keeps View Model free of treatment choices, which is the boundary the architecture guide draws. The answer decides whether the new module exports a path or a path plus an ordered set of positions along it, and that is not a detail to discover during step 6.

### Geometry that cannot carry it

A Point has no perimeter. A Flow may already have a signal treatment running along it, so a second travelling mark competes on the same channel. A Region containing other elements would have the mark cross nothing, but an Overlay Graphic is not reachable from the Canvas at all today even though validation accepts it and `apps/site/content/authoring.md:149` promises it. The boundary already permits not supporting every kind; this item should name which kinds it excludes and why, because degrading silently is worse than refusing.

### The still interpretation is the hard half

Static output has no time, so travelling has to mean something in a single frame, and it has to differ from the finite emphasis or the two are indistinguishable in print. A direction marker on the perimeter is one answer. Stating that the still case deliberately cannot distinguish them is another, but it is a decision to record, not an omission to leave.
