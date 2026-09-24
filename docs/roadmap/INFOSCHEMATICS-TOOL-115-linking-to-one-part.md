---
id: INFOSCHEMATICS-TOOL-115
area: TOOL
title: Linking to one part
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 8dd156a960b7948e203c0e9e442f5926125257fe
created_at: 2026-09-21T19:30:00Z
updated_at: 2026-09-24T23:46:50Z
---

# Linking to one part

## Goal

Surrounding prose can point at one part of an embedded [Infoschematic](../reference/vocabulary.md#infoschematic) — an artefact or a Scope — so a sentence about a component takes the reader to it.

## Context

[PDR-INFOSCHEMATICS-001](../decisions/PDR-INFOSCHEMATICS-001-an-infoschematic-is-an-authored-definition-not-a-drawing.md) positions an Infoschematic as an input embedded where it is read, and [the Getting started guide](../../apps/site/content/getting-started.md) now says so. Nothing delivers the capability that positioning implies: an embedded Diagram is reached as a whole, and a document that wants to discuss one part of it has to describe where to look.

The identities needed already exist and are stable by design. `ADR-INFOSCHEMATICS-003` authors human-readable identity codes rather than deriving them from order, so an artefact can be named durably from outside; Scopes and Scenes are named in the document too. The Canvas can already centre on a coordinate (`packages/view-canvas/src/viewport.ts`), and Present already selects a Scene, so the mechanics of arriving somewhere exist.

What is undecided is the seam. `ADR-INFOSCHEMATICS-005` gives the host routing, page metadata, and URL ownership, so a deep link cannot be a package concern without contradicting it, and a Diagram that reads `window.location` itself would be the same contradiction in a different place.

## Boundary

A decision item about addressing, not about navigation chrome. It does not add a model concept, and it does not move routing into any package: whatever lands has to be a host-driven selection the Diagram accepts, consistent with `ADR-INFOSCHEMATICS-005`.

It does not cover editing, linking into Studio state, or linking to a Dynamic occurrence, which `ADR-INFOSCHEMATICS-012` keeps transient.

## Current state

An embedded Diagram is reached as a whole. `packages/view-canvas/src/viewport.ts` can centre on a diagram coordinate, `ADR-INFOSCHEMATICS-025` already models one ordered selection with an anchor, and Present already focuses a Scene — so arriving somewhere is mechanically solved in three places and addressable from none of them.

The identities are stable by design: `ADR-INFOSCHEMATICS-003` authors human-readable codes rather than deriving them from order, and Scopes and Scenes are named in the document.

The constraint is ownership. `ADR-INFOSCHEMATICS-005` gives the host routing, page metadata and URL, so a Diagram that read `window.location` itself would contradict it. Whatever lands is therefore a resolved input the host supplies, exactly as `INFOSCHEMATICS-TOOL-117` resolves a colour scheme.

## Steps

- [x] Take the decision and record it: what is addressable, what arriving means, and that the host owns the address while the Diagram takes a resolved destination.
- [x] Define the destination in the View Model over authored identity — an artefact code or a Scope id — and resolve it to a viewport and a selection without reading any browser state.
- [x] Accept the destination as a Diagram input, centring the viewport and selecting the named part, and leave authored Dynamics untouched: arrival is not an emphasis.
- [x] Make an unresolvable destination a quiet no-op with a reported reason rather than a thrown error, because an address in someone else's prose outlives the document it points into.
- [x] Announce arrival to an assistive reader, per `ADR-INFOSCHEMATICS-029`.
- [x] State plainly what a static outlet does: an SVG cannot navigate, so the deterministic renderer either frames the named part or says it does not honour a destination.
- [x] Show the mechanism working from a host in the website, since the claim is that surrounding prose can point into a drawing.

## Files touched

`packages/view-model` for destination resolution and its test; `packages/view-canvas` for the input and the arrival behaviour; `apps/site` for the host that demonstrates it; `docs/specs/` for the requirements; a new Decision Record.

## Verify

`bun run self:check`. Destination resolution is unit-tested over an artefact code, a Scope id, and an identity that does not resolve.

Arrival is proved in a browser: the viewport centres on the named part, the selection is what was addressed, and no Dynamic starts. The unresolvable case asserts that the Diagram still mounts and still draws.

## Dependencies / blocks

Nothing blocks it. It is independent of [INFOSCHEMATICS-TOOL-114](INFOSCHEMATICS-TOOL-114-detail-follows-magnification.md), which deliberately leaves named views here.

## Documentation impact

### Decision Records

A new record deciding that a destination is authored identity resolved by the host and accepted by the Diagram, that arriving is centring and selecting rather than emphasising, and that an unresolvable destination is not an error.

### Specifications

`docs/specs/runtime-model.md` or `docs/specs/diagram-elements.md` states the destination input and its resolution; `docs/specs/static-rendering.md` states what a still outlet does with one.

### Guides

The React integration guide shows a host turning a URL into a destination; the consumer guide shows prose pointing at one part of an embedded diagram.

### Roadmap

Nothing follows necessarily. Linking into Studio state and into a Dynamic occurrence stay out, the latter because `ADR-INFOSCHEMATICS-012` keeps an occurrence transient.

## Review

### Delivered

Prose can now point at one part of an embedded Infoschematic. A host reads its own address — `?artefact=STORE`, `?scope=edge`, a fragment, a path segment, whatever grammar it already owns — and hands the Diagram an authored identity. The Diagram resolves that identity against its own runtime, centres the viewport on what it names, and selects it. Nothing else moves: no magnification, no emphasis, no authored Dynamic started, nothing written back to the document.

The boundary held exactly as `ADR-INFOSCHEMATICS-005` requires. No package reads `window.location`; what crosses is a value, not a route. Resolution is a pure function in View Model over a runtime, so a host, a test or a future outlet can ask where an address leads without mounting anything.

Two decisions the item left open were taken and recorded in `ADR-INFOSCHEMATICS-041`. Arriving does not magnify, because `ADR-INFOSCHEMATICS-039` makes the detail band a pure function of rendered scale — zooming to a part would silently change how much every element in the drawing reveals, and an address in someone else's sentence must not be able to edit the document's voice. And Graphics are not addressable, because a Graphic may carry no bounds and then covers the whole drawing, leaving nothing particular to arrive at. Scenes stayed out for the reason the item's Adoption note already gave.

The failure case is the one that mattered most. An address written into prose outlives the document it points into, so an unresolvable destination is a quiet no-op: the Diagram still mounts, still draws the whole document, selects nothing, says nothing to the reader, and reports the named reason to the host through `onDestination`. The only party who can act on a broken link is the one who wrote it.

The coordinator's decision about stills is recorded in `STATIC-022` and in the Static rendering guide: a still ignores a destination and renders the whole document, because an SVG has no viewport a reader controls and a pre-framed crop would make one definition produce different pictures depending on an address the picture cannot show.

### Change Summary

- `packages/view-model/src/destination.ts` — new. `resolveDestination` maps an `InfoschematicDestination` (an artefact code or a Scope id) over a `DestinationDocument` projection of the runtime to either a resolution carrying extent, centre, label and an anchor-first `ArtefactSelectionSet`, or a refusal carrying one of `unknown-artefact`, `unknown-scope`, `empty-scope`, `unplaced-artefact` and a sentence explaining it. `artefactDestination` and `scopeDestination` spell an address; `arrivalAnnouncement` supplies the sentence the live region speaks. The addressable index is built from Regions, Fabrics, Cards, Points and Flows; a Scope resolves to the union extent of its placed members.
- `packages/view-model/src/destination.test.ts` — new. An artefact code, a Region by id, a Flow by code, a Point by its own coordinate, a Scope union and its ordered selection, the announcement sentences, both unknown refusals, the hollow Scope, the unplaced artefact, determinism over repeated calls, and exact-case comparison — a near miss refuses rather than guessing.
- `packages/view-model/package.json` — a `./destination` export subpath. This package has no `src/index.ts`; every module is exported individually, so this is the equivalent of exporting from a barrel, and it follows how `./detail` was added in `acbf5ea3`.
- `packages/view-canvas/src/InfoschematicDiagram.tsx` — accepts `destination` and `onDestination`. Resolution is memoised on a string key derived from the address by value, so an inline object literal does not re-resolve or re-announce on every render. An arrival centres the viewport through the existing `centerViewportAt` and holds an arrival selection that stands in only where the host supplies none; `selectArtefact` and `clearSelection` drop it, so it behaves like an opening selection rather than a latch. A second live region, tagged `data-arrival-announcement`, carries the arrival sentence with a revision prefix.
- `packages/view-canvas/src/index.ts` — re-exports the destination vocabulary, so a host that already depends on View Canvas does not have to add View Model to spell an address.
- `packages/view-canvas/src/InfoschematicDiagram.destination.test.tsx` — new node suite: server-rendered markup is byte-identical with and without an address, resolvable or not; the arrival region mounts empty; no address throws.
- `packages/view-canvas/src/InfoschematicDiagram.destination.browser.test.tsx` — new browser suite, eight cases in Chromium: arrival selects and announces; a Scope arrival holds the anchor with the rest group-held; arriving starts no Dynamic, with a capability assertion proving the same Dynamic does emphasise when it actually occurs; a magnified reader is recentred while magnification is preserved; arriving at fit moves nothing; an unresolvable address still draws, selects nothing, announces nothing and reports its reason; a second address is a second arrival.
- `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx` — four positional `[role="status"]` selectors gained `:not([data-arrival-announcement])`, because the new live region shifted their indices. No assertion changed meaning.
- `apps/site/src/destination-specimen.ts` — new. A small authored document with Regions, Cards, a Point, Flows, two Architectural Scopes and one authored Dynamic over `STORE`, so a reader can see for themselves that arriving does not start it.
- `apps/site/src/DestinationDemo.tsx` — new. `destinationFromSearch` turns this site's own query string into an authored identity and nothing more; the demo offers four live addresses and one deliberately broken one, and reports what the Diagram said back.
- `apps/site/src/ReactIntegrationPage.tsx`, `apps/site/src/DestinationDemo.test.tsx`, `apps/site/src/routes.ts`, `apps/site/src/main.tsx`, `apps/site/src/styles.css` — the guide route now renders the demo beneath its prose, as the Overview page renders its anatomy.
- `apps/site/content/react-integration.md` — a `Link to one part` section: the host-side code, what is addressable and what is not, what arriving does and does not do, the quiet no-op, the single Diagram-owned announcement, and a pointer to the live demonstration and to the static rendering guide.
- `apps/site/content/static-rendering.md` — a still ignores a destination and draws the whole document; cropping is the caller's decision.
- `docs/specs/runtime-model.md` — `RUNTIME-008` states the resolution contract: total, anchor-first, union extent for a Scope, reading no browser state.
- `docs/specs/diagram-elements.md` — `DIAGRAM-012` states what an address may name, and why Graphics and Scenes are excluded.
- `docs/specs/static-rendering.md` — `STATIC-022` states that a still ignores a destination.
- `docs/decisions/ADR-INFOSCHEMATICS-041-a-link-names-a-part-and-arriving-centres-and-selects-it.md` — new, unindexed by instruction.

### Verification

- `bunx turbo run typecheck test --filter=@infoschematics/view-model --filter=@infoschematics/view-canvas --filter=@infoschematics/site --force` — `Tasks: 15 successful, 15 total`. View Model 20 files, 259 tests passed; View Canvas 15 files, 108 tests passed; Site 12 files, 159 tests passed.
- `bun run test:browser` in `packages/view-canvas` — 8 test files, 57 tests, all passed, in Chromium under Playwright.
- `bunx vitest run --root . scripts/specification-evidence.test.ts scripts/vocabulary-citations.test.ts scripts/vocabulary-terms.test.ts` — 3 files, 10 tests passed, over the three new requirements and their vocabulary citations.
- `bun run ki:lint:md` — `Success: No issues found in 121 files`. It first found five broken vocabulary fragments in the new prose: the anchor for an Architectural Scope is `#scope`, not `#architectural-scope`, and there is no `#card` anchor at all. Fixed, then clean.
- `bunx biome check --write` over the files this change touches — 6 files reformatted, then clean apart from one `suppressions/unused` warning at `packages/view-canvas/src/InfoschematicDiagram.tsx:2664`, which is pre-existing and was already recorded by `INFOSCHEMATICS-TOOL-114`.
- Not run, by instruction: `bun run self:check`, which is repo-wide and would measure another writer's half-finished work rather than this change.

The look was taken with `bun run self:browser:look -- --name destination-artefact --path "/docs/react-integration/?artefact=STORE" --probe reports/TOOL-115-destination-probe.ts`, driving the page through five states. `apps/site` resolves `@infoschematics/*` through `exports` to `dist`, so `bunx turbo run build` for View Model and View Canvas came first; without it the browser shows the old Diagram and the look reads as a defect that is not one.

What the captures in `reports/destination-artefact/` actually showed. Arriving at `STORE` with the whole document in view: the drawing is unchanged — Client, Intake and Store on the blueprint surface, both Cards in their collection's blue with code chips and descriptions, no emphasis anywhere, the Dynamic the document declares over `STORE` plainly not running — and the host's caption reads `Arrived at Store, holding one element.` The `viewBox` is `0 0 760 320` before and after, which is the honest outcome recorded in `ADR-INFOSCHEMATICS-041`: there is nothing to centre when everything is already in frame.

Magnified three steps and then addressed, the movement is unmistakable. At `?artefact=CLIENT` the `viewBox` is `0 78.08 389.12 163.84` and the capture shows Client at the left with Intake running off the right edge; pressing `?artefact=STORE` moves it to `365.44 78.08 389.12 163.84` — same width and height, so the magnification the reader chose is preserved — and the capture shows Store centred with Intake now clipped at the left, the minimap thumbnail in the corner showing the viewport rectangle slid to the right. Addressing the `edge` Scope lands at `40.44 78.08 389.12 163.84`, the centre of the union of Client and Intake, with `CLIENT` selected and `INTAKE` group-held.

The stale address is the one worth looking at twice. Pressing `?artefact=GONE-01` leaves the `viewBox` byte-for-byte where the previous arrival put it, leaves the previous selection alone, leaves the arrival announcement reading `Destination 4` rather than announcing a fifth, still draws both Cards and every Flow, and reports `Nothing here answers to that address (unknown-artefact). The document is drawn in full.` to the host alone.

Two defects were found by looking rather than by the suites, both now fixed. The demonstration's Cards had no `collection`, so they drew as grey dashed ghosts with dark-on-dark labels while every gate stayed green. And the demo's heading reused the slug of the Markdown heading above it, which React reported as a duplicate key and which would have put two elements with the same `id` on one page; the demo section is now `Try an address`.

### Outstanding concerns

- **A selection is not painted in a Diagram that is not editing.** The `.selected` and `.group-held` treatments in `packages/view-canvas/src/styles.css` are gated behind `.infoschematic-svg.editing`, so an arrival's selection is in the DOM, announced to an assistive reader and reported to the host, but a sighted reader of a read-only Canvas sees no visible mark on the part they were sent to. Everything this item claims is true; half of it is invisible. Changing that treatment affects every read-only host, not just an arrival, so it is a visual-language decision rather than a detail of this delivery: it belongs to whoever owns View Canvas's visual treatment, as its own record.
- **Centring is a no-op while the whole document is in view.** Deliberate and recorded, but it means a host demonstrating this on a document that fits its frame sees only the selection change. A host that wants framing must magnify on its own behalf first, and there is no API here that does it for them.
- **Arriving does not frame or zoom at all.** Recorded in `ADR-INFOSCHEMATICS-041` with its reason. If a later reader study says an arrival should magnify, it has to argue with `ADR-INFOSCHEMATICS-039` first, because the detail band moves with the scale.
- **Graphics are unaddressable and say so nowhere a reader will look.** `DIAGRAM-012` and the React integration guide state it; the Graphics component page does not. A sentence there would save someone trying it.
- **`packages/view-model/package.json` was edited** to add the `./destination` export subpath. That is a shared manifest rather than one of the source files named in the boundary, and it is flagged for the same reason `INFOSCHEMATICS-TOOL-114` flagged it: this package has no barrel to export from.
- **`reports/TOOL-115-destination-probe.ts`** was written to drive the look. It lives under the ignored `reports/` directory with its own re-run instruction in a comment, rather than in `apps/site`.
- **The changes are uncommitted by instruction.** The coordinator commits them, and owns the `ADR-INFOSCHEMATICS-041` entry in `docs/decisions/README.md`, which this delivery deliberately did not write.

### Post-change review

The goal is met and the boundary held. A sentence can point at a part, the host owns the address, no routing moved into a package, no model concept was added, and no authored document changed.

The part most likely to be wrong later is the arrival selection standing in for a host selection. It is deliberately weak — it yields to any host-held selection and is dropped by the reader's next press — but a host that holds selection state and initialises it to `null` will find the arrival's selection reported through its own `onSelect` path only after the reader acts, not on arrival. That asymmetry is defensible and documented, and it would be the first thing to revisit if a host finds it surprising.

The second is the string key that memoises resolution. It is derived from the address by value, which is what makes an inline `artefactDestination('X')` safe to pass. If the addressable set ever grows a kind whose identity is not a single string, that key has to grow with it or an address will silently fail to re-resolve.

What the suites could not have caught, the look did: two defects were sitting under a fully green run, one of which put a duplicate `id` on the page. The item's insistence on a browser proof earned its place twice over.

### Mini recap

An address is an authored identity — an artefact code or a Scope id — that a host spells and the Diagram resolves. Arriving centres the viewport and selects the named part, and does nothing else: no magnification, no emphasis, no authored Dynamic disturbed. An address that no longer resolves is a quiet no-op with a reason reported to the host, because a link in someone else's prose outlives the document it points into. A still ignores a destination and draws the whole document.

## Discussion

Captured on 2026-09-21 as the capability the positioning work implies but nothing provides.

Questions worth putting side by side when this is shaped:

- **What is addressable.** An artefact, a Scope, and a Scene are three different kinds of destination; the smallest useful version may be Scopes only.
- **What arriving means.** Centring the viewport, selecting the artefact, and emphasising it are separable, and an emphasis on arrival risks colliding with authored Dynamics.
- **Who owns the address.** A host-supplied selection keeps the ownership rule intact and makes the same mechanism serve a documentation anchor, a query parameter, and a presenter's cue.
- **What a static outlet does with it.** An SVG in a document cannot navigate, so the deterministic renderer would either honour the same selection as a framed output or say plainly that it does not.

### Adoption

Adopted for immediate work on 2026-09-21. Scenes are dropped from the addressable set for a first delivery: Present already selects a Scene by its own route, so an artefact code and a Scope id are what surrounding prose actually lacks.
