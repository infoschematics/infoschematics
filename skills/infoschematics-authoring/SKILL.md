---
name: infoschematics-authoring
description: Writes a first Infoschematic YAML document from a plain-language description, or amends an existing one, then checks and repairs it with `infoschematics check` until it is good enough to open in Studio. Use when someone asks to draft, sketch, start, or generate an Infoschematic or architecture, workflow, or pipeline diagram as an Infoschematic, or to add, move, rename, or remove something in an existing Infoschematic document. Not for changing the Infoschematics packages, schema, or renderers.
ki-depends-on: []
---

# Infoschematics authoring

Produces a canonical YAML Infoschematic that validates and that a person can open in Studio and correct. The result is a starting point, not a deliverable: a document with named, unresolved findings is a legitimate outcome, and a clean result that was not achieved is the one outcome a person cannot act on.

## Before writing anything

Read the current contract rather than recalling it. [The source map](references/sources.md) says where each catalogue lives — schema properties and option values, standard artwork keys, vocabulary, drawing rule codes, YAML notation — both in a checkout of this repository and from outside one. Never write a property, kind, renderer key, or option value you have not just read there; the schema rejects an invented key, and a remembered list drifts from the contract that owns it.

Resolve the checker once, as [the source map](references/sources.md#the-checker) describes, and confirm it runs on a known-good document before relying on it.

## Mode NEW — a first document from a description

1. **Choose a representation pattern first.** Read the representation patterns guide and name the pattern the description fits — architecture with boundaries, workflow, entity context, data or media pipeline — and its reading order (left to right, top to bottom, centre outwards). Record the choice in one sentence; composition is a decision, not an accident of the order things were generated in. If nothing fits, say so and use the nearest pattern.
2. **List the parts, then place them by the pattern.** Name every Card, Fabric, Point, Region and Flow with a stable id before any coordinate exists, cased as the worked examples case it. A part whose kind has standard artwork is a Fabric rather than a Card; the source map says where those keys live. Then assign positions from the pattern's lanes, following [the placement method](references/placement.md). Do not reason about coordinates in prose: write them into the document.
3. **Write the candidate immediately** to a `.yaml` file the person named, or to `infoschematic.yaml` in a working directory they will keep, with the schema comment as its first line. Follow the canonical YAML convention for key order and notation, and read the ports and `link` notation there before writing the first Flow. Include every field the schema lists as `required` at each level, even where a guide's short example omits it.
4. **Check and repair**, per [the repair loop](references/repair-loop.md), under its stop rule.
5. **Render and look.** Render the document to PNG and look at the image. A document that validates and reads badly is the failure this skill exists to keep out of a person's way; fix what the image shows that the checker cannot measure — a label that says nothing or is cut short, a reading order that runs backwards, a boundary drawn without a frame, Card detail the description wanted but the image hides — and check again. What is drawn is decided by `appearance` at diagram and artefact level; read those schema descriptions, or a worked example that draws what you want, before changing geometry. Stop once the check is settled and the image reads; polish beyond that is Studio's job.
6. **Hand over**, as described below.

## Mode AMEND — change an existing document

1. Read the whole document and copy it, unchanged, to a disposable place — `tmp/` in a checkout, or beside it as `<name>.before.yaml` to delete afterwards. List the ids the request concerns; everything else is out of scope.
2. Change only what was asked for. Edit in place so comments, key order, quoting and untouched values survive; never regenerate the document from a summary of it. A request that needs new parts places them by [the placement method](references/placement.md) in space that is already free, and moves an existing part only when the request requires it or a finding the change caused cannot be cleared otherwise.
3. Check and repair under [the repair loop](references/repair-loop.md), repairing only findings the amendment introduced. Findings the original already carried are reported, not fixed, unless the request asked for that.
4. Compare against the copy, per [the amendment comparison](references/repair-loop.md#confirm-an-amendment-left-the-rest-alone), and report any identity other than the requested ones that changed.
5. Render, look, and hand over as in Mode NEW.

## Hand over

Finish with a short report and nothing more:

- the document's path, and in Mode NEW the representation pattern chosen;
- the checker's final verdict as it printed it — `drawing reads`, or the exit status and every remaining finding by rule and the identities it concerns;
- for each remaining finding, why it was left: the stop rule ended the loop, or the repair needs a judgement about meaning the description did not settle;
- where those are settled: open the document in Studio (in the hosted Playground, paste it into Source, then shape it in Design) or continue the conversation.

Never describe an unresolved document as clean, and never delete, hide or weaken something to make a finding disappear unless that is a repair the finding itself offers and the meaning survives it.

## Boundaries

- Output is one serialisable YAML document. No TypeScript module, callback, component, or host code.
- No automatic layout: placement is chosen the way an author chooses it, and the checker judges the result.
- The packages, schema and checker are inputs. If the contract cannot express what the description needs, say so in the hand-over rather than working round it.
