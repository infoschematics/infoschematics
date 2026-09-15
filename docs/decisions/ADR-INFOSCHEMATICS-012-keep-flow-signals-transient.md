---
id: ADR-INFOSCHEMATICS-012
title: Keep Flow signals transient
date: 2026-09-03
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on:
  [ADR-INFOSCHEMATICS-001, ADR-INFOSCHEMATICS-005, ADR-INFOSCHEMATICS-006]
---

# ADR-INFOSCHEMATICS-012: Keep Flow signals transient

## Context

A Flow may be signalled to show a time-sensitive occurrence. Treating that occurrence as authored Diagram state would make deterministic output depend on timers, browser state, and replay history.

## Decision

A Flow signal is a framework-neutral runtime occurrence identified by `flowId` and a host-owned `occurrenceKey`. Re-rendering the same pair does not restart it; a new key may replay the same Flow. Present may derive occurrences from entering Scenes, and hosts may pass explicit external occurrences through the public View boundary. Filtering, hover, selection, focus inspection, and ordinary rendering do not create signals.

Signal state, timers, callbacks, and occurrence keys never enter the authored Infoschematic or process-global state. Canvas keeps the underlying route stable, exposes an accessible announcement, and provides a finite reduced-motion treatment. Static SVG is motion-free and may render only an explicitly requested deterministic emphasis.

## Consequences

Scene-driven and external activity share one occurrence contract without compromising portable authored data. Replay and cancellation are intentional, motion is never the sole carrier of meaning, and static output remains deterministic.

[`ADR-INFOSCHEMATICS-026`](ADR-INFOSCHEMATICS-026-name-dynamics-in-the-document.md) generalises this occurrence contract to named authored Dynamics without changing it: a resolved Flow signal is the same occurrence a host could have supplied directly.
