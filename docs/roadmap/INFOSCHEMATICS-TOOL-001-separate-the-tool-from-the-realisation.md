---
id: INFOSCHEMATICS-TOOL-001
area: TOOL
title: Separate tool from realisation
theme: tool
horizon: now
status: in-progress
blocks: []
blocked_by: []
baseline_ref: 24eac6c6d931e7fbadb0a3fea8f616d5dfaec170
---

> Moved from `5g-emerge-ibc-2026` (as `IBC2026-DBD-018`) on 2026-09-02, when the tool's source moved to this repository and the dashboard became a host. Paths in this record predate the current workspace split: read `src/diagram/` as `workspaces/core/src/`, product-model paths as `workspaces/model/src/`, and other reusable application paths as `workspaces/app/src/`. Cross-references to IBC2026 decision records and specs resolve in the [5g-emerge-ibc-2026 repository](https://github.com/5g-emerge/5g-emerge-ibc-2026).

## Goal

Reorganise the source so the seams the extraction will cut along are stated by the layout, enforced by tooling, and free of the realisation's nouns — so that when [IBC2026-DBD-011](https://github.com/5g-emerge/5g-emerge-ibc-2026/blob/main/docs/roadmap/IBC2026-DBD-011-extract-the-diagram-framework.md) moves a part, moving it is moving a directory, not disentangling one.

## Context

The source is organised by kind, and the extraction needs it organised by ownership. `src/panels/`, `src/editor/` and `src/hooks/` sort files by what they are — component, editor surface, hook — while the seam that matters is whose they are: the framework's or this realisation's. The two biggest files mix the axes inside themselves: the root diagram component carries generic stage rendering, hand-placed fabric artwork and realisation wiring in one file, and the root entry carries the app shell and the editor's wiring in another. Only `src/diagram/` is close to sorted by ownership — and even it holds one file the import check cannot see: `StageOverlay.tsx` draws this realisation's demonstration figures with the stage's geography hardcoded as literals, so it passes the no-imports test while being authored material through and through. Import-clean is necessary and not sufficient; ownership is audited by reading, and a violation can hide in a literal.

This record takes the in-place refactoring `DBD-011` carried, so that record keeps the moves, the themes and the founding while this one polishes the tree they act on. The steps that moved: the boundary rule, the colour sorting and routing, the generic UI's decoupling from the topology, the scene and act types, and the fabric caption's single source.

A documentation consolidation thread is settling terminology in parallel. This record takes names from whatever it lands rather than coining any; where a term is unsettled when a rename would use it, the current name stays.

### The approach

One axis, stated once: directories say who owns a thing — the framework or this realisation — and kind sorts within, not across. The working shape to test, using the register the tool already has:

- The framework's side gathers what any consumer would take: the diagram geometry that is already clean, the generic surfaces now scattered through the panels and editor directories, and the hooks that serve them — each importing a configured vocabulary, never the topology.
- The realisation's side gathers what only this dashboard would keep: the authored model and layout, the fabric artwork, the partner and contract surfaces, the wiring that composes a published site out of the framework's parts.
- The boundary between them is mechanical from the day it is stated: the check that today guards `src/diagram/` by habit widens to every seam, so a crossing import fails a build rather than waiting for review to notice.

Named parts of the shape, as they are called out:

- **`src/app/`** holds the application itself — the graphical elements that compose this dashboard as a site, arranged atomic-design-style: the shell (an `App.tsx` taking most of what the root entry carries today, with the entry file thinned to mounting it), the chrome, and the composition that puts framework surfaces and authored model together on a page.
- **The stage** is what `topology-diagram.tsx` is once its lodgers leave: the component that draws the stage and everything on it. The generic renderer keeps the name the vocabulary already settled; the hand-placed fabric artwork goes to `src/library/`, and the wiring goes to `src/app/`.
- **`src/library/`** holds fabrics as reusable authored artwork — pieces a future realisation could take without taking this one's model. It may reach `src/diagram/`'s geometry and never `src/model/` or `src/config/`: a fabric that names this realisation is not reusable. (Decided by Kris, 2026-09-01, while the moves were underway.)
- **`src/diagram/`** stays the framework's geometry and loses its one lodger: `StageOverlay.tsx`'s figures are authored overlay material — this programme's arguments drawn at this stage's coordinates — and leave with the realisation's authored content; whether they join `src/library/` depends on whether they are reusable artwork or this programme's arguments, judged at the split.
- **`src/model/`** holds the specific model structures this realisation uses — what `src/topology/` carries today — including any types used outside the app: the shapes a configuration is authored against, which the editor emits and a fence compiles into. Those outward types are the part a consumer would hold in hand, so the move states which types are the realisation's own and which are the contract — `AGENTS.md`'s rule that `src/config/` stays data-only with its shapes declared in one place survives the move; only the place changes.

The layout is the claim and the tooling is the proof, in that order — a directory move that cannot be enforced was a guess, and the enforcement failing is the finding, not an obstacle to it.

The tooling is dependency-cruiser, chosen over a hand-rolled architecture test for what comes free: named declarative rules whose comments carry this record's sentences, cycle detection, reachability, and a rendered graph of the boundaries — the tool's own architecture drawable as a diagram. The baseline states today's boundaries and passes before the first file moves; every move thereafter tightens the rules in the same commit, so each step of the refactor is a provable claim rather than a hoped-for one.

### The tests stay, and move with their subjects

Seventeen `.test.` files sit beside what they test, and the question was whether they are needed or whether something like Playwright drives this instead. They are needed, and they are this record's safety net rather than its clutter: about two hundred tests run in under a second, `EDIT-059` requires the diagram be rendered by a test rather than only reasoned about, and a refactor whose every step claims "nothing visible changes" is exactly the work that wants a sub-second answer to "is that still true". Playwright would add a browser to verify a no-change refactor — the wrong instrument here, and worth revisiting only for the extracted tool, whose editor has interaction specifications a browser test could demonstrate.

So the tests move with their subjects, colocated as they are now, and the refactor re-points any that reach through internals at the boundaries the new layout states — a test that broke because a private arrangement changed was testing the arrangement, not the behaviour.

### Still to settle while this is shaped

- **`scripts/`** — three loose `.mjs` files (`check-interactive`, `status`, `verify-pages-output`); whether they move, gain a stated owner, or fold into package scripts belongs in this refactor rather than after it.
- **`docs/`** — the documentation folders are part of the tree being tidied, and the consolidation thread is in them now; what this record does about them is settled when it is made ready, against whatever that thread lands.

## Boundary

Nothing visible changes. Every step claims to change only where things are stated, so a screenshot before and after differs nowhere, and the published dashboard behaves identically throughout.

Nothing leaves. No new packages, no new repository, no extraction — this record ends with the same deliverable in the same place, arranged so the extraction after it is mechanical.

Nothing new is built. No themes, no fabric genres, no viewer build — capability stays with `DBD-011`; this record only sorts and states what exists.

Renames follow the settled vocabulary. The consolidation thread owns terminology; this record consumes it.

Delivery splits judgment from mechanics, per [GDR-IBC2026-002](https://github.com/5g-emerge/5g-emerge-ibc-2026/blob/main/docs/decisions/GDR-IBC2026-002-delegated-mechanical-work.md). The coordinating agent holds the design and the architecture — the axis, the target layout, what each move claims — and hands the moves themselves to cost-effective models as precise recipes: exact files, exact strings, the verification commands, and the instruction to report rather than improvise on any mismatch. One delegate at a time, the coordinator reviews the diff and makes the commit.

## Current state

The workspace split has established `workspaces/core/` and `workspaces/app/`, and several ownership moves are already complete. The React package still carries the first realisation's model and play behind a temporary `./model` export, so the tool/realisation boundary is not yet complete.

## Steps

- [x] Agree the axis and the target layout, and record the decision before the first file moves.
- [ ] Split the root diagram component along what it mixes — the stage as the generic renderer keeping the settled name, the fabric artwork with the authored material, the wiring to the app.
- [x] Found `src/app/` and break the root entry into it: the shell legible on its own, the entry thinned to mounting.
- [x] Regroup the scattered UI — panels, editor surfaces, hooks — by ownership, kind within.
- [ ] Found `src/model/` from `src/topology/`, separating the types used outside the app — the authored contract — from the model structures only this realisation keeps.
- [ ] Move each test with its subject, and re-point any that reach through internals at the stated boundaries.
- [ ] Decide what `scripts/` and the `docs/` folders become, once the consolidation thread has landed.
- [ ] Replace the generic surfaces' topology imports with a configured vocabulary, so they describe a model rather than this model.
- [ ] Make a scene one type where there are three, and give an act a type of its own.
- [ ] Give a fabric's caption one home, so the register and the stage cannot print different names for it.
- [ ] Name the colour decisions into tokens and route the authored colours — taxonomy and lanes — through the same layer, leaving new theme sets to `DBD-011`.
- [ ] Baseline dependency-cruiser on today's boundaries before the first move, then widen it to every seam the new layout states — and audit each framework-side file by reading for ownership an import check cannot see.
- [x] Move `StageOverlay.tsx`'s figures out of `src/diagram/` with the rest of the authored material.

## Delivery so far

Recorded as the moves land, one commit per move, each verified green (boundaries, 211 tests, types, knip, build) before committing:

- `765190d` — `src/topology/` → `src/model/` (13 files) and `src/assets/partners/` → `src/config/partners/`; `config-sources-declared` lost its assets allowance in the same commit. The outward-types separation inside `src/model/` remains open.
- `0276cc8` — `src/app/` founded: the App component out of `main.tsx` into `src/app/App.tsx`, the entry thinned to an eight-line mount; `app-is-mounted-not-borrowed` and `entry-stays-thin` landed with it.
- `18f2436` — `TopologyDiagram.tsx`, its test and `StageOverlay.tsx` into `src/app/` under PascalCase names; `src/diagram/` is now pure geometry. No `Stage.tsx` rename before the split — the whole file is not the stage, only the generic renderer inside it is.
- `373be2d` — fourteen realisation panel files and `use-stage` into `src/app/panels/` and `src/app/hooks/`, classified by what they import (model, config, presentation); the framework keeps `Part`, `PlacementPanel`, `SpecificationOverlay`, `SplitPane`, `use-persistent-state` and all of `src/editor/`, whose model imports wait on the decoupling step, not a move. Includes Kris's own import fixes made alongside.

Decisions taken without a human in the loop, per the working agreement: moved component files take PascalCase names; the stage keeps its `TopologyDiagram` name until the split; no new rule text where an existing rule absorbs the moved files — the absorption is the tightening. `src/library/` for fabrics was Kris's call, made live.

Second tranche, same evening:

- `7a51e04` — `src/config/` → `src/data/`, Kris's call: the realisation's clear surface named for what it is. `scope-icons.ts` joined it; `data-sources-declared` replaced the config rule.
- `fa2f09f` — landed by Kris's parallel session mid-flight, carrying the fabric extraction: four fabric components and `FabricDefs` in `src/library/` with all realisation contact via props, `cornerRadius` to `src/diagram/tokens.ts`, the `cycle-head` marker into `StageOverlay`, plus that session's own specification-groups work.
- `e0679d3` — `register.test.ts` to `src/model/` (it tests the model, not the panel beside it); `library-stays-reusable` landed as the fabrics' rule.
- `7522dc6` — `calloutPorts` to `src/data/demonstrations.ts`, Kris's call: authored placement, not panel logic.
- Axis refined, Kris's call: the editor is part of the app, so `src/editor/`, the generic panels and `use-persistent-state` fold into `src/app/` — the application whole is tool-side in destination, decoupling pending. `ADR-IBC2026-005` amended to match. The framework core the extraction lifts unchanged is `src/diagram/` + `src/library/`.
- Still open from the fabric work: the caption's one home — on-canvas caption/detail literals are passed as props from the stage while `src/play/registry.ts` fabric entries carry prose labels; unifying means the fabric entries gain the display pair and feed the props.
- `src/data/` → `src/play/`, Kris's call: the directory takes the vocabulary's own word — "that is the play, and it is authored in `src/play/`" is now literally true. `data-sources-declared` became `play-sources-declared`; one stale pointer (`src/presentation.ts` citing a `src/data/types.ts` that does not exist — the ids are typed in `src/model/types.ts`) was corrected in the sweep.

## Files touched

- `core/src/**`
- `workspaces/app/src/**`
- `.dependency-cruiser.cjs`
- Package export maps and affected architecture documentation

## Verify

- `bun run test`, `bunx tsc --noEmit`, `bunx knip`, `bunx depcruise src`, `bun run ki:site:build`, green at every step — this is a refactor under a working deployment, not a rebuild beside one.
- A screenshot before and after differs nowhere.
- No file on the framework's side imports the topology or the config, checked by tooling rather than by reading.
- A newcomer pointed at `src/` can say which directories the extraction will take before reading any file's contents.

## Dependencies / blocks

Blocks `IBC2026-DBD-011`: the extraction acts on the tree this record leaves. It also waits, softly, on the documentation consolidation for any rename that needs a settled term — layout can move ahead of naming where the two are separable.

## Documentation impact

### Decision Records

A decision record for the layout axis, written when the axis is agreed rather than after the moves. `docs/design/architecture.md` describes the source's shape and follows it. `AGENTS.md` names `src/topology/types.ts` as where `src/config/`'s shapes are declared, and follows the move to `src/model/`. `DBD-011` is trimmed by the steps this record took, and gains its regrounding note.

### Specifications

Update vocabulary and package-boundary specifications where the first realisation currently leaks into the reusable surface.

### Guides

Update architecture and contributor guidance to describe the final `workspaces/core/`, `workspaces/app/`, and host-owned realisation boundary.

### Roadmap

Keep dependent work aligned with the final package surface and replace stale source-repository paths as the separation lands.

## Discussion

### Remaining shaping

The risk in refactoring ahead of extraction is arranging for a consumer that never comes — the same generalising-against-one-example risk `DBD-011` carries, brought earlier. The mitigation is the same: the seams being stated are the ones already demonstrated, and every move claims only to restate where things live, so an abandoned extraction still leaves a tree that says what it is.

The other risk is drift against the live tree. This record was drafted while another thread edits the source, so its observations are dated the day it was written; the first step re-reads the tree before anything moves, which is cheap insurance against refactoring a file that no longer exists.

### Delivery risk

The win this buys is that `DBD-011` stops being a refactor wearing an extraction's clothes. After this record, the extraction is founding plus movement plus themes — the parts that need judgment — while everything that was really tidying has already happened under tests, in a repository with one consumer, where tidying is cheapest.

### Decisions since the move (2026-09-02)

- **The public seam is configuration.** `@infoschematics/model` owns `InfoschematicConfig` and `defineInfoschematic`; `@infoschematics/react` requires `<App config={config} />`; each host owns `document.title`. A title-only definition is a valid blank Infoschematic and, without optional config identifier, creates no shared persistence key.
- **The package graph is directional.** Model depends on Core geometry types, React depends on Model Core, each host definition depends only on Model. Three MIT library packages use normal `0.1.0` dependencies so manifests publishable; local source consumers use root overrides while packages remain unpublished.
- **The realisation is home.** 5G host owns contracts, assets complete serialisable definition. Temporary React `./model` export, authored play, singleton model 5G fixtures are gone from this repository.
- **Hosts are independent workspaces.** Both 5G project infoschematics.info separate `workspaces/app` from `workspaces/infoschematic`. TOOL-003 moved website as [INFOSCHEMATICS-WEB-SITE-001](https://github.com/infoschematics/infoschematics-website/blob/main/docs/roadmap/INFOSCHEMATICS-WEB-SITE-001-an-infoschematic-of-infoschematics.md); blank definition is deliberately distinct from future self-describing example.
- **Each host authors its own play.** Kris settled the open question of where the 5G-EMERGE realisation lives when this record lands: it returns to `5g-emerge-ibc-2026` alone. The website's example does not share it — the website gets its own realisation, transferred to [INFOSCHEMATICS-WEB-SITE-001](https://github.com/infoschematics/infoschematics-website/blob/main/docs/roadmap/INFOSCHEMATICS-WEB-SITE-001-an-infoschematic-of-infoschematics.md).
- **The contract pack went back first.** The pack was never imported by code — the Schematics panel fetches specifications by `href` from whatever the host serves — so it left this repository ahead of the rest of the realisation. Its verification tests went home with it: the host imports the exported `readSpec` and, until this record returns the model too, the model over the temporary `./model` subpath export. Removing that subpath is part of this record's finish line.
