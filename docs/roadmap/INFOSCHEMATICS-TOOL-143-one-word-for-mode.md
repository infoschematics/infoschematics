---
id: INFOSCHEMATICS-TOOL-143
area: TOOL
title: One word for mode
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-09-25T00:00:00Z
---

# One word for mode

## Goal

The axis that says which ground a reader is on answers to one word everywhere it is named.

## Context

`INFOSCHEMATICS-TOOL-129` split the authored treatment from the reader's ground and settled the vocabulary: a **style** says what the drawing is, a **mode** says which ground it is read on. It moved the words a reader or an author sees — `appearance.style`, `appearance.mode`, `--mode`, `data-infoschematic-style`, the guide copy, the specifications and [ADR-INFOSCHEMATICS-037](../decisions/ADR-INFOSCHEMATICS-037-a-palette-belongs-to-a-colour-scheme-not-an-outlet.md).

It deliberately did not move the internal names. `packages/view-canvas/src/colour-scheme.ts` still exports `useColourScheme`, `colourSchemeAttribute` (`data-infoschematic-scheme`), `colourSchemeStorageKey` (`infoschematics.colour-scheme`) and `ColourSchemeButton`; `RenderedScheme` and the `--scheme` flag remain as the retired spelling; and Site's own gallery is still `SchemeGallery`, `schemeSpecimen` and `.scheme-gallery`. So the repository reads as though there are two axes with the same name, which is exactly the confusion TOOL-129 was opened to remove.

## Boundary

Naming, and nothing else. No palette, no resolution order, no authored field changes value or meaning; a rename that alters behaviour is out of scope and belongs in its own record.

Two things are deliberately _not_ simple renames and have to be decided rather than swept:

- `data-infoschematic-scheme` and `infoschematics.colour-scheme` are observable by a host page and by a returning reader's browser. Moving them either needs a migration that reads the old key once, or a stated decision that a reader's remembered choice is expendable.
- `--scheme`, with `adaptive` and `blueprint`, is a published command-line spelling that [CLI-013](../specs/command-line-rendering.md) requires to keep working. It stays; the question is only whether anything in the source still calls it the primary name.

## Discussion

Recorded on 2026-09-25 while delivering `INFOSCHEMATICS-TOOL-129`, whose consequences in ADR-INFOSCHEMATICS-037 name this sweep as deferred. Held back there because it touches roughly thirty files without changing a single behaviour, and a rename that large landing inside a change that moves the model would have made the model change unreviewable.

Worth doing, and worth doing separately: the cost of the confusion is paid by every later reader, and the change is mechanical enough that a reviewer can check it by reading the diff rather than the tests.
