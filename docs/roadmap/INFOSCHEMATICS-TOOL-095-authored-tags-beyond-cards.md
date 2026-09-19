---
id: INFOSCHEMATICS-TOOL-095
area: TOOL
title: Authored tags beyond Cards
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-19T12:14:00Z
updated_at: 2026-09-19T12:14:00Z
---

# Authored tags beyond Cards

## Goal

Let an author say that any element carries its code permanently, not only a Card, and have both outlets agree about it — so a published drawing and the live view show the same codes on the same things.

## Context

Raised by the same user-acceptance pass on 2026-09-19 that produced `INFOSCHEMATICS-TOOL-094`, as the forward-looking half of one report: _"any component can have label or tag turned on all the time… and obviously if there's already one, we don't need to add another one either."_ The second clause is the defect and is `094`. This is the first clause.

Today a permanent code is a Card-only privilege. `appearance.card.identity` is a `CardDetailDefaults` field, resolved by `resolveVisualTreatment` into `ResolvedCardTreatment` and placed by `card-layout.ts` into a Card's top band. An Adapter, a Fabric, a Point and a Region have no equivalent: the only way to see their codes is the viewer's Show tags toggle, which is transient and belongs to the reader rather than the author.

The two outlets also disagree about what a tag is. `render-svg`'s `annotations` option is documented as _"Emit each visible Flow's code chip at the shared annotation placement"_ and its implementation at `index.ts:958` does exactly that — Flows only. The live Diagram's annotation layer covers every placeable. So the same authored diagram, exported and viewed, carries different codes, and the Site specimens — which render with `annotations: true` — show Flow codes and Card identity chips but no component tags at all.

This is a feature with a design question in it, which is why it is separate from `094` rather than folded into it.

## Boundary

This is about who can author a permanent code and whether the outlets agree. It does not change the Show tags toggle's behaviour, the deduplication rule, or the per-kind placement — those are `INFOSCHEMATICS-TOOL-094` and this item consumes their result. It does not introduce free-text labels distinct from codes, per-element overrides of what a code says, or a second annotation vocabulary.

## Shaping

Two decisions come first, and they are the reason this is `draft`.

**Where the switch lives.** `card.identity` sits under `appearance.card`, which is a per-diagram default, not a per-element choice. The reporter said "any component", which reads as a per-element affordance. Those are different schemas: a diagram-wide `appearance.identity` extended to every kind is a one-line generalisation of what exists; a per-element `identity: true` is a new authored field on five element types and a new resolution path. The middle answer — a diagram-wide default that an element may override — is probably what an author actually wants and is the largest of the three.

**What `annotations` means in `render-svg`.** Either it widens to mean every visible element's code, matching the live view, and the option's documentation and every existing caller change meaning under them; or it stays Flows-only and a second, separate concept carries authored permanent codes into the static output. The first makes the outlets agree at the cost of changing an existing option's behaviour; the second keeps the option honest at the cost of two concepts that look alike. The visual-treatment-parity check will need to hold whichever is chosen, and that check is the reason this cannot be settled in one renderer alone.

Known dependency: none in build order. `INFOSCHEMATICS-TOOL-094` introduces a per-placeable resolution of "is this element already drawing its code", which this item would extend rather than invent; taking `094` first is a sequencing preference worth honouring.

Promotion condition: both decisions above answered. They do not share an implementation, and the schema one in particular changes how much of `domain-core`, `view-model` and both renderers this touches.

## Discussion

### Why a code and a label are not the same ask

The report said "label or tag", and those are two things. A code — `CARD-01` — is an identity a reader cross-references against a register. A label — `Ingest` — is what the element is called, and Cards, Fabrics and Regions already draw theirs. The thing that is Card-only and transient-elsewhere is the code, so that is what this item is about. If the reporter meant that some kinds are missing a drawn _name_, that is a different finding and should be raised as one rather than absorbed here.

### What the Site specimens currently show

`DemoFrame` renders with `annotations: true`, so a Rendered specimen carries Flow codes. It also carries Card identity chips, because the showcase authors `card.identity`. A reader comparing a specimen's Rendered and Design modes therefore sees the same thing — the disagreement only appears once a reader turns Show tags on in a live view, which no specimen offers. That is why this surfaced in the playground and not in the docs.
