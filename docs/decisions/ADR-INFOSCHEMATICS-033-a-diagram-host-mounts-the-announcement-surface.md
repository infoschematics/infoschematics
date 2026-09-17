---
id: ADR-INFOSCHEMATICS-033
title: A Diagram host mounts the announcement surface
date: 2026-09-17
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-026, ADR-INFOSCHEMATICS-029]
---

# ADR-INFOSCHEMATICS-033: A Diagram host mounts the announcement surface

## Context

[`ADR-INFOSCHEMATICS-026`](ADR-INFOSCHEMATICS-026-name-dynamics-in-the-document.md) made a [Diagram Dynamic](../reference/vocabulary.md#diagram-dynamic) a meaning a document names and a host plays, and [`ADR-INFOSCHEMATICS-029`](ADR-INFOSCHEMATICS-029-author-what-an-emphasis-means.md) added the held state. Both rest on the same promise: a Dynamic is legible to a reader who cannot see the treatment, because the interactive renderer says what happened in a polite live region. `DYNAMIC-006` states it.

`Canvas` composed those live regions, and for as long as it was the only host of `InfoschematicDiagram` the requirement's "interactive renderer" and the component that satisfied it were the same thing. They are not. Studio mounts `InfoschematicDiagram` directly — it resolves its own Dynamics for rehearsal and materialises a draft runtime, which is why it cannot mount `Canvas`: `Canvas` builds a runtime from `config`, and Studio's runtime already carries the draft overlay, so mounting one inside the other would put two runtimes behind one surface.

So Studio drew every Flow signal and every rehearsed Dynamic and announced none of them. Nothing failed, because the announcement contract is thoroughly tested in the two hosts that satisfy it. Studio carries live regions of its own — for Callout text and for the source panel — which is why the absence read as presence.

## Decision

The announcement surface is a component of its own, `DiagramAnnouncements` in `packages/view-canvas/src/announcements.tsx`, and **every host that mounts the Diagram mounts it**.

It does not move into `InfoschematicDiagram`. The Diagram renders an `<svg>` root: a status paragraph is not SVG content, and the only ways to put one there are a `<foreignObject>` or a new wrapper element around the Diagram — and that element is the one every host already positions, sizes and styles.

Nor is it restated per host. The text a reader hears is a product decision, not host chrome: a signalled Flow is read as its code and its two endpoint labels, and an emphasis is read as its Dynamic's label however many elements it touched. Two hosts composing that sentence separately is how they come to say different things.

The occurrence lifecycle stays with the host, because the hosts genuinely differ. `Canvas` reconciles supplied occurrences against what it drew, so its accepted set is not its active set and an occurrence arriving for a hidden element is never accepted at all; it advances the announcement inside that reconciliation. Studio draws what it resolved, so what it accepted is what is active, and `useDiagramAnnouncements` — beside the component, over the same `advance…Announcement` functions — is the whole of what it needs.

## Consequences

`DYNAMIC-006` gains the host obligation in words, so a future host author reads it in the requirement rather than inferring it from `Canvas`. Its `_Verify:_` names the Studio case and the vacuity check for it: delete the mount and the case must fail.

`Canvas` keeps its behaviour exactly — the regions moved out of its JSX unchanged, and its own announcement state, reconciliation and retirement are untouched. Present is unaffected, because Present mounts `Canvas`; it does not gain a second surface, and its Scene Callout live region announces something else and stays as it is.

Two hosts exist and both now announce. A third would have to mount the surface, and nothing mechanically makes it: the requirement says so, and a host that forgets is silent in exactly the way Studio was. That is the residual risk, and it is the reason the obligation is written as a host obligation rather than left as an observation about `Canvas`.
