---
id: INFOSCHEMATICS-TOOL-118
area: TOOL
title: Chrome in both schemes
theme: tool
horizon: now
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-117]
baseline_ref: null
created_at: 2026-09-21T23:20:00Z
updated_at: 2026-09-21T23:20:00Z
---

# Chrome in both schemes

## Goal

Every surface this repository draws around an [Infoschematic](../reference/vocabulary.md#infoschematic) — Studio, Present, and the website — resolves in the same light and dark colour schemes as the drawing, and a reader switches scheme from a control in the header rather than by changing their operating system.

## Context

[INFOSCHEMATICS-TOOL-117](INFOSCHEMATICS-TOOL-117-light-and-dark-modes.md) makes the drawing resolve in two schemes. It deliberately stops at the drawing, which leaves the obvious half-delivered state: a Diagram that reads correctly in light inside a Studio, a Present shell, and a website that are all still dark. This record is the other half, and the two together are what "Infoschematics has a light and a dark version" actually means.

The chrome is further from ready than the drawing was. `packages/view-canvas/src/styles.css` resolves `--infoschematic-*` variables 124 times, because the drawing surface has always been tokenised. `packages/view-studio/src/styles.css` resolves none of them and carries 297 raw colour literals; `packages/view-present/src/styles.css` carries 28, also with none; `apps/site/src/styles.css` carries 164 and defines only seven custom properties, none of them colour. So there is no variable layer to swap: it has to be built as part of this, which is the bulk of the work and the reason a scheme switch is not a small change.

A switch has somewhere to go on each surface. Studio has a header at `packages/view-studio/src/app/panels/TitleBar.tsx:50` with a `tool-bank` of icon buttons already following an established pattern — an `aria-label`, a `title` carrying the shortcut, a `lucide-react` icon marked `aria-hidden` — and `aria-pressed` is already how toggles report state in `PanelRail` and `ProducerControls`. The website has a header at `apps/site/src/SiteNav.tsx:22`, but no icon dependency: `lucide-react` belongs to Studio alone. Present exposes its own `PresentationControls`. Studio also already has `use-persistent-state.ts`, so remembering a choice is a pattern here rather than a new one.

One naming point, because it will otherwise leak into the interface: "mode" is taken. `ADR-INFOSCHEMATICS-028` uses it for Producer and Present modes, so what a reader switches is a **colour scheme**, and the control says so.

## Boundary

Chrome and the control only. What the drawing itself paints is TOOL-117's, and this record neither restates nor changes it.

It is colour, not a redesign: no layout, spacing, typography, or iconography changes ride along, because a recolour that also moves things cannot be reviewed as a recolour.

An embedded Diagram gets no control from this. It has no chrome to put one in, and `ADR-INFOSCHEMATICS-005` gives the host page metadata, routing, and runtime composition, so a host owns its own switch and passes the resolved scheme in. What this delivers is the control on the three surfaces this repository owns and hosts itself.

Authored data is untouched: a scheme is a reader's preference, not a property of a definition, and no Infoschematic gains a field here.

## Current state

Nothing in the repository reads `prefers-color-scheme`, and no surface stores a colour preference — the persistence that exists in `use-persistent-state.ts` and `use-presentation.ts` holds editing and presentation state.

The website is a static application built through `self:cf:build` from `apps/site/index.html`, which loads one module script. A scheme resolved only after that module runs is a scheme the reader sees flash, so a pre-paint step in the host document is the site's part of this.

The dependency gates are live constraints rather than background noise: `self:boundaries:verify` holds the ownership direction, and `self:unused:verify` fails on an unused dependency or export, so putting an icon in the site header is a decision about the site's dependencies and not only about markup.

## Steps

- [ ] Name the chrome paint roles once, in the same token manifest TOOL-117 establishes, and emit them in both schemes — a second palette invented inside a stylesheet is exactly what left the chrome un-themeable the first time.
- [ ] Replace the literals in `packages/view-studio/src/styles.css` with those roles, surface by surface, until the file's raw colour count is zero.
- [ ] Do the same for `packages/view-present/src/styles.css` and the chrome parts of `packages/view-canvas/src/styles.css`.
- [ ] Decide whether the website consumes the published token stylesheet or keeps its own role layer, then recolour `apps/site/src/styles.css` the same way.
- [ ] Add the scheme switch to Studio's title bar as an icon button in the existing tool bank, reporting state through `aria-pressed` and carrying an accessible name that says which scheme it moves to.
- [ ] Add the switch to the website header, resolving the icon question without pulling Studio's icon dependency into the site.
- [ ] Add it to Present's controls, or decide deliberately that a presenter pins the scheme before presenting and record which.
- [ ] Resolve and remember a scheme in this order: an explicit choice, then a stored preference, then `prefers-color-scheme`; resolve it before first paint in the site document, and keep following the operating system while no explicit choice is stored.
- [ ] Hold the result with a check that fails when a stylesheet in these packages gains a raw colour literal, so the layer cannot quietly decay back.

## Files touched

`packages/view-studio/src/styles.css` and its title bar; `packages/view-present/src/styles.css` and `PresentationControls`; the chrome rules in `packages/view-canvas/src/styles.css`; `apps/site/src/styles.css`, `SiteNav.tsx`, and `index.html`; the chrome roles in `packages/view-model/src/tokens.ts` with the generator and its test; a new literal-floor check under `scripts/`; the browser and component suites for each surface; and the specifications and guides named below.

## Verify

`bun run self:check`, including `self:boundaries:verify` and `self:unused:verify`, which are the two gates a new header control in the site can fail.

A literal floor: the new check asserts zero raw colour literals in the four stylesheets and fails if one returns. A check that merely counts what exists today would pass forever, so it states the floor.

Both schemes are proved in a browser, not read out of a stylesheet: the browser suites ask the runner for `prefers-color-scheme` the way they already ask for `prefers-reduced-motion`, and the switch is exercised for accessible name, `aria-pressed` state, keyboard operation, and persistence across a reload.

Then every surface is rendered and looked at in both schemes — Studio, Present, the website, and an embedded Diagram inside the site — because a recolour is a perceptual claim and `AGENTS.md` is explicit that a green suite is not evidence for one.

## Dependencies / blocks

Blocked by TOOL-117, which establishes the paint roles and the scheme concept this extends to chrome. Starting here first would invent a second palette layer that TOOL-117 would then have to reconcile.

Nothing else blocks it, and it blocks nothing.

## Documentation impact

### Decision Records

Whether the product offers a scheme control at all is a product choice, not only an implementation one: record that the surfaces this repository hosts carry a switch while an embedded Diagram takes a resolved scheme from its host, and why those are not the same promise.

### Specifications

`docs/specs/design-session.md` and `docs/specs/presentation.md` state the requirement that each surface resolves in either scheme and that the control reports its state accessibly; `docs/specs/appearance.md` keeps the drawing's own requirement with TOOL-117.

### Guides

The consumer guide says a reader can switch scheme and that their choice is remembered; the visual guide shows the chrome roles in both schemes alongside the drawing's palette.

### Roadmap

None expected. If the recolour exposes chrome that cannot be expressed as a role without a layout change, that becomes its own record rather than widening this one.

## Review

The packet carries the literal counts before and after per file, the browser evidence for each resolved scheme, the switch's accessibility assertions, and screenshots of all four surfaces in both schemes. The claim being reviewed is that the light scheme is genuinely readable rather than merely light, which only looking can settle.

## Done

Studio, Present, and the website resolve in both colour schemes with no raw colour literals left in their stylesheets; each carries a scheme switch that reports its state accessibly; a choice survives a reload and defers to the operating system when the reader has expressed none; no reader sees a flash of the wrong scheme; and an embedded Diagram still takes its scheme from its host.

## Discussion

### Why this is not folded into TOOL-117

The two halves fail differently. The drawing's palette is a token problem with a generator and a parity check already around it; the chrome is 534 literals across four stylesheets with no variable layer beneath them. Delivered as one change, the review would be dominated by mechanical recolouring and the palette decisions would go unexamined. Delivered in order, each half has a reviewable claim.

### Where the switch belongs

Raised by the owner on 2026-09-21: the scheme should be switchable from an icon in the header of the component overall, not only inherited from the operating system. Studio's title bar is the header that exists; the website's is the one every reader of the public outlet sees. The unresolved part is Present, where a scheme change mid-presentation is a change the Audience sees, and pinning the scheme before starting may be the better answer.
