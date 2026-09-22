---
id: ADR-INFOSCHEMATICS-040
title: A checker measures a drawing and never repairs it
date: 2026-09-22
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-018, ADR-INFOSCHEMATICS-021, ADR-INFOSCHEMATICS-036]
---

# ADR-INFOSCHEMATICS-040: A checker measures a drawing and never repairs it

## Context

Validation tells an author whether a document is well formed. It says nothing about whether the drawing that document describes can be read, and the schema cannot: `additionalProperties: false` in sixty-one places refuses an invented property, and accepts two [Cards](../reference/vocabulary.md#standard-card) drawn on top of each other, a [Flow](../reference/vocabulary.md#flow) that runs back across the Card it leaves, and an artefact placed outside the view nobody can scroll to. Every one of those is a valid document and a bad drawing.

The gap matters more now than when the product only had human authors. A person opens the result and sees the problem; a generating model does not see anything. Comparison with a tool that produces acceptable diagrams without any automatic layout showed what closes that gap: the **checker** carries the geometry knowledge, and the model repairs one diagnosed thing at a time. `INFOSCHEMATICS-TOOL-107` depends on this for exactly that reason, and `INFOSCHEMATICS-TOOL-116` will hold author-declared promises with the same machinery.

Three questions had to be answered together. Where the geometry lives, because both renderers, Studio and a command all want the same answer. What a finding has to carry to be repairable rather than merely discouraging. And what a checker is allowed to do about what it finds.

## Decision

A drawing review is a **measurement, reported**. The checker states what is wrong, names the subject, gives the number, lists the repairs that would clear it — and changes nothing.

The geometry lives in View Model, per [ADR-INFOSCHEMATICS-018](ADR-INFOSCHEMATICS-018-keep-the-renderer-command-thin.md), because every measurement involved is already there: ports, routes, label placement and the [Adapter](../reference/vocabulary.md#adapter-card) grip of ADR-INFOSCHEMATICS-036. `infoschematics check` is a thin outlet over it, as `render` is over the static renderer, and stays inert per [ADR-INFOSCHEMATICS-021](ADR-INFOSCHEMATICS-021-keep-command-line-input-inert.md). A second implementation of any rule in a renderer, in Studio or in the command would be the failure this arrangement exists to prevent.

Every finding carries a stable rule code, the authored identities it concerns, the measurement in diagram units, one sentence for a person, and the legal repairs. The rule code is public contract from the moment anything keys off it, so it is specified in [the drawing diagnostics specification](../specs/diagnostics.md) before it is implemented. Findings are ordered by rule and subject, so a repair loop sees a repaired finding leave the list rather than the list reshuffle.

Severity is split, and only one half gates. An **error** says the drawing cannot be read as authored; an **observation** says it is tight or unusual and leaves the judgement with the author. The command exits `1` on an error and `0` on observations alone, because a checker that refuses a merely cramped document is a checker people learn to skip.

Automatic layout is still not a product capability. The checker judges placement; it never chooses it. That is what makes an authoring skill tractable without a solver, and it keeps [PDR-INFOSCHEMATICS-002](PDR-INFOSCHEMATICS-002-a-structured-editor-not-a-drawing-tool.md)'s structured-editor position intact: the author, or the agent acting as one, moves things.

A rule that cannot fire is not admitted. The port audit's `crowded` and `misassigned` severities describe a route whose endpoint has moved away from the port it names, which only an editing host produces — a side offers only ports it has room for at the minimum gap, so no authored pair of distinct ports can be closer. They stay Studio's live audit rather than document rules that would read like coverage and measure nothing.

## Consequences

Authors gain a check they can run before publishing, and a pipeline gains a status it can gate on. The command grows its second verb, so its option table is now per-command rather than one shared list, and the CLI package takes a workspace dependency on View Model, which `CLI-005` names and the dependency-boundary rule now permits.

The rule set is a published contract with a cost attached: a rule that fires on correct authored geometry costs every author who runs the check, so every Infoschematic this repository publishes must report nothing, asserted by a walk that also proves it is still measuring something. That check is `DRAW-012`, and it carries a deliberately broken document for exactly that reason.

What the checker will not do stays as important as what it does. It never writes, never moves an element, and never reports a clean result it did not reach: an unresolved review is a legitimate outcome, and the one outcome nobody can act on is a false claim of success.
