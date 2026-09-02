---
id: ADR-INFOSCHEMATICS-006
title: Additive views and parallel renderers
date: 2026-09-02
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-004, ADR-INFOSCHEMATICS-005]
---

# ADR-INFOSCHEMATICS-006: Additive views and parallel renderers

## Context

Consumers need different subsets of the product: a reusable interactive canvas, Audience presentation controls, Producer editing, and deterministic static output. One large React application forces every consumer to take every capability and makes non-React rendering an afterthought.

## Decision

Interactive views are additive:

```text
@infoschematics/view-canvas
        ↓
@infoschematics/view-present
        ↓
@infoschematics/view-studio
```

Canvas owns the reusable interactive Infoschematic component. Present wraps Canvas with Audience navigation and presentation state. Studio wraps Present with Producer-facing Design and Direct capabilities.

`@infoschematics/render-svg` consumes the same derived View Model in parallel and produces deterministic static SVG without React. Future renderers, including slide-oriented output, follow the same boundary.

## Consequences

Consumers import only the capability they need. Higher interactive views remain substitutable wrappers rather than forks. Scene, focus, overlay, and motion treatments become explicit rendering options; static output chooses deterministic defaults and does not acquire browser state.
