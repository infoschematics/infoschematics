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

Consumers need different capabilities: an interactive Canvas, Audience presentation, Producer editing and directing, and deterministic static output. A single React application would force every consumer to take every capability and would make non-React output secondary.

## Decision

Interactive Views are additive: Canvas is the reusable interactive surface, Present adds Audience navigation and presentation state, and Studio adds Producer-facing Design and Direct capabilities. Static SVG and future renderers consume the same framework-neutral View Model in parallel rather than wrapping the React stack.

## Consequences

Consumers import only the capability they need. Higher Views remain compositions instead of forks, and every renderer shares semantic derivations while owning its output-specific treatment and deterministic fallback policy.
