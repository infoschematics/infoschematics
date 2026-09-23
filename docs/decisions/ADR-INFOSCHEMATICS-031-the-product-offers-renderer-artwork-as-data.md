---
id: ADR-INFOSCHEMATICS-031
title: The product offers renderer artwork as data
date: 2026-09-17
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-009]
---

# ADR-INFOSCHEMATICS-031: The product offers renderer artwork as data

## Context

[ADR-INFOSCHEMATICS-009](ADR-INFOSCHEMATICS-009-host-provided-versioned-renderers.md) settled how a document asks for a visual treatment: a stable key and a positive schema version, resolved against an immutable registry the host supplies. It answered the ownership question and left a supply question unasked, and the answer the code gave was "nobody". The product shipped no named [Fabric](../reference/vocabulary.md#fabric) or [Overlay](../reference/vocabulary.md#overlay) treatment at all — one generic plane, one dashed placeholder — so every named `kind` in every document drew a fallback until a host wrote a component for it.

Authoring `examples/is-showcase/` is where that became visible. Its `message-bus`, `object-store` and `annotation` all drew as fallbacks in a document whose purpose is to show what the product can do, and the only real Fabric artwork in existence lived in one exhibit repository, as React components baked to that document's absolute coordinates with a host stylesheet for paint. The product could describe a treatment and could not offer one.

Two things stood in the way of simply moving that artwork here. It was written as components, and `render-svg` emits strings — a catalogue only the interactive view could draw would repeat exactly the defect `INFOSCHEMATICS-TOOL-088` and `-089` already record, where a treatment reaches one outlet and quietly never reaches the other. And a product-owned catalogue reads, on a fast reading of `EXTEND-007`, like the thing that requirement forbids: reusable packages must not import a host's particular realisation.

## Decision

**The product offers a standard catalogue of named treatments it does not impose, and states each one as serialisable artwork data rather than as a component, so every outlet draws the same piece from one description.**

The catalogue is an offer, not a default and not an override. Resolution consults the host collection first and reaches the catalogue only where the host answers nothing, so a host registration under a standard key wins without the catalogue needing to know the host exists. Resolving to the catalogue reports no diagnostic, because nothing is wrong; a standard key asked for at a version the catalogue does not state reports an unsupported version rather than an unknown key, because an author told the key is unknown goes hunting for a registration that was never the problem. This extends `ADR-INFOSCHEMATICS-009` rather than reversing it: the registry stays immutable and host-owned, keys stay versioned, and unresolved requests still fall back accessibly.

Artwork is data for the same reason authored Infoschematics are. A piece is geometry plus **paint roles** — `shell`, `grid`, `accent`, `title`, `detail` and the rest — drawn in its own bounds and nothing else, with the `defs` it needs declared as named resources rather than emitted. Each renderer walks that one description in its own idiom: the interactive view into React elements, the static renderer into SVG strings, each resolving paint through `visualTokens` for its own outlet and naming resources in its own id space. That mirrors what `resolveCardLayout` and `resolvePointLabel` already do for Card and Point internals, which is why the catalogue lives in View Model beside them rather than in a new package or in either renderer.

Naming is the product's, not any exhibit's. The keys are generic — `internet-cloud`, `message-bus`, `object-store`, `telemetry-plane`, `mobile-network`, `satellite-link`, `cycle`, `gap-marker`, `annotation` — because a treatment a document can ask for by name is part of the public surface, and a name carried over from the first document to want it would tie the product's vocabulary to that document.

## Consequences

A document can name a treatment and get one, in the Playground and in `infoschematics render` alike, with no host code. Hosts keep everything `ADR-INFOSCHEMATICS-009` gave them, and a host with its own house style overrides a standard key by registering it, which is the unchanged path rather than a new one.

Two walks of one description can still diverge, and nothing but a check that compares them says otherwise, so `scripts/visual-treatment-parity.test.ts` walks every standard key in both renderings and compares the drawing piece by piece. Each piece marks itself with the key it drew so the comparison is one piece against its counterpart rather than two whole pages.

The catalogue is now a public surface with the obligations of one. A key is as stable as any other renderer key, its properties go through a real validator, and changing what a piece draws is a visual change to every document that names it — `EXTEND-002`'s versioning is the instrument for a change that is not compatible.

Paint deliberately differs between outlets and geometry deliberately does not. The interactive palette is for a dark canvas and the static one for paper, so a parity check that compared colours across renderers would be asserting a defect; what it compares is geometry, shapes and drawn text, with each rendering's `url(#…)` references closed within itself.

A passing comparison is still not evidence the artwork looks right. Five real defects in these nine pieces — captions struck through by the rails behind them, a mesh reading as a sparkline, ties ending in open space — were found only by rendering the pieces and looking at them, with the suite green throughout. That is the rule AGENTS.md already states, and this catalogue is the case it was written for.

`INFOSCHEMATICS-TOOL-089` bounds the offer: an authored Overlay is not drawn outside the Design workspace, so a standard `annotation` reaches a static rendering and the interactive view only as a scene's own graphic until that is fixed. The limitation is stated where authors meet it rather than worked around here.
