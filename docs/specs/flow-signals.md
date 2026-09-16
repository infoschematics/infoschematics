# Flow signals — SIGNAL

Finite runtime Flow occurrences, replay, cancellation, announcements, and reduced-motion treatment. Part of the [Specifications corpus](index.md).

A host may also reach these occurrences by naming an authored Dynamic rather than a Flow; see [Diagram Dynamics](diagram-dynamics.md).

## User-observable behaviours

### SIGNAL-001 — Signals are finite keyed occurrences

Canvas MAY receive framework-neutral `FlowSignal` occurrences from Present or its host through the `signals` prop. Each occurrence MUST identify one configured Flow through `flowId` and one host-owned `occurrenceKey`. Re-rendering the same pair MUST NOT restart a completed signal; a new occurrence key MAY replay that Flow. Simultaneous occurrences for different Flows MUST remain independent.

Canvas MUST cancel an obsolete occurrence when the occurrence is removed. Cancellation and completion MUST leave the underlying Flow route, hit target, selection behaviour, and authored routing geometry unchanged. Filtering, hover, focus, and selection MUST NOT synthesize occurrences. An occurrence for an unknown or currently unavailable Flow MUST NOT make content visible or destabilise rendering.

The travelling pulse MUST be finite and presentational. Signal graphics MUST be hidden from assistive technology and MUST NOT become the only evidence that a Flow was signalled.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-canvas`, then drive the `signals` prop directly: re-render the same `flowId` and `occurrenceKey` and no completed pulse may restart; change only the key and the Flow replays; remove the occurrence and it cancels; signal two Flows at once and neither disturbs the other; supply an unknown `flowId` and the render stands with nothing newly visible. Filter, hover, focus, and select without signalling and confirm no occurrence appears, and compare each Flow's route, hit target, and selection behaviour before and after a pulse.

_Evidence:_ signal props in `packages/view-canvas/src/Canvas.tsx` and signal rendering in `packages/view-canvas/src/InfoschematicDiagram.tsx`.

### SIGNAL-002 — Scene entry can signal focused Flows once

Present MUST expose a `signalPolicy` prop accepting `focused-flows` or `none`. Under `focused-flows`, entering a Standalone Scene or Sequence Scene MUST derive one framework-neutral signal occurrence for each resolved focused Flow. The occurrence key MUST distinguish that Scene entry from earlier entries while remaining stable across ordinary renders of the same entry.

Re-rendering, filtering, hover, selection, and focus inspection MUST NOT create a new occurrence. Stepping to another Sequence Scene or entering another Scene MAY create new occurrences for its resolved focused Flows, including a Flow signalled by an earlier entry.

Under `none`, Present MUST derive no automatic occurrences. The policy MUST NOT prevent a host from supplying explicit occurrences directly through the Canvas boundary. Signal policy and active occurrences MUST remain transient host or Present state rather than authored Infoschematic or process-global state.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-present`, then step a Sequence under each `signalPolicy`. Entering a Scene must derive one occurrence per resolved focused Flow; re-rendering, filtering, hovering, selecting, or inspecting focus within that entry must derive none; stepping on must derive fresh keys, including for a Flow an earlier entry signalled; `none` must derive nothing while a host's own occurrences still reach Canvas. Reload with the authored document unchanged to confirm the policy and the active occurrences were never authored state.

_Evidence:_ signal derivation in `packages/view-model/src/signals.ts` and Scene-entry coordination in `packages/view-present`.

### SIGNAL-003 — Scene changes cancel obsolete signals

Clearing a Scene MUST cancel its active occurrences. Replacing the active Standalone or Sequence Scene MUST cancel occurrences not owned by the new entry before deriving new ones. A completed occurrence MUST NOT resume merely because Present re-renders or the same Scene remains active.

Unknown Flow identifiers MUST be ignored by focused-Flow resolution. Scene signal derivation MUST remain pure, framework-neutral, and independent of timers; Canvas owns finite rendering and accessible announcement.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-present`, then clear the active Scene and confirm its occurrences cancel; replace it and confirm occurrences the new entry does not own cancel before new ones derive; re-render with the same Scene active and confirm a completed occurrence stays completed; put an unknown Flow identifier in a Scene's focus and confirm resolution ignores it. Derive twice from the same inputs without advancing any clock: the occurrences must match, because nothing here may read a timer.

_Evidence:_ presentation reducer and rendered Present tests cover one-shot entry, opt-out, replay after a new entry, Sequence stepping, cancellation, and filtering without signalling.

## Quality properties

### SIGNAL-004 — Signal meaning survives motion preferences

Canvas MUST announce each newly received known Flow occurrence through a concise live region identifying the Flow. Re-rendering the same occurrence MUST NOT repeat its announcement. Removing or cancelling an occurrence MUST NOT announce new activity.

Under `prefers-reduced-motion`, Canvas MUST replace spatial pulse travel with finite in-place emphasis on the same Flow route. The reduced-motion treatment MUST preserve the announcement, occurrence identity, cancellation, and static route semantics.

Signal measurements shared with deterministic still output MUST come from View Model tokens. Canvas MAY own interaction-specific duration and easing while no other renderer depends on those values.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-canvas` and `bun run test:browser --filter=@infoschematics/view-canvas`, then watch the live region: each newly received known occurrence is announced once, a re-render of that occurrence adds nothing, and removing or cancelling announces nothing new. With reduced motion emulated, the pulse must become finite in-place emphasis on the same route while its announcement, its occurrence identity, its cancellation, and the still route semantics all survive. Confirm any measurement the deterministic still output also depends on is read from View Model tokens rather than declared in Canvas.

_Evidence:_ pure occurrence and announcement-state tests cover replay, concurrent signals, cancellation, and live-region revisions; server-rendered Canvas tests cover pulse and reduced-motion markup, the announcement surface, and unchanged Flow interaction geometry.
