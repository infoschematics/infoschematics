---
id: PDR-INFOSCHEMATICS-001
title: An Infoschematic is an authored definition, not a drawing
date: 2026-09-21
status: current
decision_type: product
decision_type_url: https://knowledgeislands.info/specifications/decision-records/pdr
decision_depends_on: [GDR-INFOSCHEMATICS-001]
---

# PDR-INFOSCHEMATICS-001: An Infoschematic is an authored definition, not a drawing

## Context

The product explains how a system is structured and how things move through it. It is more specific than a generic diagram and broader than a schema, and it needs a name before anything else can be decided about it — the model, the packages, the public API and the copy all want one subject to refer to.

What follows from the name is the harder part. A tool in this space can be built around either of two artefacts. It can produce pictures, in which case the picture is the deliverable and the thing that made it is scaffolding. Or it can hold a definition, in which case the picture is one rendering of something that outlives it. Almost every downstream question — whether the library binds to a UI framework, whether the editor offers free coordinates, what the public copy promises — is really this question asked again in a narrower place.

## Decision

The tool is **Infoschematics** and one complete authored product is **an Infoschematic**. Use `infoschematic` as the naming stem unless a more specific role name is clearer.

**An Infoschematic is an input rather than an output.** There is one canonical definition, and it is embedded wherever it is read — in a document, a website, a build pipeline, or a presentation. Every rendering derives from that single definition rather than being a fresh act of drawing, so adding or changing an outlet does not mean remaking the Infoschematic, and a correction made in the definition reaches every outlet that draws it.

Three things follow, and they are the same decision applied at three depths.

**The library is framework-neutral.** Domain Model owns dependency-free serialisable types; Domain Core owns domain behaviour; View Model owns derived visual and editing calculations. Interactive views and static renderers depend on those layers. Authored Infoschematics and host applications remain independent consumers, and reusable packages never depend on a particular example or host. Binding the model to one UI framework or authored example would make every consumer repeat the same work and would stop parallel renderers sharing a contract — which is to say it would make the rendering the artefact again.

**Studio is a structured editor, not a drawing tool.** It offers choices the model understands: placement respects Infoschematic geography, Flow editing operates through ports and waypoints, visual identity follows authored groupings and renderer contracts, and derived values are changed through their source rather than overwritten. Where the model constrains a value, the editor enforces the constraint during the interaction instead of warning afterwards. Free coordinates, arbitrary colours, unrestricted shapes and manual stacking look like flexibility, but they let the drawing contradict the structure it claims to represent — and a definition that can contradict itself is not one.

**The boundary is drawn at the same line.** Charts, mind maps and unconstrained drawings stay outside the product.

## Consequences

The name provides one subject for the model, documentation, and public API, and packages keep responsibility-based names under `@infoschematics/*`.

React, SVG, and future outputs share one model without importing one another. New reusable behaviour belongs in the lowest layer that can own it; application-specific composition remains outside the library.

Free rotation, arbitrary shapes, per-item font controls, and unconstrained z-order are deliberately absent rather than missing features. A new visual kind requires a named model or renderer concept before Studio can author it. This is slower than sketching but keeps rendered output trustworthy and portable between renderers.

This record is the single review point for the embedding claim. Guide copy such as [the Getting started overview](../../apps/site/content/getting-started.md) cites it rather than arguing the positioning again.
