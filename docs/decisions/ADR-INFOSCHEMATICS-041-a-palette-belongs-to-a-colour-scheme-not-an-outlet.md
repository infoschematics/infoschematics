---
id: ADR-INFOSCHEMATICS-041
title: A palette belongs to a colour scheme, not an outlet
date: 2026-09-22
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-005, ADR-INFOSCHEMATICS-011, ADR-INFOSCHEMATICS-024, ADR-INFOSCHEMATICS-035]
---

# ADR-INFOSCHEMATICS-041: A palette belongs to a colour scheme, not an outlet

## Context

Until now the drawing's colours were chosen by the outlet that drew them. The token manifest said so in as many words — the interactive surface was dark, the static renderer's paper was light — and the tokens followed: `canvas.surfaces.backdrop` was `#081725` while `canvas.output.backdrop` was `#ffffff`, and `canvas.artwork` carried two complete ink groups so a piece of standard artwork could be painted either way.

That agreement was coherent while the question was "which renderer is this". It stops being coherent the moment the question is "what does the reader prefer", because the reader's preference is not a property of the renderer. [PDR-INFOSCHEMATICS-004](PDR-INFOSCHEMATICS-004-product-messaging.md) positions an [Infoschematic](../reference/vocabulary.md#infoschematic) as an input embedded where it is read — in a document, a site, a build pipeline. A definition that can only be drawn dark cannot honour that: embedded in a light document it is a black rectangle in the middle of the page, and an SVG committed to a repository is wrong for half the people who open it.

Nothing in the repository read `prefers-color-scheme` at all, in any TypeScript, stylesheet, document or manifest. So the decision was not how to add a second palette to an existing scheme mechanism; it was whether a scheme exists as a concept here, and who gets to resolve it.

Three questions had to be settled together: what a palette is attached to, who decides which one applies, and what a file that nobody will ever ask does.

## Decision

A palette belongs to a **colour scheme**. One role set — 36 paint roles plus the standard-artwork inks — is realised by three palettes: `light`, `dark`, and `blueprint`. Every palette answers every role, or the generated stylesheet is not written; a role one palette declares and another does not would resolve to whatever an earlier block left behind, and the drawing would be half one palette under a preference no default page expresses.

**The browser resolves the scheme for an interactive drawing.** Canvas references a role as its own custom property rather than resolving a palette in TypeScript, because the reader's preference and a host's override are both things the browser already knows and a module does not. The generated stylesheet declares `light` on `:root`, `dark` behind `prefers-color-scheme` and again behind `[data-infoschematic-scheme]`, so the default path needs no script at all and a host that has resolved the scheme itself can say so. This keeps [ADR-INFOSCHEMATICS-005](ADR-INFOSCHEMATICS-005-host-owned-configuration.md) intact: reading a URL parameter, storing a choice and listening to the operating system stay the host's work, and what reaches a package is a resolved answer or nothing.

**A still rendering resolves the scheme once and writes the colours it settled on** — because nothing downstream of it can react. A caller who wants both renders twice, which is also what makes the two comparable.

**A rendering may also decline to choose.** `scheme: 'adaptive'` writes one SVG carrying both palettes in its own `<style>` element behind `prefers-color-scheme`, scoped to the drawing's own element rather than `:root` so the same markup inlines into a page without declaring a palette over everything around it. This is the form our output most often takes in somebody else's repository, read by people whose preference we will never know. A raster cannot take it: the colour is in the pixel, so [ADR-INFOSCHEMATICS-024](ADR-INFOSCHEMATICS-024-rasterise-with-a-native-resvg-binding.md)'s encoder has to be told, and `--scheme adaptive --format png` is refused rather than quietly resolved.

An adaptive rendering references its roles through inline `style` rather than presentation attributes. `fill="var(--paint)"` is a CSS value only where SVG 2's presentation-attribute parsing is implemented — it resolves in Chromium — and a file committed for strangers to open is exactly the output that cannot depend on which engine they use.

What an adaptive rendering does depend on is a consumer that resolves custom properties, and no fallback rescues one that does not. resvg reads an inline `style` and then treats `var(...)` as an invalid paint: it paints black, and looks past both a `var()` fallback and the presentation attribute beneath it. So the choice is between a drawing that follows its reader and one that any consumer can read, and it is the caller's: `adaptive` is for embedding where CSS applies, and anything else asks for a resolved scheme.

**Paper is light whatever the screen was.** Both palette carriers — the generated stylesheet and an adaptive SVG's own `<style>` — end with a `print` rule restoring the light palette. It shares `:root`'s specificity with the reader's preference and with a host's override, so it is source order that makes it win, which is why the claim is held by a browser case asking the page for `print` rather than by reading the stylesheet. An authored blueprint prints as drawn: it outranks a scheme by specificity, not by order.

**A scheme is not authored data, and `blueprint` is not a scheme.** A document's `appearance.surface: blueprint` is an authored treatment per [ADR-INFOSCHEMATICS-011](ADR-INFOSCHEMATICS-011-separate-authored-appearance-from-output-detail.md), so it pins the blueprint palette in either preference and overrides whatever a caller asked for. An author's own colours mean the same thing in every scheme: a scheme change re-resolves the readable ink measured against an authored fill, and never repaints the author's choice. The readable-ink pair is therefore kept outside the palettes entirely — it is chosen from a fill's luminance, not from the scheme — and the scheme only answers for a fill nobody authored.

## Consequences

The `output`, `surfaces` and `artwork.ink` token groups are gone. Every consumer now names a role and either resolves it for a scheme or references it as a custom property, and the standard-artwork catalogue of [ADR-INFOSCHEMATICS-035](ADR-INFOSCHEMATICS-035-the-product-offers-renderer-artwork-as-data.md) paints itself from the artwork roles rather than from one outlet's inks — one catalogue, correct in every scheme.

Renderer parity now compares the **role** each outlet names rather than the colour it wrote, because the two deliberately differ about resolution: Canvas emits `var(--infoschematic-canvas-paint-artwork-mark)` where the static renderer writes `#9cd5f58c`, and both are right. A parity check that compared literals would fail on a correct pair.

Three gates hold the role agreement, in the three places it can break: the generator refuses to write the stylesheet when the palettes disagree about which roles exist, the manifest suite asserts every role in every scheme, and a browser case asserts that each declared block resolves the same role names — which is the only place the half-painted failure is visible at all.

The command surface grows a `--scheme` option, and with it the first thing about a rendering that a caller chooses and the document does not. `infoschematics render` therefore has an answer to a question it never had to ask, and the guidance has to say plainly that a rendering keeps the scheme it was given: `--scheme dark` writes a dark drawing, not one that might become dark.

The chrome around the drawing is not covered by this. Studio, Present and the website hold hundreds of hard-coded colour literals with no variable layer beneath them, and `INFOSCHEMATICS-TOOL-118` extends these same schemes to them along with a reader-facing switch. A drawing that reads correctly in light inside chrome that is still dark is a coherent half-delivery; the reverse would not be.
