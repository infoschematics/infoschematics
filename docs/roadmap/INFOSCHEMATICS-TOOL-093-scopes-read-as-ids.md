---
id: INFOSCHEMATICS-TOOL-093
area: TOOL
title: Scopes read as ids
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 364ce600cd25fb9c1eb596487ff7b8862b4d8064
created_at: 2026-09-19T12:10:00Z
updated_at: 2026-09-19T12:22:00Z
---

# Scopes read as ids

## Goal

Name an Architectural scope in the Present controls the way its author named it, so a reader meets `Pipeline` and `Edges` rather than `SCOPE-PIPELINE` and `SCOPE-EDGE`, and so the collapsed rail holds what it shows.

## Context

Found by user-acceptance testing on 2026-09-19 against the running playground, in two places that turn out to have one cause.

In the expanded control bank, the two scope buttons carry raw identifiers while every sibling bank — collections, Flow families, Scenes — carries human names. In the collapsed 48px rail the same identifiers are rendered as horizontal text inside a vertical strip: they set at a visibly larger size than the Scene and Story entries beneath them, wrap, and clip at the rail's edge.

Both come from `prefix`. `packages/view-model/src/runtime.ts:688` sets a scope's runtime `prefix` to `scope.id`, and `:702` does the same for a Flow family. The two Present panels then render that `prefix` as the button's visible text, even though `scope.label` is authored, is already the button's `aria-label`, and is already half of its `title`. Flow families read acceptably only by accident: the showcase's family ids are the words `stream` and `control`, so their ids happen to look like names.

`prefix` is not decorative and is not wrong in itself. `packages/view-studio/src/app/App.tsx:693` and `:1177` use it to mint the next code when an author creates a Card or a Flow, and `ModelRegister` shows it as a code prefix, which is what it is. The authored schema has no `prefix` field for a scope or a family, so `id` is the only value available and the derivation is reasonable. The defect is showing a code prefix where a name belongs.

The rail's clipping has a second contributor. `PanelRail.tsx:36` draws a registered scope icon when the host provides one and falls back to the prefix text when it does not, and `scopeIcons` is a host extension point that nothing in this repository registers — so every reader of the playground and of Site takes the fallback path despite `icon: pipeline` and `appearance.icon: edge` being authored on the showcase's scopes. `.panel-rail .rail-scope` also overrides the rail's `writing-mode: vertical-rl` back to `horizontal-tb`, which is right for an icon and wrong for a word in a 48px column.

## Boundary

This changes what the Present scope and family controls display, and how the collapsed rail sets that text. It does not remove or repurpose `prefix`: code minting and the model register keep reading it. It does not add a `prefix` field to the authored schema, register any scope icons, change which scopes exist or what toggling one does, alter the rail's width, or touch the Diagram surface.

## Current state

`RuntimeScope` and `RuntimeFamily` both carry `prefix` and `label`. `PanelRail.tsx:49` renders `{ScopeIcon ? <ScopeIcon … /> : scope.prefix}`; `ProducerControls.tsx:52` renders the icon and then `{scope.prefix}` unconditionally, and `:72` renders a colour swatch and then `{family.prefix}`. `ShortcutOverlay.tsx:116` and `:133` render the same values inside `<kbd>`, but alongside the label in the same row, so no reader of that legend is left naming a scope by its id. `ModelRegister.tsx:126` renders `{scope.prefix}` as a code prefix, which is correct and stays.

`.panel-rail button` sets `writing-mode: vertical-rl` at 11px; `.panel-rail .rail-scope` resets it to `horizontal-tb` and centres its content with `display: grid; place-items: center`.

## Steps

- [x] Render `scope.label` rather than `scope.prefix` in `ProducerControls`, keeping the icon before it where one is registered.
- [x] Render `family.label` rather than `family.prefix` in `ProducerControls`, keeping the swatch.
- [x] Render `scope.label` in `PanelRail`'s fallback, and set the scope button to the rail's vertical writing mode when it is showing text, so a name runs down the rail and an icon stays upright.
- [x] Examine `ShortcutOverlay`'s rendering of the same field and leave it alone — see the Discussion topic on why the overlay is not a third instance.
- [x] Cover both panels with cases that assert the authored label is what is drawn, using a fixture whose id and label differ, so an id that happens to read as a word cannot make the case pass.
- [x] Render the collapsed rail and look at it: two scope names whole, inside the rail, nothing clipped.

## Files touched

- `packages/view-studio/src/app/panels/PanelRail.tsx`
- `packages/view-studio/src/app/panels/ProducerControls.tsx`
- `packages/view-studio/src/styles.css` — `.panel-rail .rail-scope`
- `packages/view-studio/src/app/panels/ProductionControls.test.tsx` — the shared case file covering both panels

## Verify

`bun run self:check`, and open the playground in Present mode: the scope bank reads `Pipeline` and `Edges`, the family bank reads `Carries media` and `Controls`, and the collapsed rail shows both scope names whole, running down the strip, with nothing past its edge.

## Dependencies / blocks

None. `INFOSCHEMATICS-TOOL-094` was raised in the same acceptance pass and touches the Diagram rather than the panels; the two can land in either order.

## Documentation impact

### Decision Records

None. Displaying an authored label instead of a derived code prefix corrects a slip in two components; it settles nothing durable that a future reader would need the reasoning for.

### Specifications

None. No behaviour-level contract changes: the specification corpus governs notation and view behaviour, and neither names the text a scope control carries.

### Guides

None. No guide instructs a reader to identify a scope by its id, so nothing written becomes untrue.

### Roadmap

None beyond this record. The unregistered `scopeIcons` extension point is noted in Discussion as an observation, not as work this item takes on.

## Review

### Delivered

Every Step, within the stated Boundary. `prefix` is untouched as a field and still mints codes in `App.tsx` and reads as a code prefix in `ModelRegister`; no scope icons were registered and the schema gained nothing. Baseline `364ce600cd25fb9c1eb596487ff7b8862b4d8064`.

### Summary of changes

`ProducerControls.tsx` now renders `scope.label` and `family.label` in the two banks. `PanelRail.tsx` renders the scope's label inside a `rail-scope__name` span when no icon is registered, and `.panel-rail .rail-scope__name` in `packages/view-studio/src/styles.css` gives that span the rail's `writing-mode: vertical-rl` — the button itself stays `horizontal-tb`, so a registered icon is still drawn upright. One departure from the plan: `ShortcutOverlay` was examined and deliberately left unchanged, for the reason recorded in Discussion.

### Verification

`bun run self:check` — 48 of 48 tasks successful. `packages/view-studio` suite: 22 files, 120 cases, green.

The new case was proved non-vacuous by putting `prefix` back in all three places and rerunning: 2 failed, including `expected '<section aria-label="Infoschematic co…' to contain '>Scope one</button>'`. Both files were restored from copies taken before the experiment.

### Outstanding concerns

None blocking. The fixture in `ProductionControls.test.tsx` authors `prefix: 'ONE'` through `defineInfoschematic`, which is the compatibility path rather than the YAML loader — the YAML path has no authored prefix and derives it from the id, so the assertion covers the stronger case (label, id and prefix all distinct) than production currently produces.

### Post-change review

The Goal is met on both surfaces and nothing outside the Present panels moved. Regression risk is low and confined to layout: the rail's scope buttons now set vertically, which makes the rail's height depend on how long the scope names are. A very long label would push the Sequence group down the strip and eventually off it. That is the trade for holding an arbitrary authored name in 48px: the Scene entries avoid it by staying horizontal at 8px and wrapping, which works for a fixed-shape code like `SCENE-01` and would not work for prose. Acceptance needs a look at the running rail, which the Verify line asks for.

### Mini recap

Two Present controls were showing a code prefix where a name belongs, because the runtime derives that prefix from the scope's id. They now show the authored label, and the collapsed rail runs it down the strip instead of wrapping and clipping. No schema or code-minting behaviour changed. What this surfaced and did not take on: `scopeIcons` is an extension point nothing in this repository registers, so the fallback branch is the only branch a reader ever meets.

## Discussion

### Why the two reports are one item

The rail and the bank are separate components with separate stylesheets, but both render the same field for the same reason, and a fix to one that left the other showing ids would leave the product inconsistent with itself in the same session it was reported. The rail additionally needs a writing-mode correction, which is one rule.

### What `prefix` is for

It is the code prefix an author's next element is numbered from — `CARD-01`, `FLOW-03`. For a scope and a family the runtime has nothing better to derive it from, because the authored schema does not carry one, so it uses the id. That derivation is only visible as a defect because two panels treat it as a display name. Whether a scope should be able to author a distinct prefix at all is a separate question and is not raised here, since no authored diagram currently mints codes per scope with an id it would want spelled differently.

### The icon fallback nobody reaches past

`scopeIcons` is a renderer-registry extension point, and no host in this repository registers one, so the authored `icon: pipeline` and `icon: edge` are inert everywhere they are read. That is not this item's work — registering a default icon set is a design decision with its own consequences — but it is worth recording that the fallback branch is the only branch in practice, which is why the fallback's legibility matters more than its being a fallback suggests.

### Why the rail's scopes set vertically and its Scenes do not

`.rail-pathway` is `horizontal-tb` at 8px in a 30px column, so `SCENE-01` wraps at its hyphen into two short lines and fits. That works because a Scene code has a known shape. A scope carries whatever its author called it, so the same treatment would wrap `Pipeline` mid-word or clip it, which is the reported defect in a smaller font. `.panel-rail button` already sets `writing-mode: vertical-rl` — the rail's own default, which `.rail-scope` had overridden — and a vertical name holds any length the rail is tall enough for.

### Why the overlay is not a third instance

`ShortcutOverlay` renders `scope.prefix` too, which is why the plan named it. Looking at it, its row is `swatch + <kbd>prefix</kbd>` followed by `label — description` in the `<dd>`: the name is already there, so no reader of that legend is left identifying a scope by its id. What is wrong there is the element — a code prefix is not a keyboard key and does not belong in `<kbd>` — and that is a different defect from the one reported, with a different fix. Changing it here would have widened the Boundary to make a point the Goal does not make, so it was left, deliberately rather than by omission.
