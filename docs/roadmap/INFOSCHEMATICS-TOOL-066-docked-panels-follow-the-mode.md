---
id: INFOSCHEMATICS-TOOL-066
area: TOOL
title: Panels follow the mode
theme: tool
horizon: now
status: ready
blocks: [INFOSCHEMATICS-TOOL-063]
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T14:05:00Z
updated_at: 2026-09-16T10:45:00Z
---

# Panels follow the mode

## Goal

Make switching into Design or Direct open the docked panels those modes work in, so a mode switch lands a Producer somewhere they can work rather than on a collapsed rail with nothing in it.

## Context

The Studio panel dock collapses to a rail and remembers that choice per document, defaulting to collapsed. Present needs nothing from the dock — the Infoschematic is the whole surface — so collapsing it there is the right default and is what a Producer will have left it on. Design and Direct are the opposite: the properties for the element in hand, the tools row, the interaction-layer controls, and the Scene being composed all live in the dock, so entering either while collapsed hides the half of the mode that does the work.

Raised directly: "we could do with the docked sidebar populating for the design and direct mode, so switching modes maybe should force the expanded view."

Reading the tree confirms it and adds two facts the original shaping did not have. The collapsed dock in a Producer mode is not a narrow rail with fewer controls — it is an empty 48-pixel column, because `PanelRail` renders nothing outside Present and the panel itself is `display: none`. And the rendered suite already operates those hidden controls by selector, so `packages/view-studio/src/app/App.browser.test.tsx` is green over a surface a person cannot reach at all.

## Boundary

This item changes when the dock is open, what the collapsed rail offers in a Producer mode, and which tab the dock lands on when a mode is entered. It does not change the panels' content, the mode set, what any mode can do, or the persisted collapse preference as a preference — a Producer who collapses the dock inside Design must stay collapsed.

## Current state

- `packages/view-studio/src/app/App.tsx:272` holds `collapsed` in `usePersistentState(storage && \`${storage}.panels.collapsed\`, true)`, where `storage` is the document id from `compatibilityConfig.id` at `:271`. It is `localStorage`-backed through `packages/view-studio/src/app/hooks/use-persistent-state.ts:33` and defaults to collapsed. The record's original claim holds.
- `App.tsx:1161` renders `PanelRail` when collapsed — but the dock's content is not swapped out with it. `DetailsPanel` at `:1163` is rendered unconditionally inside the same `<aside className="details-panel">` at `:1160`, and `packages/view-studio/src/styles.css:393` hides it with `.control-room.collapsed .producer-controls, .control-room.collapsed .state-panel { display: none }`. Collapse is a cascade state over a mounted panel, not a render branch, and that distinction decides how any new test has to assert.
- `packages/view-studio/src/app/panels/PanelRail.tsx:20` returns `null` unless `presentation.mode === 'present'`. So in Design or Direct with the dock collapsed, the 48-pixel rail column that `styles.css:389` reserves is empty, every control the mode owns is `display: none`, and the only route back is the title bar's **Show panels**. `styles.css:437` declares `.panel-rail .rail-restore`, which no component in the repository uses — a rail restore control was intended and does not exist.
- `packages/view-studio/src/app/panels/TitleBar.tsx:19` lists the modes as `['present', 'design', 'direct']` and `:114` switches with `presentation.setMode(mode)`, with no side effect on the dock. The record's claim holds. Worth adding: the dock toggle is TitleBar's too — it takes `collapsed` at `:38` and `onToggleCollapsed` at `:39`, wired from `App.tsx:957`, and renders the **Show panels** / **Collapse panels** button at `:136`–`:148`. A transition hook can therefore sit in `App.tsx` beside the state or in the mode handler TitleBar already calls.
- `packages/view-studio/src/app/hooks/use-presentation.ts:68` dispatches `{ mode, type: 'set-mode' }` into `reduceProduction` from `@infoschematics/view-present` (`packages/view-present/src/production.ts:101` and `:135`), and nothing relates the mode to the collapse state. The record's claim holds. Worth adding: the comment at `use-presentation.ts:35` states that production mode is deliberately not persisted, and `DESIGN-001` in `docs/specs/design-session.md:9` requires every reload to begin in `present`. A reload can therefore only ever restore the dock preference, never the mode that opened the dock — so "the preference surviving a reload" is a statement about `present`, not about Design.
- The tab question is narrower than the original shaping assumed. `packages/view-studio/src/app/panels/DetailsPanel.tsx:666`–`:674` derives the tab set from the mode: Present offers Info, Specifications and optionally Source; Design offers a single Design tab and optionally Source; Direct offers `directKinds` (`:63`) and optionally Source. Only Present persists a choice, in `sessionStorage`, at `:386`. There is no per-mode tab to pick for Design, because Design has one.
- What does survive a mode switch is `sourceOpen`, a plain `useState(false)` at `DetailsPanel.tsx:390` that only the tab buttons at `:707` and `:709` ever set. `:722` gives it priority over the mode's own panel, so leaving Present with the Source tab open and entering Design shows the YAML source rather than the Design tools. That, and not "which tab", is the landing defect.
- `App.browser.test.tsx:488` is the evidence `DESIGN-018` cites. It clears `localStorage`, clicks Design, and then reads and clicks `button[aria-label="Cards interactive"]` — a control inside `.state-panel`, which is `display: none` for the entire test because the dock defaults to collapsed. It passes on presence. `App.treatments.browser.test.tsx:37`–`:43` is the only helper in the package that clicks **Show panels** first, and it has to, because it computes styles. This is the "a passing suite is not evidence that output looks right" case in its purest form.
- `docs/specs/presentation.md:91` `PRESENT-009` is the only requirement governing the collapsed layout, and it is scoped to Present View: the collapsed layout must retain reachable Scope, Family and Sequence controls, and the title bar must retain a restore control. Nothing anywhere in `docs/specs/` says what the dock does on entering a Producer mode, so this item is adding stated behaviour rather than correcting it.

## Steps

1. Decide the preference model and record it: one persisted `<storage>.panels.collapsed` that a Producer-mode entry overrides for the visit, or a per-mode preference, or opening only when the dock has never been touched for the document. Decide in the same breath whether the collapsed rail in Design and Direct should gain the mode's compact controls and a restore button — if it does, forcing the dock open may not be needed at all. Verifiable by a Decision Record under `docs/decisions/` naming the chosen model, indexed in `docs/decisions/README.md`.
2. Reset `sourceOpen` in `packages/view-studio/src/app/panels/DetailsPanel.tsx` when `presentation.mode` changes, so entering a mode lands on that mode's own panel rather than on whatever tab was last open. Independently shippable and the smallest real part of the fix. Verifiable by a rendered case that opens Source in Present, switches to Design, and asserts the Design tools row is showing and the Source panel is not.
3. Open the dock on the transition into Design or Direct in `App.tsx`, keyed on the previous mode rather than held open continuously, so a Producer who collapses it while inside the mode is not overridden on the next render. Verifiable by a rendered case that enters Design, collapses the dock, and asserts it stays collapsed across a re-render and a selection change.
4. Apply the step 1 answer to leaving a Producer mode: either restore what the Producer had in Present or leave the dock as they left it. Verifiable by a rendered case covering Present → Design → Present and asserting the persisted `<storage>.panels.collapsed` value in `localStorage` directly, not just the rendered class.
5. Implement whatever step 1 decided about the collapsed rail in a Producer mode: either give `packages/view-studio/src/app/panels/PanelRail.tsx` a Design and Direct branch plus the `rail-restore` control that `styles.css:437` already styles, or delete that dead rule and state in the specification that the collapsed rail is a Present affordance. Verifiable either by a rendered case finding a restore control in the rail in Design, or by `scripts/stylesheet-shadowing.test.ts` and `bun run --cwd packages/view-studio test` staying green after the rule goes.
6. Make the existing suite honest. Change the layer-control case at `App.browser.test.tsx:488` — and any other case that operates a dock control without expanding it — to reach its controls the way a person does, and assert reachability rather than presence: `getComputedStyle(control).display`, or `control.offsetParent`, either of which fails on a `display: none` ancestor while `querySelector` does not. Verifiable by reverting step 3 locally and confirming the case now fails, then restoring it.
7. Cover each transition in the rendered matrix: Present collapsed → Design opens, Design collapsed by hand → stays collapsed, Design → Direct, Direct → Present, and a reload beginning in `present` with the persisted preference intact. Verifiable by `bun run --cwd packages/view-studio test:browser`.
8. State the new behaviour in the specification corpus: amend `PRESENT-009` in `docs/specs/presentation.md` to say the collapsed layout is a Present affordance and what a Producer mode does on entry, or add a new requirement to `docs/specs/design-session.md` beside `DESIGN-001` and `DESIGN-004`, which already own mode-transition behaviour. Verifiable by `bun run self:verify:repo`, which runs the corpus integrity suites under `scripts/`.

## Files touched

- `packages/view-studio/src/app/App.tsx` — the collapse state and the mode-entry transition
- `packages/view-studio/src/app/panels/DetailsPanel.tsx` — resetting `sourceOpen` on a mode change
- `packages/view-studio/src/app/panels/PanelRail.tsx` — a Producer-mode branch, if step 1 chooses one
- `packages/view-studio/src/styles.css` — the `.panel-rail .rail-restore` rule, either used or removed
- `packages/view-studio/src/app/panels/TitleBar.tsx` — only if the transition is placed in the mode handler rather than in `App.tsx`
- `packages/view-studio/src/app/App.browser.test.tsx` — the transition matrix and the honesty fix to the existing layer-control case
- `docs/specs/presentation.md` or `docs/specs/design-session.md` — `PRESENT-009` amended, or a new requirement added
- `docs/decisions/ADR-INFOSCHEMATICS-0NN-<slug>.md` — **new**, number allocated at delivery
- `docs/decisions/README.md` — the index entry for that record

No new source file is required. Every path above exists except the Decision Record. Note that the original shaping named `docs/specs/design-session.md` alone; the requirement that actually governs the dock is `PRESENT-009` in `docs/specs/presentation.md`, and step 8 chooses between them.

## Verify

Run `bun run --cwd packages/view-studio test` and `bun run --cwd packages/view-studio test:browser` while iterating, then `bun run self:verify:repo` for the corpus, then `bun run self:check`, because `test:browser` is the last stage of that gate and the new cases must survive the full run.

Prove the new cases could fail. Revert the step 3 transition locally and confirm the Present-to-Design case fails; restore it. Then confirm the step 6 change is doing work: put the old `querySelector`-only assertion back and confirm it passes with the transition reverted, which is exactly the false green this item exists to remove.

Then render the three modes and look at each, because the fault being fixed is one a green suite did not show. Run `bun run self:dev` — it builds every package before starting the site, which resolves `@infoschematics/view-studio` from `dist`, so a plain `bun run ki:site:dev` will show the previous build. Open `http://localhost:4173/playground/`, and with the browser's application storage for that origin cleared first so the dock starts at its real default:

- In **Present** with the dock collapsed, confirm the rail still shows the Scope, Family and Sequence controls `PRESENT-009` requires, and that the Infoschematic has the full width.
- Click **Design**. The dock must open, and it must open on the Design tools and Properties, not on Source. Read what is in it: the tools row, the interaction-layer buttons and the Properties panel should all be visible without scrolling at a normal window size.
- Still in Design, click **Collapse panels**. Confirm it collapses and stays collapsed — select a Card, move it, and confirm the dock does not spring back open on the re-render. Then confirm the collapsed rail is either usefully populated or honestly empty per the step 1 decision, and that there is some way back other than the title bar if that is what was decided.
- Click **Direct**. Confirm the dock opens on a Direct target chooser with a target selected, not on an empty panel, and not on Source.
- Open the **Source** tab in Direct, then click **Present** and then **Design**. Design must show its own tools, not the YAML — this is the `sourceOpen` defect and it is invisible to any test that only looks at the tab strip.
- Return to **Present** and confirm the dock is in the state step 1 decided, then reload the page and confirm Studio comes back in Present with the persisted dock preference and no leftover Producer state, as `DESIGN-001` requires.

## Dependencies / blocks

No hard dependency.

`INFOSCHEMATICS-TOOL-063` edits `packages/view-studio/src/app/App.tsx` and `packages/view-studio/src/app/App.browser.test.tsx` as well, and both items expect the next unused `ADR-INFOSCHEMATICS-0NN` plus a new index entry in `docs/decisions/README.md`, so in parallel they collide on a number and on two files. This item is much the smaller of the two and it makes the other one's manual verification honest — until the dock opens with the mode, checking a Point's Design behaviour by hand means remembering to press **Show panels** first, and the Point layer control is `display: none` until someone does. Delivering this one first is the cheaper order.

## Documentation impact

### Decision Records

One is expected, for step 1. It was originally judged unlikely, and reading the tree changed that: the choice is not only whether the preference becomes per-mode, but whether the collapsed rail is a Present-only affordance that Producer modes inherited by accident. Both halves outlive the change and both are read by `PRESENT-009`, so they belong in a record rather than in a comment. It takes the next unused `ADR-INFOSCHEMATICS-0NN` and an index entry in `docs/decisions/README.md`.

### Specifications

One requirement changes, in the delivery, and step 8 chooses which. Either `PRESENT-009` in `docs/specs/presentation.md` is amended to scope the collapsed layout to Present and state what a Producer mode does on entry, or a new requirement joins `docs/specs/design-session.md` beside `DESIGN-001` and `DESIGN-004`, which already own transient mode state and mode-transition cleanup. The `docs/specs/design-session.md`-only plan in the original shaping was wrong: the dock contract is not in that file today.

### Guides

Deferred, per this repository's practice of landing the feature first and capturing site prose as its own record. `apps/site/content/studio.md` gains a sentence about the dock opening with the mode, and `apps/site/content/present.md` keeps its account of the collapsed layout — neither in this delivery.

### Roadmap

One new Triage record for the Guides work above. No change to any existing record beyond this one.

## Discussion

### Is the fix that the mode opens the dock, or that the rail stops being empty

The item is framed as a mode transition opening the dock, and that framing may be treating a symptom. `PRESENT-009` designed the collapsed layout for Present: a 48-pixel rail carrying Scope, Family and Sequence controls so an audience-facing Infoschematic can take the whole window and still be filtered. `PanelRail` enforces that scope literally, returning `null` outside Present, so the Producer modes inherited the _geometry_ of the collapsed layout with none of its content. That is why collapsed Design is not a compact Design — it is a blank strip, and a dead `.panel-rail .rail-restore` rule in the stylesheet suggests someone once meant to put at least a restore button in it.

If the rail gained a Design and Direct branch — a restore control, and perhaps the layer toggles and the selection identity, which are small enough to fit — then collapsed Design would be a usable narrow mode rather than a dead end, and forcing the dock open would be an override a Producer did not ask for and cannot see coming. If the rail stays Present-only, then the mode must open the dock, because there is no other way to reach the mode's tools, and the persisted preference has to bend on entry.

The two answers differ in what this item touches, and the difference is not small. Opening the dock is a handful of lines in `App.tsx` plus the `sourceOpen` reset. Populating the rail is a new compact control surface for two modes, a decision about what belongs in 48 pixels, and an amendment widening `PRESENT-009` rather than narrowing it. Step 1 has to settle it before step 3 or step 5 is written, and the answer also decides whether the persisted preference needs to change at all: a usable collapsed Design does not need a per-mode preference, because collapsed is no longer a failure state.

### How long should a forced open be remembered

Secondary but genuinely unresolved, and it only matters if step 1 chooses to force the dock open. If entering Design writes `<storage>.panels.collapsed = false`, then one visit to Design permanently changes what Present looks like for that document — the opposite of the "Present needs nothing from the dock" premise this item is built on. If it does not write, the dock opens on every entry to Design for the rest of time, including for the Producer who has deliberately collapsed it in Design ten times. The middle answer is per-session memory: force it open on the first Producer entry of the session and respect the Producer's choice after that. Mode is already session state and deliberately unpersisted (`use-presentation.ts:35`, `DESIGN-001`), so a session-scoped dock decision would sit naturally beside it in `sessionStorage` through the `useSessionState` hook that `DetailsPanel` already uses — but that introduces a third lifetime for panel state, next to `localStorage` for the preference and plain `useState` for `sourceOpen`, and three lifetimes for one panel is the kind of thing that needs to be chosen deliberately rather than accumulated.
