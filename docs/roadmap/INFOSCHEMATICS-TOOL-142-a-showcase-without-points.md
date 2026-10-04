---
id: INFOSCHEMATICS-TOOL-142
area: TOOL
title: A showcase without Points
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: 9f7d117b91cfd52cbef73c31e3023f338c8bc23f
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-10-04T20:57:00Z
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

- [ ] Add `DYN-SOURCE` to `diagram.dynamics` in `examples/is-showcase/infoschematic.yaml`, after `DYN-STATE`, and cue it from `SCENE-03` at stage 1 with `playback: once`.
- [ ] Regenerate the typed export with `bun run self:examples:generate`.
- [ ] Update `examples/is-showcase/src/index.test.ts` to expect four Dynamics and to assert that the emphasise-elements Dynamics between them name a Card, a Fabric and a Point.
- [ ] Update the capability table in `examples/is-showcase/README.md` to four Diagram Dynamics, three cued by Scenes.
- [ ] Look at the result in a real browser with `bun run self:browser:look`: the Playground's showcase, with `DYN-SOURCE` played, shows the Point's emphasis ring around the Camera; record the capture paths under Review.

## Files touched

- `examples/is-showcase/infoschematic.yaml`
- `examples/is-showcase/src/infoschematic.ts` (generated)
- `examples/is-showcase/src/index.test.ts`
- `examples/is-showcase/README.md`
- A probe under `scripts/probes/` if the look needs to drive the page
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

## Discussion

Captured on 2026-09-24 by the agent delivering `INFOSCHEMATICS-TOOL-126`, as a follow-on it deliberately did not fold in.

Relevant context for whoever picks it up: at that moment the Playground could not be used at all, because a concurrently-delivered change had the showcase mid-regeneration and its YAML did not parse. That was transient and is resolved; it is recorded only so the throwaway-page workaround in the `INFOSCHEMATICS-TOOL-126` record is not mistaken for a standing limitation.
