---
id: ADR-INFOSCHEMATICS-005
title: Host-owned complete configuration
date: 2026-09-02
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [PDR-INFOSCHEMATICS-001, ADR-INFOSCHEMATICS-004]
---

# ADR-INFOSCHEMATICS-005: Host-owned complete configuration

## Context

A reusable runtime that imports an authored realisation depends on content, hides the composition boundary, and prevents hosts from choosing an Infoschematic independently.

## Decision

The host owns one complete `InfoschematicConfig`, page title, routing, static assets, and deployment. It passes the configuration into the selected view or renderer. Reusable packages never import a particular authored Infoschematic.

Authored configurations remain serialisable data. They may contain stable renderer keys and URL-addressed assets but not React components, runtime stores, browser state, callbacks, or derived registries.

## Consequences

The same authored package can be rendered by different outputs and mounted by different hosts. A title-only configuration is a valid blank canvas. Browser persistence requires an explicit stable configuration identity rather than inventing a shared key for anonymous content.
