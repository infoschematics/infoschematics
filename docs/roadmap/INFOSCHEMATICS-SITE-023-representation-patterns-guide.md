---
id: INFOSCHEMATICS-SITE-023
area: SITE
title: Representation patterns guide
theme: site-experience
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: b9f001f3c6b9f9a2828d946293fec7af41b8ad7a
created_at: 2026-09-14T01:59:19Z
updated_at: 2026-09-14T02:13:09Z
---

# Representation patterns guide

## Goal

Explain which kinds of diagrams Infoschematics can represent without weakening its architectural purpose, and give readers a concrete media-pipeline example they can inspect and edit.

## Context

Components, interfaces, specifications, and interactions remain the centre of Infoschematics. The same Cards, Ports, Fabrics, and Flows can also provide useful simplified workflow, process, entity-relationship, and data-pipeline views, but the Site does not yet explain those adjacent uses or where a specialist modelling tool remains the better choice.

## Boundary

This item changes Site guidance and curated Playground material only. It does not add workflow execution, BPMN semantics, entity cardinality, automatic layout, importer implementations, runtime control, or reusable package behaviour.

## Current state

The Overview describes outputs and editing modes but not the range of representations. The Playground has generic source-to-sink and product-overview presets but no architectural media-flow example. The related-tools reference covers architecture and diagramming products without distinguishing node-editor libraries, process modelers, layout engines, and executable workflow products.

## Steps

- [x] Publish a Representation patterns guide that puts architectural explanation first and describes supporting workflow, process, entity, and pipeline views honestly.
- [x] Explain that imports from BPMN, n8n, or Node-RED would translate source models into a readable Infoschematic rather than make Infoschematics their execution engine.
- [x] Add a valid editable media-pipeline Playground preset whose Flow Families identify what passes between components.
- [x] Link the new guide from Overview and place it coherently in documentation navigation.
- [x] Expand the related-tools reference with focused lessons from React Flow, Svelte Flow, Comgy, Rete.js, bpmn-js, ELK, Node-RED, and n8n, including n8n's licensing boundary.
- [x] Verify routing, source rendering, preset selection, canonical parsing, responsive output, and external-link wording.

## Files touched

- `apps/site/content/`
- `apps/site/src/routes.ts`
- `apps/site/src/DocumentPage.tsx`
- `apps/site/src/Playground.tsx`
- `apps/site/src/Playground.test.tsx`
- `apps/site/src/App.test.tsx`
- `apps/site/src/playground/seeds/`
- `docs/reference/related-tools.md`

## Verify

Run focused Site tests and `bun run self:check`. Inspect the guide and media-pipeline preset at desktop and 390-pixel widths, confirm the preset parses and renders without stale output, and confirm there are no console errors or horizontal overflow.

## Dependencies / blocks

None for the Site guidance and authored preset. Actual import adapters, additional notation, automatic layout, and operational control require separately shaped non-website work.

## Documentation impact

### Decision Records

No decision record is needed because the guide applies the existing structured-editor, host-ownership, and Site-outlet boundaries.

### Specifications

No behaviour-level contract changes. The preset uses only current canonical model fields and the guide labels unsupported semantics explicitly.

### Guides

Add a Site-owned Representation patterns page and connect it from Overview.

### Roadmap

Keep importer, layout, notation, and runtime-control implementation outside this Site item for the non-website workstream to shape independently.

## Review

### Delivered

Implementation commits `b312adf372d7e9db78aef6ca90468cb6de83393c` and `e47f2ae54bd64431190ab9154576374c88b531a8` deliver the Representation patterns guide, its navigation and Overview pathway, the editable live-media pipeline preset, and the expanded related-tools inspiration reference, including visual lessons from the supplied n8n example.

### Summary of changes

The guide keeps architecture at the centre while describing dashboard topology, supporting workflow and entity views, media pipelines, source-model translation, and operational-console embedding. The Playground preset demonstrates typed media Flows between five components. React Flow, Svelte Flow, Comgy, Rete.js, bpmn-js, ELK, Node-RED, and n8n are recorded with their relevant lessons and boundaries.

### Verification

Focused App, DocumentPage, and Playground tests passed. Site TypeScript checking and `bun run self:check` passed with 587 unit tests and three browser tests. The guide was inspected at desktop and 390-pixel widths, and the media preset was inspected in the running Playground with no parse issues, console errors, stale output, or horizontal overflow. The roadmap audit reached unrelated `INFOSCHEMATICS-TOOL-*` candidate-field and harness-catalogue failures owned by the concurrent non-website workstream; this Site item introduced no roadmap-audit finding.

### Outstanding concerns

Import adapters, automatic layout, richer process or entity notation, live-data bindings, and runtime control remain deliberately outside this Site-owned item and need separately shaped package work.

### Post-change review

The page follows the existing documentation shell on desktop and mobile. The dashboard example is represented as a stable architectural topology with host-supplied operational overlays, avoiding any implication that an Infoschematic becomes the source system or workflow engine.

### Mini recap

Baseline `b9f001f3c6b9f9a2828d946293fec7af41b8ad7a`; result `e47f2ae54bd64431190ab9154576374c88b531a8`. The Site now explains the broader representation space and provides a concrete editable example without expanding the domain contract.

## Discussion

### Architecture remains primary

Workflow and entity views are useful projections, not a repositioning as a generic flowchart tool. The distinctive value is combining architectural structure with specifications and audience explanation.

### Import is not execution

BPMN XML and workflow JSON can be useful source formats for future adapters. An adapter should preserve stable source identity and useful labels while producing ordinary serialisable Infoschematic data; it should not embed a foreign runtime or claim lossless round-tripping without an explicit contract.

### Editor and layout references

React Flow, Svelte Flow, and Rete.js are useful references for node, Port, connection, and editorial interaction. Comgy's Svelte Flow implementation is a particularly relevant example because it places live energy measures over a stable topology. React Flow's workflow template and showcase provide comparable workflow, pipeline, entity, media, and automation examples. bpmn-js is the specialist choice for native BPMN modelling. ELK addresses graph layout rather than rendering. Node-RED and n8n demonstrate executable workflows and data mapping, but n8n's editor code is source-available under commercial-use restrictions, so it is inspiration or an integration source rather than a default library dependency.

### Dashboard topology

The supplied deployed-architecture dashboard is a strong pattern for an Infoschematic view: nested deployment boundaries, compact resource Cards, external dependencies, and cross-boundary Flows form the stable topology, while measures such as traffic, capacity, cost, health, or risk can be supplied by the host as a selected Scene or live overlay.

### Embedded operational explanation

An operational console, including an HR or service-management console, can host an interactive Infoschematic to explain a live system or authored setup. The host owns runtime data, actions, permissions, and persistence; the Infoschematic owns the serialisable explanatory model.
