---
id: INFOSCHEMATICS-TOOL-087
area: TOOL
title: One authored example shows every capability
theme: authoring
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 8efcf51c4a944b886f25a15e092da9763fee7603
created_at: 2026-09-17T10:20:00Z
updated_at: 2026-09-17T11:05:00Z
---

# One authored example shows every capability

## Goal

Publish one authored Infoschematic that exercises every capability the document contract offers, reachable from the Playground, and defended by a check that fails when a new capability lands unshown — so trying a capability out never again means hand-editing a real diagram to find out what it draws.

## Context

Measured across `examples/*/*.yaml` and `apps/site/src/playground/seeds/*.yaml` before this item, no authored document anywhere in the repository carried a [Fabric](../reference/vocabulary.md#fabric), an [Adapter Card](../reference/vocabulary.md#adapter-card) (`adapts:`), a Wrapper Card (`wraps:`), an [Overlay](../reference/vocabulary.md#overlay), a bidirectional [Flow](../reference/vocabulary.md#flow), a `calloutPositions` list, a `specifications` group, or an `icon`. The visual guide has an `adapter-card` specimen (`apps/site/src/visual-guide/specimens.ts:501`), so the notation is drawn somewhere — but never from an authored document, which is why the only way to see one has been to edit the live IBC 2026 diagram.

A showcase that has to be remembered goes stale, so the check derives what it measures from the contract rather than from a list kept beside it.

## Boundary

A new `examples/` package, one root check, a Playground preset, one requirement, and this record. The homepage editorial capability discussed alongside this is explicitly out of scope — the owner dropped it in favour of the example. No renderer, view or contract behaviour changes: what the showcase reveals about the renderers is recorded as `INFOSCHEMATICS-TOOL-088` and `-089` rather than fixed here.

## Steps

1. [x] Author `examples/is-showcase/` beside the existing example packages, following their exact shape.
2. [x] Derive the capability list from the projected schema and assert the showcase exercises every property path and every value each choice admits.
3. [x] Give the check an assertion about its own coverage, and prove it is not vacuous in both halves.
4. [x] Add `examples/*/*.yaml` to `//#self:scripts:test`'s `inputs` and prove the miss by editing the YAML.
5. [x] Reach it from the Playground as a preset.
6. [x] State the requirement in `docs/specs/authoring.md` so the check defends something a requirement names.

## Files touched

- `examples/is-showcase/` — the authored document, its generated source, its own tests and README
- `scripts/example-capability-coverage.test.ts` — the derived coverage check
- `turbo.json` — `examples/*/*.yaml` added to `//#self:scripts:test`
- `apps/site/src/Playground.tsx`, `apps/site/src/Playground.test.tsx`, `apps/site/package.json` — the preset
- `docs/specs/authoring.md` — `AUTHOR-017`
- `package.json`, `bun.lock` — `yaml` and `zod` at the root, for the check

## Verify

- `bun run self:check`.
- `turbo run //#self:scripts:test` after editing the showcase YAML alone, to prove the new `inputs` entry is load-bearing.
- By hand in the Playground, because a green suite is not evidence it looks right.

## Dependencies / blocks

None. `INFOSCHEMATICS-TOOL-084` constrains the authoring — every two-point port-derived route stays axis-aligned — but is not blocking.

## Documentation impact

### Specifications

`docs/specs/authoring.md` gains `AUTHOR-017`.

### Decision Records

None. `ADR-INFOSCHEMATICS-034` already owns the rule that a check defends a stated requirement; this item obeys it rather than amending it.

### Guides

None. The document's own README explains what it is for.

## Discussion

Raised by the owner as "I'd like to make sure we've got an adapter card somewhere in there. Or maybe what we do is the example diagram shows all the capabilities."

## Review packet

### Delivered

`examples/is-showcase/infoschematic.yaml` — `showcase`, four labelled bands on a blueprint surface — exercises every property the authored schema declares and every value its choices admit, including all seven capabilities nothing had ever authored. `scripts/example-capability-coverage.test.ts` derives that list from the contract and fails when it falls behind. `AUTHOR-017` states the rule. The Playground reaches it as the "Every capability" preset.

### Summary of changes

The check walks the JSON Schema projected from `infoschematicSchema`, collecting every property at the path it is declared and every enum's admitted values, then measures the showcase against it in both its authored YAML and its canonical model — so a compact spelling (`link`, `ports: 1 1`, a string box) and what it means both count. Union branches and array items keep their parent's path, because the compact and structured forms of a Flow are two ways to author one Flow rather than two places in the document, and items below an array are marked repeatable: that is what makes several values of one choice reachable at all. A non-repeatable choice is asked for one value; a repeatable one with three or fewer values for all of them; a wider one for variety.

Paths that admit the same choice are pooled by the values themselves, because the contract offers one treatment under more than one spelling — a Flow's line as `line` or as `appearance.line`, a Collection's colour wrapped or unwrapped — and asking each spelling for every value buys duplicated authoring rather than coverage. Every spelling still has to appear, since each is a property the walk found.

Run against the showcase as first drafted, it named 15 unshown property paths and 4 choices short of their values; each was authored rather than excused.

### Verification

`bun run self:check` — green. `bun run self:scripts:test` — 16 files green, including the three new coverage tests. `bun run --cwd examples/is-showcase check` — the document renders through the CLI. `bun run self:examples:verify` — the generated source agrees with the YAML.

The new turbo input is load-bearing: `//#self:scripts:test` replayed FULL TURBO before the change and missed cache after a YAML-only edit once `examples/*/*.yaml` was added.

The coverage check is not vacuous in either half, proved by breaking it: removing `adapts:` from the showcase fails the property half; downgrading the one dotted Region frame to dashed fails the value half. Its own floors are asserted first, so a walk that resolved nothing fails there rather than passing everything after it.

Rendered and looked at, in the Playground at the new preset: the Adapter Card and Wrapper Card clasps, the Fabric, both Points, the dashed per-Flow override, the bidirectional head, and every Region frame style. No console errors; the parse reports `adapters: 2, sockets: 2, fabrics: 2, cards: 5, regions: 4, points: 2`.

### Outstanding concerns

Two product findings the showcase exposed, both recorded rather than fixed: `INFOSCHEMATICS-TOOL-088`, `render-svg` does not draw the Adapter Card clasp — the `wraps` field, the derived clasp box and the outline primitive are all shared already, and its card loop emits a plain `<rect>` over the Card it holds rather than consuming them, which also leaves the two renderers disagreeing over whether an adapter's authored bounds mean anything; and `INFOSCHEMATICS-TOOL-089`, an authored Overlay cannot be drawn by `infoschematics render` or in Present, so `OVL-01` is in the document and in no picture.

`diagram.appearance.card.compact` is `true` in the showcase, not by preference but because a non-compact Card centres its label at exactly the y the clasp's top sits on, so a held Card's label is unreadable under the static renderer. That is `TOOL-088`'s territory; the showcase takes the setting that reads.

### Post-change review

The capabilities nothing authored were not obscure — a Fabric is a whole element kind — and every gate was green for as long as they went unauthored, because nothing measured the contract against what any document shows. The derived check is the same shape of fix as the boundary gate's module floor: ask the check what it found before believing what it reports.

### Mini recap

One authored document, one derived check, one requirement, one preset: every capability is now visible in a place that cannot quietly fall behind.
