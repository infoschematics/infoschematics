---
id: ADR-INFOSCHEMATICS-005
title: Host-owned configuration
date: 2026-09-02
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [PDR-INFOSCHEMATICS-001, ADR-INFOSCHEMATICS-004]
---

# ADR-INFOSCHEMATICS-005: Host-owned configuration

## Context

A reusable package that imports one authored Infoschematic depends on content, conceals the composition boundary, and prevents a host from selecting its own product.

## Decision

The host owns the complete Infoschematic selection plus page metadata, routing, static assets, and deployment. It passes the selected serialisable model and any host capabilities into a View or renderer. Reusable packages never import a particular authored Infoschematic.

Authored data may contain stable renderer keys and URL-addressed assets, but not components, callbacks, browser state, runtime stores, or derived registries.

## Consequences

One authored Infoschematic can be rendered by different outputs and mounted by different hosts. Runtime state and persistence require explicit host ownership rather than being smuggled into portable data.
