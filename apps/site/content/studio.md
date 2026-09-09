# Produce with Studio

Studio adds [Producer](/docs/reference/vocabulary/#producer) capability to [Present](/docs/reference/vocabulary/#present). It is a structured Infoschematic authoring environment, not a general drawing tool: every control changes something the domain model can express, and every constraint is enforced at the point of editing. There is no free rotation, arbitrary paint, font selection, or manual z-order — an Infoschematic remains a view of a structured model, not a picture that happens to resemble one.

Studio supports two closely related loops:

- [**Design**](/docs/reference/vocabulary/#design) shapes the Infoschematic itself: its artefacts, geography, identity, layout, ports, and Flows.
- [**Direct**](/docs/reference/vocabulary/#direct) shapes its presentation material: Scenes, Themes, Stories, Callouts, and Graphics.

A session always starts in Present — the audience experience — and a Producer switches into Design or Direct deliberately. Design and Direct work on the complete authored content rather than the audience's filtered projection, so a hidden artefact never becomes unreachable while editing.

## Structured editing

Studio offers choices the model already understands. Select a Region and its extent is editable; select a Card and its identity, text, placement, renderer properties, and ports appear; select a Flow and its endpoints, family, label, and route open up. Where the model constrains a value, Studio prevents the invalid choice rather than warning about it later.

Clicking an artefact selects it; clicking the empty canvas or pressing Escape clears the selection. Dragging and numeric entry are two inputs to the same placement operation. Moving a Card carries what is structurally attached: derived labels, the terminal points of Flows meeting its ports, and the route geometry needed to keep those runs orthogonal — the rest of an authored route stays put.

## The Library

The Library offers reusable Card, Fabric, and Flow starting points — seeds, not linked instances. Each insertion deep-copies the template, assigns a fresh `id` and `code`, and applies current placement, Scope, or endpoints. The result carries no template link, so later edits affect only that instance.

## Drafts and the handoff

Studio never writes authored source. Edits accumulate into one reviewable change set of serialisable operations: creates, movement, resize, property edits, reordering, and removals all appear immediately in the diagram but remain a draft until the set is applied.

- Undo and redo operate on whole gestures — one drag is one step regardless of pointer events.
- Repeated edits to the same property consolidate into one final change.
- Changes can be discarded individually or together.
- Related consequences travel together: removing a Card names the dependent Flows that would lose an endpoint; removing a Region removes only itself.

Applying the change set is a deliberate handoff, readable in review as model fragments keyed by stable identity. How an approved change set reaches authored configuration — a commit, a pull request, an API — is the host's decision, not Studio's.

A draft can survive an accidental reload, but the session boundary holds: reload always returns to Present with no active focus or running Story.

## Where next

Studio mounts like any other view — see the [React integration guide](/docs/react-integration/). The [authoring guide](/docs/authoring/) covers the same definition written directly, which remains the right choice for a definition that lives in a package.
