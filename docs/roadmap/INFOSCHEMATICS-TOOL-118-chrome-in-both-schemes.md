---
id: INFOSCHEMATICS-TOOL-118
area: TOOL
title: Chrome in both schemes
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 9f0503bb1229a82fee2bfcf349d1c75b827548f6
created_at: 2026-09-21T23:20:00Z
updated_at: 2026-09-22T06:40:00Z
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

- [x] Name the chrome paint roles once, in the same token manifest TOOL-117 establishes, and emit them in both schemes — a second palette invented inside a stylesheet is exactly what left the chrome un-themeable the first time.
- [x] Replace the literals in `packages/view-studio/src/styles.css` with those roles, surface by surface, until the file's raw colour count is zero.
- [x] Do the same for `packages/view-present/src/styles.css` and the chrome parts of `packages/view-canvas/src/styles.css`.
- [x] Decide whether the website consumes the published token stylesheet or keeps its own role layer, then recolour `apps/site/src/styles.css` the same way.
- [x] Add the scheme switch to Studio's title bar as an icon button in the existing tool bank, reporting state through `aria-pressed` and carrying an accessible name that says which scheme it moves to.
- [x] Add the switch to the website header, resolving the icon question without pulling Studio's icon dependency into the site.
- [x] Add it to Present's controls, or decide deliberately that a presenter pins the scheme before presenting and record which.
- [x] Resolve and remember a scheme in this order: an explicit choice, then a stored preference, then `prefers-color-scheme`; resolve it before first paint in the site document, and keep following the operating system while no explicit choice is stored.
- [x] Hold the result with a check that fails when a stylesheet in these packages gains a raw colour literal, so the layer cannot quietly decay back.

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

### Delivered

Studio, Present, the website and the chrome parts of Canvas painted from a chrome role set in two schemes, with a scheme switch in Studio's title bar and in the site header, a pre-paint resolution step in the site document, and a check that holds the literal floor at zero.

Baseline `9f0503bb1229a82fee2bfcf349d1c75b827548f6`. The reasoning extends [ADR-INFOSCHEMATICS-041](../decisions/ADR-INFOSCHEMATICS-041-a-palette-belongs-to-a-colour-scheme-not-an-outlet.md) rather than opening a second record: the chrome answers the same reader preference from its own role set, and the decision now says so.

Four departures from the plan:

- **Present carries no switch.** The Step left the choice open; it is resolved as a deliberate absence and written into `docs/specs/presentation.md` as PRESENT-013. A presentation is the presenter's, and the scheme is the reader's viewing preference rather than a presentation control — a control that changes what an Audience sees mid-presentation is a different promise from one that changes what a reader sees. Present resolves in whichever scheme the page around it is in, and offers nothing to change it.
- **Twenty-two named-colour literals beyond the record's scope.** The Boundary says colour, not redesign, and these were both. `color: white` sat in Studio's chrome twenty-two times, invisible to a `#`-shaped pattern, and every one was a bug rather than a survivor: white type on the light scheme's pale selected wash is unreadable, so the scheme nobody could select was also the scheme that was wrong. They are fixed, and the checker's pattern now names the colour words so they cannot return.
- **An SSR defect, found by the gate rather than by a case.** `preferredColourScheme` called `window.matchMedia` behind a `typeof window` guard, which is true during the site's static-markup render and where `matchMedia` does not exist. The guard is now on the function, and `colour-scheme.test.ts` is the regression witness.
- **A repainting defect in the still renderer, found by looking.** Recorded under Outstanding concerns below, because it is TOOL-117's contract rather than this record's chrome — but it was this record's guide page that made it visible, and it is fixed here rather than left to read as delivered.

### Summary of changes

Palette and generator — `packages/view-model/src/tokens.ts` adds `visualTokens.chrome.paint.{dark,light}` over 36 chrome roles, alongside the 36 canvas paint roles TOOL-117 established, and exports `chromeDeclarations`. `scripts/generate-visual-tokens.ts` emits them under the same carriers as the drawing's palettes — `:root`, `prefers-color-scheme: dark`, and the `data-infoschematic-scheme` host attribute — and reports `36 chrome roles in 2` schemes. `packages/view-model/src/tokens.generated.css` gains 180 lines.

Stylesheets — the four files go from 542 raw colour literals to none: `apps/site/src/styles.css` 156, `packages/view-studio/src/styles.css` 314, `packages/view-present/src/styles.css` 31, `packages/view-canvas/src/styles.css` 41. Canvas's chrome rules take chrome roles where they frame a drawing and canvas roles where they paint one; the diagram container settles toward `var(--infoschematic-chrome-paint-page)` rather than toward black, which in the light scheme is the difference between a frame and a mid-grey slab.

The switch — `packages/view-canvas/src/colour-scheme.ts` is new and owns the whole resolution: `preferredColourScheme`, `storedColourScheme`, `resolveColourScheme`, `applyColourScheme`, `useColourScheme`, the `data-infoschematic-scheme` attribute and the `infoschematics.colour-scheme` storage key. `ColourSchemeButton.tsx` is the shared control, carrying an inline sun/crescent mark so the site gets an icon without `lucide-react`, an accessible name saying which scheme it moves _to_, and `aria-pressed`. Studio mounts it in the existing tool bank in `TitleBar.tsx`; the site mounts it in `SiteNav.tsx`; `apps/site/index.html` resolves and applies the scheme before the module script runs, so no reader sees a flash of the wrong one.

Still rendering — `packages/render-svg/src/index.ts` now has every rendering declare the palette it settled on, scoped to `data-infoschematic-paint`, not only the `adaptive` one.

Documentation — `ADR-INFOSCHEMATICS-041` gains the chrome clause and the two sentences that separate the promises ("a drawing we embed is not" the same as a surface we host; "there is no blueprint chrome"). `docs/specs/design-session.md` gains DESIGN-022 and `docs/specs/presentation.md` gains PRESENT-013. `apps/site/content/studio.md` and `present.md` each gain a "Light and dark" section, and the Canvas guide page gains a strip of fifteen chrome swatches painted from the roles themselves.

Checks — `scripts/stylesheet-literals.test.ts` is new: it parses declarations by delimiter rather than by line, exempts `mask-image` by property, blanks comments, and asserts an empty list per file. It carries two coverage assertions of its own — a per-file and a union floor on role references, and a positive case over an inline fixture, because a scanner that had stopped recognising colours would return the same empty list the four real cases want. `ColourScheme.browser.test.tsx`, `App.schemes.browser.test.tsx`, `SiteNav.browser.test.tsx` and `colour-scheme.test.ts` are new; `Present.test.tsx`, `App.treatments.browser.test.tsx`, `viewport-frame.test.ts`, `ProductionControls.test.tsx` and `render-svg/index.test.ts` are extended.

### Verification

`bun run self:check` — green, 48/48 tasks.

The literal floor measured rather than asserted from memory: 542 literals across the four stylesheets at the baseline, 158 of them distinct, and zero now. The checker's own coverage assertions hold at 85 distinct role references across the union.

Both schemes read out of the browser rather than out of a stylesheet: the browser suites emulate `prefers-color-scheme` through a runner command and compare what the page resolved against the manifest, or — inside `apps/site`, where `site-does-not-own-product-model` forbids importing the model even in a test — against a probe element the browser computed.

Looked at, per `AGENTS.md`, from a real browser in both schemes, written to `reports/schemes/`: the website homepage, the Canvas guide page with its scheme gallery and chrome swatch strip, Studio in Design, and Present. The light scheme is readable rather than merely light; the authored blueprint drawing on the homepage stays blueprint under both, which is the ADR's claim rather than a defect; and the swatch strip moves with the switch.

### Outstanding concerns

**A resolved still rendering was repainted by the page it was inlined into.** The guide's own gallery is what showed it: a light drawing, a dark drawing and a deferring drawing rendered as three identical pictures. A presentation attribute loses to every CSS declaration, so `fill: var(--infoschematic-canvas-paint-backdrop)` in the Canvas stylesheet overrode the colours `--scheme dark` had baked in. Fixed by having every rendering declare the palette it resolved on its own root, scoped by a marker so a light and a dark drawing on one page do not reach each other. This is TOOL-117's contract, not this record's chrome, and it is flagged for that record's acceptance as much as this one's.

**The still renderer and Canvas disagree about the identity chip, and always have.** The renderer paints it from `annotationFill` — a contrast chip, dark on light paper — while `.infoschematic-card-identity rect` paints it from the backdrop at 88% alpha, a paper chip. Both predate TOOL-117; putting a still drawing beside a live one on the guide page is what made the disagreement visible. Out of scope here and captured as its own record rather than widened into this one.

**A scheme switch during a presentation is still reachable through Studio's header.** Present offers none of its own, as PRESENT-013 says, but Present inside Studio inherits Studio's. That is correct — the presenter is the one holding Studio — and is noted because the two records read as contradictory without it.

### Post-change review

The Goal is met: Studio, Present and the website resolve in both schemes; a reader switches from a header control on the two surfaces that have a header; the choice survives a reload and defers to the operating system while none is stored; nothing flashes; and an embedded Diagram still takes its scheme from its host.

Scope held to colour. The regression risk is concentrated in the stylesheet rewrite, where a role picked wrong looks perfectly correct in whichever scheme it was picked in — which is why the evidence is a browser reading the resolved value against the manifest, and four surfaces looked at, rather than a green suite. The `color: white` cluster is the proof that this failure mode is real and that reading the stylesheet would not have caught it.

Ready for acceptance on that evidence, with the identity-chip parity gap accepted as pre-existing and separately captured.

### Mini recap

Delivered: 36 chrome roles in two schemes, 542 literals removed from four stylesheets, a shared scheme switch on the two surfaces that own a header, a pre-paint step so nothing flashes, and a check that fails when a literal returns.

Verified: a green `self:check`, a measured before-and-after literal count, browser cases that ask the page what it resolved, and all four surfaces captured from a real browser in both schemes into `reports/schemes/`.

Concerns: a resolved rendering was being repainted by its host page and is now fixed — TOOL-117's contract, worth its reviewer's attention; the identity chip's renderer/stylesheet disagreement is pre-existing and goes to its own record.

Learning routes, proposed and not taken: that a presentation attribute loses to any CSS declaration, so a "resolved once" rendering has to declare what it resolved, belongs with `AGENTS.md`'s existing passage about looking at output. The identity-chip gap belongs in a Triage record. Neither is promoted here.

## Done

Studio, Present, and the website resolve in both colour schemes with no raw colour literals left in their stylesheets; each carries a scheme switch that reports its state accessibly; a choice survives a reload and defers to the operating system when the reader has expressed none; no reader sees a flash of the wrong scheme; and an embedded Diagram still takes its scheme from its host.

## Discussion

### Why this is not folded into TOOL-117

The two halves fail differently. The drawing's palette is a token problem with a generator and a parity check already around it; the chrome is 534 literals across four stylesheets with no variable layer beneath them. Delivered as one change, the review would be dominated by mechanical recolouring and the palette decisions would go unexamined. Delivered in order, each half has a reviewable claim.

### Where the switch belongs

Raised by the owner on 2026-09-21: the scheme should be switchable from an icon in the header of the component overall, not only inherited from the operating system. Studio's title bar is the header that exists; the website's is the one every reader of the public outlet sees. The unresolved part is Present, where a scheme change mid-presentation is a change the Audience sees, and pinning the scheme before starting may be the better answer.
