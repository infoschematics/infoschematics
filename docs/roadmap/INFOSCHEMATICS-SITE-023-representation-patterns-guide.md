---
id: INFOSCHEMATICS-SITE-023
area: SITE
title: Representation patterns guide
theme: site-experience
horizon: now
status: in-progress
blocks: []
blocked_by: []
baseline_ref: b9f001f3c6b9f9a2828d946293fec7af41b8ad7a
created_at: 2026-09-14T01:59:19Z
updated_at: 2026-09-14T01:59:55Z
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

- [ ] Publish a Representation patterns guide that puts architectural explanation first and describes supporting workflow, process, entity, and pipeline views honestly.
- [ ] Explain that imports from BPMN, n8n, or Node-RED would translate source models into a readable Infoschematic rather than make Infoschematics their execution engine.
- [ ] Add a valid editable media-pipeline Playground preset whose Flow Families identify what passes between components.
- [ ] Link the new guide from Overview and place it coherently in documentation navigation.
- [ ] Expand the related-tools reference with focused lessons from React Flow, Rete.js, bpmn-js, ELK, Node-RED, and n8n, including n8n's licensing boundary.
- [ ] Verify routing, source rendering, preset selection, canonical parsing, responsive output, and external-link wording.

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

## Discussion

### Architecture remains primary

Workflow and entity views are useful projections, not a repositioning as a generic flowchart tool. The distinctive value is combining architectural structure with specifications and audience explanation.

### Import is not execution

BPMN XML and workflow JSON can be useful source formats for future adapters. An adapter should preserve stable source identity and useful labels while producing ordinary serialisable Infoschematic data; it should not embed a foreign runtime or claim lossless round-tripping without an explicit contract.

### Editor and layout references

React Flow and Rete.js are useful references for node, Port, connection, and editorial interaction. bpmn-js is the specialist choice for native BPMN modelling. ELK addresses graph layout rather than rendering. Node-RED and n8n demonstrate executable workflows and data mapping, but n8n's editor code is source-available under commercial-use restrictions, so it is inspiration or an integration source rather than a default library dependency.

### Embedded operational explanation

An operational console, including the HNR console, can host an interactive Infoschematic to explain a live system or authored setup. The host owns runtime data, actions, permissions, and persistence; the Infoschematic owns the serialisable explanatory model.
