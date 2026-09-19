---
id: INFOSCHEMATICS-TOOL-095
area: TOOL
title: Authored tags beyond Cards
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: ab3187460c2c018eab4b12c625a03991f162ddd3
created_at: 2026-09-19T12:14:00Z
updated_at: 2026-09-19T13:45:00Z
---

# Authored tags beyond Cards

## Goal

Let an author say that any element carries its code permanently, not only a Card, and have both outlets agree about it — so a published drawing and the live view show the same codes on the same things.

## Context

Raised by the same user-acceptance pass on 2026-09-19 that produced `INFOSCHEMATICS-TOOL-094`, as the forward-looking half of one report: _"any component can have label or tag turned on all the time… and obviously if it already has one, we don't need to add another one either."_ The second clause is the defect and is `094`, which has landed: a reader's tag now takes the place the element already draws its code, and is withheld where the element already carries it. This item is the first clause.

Today a permanent code is a Card-only privilege. `appearance.card.identity` is a `CardDetailDefaults` field, resolved by `resolveVisualTreatment` into `ResolvedCardTreatment` and placed by `card-layout.ts` into a Card's top band. An Adapter, a Fabric, a Point and a Region have no equivalent: the only way to see their codes is the viewer's Show tags toggle, which is transient and belongs to the reader rather than the author.

The two outlets also disagree about what a tag is. `render-svg`'s `annotations` option is documented as _"Emit each visible Flow's code chip at the shared annotation placement"_ and its implementation at `index.ts:958` does exactly that — Flows only. The live Diagram's annotation layer covers every placeable. So the same authored diagram, exported and viewed, carries different codes, and the Site specimens — which render with `annotations: true` — show Flow codes and Card identity chips but no component tags at all.

This is a feature with a design question in it, which is why it is separate from `094` rather than folded into it.

## Boundary

This is about who can author a permanent code and whether the outlets agree. It does not change the Show tags toggle's behaviour or the rule ROUTE-021 states about where a revealed code is drawn — that is `INFOSCHEMATICS-TOOL-094` and this item consumes its result. It does not introduce free-text labels distinct from codes, per-element overrides of what a code says, or a second annotation vocabulary.

## Current state

`appearance.card.identity` was a `CardDetailDefaults` field, resolved by `resolveVisualTreatment` into `ResolvedCardTreatment.identity` and placed by `card-layout.ts` into a Card's top band. No other kind could author a code at all: a Fabric, an Adapter, a Point, a Region and a Flow were reachable only through the live view's Show tags control, which belongs to the reader.

`INFOSCHEMATICS-TOOL-094` landed the per-placeable "is this element already drawing its code" resolution — `cardText` and `selfCoded` in `InfoschematicDiagram.tsx` — and ROUTE-021 states the rule it serves. Placement still lived in the layer that drew the reader's tag, so there was nowhere for a second reason to draw the same code to ask from.

`render-svg`'s `annotations` option drew Flow chips only, while the live annotation layer covered every placeable, so the same document exported and viewed carried different codes.

## Steps

- [x] Add `identity` to the authored contract on Card, Fabric, Point, Region and Flow, and `appearance.identity` as the Diagram-wide default for everything that says nothing, with `appearance.card.identity` left as the narrower statement that answers for a plain Card first.
- [x] Resolve the question in one place — `drawsOwnCode(element, byDefault)` in `view-model/appearance.ts` — so an element's own answer wins and an output override or a responsive reduction acts on the default rather than on the element.
- [x] Move code placement out of the layer that draws the reader's tag into `view-model/code-badge.ts`, which answers for a box corner, a Card's identity slot, an Adapter's rim, a Point's mark and a Flow's route, so both renderers and both reasons take one answer.
- [x] Draw pinned codes in Canvas from that resolution, in their own layer, withheld wherever the annotation layer is already drawing the same code.
- [x] Draw them in `render-svg` from the same resolution, and widen `annotations` to `boolean | { components?, flows? }` so a still can say exactly what a live view beside it is saying.
- [x] Keep every Site caller's appearance unchanged by naming `{ flows: true }` where it previously passed `true`.
- [x] Prove both renderers place a pinned code identically, in `scripts/visual-treatment-parity.test.ts`, on a document with no reader control involved at all.
- [x] Author the capability in the showcase, which the contract-coverage gate requires, and render it with tags off and on to look at the result.

## Files touched

- `packages/domain-model/src/{appearance,artefact,flow,point,region,model,option-catalogue}.ts` — the authored `identity` field and its catalogue entry
- `packages/domain-core/src/{schema,model}.ts`, `packages/domain-core/schema/infoschematic.schema.json` — the contract and the config-to-model bridge
- `packages/view-model/src/{appearance,code-badge,compatibility,runtime}.ts` and `package.json` — `drawsOwnCode`, the new `code-badge` module and its export
- `packages/view-canvas/src/{InfoschematicDiagram.tsx,styles.css}` — the pinned-code layer and its pointer-events rule
- `packages/render-svg/src/index.ts` — the code layer and the widened `annotations` option
- `apps/site/src/{VisualGuide,OverviewAnatomy,HomepageGuideDiagram,StaticInfoschematic.test,visual-guide/DemoFrame}.tsx`, `apps/site/src/visual-guide/curriculum.ts` — `{ flows: true }` callers and the catalogue entry
- `examples/is-showcase/infoschematic.yaml` and its generated export, `scripts/render-example.ts`
- Tests: `packages/view-model/src/{appearance,code-badge}.test.ts`, `packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx`, `packages/render-svg/src/index.test.ts`, `scripts/visual-treatment-parity.test.ts`
- Specifications and guidance: `docs/specs/{appearance,static-rendering,routing-and-placement}.md`, `apps/site/content/{authoring,static-rendering}.md`

## Verify

`bun run self:check`, then `bun run self:examples:render -- showcase --png` and the same with `--annotations`: every pinned code is drawn in the quiet render, and turning the option on adds the codes that were missing without moving or doubling any of them.

## Dependencies / blocks

None. `INFOSCHEMATICS-TOOL-094` landed first and this item consumes its result rather than revisiting it.

## Documentation impact

### Decision Records

None. The precedence this sets — an element's own statement over a Diagram-wide default, and neither disturbed by an output option — is a requirement about resolved treatment, which the Specifications corpus states in the same terms as its neighbours. A decision record would restate APPEAR-018 with less precision and no verification.

### Specifications

`APPEAR-018` added to `docs/specs/appearance.md`: who may pin a code, which statement answers first, and that an output override and a responsive reduction act on the default rather than on the element. `STATIC-006` rewritten in `docs/specs/static-rendering.md` for the widened and selective `annotations` option, including that a pinned code is drawn whether or not the option was given and never twice. `ROUTE-021` extended in `docs/specs/routing-and-placement.md` from the Card chip to every kind that can now carry a code, naming the placement each one takes.

### Guides

`apps/site/content/authoring.md` gains the `identity` field and the per-kind `annotations` selection; `apps/site/content/static-rendering.md` corrects the `annotations` bullet, which described a Flow-only option that no longer exists. Both were prose that would have become untrue rather than new material, so they landed here rather than as a follow-up Site record.

### Roadmap

None raised. The Shaping decisions this record deferred are answered below rather than split out.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `ab3187460c2c018eab4b12c625a03991f162ddd3`.

**Both Shaping decisions were taken here rather than by the user, under the instruction to progress every record that is not waiting-for or parked. Both are open to being pushed back on in the next testing pass.**

**Where the switch lives — the middle answer.** A per-element `identity` field on Card, Fabric, Adapter, Point, Region and Flow, over a Diagram-wide `appearance.identity` default. The reporter said "any component", which the diagram-wide generalisation alone does not give, and the per-element field alone makes an author repeat themselves on every element of a document that wants codes everywhere. `appearance.card.identity` keeps answering for a plain Card ahead of the diagram-wide default, so an existing document that authors Card identity — the parity fixture and the Site showcase both do — does not silently gain Adapter and Fabric codes it never asked for.

**What `annotations` means — widened, but selective.** `boolean | { components?: boolean; flows?: boolean }`, where `true` means every kind the live view's tag control covers. Widening it outright would have made `DemoFrame`'s Rendered half draw component codes beside a Design half that is a live view with its tags off — the two halves disagreeing again, which is what `SITE-030`/`SITE-031` closed. Every Site caller now names `{ flows: true }` and looks exactly as it did. A reader who wants what the live control gives asks for `true`.

### Summary of changes

`drawsOwnCode(element, byDefault)` is the whole resolution: the element's own `identity` if it has one, otherwise the default for its kind. An output `cardDetails` override and `resolveResponsiveCardTreatment` both act on the default that reaches it, so a Card that says it carries its code still draws it in a rendering too small for the authored default.

`view-model/code-badge.ts` answers where. One `CodeBadgePlacement` per element, from five anchors: a free top-right corner, a Card's own identity slot as `resolveCardLayout` resolved it, an Adapter's rim below the Card it holds, a Point's mark stacked clear of its label, and a Flow's along-route position. A Flow keeps the narrower shared minimum width because its chip floats with nothing to sit inside; everything else is read against the element it names.

Canvas draws pinned codes in a new `infoschematic-codes` layer, withheld for anything the annotation layer is already drawing — a Card with a chip, or a Flow whose annotation chip is also the Producer's drag handle. `render-svg` gained a `codeLayer` emitted above the emphasis layer, built from the same resolution, with `data-artefact-id`, `data-artefact-kind` and `data-code` on every entry.

### Verification

`bun run self:check` — 48 tasks, green, including the browser suites.

Both renderers were compared on a document that pins a code to a Fabric, a Point, a Region and a Flow with no option and no control given: `scripts/visual-treatment-parity.test.ts` asserts the same rectangle for each, and asserts the Card that says nothing draws no code while the one that does draws it in its own chip slot.

Looked at rather than only measured, at `tmp/tool-095/showcase-quiet.png` and `tmp/tool-095/showcase-tagged.png`: the quiet render carries `REG-ADAPT`, `FAB-02`, `PT-01`, `FLOW-01` and the authored Card chips and nothing else; the tagged render adds `ADPT-01`, `WRAP-01`, `FAB-01` and the remaining Flows, and no code drawn in the first moved or doubled in the second.

The render-svg selection case asks for `true`, `{ flows: true }`, `{ components: true }` and `false` against one document and asserts what each does and does not draw, so an implementation that ignored the selection fails it in two directions.

### Outstanding concerns

The visual guide's option catalogue now lists the Diagram-wide `identity` option, but the guide offers no interactive control for it — `guideProperties` has `card.identity` and no `canvas.identity`. The catalogue check compares the published list against the contract, which passes, so nothing is wrong; a reader working through the guide simply cannot try this option in the way they can try `surface` or `grid`. Raise it as a Site item if the gap is felt.

The showcase authors `appearance.identity: false` explicitly. It changes nothing — `false` is the default — and exists because the contract-coverage gate requires every declared property to be exercised somewhere. It reads as a deliberate statement of the default beside `card.identity`, which is defensible, but it is there for the gate.

A pinned Flow code and the reader's Flow chip are one chip by construction in Canvas: the annotation layer draws it when tags are on, the pinned layer when they are off. The two are the same rectangle from the same call, but they are two code paths, so a future change to one alone would show as the chip moving when the control is switched. ROUTE-021's verification asks exactly that question.

### Post-change review

The Goal is met: an author can pin a code to any kind, and both outlets draw it in the same place with no control involved. The shape that makes it hold is `code-badge.ts` — placement left the layer that drew one of the two reasons, so neither renderer can drift from the other without changing the shared answer.

The risk carried forward is the widened option's meaning rather than its behaviour. `annotations: true` now means more than it did, and the only callers in this repository were updated with it; an external caller passing `true` gets component codes it did not get before. That is a deliberate widening, stated in `STATIC-006`, and the per-kind form exists so a caller can say the narrower thing.

### Mini recap

A permanent code was a Card-only privilege and the two renderers disagreed about what a tag was. Any element can now say `identity: true`, a Diagram can say it once for everything, and one shared resolution decides both whether a code is drawn and where — so the static renderer, the live view, the author's statement and the reader's control all land on one rectangle. The static `annotations` option widened to match the live control, with a per-kind form so a still beside a live view can keep saying exactly what that view says.

## Done

Delivered 2026-09-19 on the review packet above; the two Shaping decisions were taken without the user and are flagged for the next testing pass.

## Discussion

### Why a code and a label are not the same ask

The report said "label or tag", and those are two things. A code — `CARD-01` — is an identity a reader cross-references against a register. A label — `Ingest` — is what the element is called, and Cards, Fabrics and Regions already draw theirs. The thing that is Card-only and transient-elsewhere is the code, so that is what this item is about. If the reporter meant that some kinds are missing a drawn _name_, that is a different finding and should be raised as one rather than absorbed here.

### What the Site specimens currently show

`DemoFrame` renders with `annotations: true`, so a Rendered specimen carries Flow codes. It also carries Card identity chips, because the showcase authors `card.identity`. A reader comparing a specimen's Rendered and Design modes therefore sees the same thing — the disagreement only appears once a reader turns Show tags on in a live view, which no specimen offers. That is why this surfaced in the playground and not in the docs.
