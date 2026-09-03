---
id: ADR-INFOSCHEMATICS-012
title: Keep Flow signals transient
date: 2026-09-03
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-001, ADR-INFOSCHEMATICS-005, ADR-INFOSCHEMATICS-006]
---

# ADR-INFOSCHEMATICS-012: Keep Flow signals transient

## Context

A Flow can be signalled to show that a meaningful action, event, or Scene transition has occurred. This state is finite and time-sensitive: replaying it on every React render would imply repeated activity, while storing animation state in an authored Infoschematic would turn serialisable configuration into an executable runtime protocol.

Present knows when a Standalone Scene, Thematic Scene, or Story Scene is entered. A host may also know about an external event that is not part of Scene playback. Canvas owns the interactive motion and its accessible presentation. Static SVG cannot reproduce a runtime occurrence, but it can provide a deterministic still treatment when its caller explicitly requests one.

## Decision

A `FlowSignal` is a framework-neutral runtime occurrence containing `flowId` and a host-owned `occurrenceKey`. The pair identifies one occurrence. Re-rendering the same pair MUST NOT restart a completed signal; supplying a new occurrence key MAY replay the same Flow.

Present owns automatic Scene signalling. Its `focused-flows` policy derives one occurrence for each resolved focused Flow when a Standalone Scene, Thematic Scene, or Story Scene is entered. Its explicit `none` policy derives no occurrences. Filtering, hover, selection, focus inspection, and ordinary re-rendering do not create signals. Clearing or replacing a Scene cancels obsolete occurrences, and a completed occurrence does not resume automatically.

Hosts own explicit occurrences caused by application or external events and pass them through a public View boundary. Signal state, occurrence keys, timers, callbacks, animation policy, and event correlation MUST NOT appear in `InfoschematicConfig` or process-global state.

Canvas keeps the underlying Flow route static before, during, and after a signal. A travelling pulse is decorative and hidden from assistive technology; a concise live announcement identifies the semantic Flow occurrence. Under `prefers-reduced-motion`, Canvas replaces travel with finite in-place route emphasis while preserving the same announcement and cancellation semantics.

Static SVG accepts an explicit set of signalled Flow identifiers and emits deterministic non-animated emphasis. Unknown identifiers are ignored. With no explicit signal option, output remains unchanged and motion-free. Static output never serialises occurrences, animation elements, timers, or browser state.

## Consequences

The authored model remains portable and deterministic, while Scene-driven and externally driven activity can share one occurrence contract. Hosts can suppress automatic Scene signalling without disabling explicit signals, and replay remains intentional rather than render-driven.

Motion is never the only carrier of meaning. Interactive output has a stable route and live announcement, reduced-motion output receives equivalent finite emphasis, and static output has an explicit deterministic fallback. Event-stream correlation, operational telemetry, and authoring UI for signal policies remain separate future work.
