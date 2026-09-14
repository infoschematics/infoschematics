---
id: ADR-INFOSCHEMATICS-006
title: Additive views and renderers
date: 2026-09-02
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-004, ADR-INFOSCHEMATICS-005]
---

# ADR-INFOSCHEMATICS-006: Additive views and renderers

## Context

Consumers need different capabilities: an interactive Canvas, Audience presentation, Producer editing and directing, and deterministic static output. A single React application would force every consumer to take every capability and would make non-React output secondary. Canonical YAML, JSON and TypeScript inputs also need one semantic runtime rather than one projection per View.

## Decision

The interactive Views are additive: Canvas is the reusable interactive surface, Present adds Audience navigation and presentation state, and Studio adds Producer-facing Design and Direct capabilities. Domain Core normalises supported public inputs into the canonical Infoschematic model once; View Model derives the shared runtime from that canonical value. Static SVG and future renderers consume the same framework-neutral View Model in parallel rather than wrapping the React stack. Established `InfoschematicConfig` input remains a compatibility boundary and is not an internal View vocabulary.

## Consequences

Consumers import only the capability they need. Higher Views remain compositions instead of forks, every renderer shares semantic derivations while owning its output-specific treatment and deterministic fallback policy, and canonical inputs retain their own concepts through rendering and presentation. Compatibility projections stay explicit and temporary where established Studio source-edit operations still require them.
