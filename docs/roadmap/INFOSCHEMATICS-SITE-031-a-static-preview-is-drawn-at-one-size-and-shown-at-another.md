---
id: INFOSCHEMATICS-SITE-031
area: SITE
title: A static preview is drawn at one size and shown at another
theme: site
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 894a16b772b60fb770b64b3ac2b41977a338e60f
created_at: 2026-09-19T11:58:00Z
updated_at: 2026-09-19T14:02:00Z
---

# A static preview is drawn at one size and shown at another

## Goal

Make a docs specimen read the same whether a reader meets it in Rendered or in Design, so the mode a reader arrives on is not the weaker drawing.

## Context

Found by user-acceptance testing on 2026-09-19, and carried out of `INFOSCHEMATICS-SITE-030` where the comparison was made. The reported judgement was that switching a specimen to Design looked closer to the intended reading than Rendered, which is the mode a page opens on.

Put side by side on the Cards specimen, the two modes differed in three ways. Design draws the canvas boundary as a visible edge and Rendered does not. Design carries the viewport controls, which is correct and not at issue. And Design's grid was crisper: Rendered was a fixed-size drawing produced by `renderInfoschematicSvg`, encoded as a data URI and handed to an `img`, which fits it to whatever box the preview has.

The third is the substance of the report. It is Site-owned — Site chooses how it presents the result — but it is not a treatment defect in any renderer, and no authored specimen is wrong.

## Boundary

This is about how Site produces and presents a static preview, not about what either renderer draws. It does not change the authored specimens, the visual language, the Design mode's editing affordances, or the viewport controls. It does not remove the Rendered mode: the static drawing is what `infoschematics render` produces and a reader should be able to see it. It does not change `render-svg`, and the markup a reader now sees is byte-for-byte the string the command writes to a file.

## Current state

`apps/site/src/StaticInfoschematic.tsx` places renderer output in the page. Three surfaces use it: the Rendered half of `DemoFrame`, the component tour's stills in `VisualGuide`, and the labelled example in `OverviewAnatomy`. No Site page carries a `data:image/svg+xml` reference, and the pages that never had one keep the assertion that says so.

Each host takes a `resourceIdPrefix`. `DemoFrame` derives one per mount from `useId` and appends the variant's id; the tour names each still after its component; the labelled example names itself.

## Steps

- [x] Put the renderer's output in the page rather than behind an `img`, so it is laid out at the size it is shown.
- [x] Give each inlined drawing its own resource namespace, since SVG resolves a reference to the first match in document order rather than the nearest.
- [x] Keep each drawing's accessible name what it was: a name on the labelled example, decoration in the tour, the renderer's own name where the live Canvas gives the same one.
- [x] Replace the `object-fit` fit with a box that keeps the drawing's own proportions, so the caption's proximity argument from `INFOSCHEMATICS-SITE-030` survives.
- [x] Measure the thing that was reported rather than asserting it: the same specimen resolves to the same scale in both modes.

## Files touched

- `apps/site/src/StaticInfoschematic.tsx` — new; `apps/site/src/StaticInfoschematic.test.tsx`
- `apps/site/src/visual-guide/DemoFrame.tsx`, `apps/site/src/VisualGuide.tsx`, `apps/site/src/OverviewAnatomy.tsx`
- `apps/site/src/visual-guide/DemoFrame.css`, `apps/site/src/styles.css`
- `apps/site/src/visual-guide/DemoFrame.browser.test.tsx`, `apps/site/src/VisualGuide.test.tsx`, `apps/site/src/OverviewPage.test.tsx`
- `docs/specs/static-rendering.md` — `STATIC-015` gains the new host as verification and evidence

## Verify

`bun run self:check`, then open a component page and switch a specimen between Rendered and Design: the drawing keeps its weight and its grid across the switch, and the only differences left are the canvas edge and the viewport controls. Narrow the window and switch again — both modes shrink together.

## Dependencies / blocks

None. `INFOSCHEMATICS-SITE-030` removed the letterboxing that put the two modes in differently shaped boxes and landed first; this depends on that having happened but changes none of it.

## Documentation impact

### Decision Records

None. How Site embeds renderer output is a hosting choice inside one application, not a durable product trade-off — and the property that makes it safe, host-owned resource namespacing, is already decided and recorded as `STATIC-015`.

### Specifications

No new requirement. The corpus has no `SITE` area by design: Site is an outlet for this repository rather than an owner of product behaviour, so a requirement about where a drawing is placed in one application's markup would be misfiled. `STATIC-015` gains `apps/site/src/StaticInfoschematic.test.tsx` in its Verify and Evidence, because inlining is what the requirement exists for and this adds a second host that depends on it.

### Guides

None. No guide or Site page described how a preview was embedded.

### Roadmap

None raised. The canvas-edge difference the Context records is left as it was, for the reason the original Discussion gave: an editing surface has an edge a Producer drags against and a published drawing does not, so it is a deliberate difference rather than a defect.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `894a16b772b60fb770b64b3ac2b41977a338e60f`.

The Shaping left one question for the user: whether Site should render at the display size, or ask `render-svg` for a grid and stroke weight in output pixels. Under the instruction to progress every open item to `done`, it was decided here, and it is flagged for the next testing pass.

**Neither, as posed — the drawing is placed in the page instead.** Both options in the Shaping accept that the drawing goes through an `img` and work around the consequences. Removing the `img` gets what the first option wanted — a drawing laid out at the size it is shown — without a resize observer, without a set of breakpoint widths, and without a different drawing per viewport. The second option was the one worth refusing outright: expressing stroke weight in output pixels would make what `infoschematics render` writes depend on where the caller intended to display it, which is a change to the product's output for a defect in one website's markup.

The cost is that Site's page weight rises: three surfaces now ship SVG markup in the HTML rather than a URI-encoded reference. The labelled example is the largest, and it was already URI-encoded inline in the same document, so the change there is close to neutral; the eight tour stills are the real addition.

### Summary of changes

`StaticInfoschematic` renders `renderInfoschematicSvg` output through `dangerouslySetInnerHTML`, guarded by the same reasoning `InlineSvgReference` already carries: the markup is produced locally, XML-escapes authored values, and emits no script or inline event attributes.

It takes a required `resourceIdPrefix`, required rather than defaulted because the failure it prevents is silent. SVG resolves `url(#…)` to the first matching definition in document order, so two drawings sharing a prefix both paint the first one's grid and arrowheads — correct-looking markup, wrong output. An `img` never had the problem, because each reference was its own document, so the hazard arrives with the change that removes it.

Naming has three cases and the prop has three states. A string names the whole host, which takes `role="img"` with it so assistive technology does not descend and announce the drawing's own name as well. `null` marks the drawing decoration, which is what the tour's stills were as `alt=""`. Omitted, the renderer's root keeps the name it already emits — `"<title> structural Infoschematic"` — which is the same name the live Canvas gives the same specimen, and therefore the right default for the Rendered half of a frame whose other half is that Canvas.

The stylesheet stopped fitting a painted area inside a larger box. `object-fit: contain` with `object-position: center bottom` existed because an `img`'s box and its drawing were different shapes; an inline drawing keeps its own proportions, so the host aligns the box instead and the slack falls above it as before.

### Verification

`bun run self:check` — 48 tasks, all successful.

The reported symptom was "crisper", which cannot be asserted. What can be is the scale the two modes resolve to, and a browser case now reads `getScreenCTM()` from the Rendered drawing and then from the live Canvas after switching modes in the same box: both are `0.45`, agreeing to two decimal places. That case could not have been written before the change at all — there was no element in the page whose transform to the screen could be read, which is the same fact as the defect.

`StaticInfoschematic.test.tsx` covers the namespacing hazard directly: two drawings in one document, every marker and pattern id unique, every `url(#…)` resolving to a definition that exists. It also covers the three naming cases.

The caption case from `INFOSCHEMATICS-SITE-030` was rewritten rather than deleted, and got simpler: it had to reconstruct the painted rectangle from `naturalWidth`, `naturalHeight` and the resolved `object-position`, and now reads the element's own box, because with an inline drawing those are the same thing. Its assertions are unchanged.

Non-vacuity: every new assertion names `.demo-frame__rendered > svg`, `.visual-guide__anatomy-drawing` or `class="component-tour__preview"><svg`, none of which existed before, and the three page tests assert `data:image/svg+xml` is absent where it was previously present.

### Outstanding concerns

None blocking. Three worth stating.

The scale is `0.45`, and inlining does not change that. A drawing about 1200 units wide shown in a 520-pixel box is still drawn at 0.45, so a one-unit stroke is under a CSS pixel in both modes. What has changed is that it is now resolved as vector at device resolution rather than resampled from a fixed-size image, and that the two modes agree. If the strokes are still too light at narrow widths, that is a different item and a renderer-level one — and it is the question the Shaping's second option was really asking, now separable from this defect.

Page weight, as above. Eight tour stills are now markup rather than references. Nothing measures it, and if the components hub gets slow that is where to look first.

`resourceIdPrefix` in `DemoFrame` is `useId` plus the variant id. `useId` is unique per mount within a render pass but not across two independent server passes, which is the gap `view-canvas` documents for the same reason. Site renders each page in one pass, so it holds here; a future page that composed two passes would need explicit prefixes.

### Post-change review

The Goal is met for the case that was reported: the two modes are the same drawing at the same scale, and the differences left are the two the Context named as correct.

The risk in this change is the namespacing one, and it is worth being clear that it is new. Before, every static preview was its own document and could not collide with anything. Now they share one, and a collision produces a drawing that looks plausible — the second Fabric painted with the first one's arrowheads — rather than an error. The test asserts uniqueness and resolvability across two drawings, and the required prop means a new caller cannot omit a prefix, but neither stops a new caller passing a prefix that another already uses.

The second risk is that `dangerouslySetInnerHTML` now appears in three more places. The input is renderer output in all of them and the renderer's escaping is covered by `STATIC-012`, but the component is the boundary that holds that guarantee, and a caller passing something else through it would break it silently. The prop is typed as the renderer's own input rather than as a string, which is what prevents that.

### Mini recap

The Rendered half of a specimen was a fixed-size drawing handed to an `img` and fitted into a box of another size, so a reader met it resampled while the same specimen in Design was drawn in the page. The drawing is now placed in the page too — the identical renderer output, in three Site surfaces — so both modes resolve to one scale, which a browser case measures at `0.45` for each. The Shaping's two options were both declined: neither a resize observer nor an output-pixel stroke weight is needed once there is no image to fit. What the change brings with it is the resource-namespacing hazard that inline SVG always has, which is why every host must name its own.

## Done

Accepted 2026-09-19 by Kris Brown on the review packet above.

## Discussion

### Why this was not simply a Site stylesheet fix

`INFOSCHEMATICS-SITE-030` removed the letterboxing that made previews look wrong, and the two modes already occupied the same box at the same height. What remained was entirely about how the drawing got into that box, which no arrangement of the box changes — which is why it left that record rather than being absorbed into it.

### Why the renderer was the wrong place to fix it

The Shaping's second option — a grid and stroke weight in output pixels — would have made the renderer's output depend on the size the caller meant to show it at. `STATIC-016` already covers the one legitimate form of that, an explicit target size for responsive Card detail, and it is explicit for a reason. Generalising it to stroke weight would mean a drawing rendered for a website and the same drawing rendered for print differ in the thing a reader is most likely to notice, to fix a defect that only ever existed in one `img` tag.

### The canvas edge

Design's visible canvas boundary is the smaller remaining difference and is left alone. An editing surface has an edge the reader can drag against; a published drawing does not. It is recorded so the comparison is complete, not because it is presumed wrong.

### What an `img` was hiding

Each `data:` reference was its own document, so every static preview had a private namespace for its markers and patterns and could not collide with anything. That is a real property, and giving it up is the price of the fix — the collision it prevented is invisible when it happens, because the result is a drawing, just not the right one. Making the prefix required rather than defaulted is the smallest thing that keeps a caller from walking into it without noticing.
