---
id: ADR-INFOSCHEMATICS-029
title: Author what an emphasis means, not how it is played
date: 2026-09-16
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-012, ADR-INFOSCHEMATICS-026]
---

# ADR-INFOSCHEMATICS-029: Author what an emphasis means, not how it is played

## Context

[`ADR-INFOSCHEMATICS-026`](ADR-INFOSCHEMATICS-026-name-dynamics-in-the-document.md) gave a document a vocabulary of named [Diagram Dynamics](../reference/vocabulary.md#diagram-dynamic) and kept every depiction choice out of it: no duration, easing, colour, selector, callback, timer, or renderer component. It named the finite kind list as the deliberate cost, and said a third kind would be a decision with its own static and accessible obligations rather than a configuration value.

Two asks have since arrived from the same rehearsal, the IBC 2026 5G-EMERGE walkthrough, and they are not the same ask.

The first is a hold. Every `emphasise-elements` occurrence outlines its targets for one token-owned duration and retires itself, so the only way to keep a stage marked while a presenter talks about it is to keep minting occurrence keys. That stutters, repeats the announcement, and puts a timing loop in the host for something the document could state once. What the presenter is saying is not "something happened at this stage" but "this stage is the one we are on" — a state, not an event.

The second is a travelling mark: an emphasis whose treatment runs the perimeter of the element instead of brightening all of it at once, so the eye follows a direction. Held and travelling arrive together, they want the same four edit regions, and a held travelling mark is what the walkthrough actually asks for — so the surface question has to be answered once, for both, rather than twice with the second answer contradicting the first.

Answering it twice is the real hazard. Each ask has an obvious local answer: a `held` kind for the first, an `animate` kind or a technique field for the second. Taken one at a time, both are plausible; taken together they turn `diagram.dynamics` into a small animation language, which is exactly the outcome `ADR-INFOSCHEMATICS-026` declined. There needs to be a test that says which of the two asks the document may express, and it has to be a test a reader can apply to the third ask as well.

## Decision

An authored Dynamic may state **what the change is**, including whether it is an event or a state. It may not state **how a renderer carries it**.

The dividing question is whether a [Producer](../reference/vocabulary.md#producer) would say the thing out loud while presenting. "Segments were published" and "we are on this stage" are both things they would say, and both are properties of the change itself, legible in review before any wiring exists. "Pulse for nine hundred milliseconds", "run a mark clockwise round the perimeter", "ease out" are things only a renderer would say; a document that carried them would make every renderer that cannot animate a degraded case of the authored intent rather than a realisation of it.

That test settles both asks.

**A hold is authored, as a property of the existing kind.** An `emphasise-elements` declaration may carry `depicts`, with the values `event` and `state`. Absent means `event`, so every document already written keeps the reading it has, and the compact serialisation of a document that does not use it is unchanged. The kind list stays at two: `signal-flow` and `emphasise-elements` are different statements, while an event and a state emphasis are the same statement over different spans, which is a property of the statement and not a third one. Validation rejects `depicts` on a `signal-flow` declaration, exactly as it already rejects a target field belonging to the other kind: a held Flow signal is a separate decision with its own treatments, and the contract should not promise it before anything honours it.

**A travelling mark is not authored.** It is a second renderer interpretation of the same declaration, chosen from the element's geometry rather than from anything the document said, and it needs no authored surface at all. A document that wanted to insist on it would be naming a technique, which this decision refuses.

`depicts: state` describes the change; it does not grant the document a lifetime. The occurrence remains host-owned in exactly the terms [`ADR-INFOSCHEMATICS-012`](ADR-INFOSCHEMATICS-012-keep-flow-signals-transient.md) set: the host supplies an occurrence key, retaining it holds the occurrence, changing it replays, and withdrawing it ends it. What `depicts: state` changes is only who decides the end. For an event, the renderer's own finite duration ends it, and the document is asking for that. For a state, nothing but the host's withdrawal ends it, because a state has no intrinsic duration to expire — which is why this is not the persistent presentation state `ADR-INFOSCHEMATICS-026` excluded. Nothing is written to the authored document, no occurrence or timer becomes authored data, and a held occurrence still reaches only elements the renderer actually drew. Scope filtering, Scene change, a replaced key, and host withdrawal all end a hold as they end an event.

Every treatment obligation that `ADR-INFOSCHEMATICS-026` placed on a kind is placed on `depicts: state` too, and the answers are these.

Full motion sustains rather than repeats: the outline breathes on the same `canvas.emphasis` period and never reaches full transparency, so a reader arriving mid-hold sees it and a reader watching it start does not see it restart.

Reduced motion is steady. A finite pulse degrades to a still outline that then disappears; a held emphasis has nowhere to degrade except a steady one, so under `prefers-reduced-motion` a held emphasis and a still rendering of it are the same picture. That convergence is accepted rather than worked around: it costs a reduced-motion reader the knowledge that the state is live rather than drawn, and the alternative — some non-motion carrier of liveness — would be a signal invented for that reader alone and legible to nobody else.

Still output does not distinguish held from finite. A single frame has no time to hold, so the honest still interpretation of both is the same outline, and inventing a glyph that means "this one persists" would ask a reader to decode a convention nothing teaches. Deterministic still output therefore stays byte-identical for a document whether its emphasis Dynamics depict events or states, and unchanged for a document that declares none.

The announcement says the Dynamic's label once, when the occurrence is accepted, and says nothing when the hold ends. A state's ending is the absence of the treatment, not a new event, and an utterance per ending would make a presenter's every withdrawal a spoken interruption.

Studio's rehearsal becomes a toggle for a state-depicting Dynamic and stays momentary for an event. A held Dynamic has no end of its own, so a momentary control would start something the [Producer controls](../reference/vocabulary.md#producer-controls) could not stop, and `aria-pressed` on that button would claim a state that was true for nine hundred milliseconds. Pressing a pressed held Dynamic withdraws its occurrence, which is the host withdrawal the contract already requires, so rehearsal exercises the real ending rather than a Studio-only one.

The travelling interpretation is unauthored, but it is not unconstrained. Being a renderer's choice means a renderer may decline it; it does not mean a renderer may decide freely what it costs a reader. The same obligations apply, and the answers are these.

A travelling mark is offered only where the element has a closed perimeter the mark can be seen to follow, and every other geometry falls back to the finite outline rather than drawing nothing. A Region, a Card and a Fabric are boxes, so each has one. A Point is a disc whose whole extent is already the treatment, so travelling round it says nothing its ring did not; still output rings it and sends nothing round it, and the interactive Canvas draws no Point at all, so no emphasis reaches one there. A Flow is a route that may already be carrying a signal along its own length, so a second mark travelling the same line competes for the same channel and would be read as a signal. An Overlay Graphic is accepted by validation and drawn by still output, but the interactive Canvas draws none, so there is nothing there to travel. Declining a geometry is recorded here because degrading silently is worse than refusing: an author who emphasises a Flow should get the route outline they always got, not an absence, and where a renderer draws no such element in the first place that is the existing rule about reaching only what was drawn rather than a new refusal.

Full motion is one circuit of the drawn perimeter in the same `canvas.emphasis` period the finite treatment already uses, and the mark travels along the very path string the outline is drawn from. That is the substantive part: the outline and the motion are one calculation owned by View Model, not two, so a mark cannot cut a corner the outline rounds, and the two renderers cannot disagree about where the perimeter is. Where the emphasis depicts a state the circuit repeats for as long as the host holds it, so held and travelling compose without either knowing about the other — one side chose the span, the other chose the geometry.

Reduced motion removes the mark rather than slowing it, and the outline's steady treatment is what remains. This needs saying because the obvious answer is wrong: the mark travels on declarative SVG motion, which no CSS `animation` property can stop, so the reduced-motion rule that suppresses every other treatment in this area leaves a travelling mark running. It is removed by class, exactly as the Flow signal pulse already is.

Still output does not distinguish a travelling emphasis from a finite one, on the same reasoning that settled the held case. A single frame has no time to travel; and more than that, the direction a mark traces is chosen from the element's geometry rather than from anything the document said, so there is no authored direction for a still frame to record. Freezing one into an arrow or a gap on the outline would state as content a direction no author asserted, and would ask a print reader to decode a convention nothing teaches. So the three quiet interpretations converge on one picture — finite, held and travelling all render as the same still outline — and that convergence is accepted rather than worked around. The cost is that a printed Infoschematic cannot show direction, and the answer to an author who needs direction shown is a Flow, which is direction the document actually states.

## Consequences

A document can now be read for the distinction a presenter actually makes. "Segments were published" and "we are on this stage" look different in the source, so a reviewer can see which Dynamics are states before any host exists, and a host binds both the same way — one `dynamicId` and one key — without learning which is which.

`depicts` is a precedent, and it should be held to the test above rather than to its own convenience. It is the first authored field that shapes a treatment's lifetime, and the next request of the same shape — a held Flow signal, a delay, a priority between two concurrent Dynamics — will arrive looking equally reasonable. Only the first of those is the same statement: a held Flow signal names the event-or-state property of a change, and could extend `depicts` to `signal-flow` once a sustained route treatment exists in every renderer. A delay and a priority are playback, they belong to a Scene where [`INFOSCHEMATICS-TOOL-023`](../roadmap/INFOSCHEMATICS-TOOL-023-scene-signal-treatments.md) already puts them, and that item's `continuous` policy is now a thing that can be sustained rather than a policy with nothing to hold.

The travelling treatment gains its authority here rather than needing a record of its own. Because it is a renderer interpretation, a renderer may add it, restrict it to the geometries that can carry it honestly, and fall back to the finite outline elsewhere, without any document changing — and a held travelling mark composes by construction, because one side chose the span and the other chose the geometry. The cost is that a document cannot ask for it, so an author who wants direction shown has no way to insist on it; if that turns out to be the wrong side of the line, the argument to reopen is that direction is part of what the change _is_, not that travelling looks better.

A reduced-motion reader and a print reader both see a held emphasis as an outline, and neither can tell it from a finite one. For print that is inherent. For reduced motion it is a real accessibility cost, accepted knowingly and recorded here so it is not rediscovered as a defect. A travelling emphasis is now the third thing they cannot tell apart from a finite one, which makes the outline the meaning and the motion an aid to finding it — the right way round, since motion was never allowed to be the only carrier.

One perimeter becomes a View Model responsibility, and deliberately only one. Because the still case declines a direction marker, the shared calculation is a path and nothing else: no ordered positions along it, no start angle, no sense of rotation exposed to a renderer to draw from. That keeps View Model free of treatment choices while still making the perimeter a calculation rather than a drawing decision, which is the line the architecture guide draws. It also retires a real hazard, since the emphasis outline was previously built twice from the same tokens by unrelated code with no parity case holding the two together.
