---
id: ADR-INFOSCHEMATICS-010
title: Coordinated package release contract
date: 2026-09-03
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-006, ADR-INFOSCHEMATICS-008]
---

# ADR-INFOSCHEMATICS-010: Coordinated package release contract

## Context

Infoschematics packages are developed and verified together but consumed independently through npm. Publishing source would expose repository and toolchain assumptions. Versioning interdependent packages separately could create combinations the repository has never verified. React packages also need explicit stylesheet entry points that consumer optimisers preserve.

## Decision

Every public package publishes compiled, unbundled ESM JavaScript, source maps, and TypeScript declarations under `dist/`. Explicit export maps expose only supported JavaScript, declaration, and stylesheet entry points; runtime dependencies remain external.

Stylesheets are opt-in subpath imports and remain marked as side effects. JavaScript-only packages declare no side effects. Browser-oriented React packages retain React and React DOM as peer dependencies and support server rendering at the repository's supported Node floor.

The dependency-closed public package set shares one exact SemVer. Internal package dependencies use that exact version and publication proceeds in dependency order through trusted publishing. A release is a separately authorised operation after local release verification.

The [release guide](../guides/releasing-packages.md) owns current package membership, commands, runtime versions, and recovery procedure.

## Consequences

Consumers receive stable JavaScript, declarations, and explicit CSS without compiling repository source or depending on monorepo layout. Private subpath imports fail intentionally.

A public-package change coordinates the dependency-closed set even when implementation changed in only one package. Partial publication cannot overwrite an npm version and must be repaired forward. Examples and applications remain outside the public package release set.
