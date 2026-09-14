---
id: INFOSCHEMATICS-TOOL-052
area: TOOL
title: Major dependency upgrades
theme: tool
horizon: future
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-14T07:02:11Z
---

# Major dependency upgrades

## Goal

Deliberately migrate the repository across its held TypeScript, Node type, Vite, and React-plugin major versions while preserving package, application, and release behaviour.

## Context

Repository conformance records the major-version holds in `.ki.toml` because they require coordinated migration rather than incidental dependency updates. The TypeScript and Node type upgrades form one toolchain concern; Vite and its React plugin form another.

## Boundary

This item does not automatically adopt every available major, remove holds before their verification passes, mix unrelated dependency refreshes into the migration, or publish packages.

## Discussion

### Migration sets

Shaping should assess the TypeScript toolchain and Vite application toolchain independently, then split them into separate delivery records if they do not share a safe verification and rollback boundary.

### Hold removal

Each `.ki.toml` hold remains authoritative until the corresponding migration has landed and the full repository check passes. A partial upgrade must not make the remaining hold ambiguous.
