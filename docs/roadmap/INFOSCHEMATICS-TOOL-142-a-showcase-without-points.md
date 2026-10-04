---
id: INFOSCHEMATICS-TOOL-142
area: TOOL
title: A showcase without Points
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 9f7d117b91cfd52cbef73c31e3023f338c8bc23f
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-10-04T21:55:00Z
---

# A showcase without Points

## Goal

The showcase document names a [Point](../reference/vocabulary.md#point) in a Dynamic, so the emphasis treatment a Point receives is exercised by an authored document rather than only by tests.

## Context

`INFOSCHEMATICS-TOOL-126` made an emphasis reach a Point in both renderers. The behaviour is held by unit tests, a browser test, and a visual-treatment parity case, and it was confirmed by a browser look — but the look had to be taken from a throwaway page, because `examples/is-showcase` names no Point in any Dynamic and the Playground therefore cannot show one.

That matters beyond convenience. `scripts/example-capability-coverage.test.ts` derives its capability list from the live schema and asserts it against the showcase alone, which is the mechanism that keeps authored examples honest about what the product can do. A capability the showcase does not author is a capability nobody looks at unless they go out of their way to build a page for it.

## Boundary

Authoring an existing capability into the existing showcase. It adds no product behaviour and changes no contract.

It does not follow that every capability belongs in the showcase — that document is also a piece of communication and a dumping ground for feature coverage would be a worse one. Whether Point emphasis earns a place in the story the showcase tells, or wants a separate example under `examples/`, is the question worth asking rather than assuming the first answer.

## Current state

`examples/is-showcase/infoschematic.yaml` declares three Diagram Dynamics: `DYN-SIGNAL` (`signal-flow` over `FLOW-01` and `FLOW-03`), `DYN-EVENT` (`emphasise-elements`, `depicts: event`, on `CARD-02`) and `DYN-STATE` (`emphasise-elements`, `depicts: state`, on `FAB-01`). Emphasis therefore reaches a Card and a Fabric in an authored document, but no Dynamic names either of the two Points, `PT-01` (Camera, `icon: source`) and `PT-02` (Archive, `icon: sink`).

`STORY-01`'s third Scene, `SCENE-03` "Edges and substrate", already tells the Points story: it shows `SCOPE-EDGE` (which holds both Points), focuses `FAB-01`, `PT-01` and `PT-02`, cues `DYN-STATE` at stage 1 and `DYN-SIGNAL` on `repeat` at stage 2, and its Callout reads "A Point is a lightweight source or sink".

The YAML is the authored source; `src/infoschematic.ts` is generated from it by `bun run self:examples:generate` and held to it by `self:examples:verify`. `examples/is-showcase/src/index.test.ts` pins the Dynamics list (`names three Dynamics, covering a signal and both depictions of emphasis`) and the README's capability table says "three Diagram Dynamics, two of them cued by Scenes". `scripts/example-capability-coverage.test.ts` measures schema paths and enum values, so it is already satisfied by `dynamics[].elements` and cannot see what kind of element a Dynamic names; that check is not changed here.

### Decisions

- **Point emphasis belongs in the showcase, not a separate example.** `SCENE-03` already stages the Points as the place material enters and leaves, so an emphasis on the Camera extends a story the document tells rather than bolting on coverage; a new package under `examples/` would add a manifest, a generated module and a Playground preset to show one Dynamic, and would sit outside the capability-coverage mechanism that is anchored to the showcase. Decided under delegated autonomy (2026-10-04), reversible.
- **One new Dynamic, `DYN-SOURCE` "The camera started sending", `emphasise-elements`, `depicts: event`, on `PT-01`.** An event on the source reads naturally at the start of the edges Scene and keeps the existing event/state pair on the Card and the Fabric untouched; a state on the sink was the alternative and adds nothing the Fabric's state does not already show. Decided under delegated autonomy (2026-10-04), reversible.
- **It is cued by `SCENE-03` at stage 1 with `playback: once`, beside `DYN-STATE`.** That makes it reachable through the Story in Present as well as through the Studio's production controls, and keeps the Scene's two-stage cascade. Decided under delegated autonomy (2026-10-04), reversible.
- **The showcase test asserts that emphasis reaches a Card, a Fabric and a Point.** This holds the document to the reason the Dynamic exists, so a later edit that drops it fails a named test rather than passing silently. Decided under delegated autonomy (2026-10-04), reversible.
- **The package README is corrected in this change.** `AGENTS.md` routes consumer prose to a follow-up record so it is written once behaviour has settled; no behaviour moves here, and the README describes this document, so leaving it saying "three Diagram Dynamics" would make it wrong on landing. Decided under delegated autonomy (2026-10-04), reversible.

## Steps

- [x] Add `DYN-SOURCE` to `diagram.dynamics` in `examples/is-showcase/infoschematic.yaml`, after `DYN-STATE`, and cue it from `SCENE-03` at stage 1 with `playback: once`.
- [x] Regenerate the typed export with `bun run self:examples:generate`.
- [x] Update `examples/is-showcase/src/index.test.ts` to expect four Dynamics and to assert that the emphasise-elements Dynamics between them name a Card, a Fabric and a Point.
- [x] Update the capability table in `examples/is-showcase/README.md` to four Diagram Dynamics, three cued by Scenes.
- [x] Look at the result in a real browser with `bun run self:browser:look`: the Playground's showcase, with `DYN-SOURCE` played, shows the Point's emphasis ring around the Camera; record the capture paths under Review.

## Files touched

- `examples/is-showcase/infoschematic.yaml`
- `examples/is-showcase/src/infoschematic.ts` (generated)
- `examples/is-showcase/src/index.test.ts`
- `examples/is-showcase/README.md`
- `scripts/probes/TOOL-142-point-emphasis.ts` (the look's probe)
- This record

Not touched: the schema, the renderers, the emphasis treatment, `scripts/example-capability-coverage.test.ts`, and the Site content.

## Verify

- `bun run self:examples:verify` passes, proving the generated module matches the YAML.
- `bunx vitest run --root examples/is-showcase` and `bunx vitest run scripts/example-capability-coverage.test.ts scripts/example-drawings.test.ts` pass; the new showcase assertion is shown failing with `DYN-SOURCE` removed, then restored.
- A browser capture from `bun run self:browser:look` shows the Camera Point emphasised in the showcase, with no console error.
- `bun run self:check` passes; `bunx rumdl check` is clean on the touched Markdown; `ki repo audit --repo .` reports FAIL=0.

## Dependencies / blocks

None. Builds on the delivered `INFOSCHEMATICS-TOOL-126`, which made emphasis reach a Point in both renderers.

## Documentation impact

### Decision Records

None. Authoring an existing capability into an example decides nothing new.

### Specifications

None. `DYNAMIC-003` already requires emphasis to reach a Point; this change only gives it an authored document.

### Guides

The showcase package README's capability table is corrected to four Diagram Dynamics.

### Roadmap

None.

## Review

### Delivered

The showcase now names a Point in a Dynamic: `DYN-SOURCE` "The camera started sending" emphasises `PT-01` as an event and is cued by `SCENE-03` at stage 1. Within boundary: no schema, renderer, emphasis-treatment or Site change, and `scripts/example-capability-coverage.test.ts` is untouched. Planning baseline `9f7d117b91cfd52cbef73c31e3023f338c8bc23f`; delivery started from `974ceddeed2a1fe74dc88cd4889484c89079f31a`, the commit that marked this record ready.

### Change Summary

- `examples/is-showcase/infoschematic.yaml`: `DYN-SOURCE` added after `DYN-STATE`, and a `DYN-SOURCE` cue (`playback: once`, `stage: 1`) added to `SCENE-03` beside `DYN-STATE`.
- `examples/is-showcase/src/infoschematic.ts`: regenerated by `bun run self:examples:generate`.
- `examples/is-showcase/src/index.test.ts`: the Dynamics case expects four, the fourth on `PT-01`; a new case requires the emphasise-elements Dynamics between them to name a Card, a Fabric and a Point.
- `examples/is-showcase/README.md`: Edges row names the emphasised source; Throughout row reads four Diagram Dynamics, three cued by Scenes.
- `scripts/probes/TOOL-142-point-emphasis.ts`: the committed probe for the browser look, so the look can be retaken.
- No deviations from the plan.

### Verification

- `bun run self:examples:verify`: "Generated example exports current: 5".
- `bunx vitest run` in `examples/is-showcase`: 9 passed. With the baseline generated module restored, the two changed cases failed (2 failed, 7 passed) and passed again once it was put back, so the new assertions are not vacuous.
- `bunx vitest run scripts/example-capability-coverage.test.ts scripts/example-drawings.test.ts`: 5 passed.
- `bun run self:check`: 52 of 52 tasks successful, exit 0, including browser suites and the Site build.
- `bunx rumdl check` clean on the touched Markdown; `ki repo audit --skill ki-work-roadmap --repo .` passes.
- Browser look: `bun run self:browser:look -- --name tool-142-point-emphasis --path '/playground/?preset=showcase' --probe scripts/probes/TOOL-142-point-emphasis.ts`, Chromium through Playwright, no page or console error. With `SCENE-03` entered from the Sequences rail and auto-advance held, `DYN-SOURCE` draws a 12-unit amber ring (`rgb(242, 166, 59)`, 3px) round the Camera beside the Fabric's held ring and the Edges Callout. At full motion the 900 ms finite fade was sampled running (717 ms, 833 ms) and then `finished`; seeked to 400 ms it paints at opacity 0.90. Under `prefers-reduced-motion: reduce` it is a still ring at 0.90 throughout. Captures in `reports/tool-142-point-emphasis/`: `full-motion-camera-close-peak.png`, `reduced-motion-scene-03-at-300ms.png`, `reduced-motion-camera-close-400ms.png`, and `look-log.txt`.

### Outstanding concerns

- **Timed Stories spin, and this was pre-existing.** A Scene's authored `duration` is documented in seconds but read as milliseconds, so in the Playground `STORY-01` cycles through its three Scenes about fifteen times a second and restarts every finite emphasis before it can be seen. That is the same at baseline with the unchanged document. The look holds auto-advance to see the Point at all. Captured as [INFOSCHEMATICS-TOOL-150](INFOSCHEMATICS-TOOL-150-seconds-read-as-milliseconds.md) in Triage rather than fixed here, because it is a runtime change outside this boundary. Until it lands, a reader who lets the Story play will not see the Camera's event emphasis in full motion.
- The full-motion peak capture is a frame the browser painted after its own animation was seeked to 400 ms, not one caught in flight, because sampling started after the fade had finished.

### Post-change review

Goal met: Point emphasis is now exercised by an authored document, held by a named test and reachable through the Story in the Playground. Scope held to the example and its README. Regression risk is low. Adding a stage-1 cue changes no geometry, and the drawing review, capability coverage and full gate are green. The concern above is a separate defect that this item surfaced rather than caused. Ready for review.

### Mini recap

Authored `DYN-SOURCE` on the Camera Point into the showcase's edges Scene, tested it, corrected the README and looked at it in Chromium at both motion preferences. The look found that timed Scene durations are read in the wrong unit (TOOL-150). Proposed learning route: none beyond TOOL-150. The finding that a held state hides a spinning Story, while a finite event shows it, is recorded there.

## Done

Accepted 2026-10-04 on the review packet above after an independent Fable review returned ACCEPT: `DYN-SOURCE` emphasises the Camera Point once at the start of the third Scene, the showcase test now requires highlights on a Card, a Fabric and a Point and fails without the new Dynamic, the README matches the document, and generated examples are current. The Scene timing fault found on the way stays out of scope as `INFOSCHEMATICS-TOOL-150`; the ring remains visible meanwhile, in full under reduced motion. Non-blocking note: the committed probe hardcodes its close-up directory rather than deriving it from `--name`. Decided by the Fable reviewer under delegated autonomy (2026-10-04), reversible.

## Discussion

Captured on 2026-09-24 by the agent delivering `INFOSCHEMATICS-TOOL-126`, as a follow-on it deliberately did not fold in.

Relevant context for whoever picks it up: at that moment the Playground could not be used at all, because a concurrently-delivered change had the showcase mid-regeneration and its YAML did not parse. That was transient and is resolved; it is recorded only so the throwaway-page workaround in the `INFOSCHEMATICS-TOOL-126` record is not mistaken for a standing limitation.
