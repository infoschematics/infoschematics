---
id: ADR-INFOSCHEMATICS-037
title: An authored Overlay is drawn wherever the Diagram is
date: 2026-09-18
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-035]
---

# ADR-INFOSCHEMATICS-037: An authored Overlay is drawn wherever the Diagram is

## Context

An [Overlay](../reference/vocabulary.md#overlay) is authorable — `diagram.overlays` is in the schema and reaches the runtime — and until this decision neither outlet drew one from an authored document.

Both outlets scoped a Graphic to a [Scene](../reference/vocabulary.md#scene). The static renderer defaulted `visibility.graphics` to `'scene'` and resolved the visible set from the selected Scene's `graphic`; the interactive Diagram drew `config.diagram.overlays` only while editing and otherwise drew the Scene's Graphic alone. [Present](../reference/vocabulary.md#present) passes that one Graphic down.

The scoping was unreachable from authored data. `sceneShape` is a `strictObject` with no `graphic` key, so `SequenceScene.graphic` can only be set by a host constructing a model in code. An authored Scene therefore names no Graphic, the scene-scoped set is always empty for an authored document, and `infoschematics render` — which passes no options at all — could never emit one. The declaration was authorable, validated, counted by the coverage check, and in no picture.

`INFOSCHEMATICS-TOOL-090` sharpened it: the product now offers a standard `annotation` treatment both renderers draw, and `OVL-01` in `examples/is-showcase/` names it. What went undrawn was a treatment the product supplies.

## Decision

**An authored Overlay is diagram-scoped and drawn wherever the Diagram is drawn. A Scene's own Graphic adds to that set rather than replacing it, and scene scoping is an option a caller asks for rather than the default.**

An authored element that only one editing mode draws is not a declaration, and the other candidate shapes each left a document unable to show its Overlay somewhere an audience looks: a new Scene key would have left an unscened document's Overlay undrawn, and a command-line flag would have done nothing for Present.

Reversing the static default breaks no authored document, because no authored document could reach the old default. `'scene'` stays available for a host that constructs a model in code and wants the scene-scoped set, and `'none'` is unchanged. In Canvas the two sets are unioned and deduplicated by id, because a Scene naming an authored Overlay means that same Overlay and not a second copy of it.

Present is unchanged. It keeps passing the active Sequence Scene's Graphic, and the declaration reaches the audience because Canvas draws it — which is the test of this shape: the outlet that shows an Infoschematic to a reader needed no new wiring for an authored Overlay to appear in it.

## Consequences

`STATIC-019` and `DIAGRAM-011` state the rule where an author reads it, and `scripts/visual-treatment-parity.test.ts` holds both renderers to an Overlay authored in a document with no Scene and no options — the case that was previously drawn by handing Canvas a Graphic and asking the static renderer for `'all'`.

A document that authors a decorative Overlay now sees it in every outlet, including a still rendering it may not have expected to carry one. That is the intended reading of an authored declaration, and the Design workspace is no longer the place a reader goes to find out what a document says.

Scene scoping is now the exception rather than the default, so a host that relied on `renderInfoschematicSvg`'s old behaviour must pass `visibility: { graphics: 'scene' }` to keep it. No authored document and no repository caller did.
