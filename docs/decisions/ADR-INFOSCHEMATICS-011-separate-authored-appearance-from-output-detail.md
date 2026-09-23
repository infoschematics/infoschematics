---
id: ADR-INFOSCHEMATICS-011
title: Separate authored appearance from output detail
date: 2026-09-03
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-001, ADR-INFOSCHEMATICS-006]
---

# ADR-INFOSCHEMATICS-011: Separate authored appearance from output detail

## Context

An author choosing semantic visual identity is different from a host choosing how much optional detail an output can show. Conflating them would let viewport or presentation policy silently change the meaning of a Diagram.

## Decision

Authored appearance is narrow, typed, and serialisable. Card Collections provide the default semantic identity for their Cards, Flow Families provide it for their Flows, and Fabrics and Regions may carry their identity directly. Architectural Scopes are presentation overlays and do not provide element identity. Individual elements may carry only the deliberate overrides admitted by the canonical model.

Output-detail policy may reduce optional labels, descriptions, codes, or other metadata without mutating authored data, geometry, or semantic identity. Responsive Card detail is explicitly host-owned and opt-in: interactive hosts resolve it from the measured rendered size, while static hosts provide an explicit target size. The framework-neutral resolver applies deterministic thresholds in the order description, identity, then stereotype; explicit detail settings remain an upper bound and essential labels and accessible metadata remain present. Shared measurements and fallback colours are renderer tokens, not arbitrary per-Infoschematic CSS.

Surface composition proceeds from the diagram backdrop to its authored grid, then through Regions in authored order, with each Region's fill behind its frame and label, before the remaining diagram elements. The portable Region vocabulary remains a solid serialisable colour fill, optional solid, dashed, or dotted frame with opacity, corner radius, and label treatment. Gradients, image fills, arbitrary patterns, paint servers, per-side rules, and double frames remain outside the contract until a named authoring and audience need justifies them across renderers.

## Consequences

One authored model retains its intended visual meaning across interactive and static outputs while each output can fit its available space. Responsive detail cannot silently alter existing output because hosts must opt in, and deterministic dimensions give Canvas and static rendering the same decision inputs. Adding an appearance treatment requires a canonical contract, framework-neutral resolution, documented examples, and renderer-parity evidence.

[The visual language design](references/design-visual-language.md) holds the presentation system this separation makes possible — hierarchy, semantic colour, routing and motion as one coherent character rather than a rule per treatment.
