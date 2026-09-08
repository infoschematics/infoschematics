---
id: INFOSCHEMATICS-TOOL-025
area: TOOL
title: Enforce the package graph
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 31132d1e10284659a6c48e40dde977a4cc33a4c4
---

## Goal

Make the dependency check enforce the package graph it claims to: workspace imports resolve, every ownership rule matches the edges that actually exist, and an illegal import fails `bun run self:check` instead of passing silently.

## Context

`.dependency-cruiser.ts` encodes the direction [the architecture guide](../design/architecture.md) documents, but it cannot see the graph. Workspace imports are reported unresolved — `@infoschematics/view-model/card-layout` resolves to the bare specifier with `dependencyTypes: ["unknown"]` — because subpath `exports` resolution needs `options.enhancedResolveOptions` and the configuration sets only `doNotFollow` and `tsConfig`. Eleven of the fourteen rules are phrased `to: { path: '^(packages|apps|examples)/' }`, so with nothing resolving into those paths none of them can match. They constrain deep relative imports across package roots, which nobody writes.

A positive control confirms it. Adding `import '@infoschematics/view-canvas'` to `packages/view-model/src/tokens.ts` — View Model reaching into a React view, the boundary this repository cares most about — reports `✔ no dependency violations found`. The clean result `self:check` prints today is therefore true and empty: it proves no cycles within a package and no illegal relative paths, and nothing about the package graph.

Configuring the resolver raises the graph from 491 to 722 edges and reports 99 errors against the current rules. Almost all are a path-shape mismatch rather than drift: each exemption is written `^packages/(…)/src`, but a resolved workspace import lands in that package's `dist`. Seventeen are a real policy question — `view-canvas`, `view-present` and `view-model` use `defineInfoschematic` from Domain Core in their **tests**, which each package declares as a devDependency and no rule allows.

## Boundary

This item changes what the checker enforces, not what the packages are. It does not restructure the package graph, move source between ownership roots, or change any package's declared dependencies. Where enforcement reveals a genuine breach, this item records it and repairs it only where the repair is a one-line import change; anything larger becomes its own record.

## Current state

`bunx depcruise` is invoked from `self:check` over eleven `src` roots. `no-circular` works, because a cycle inside one package resolves through relative paths; `studio-is-mounted-not-borrowed` and `library-stays-reusable` work, because they constrain paths within `view-studio`. Everything that crosses a package boundary is inert. `entry-stays-thin` half-acknowledges this: its exemption list already includes the unresolved specifier forms `@infoschematics/view-(canvas|present)` alongside the source paths.

There is no `no-unresolvable` rule, so the resolution failure that disables the ruleset has nothing to surface it, and no rule ties an import to the importing package's declared dependencies.

## Shaping decisions

- **Resolution is configured explicitly.** `enhancedResolveOptions` declares `exportsFields`, `conditionNames` and `extensions`, because subpath exports are how every package in this workspace is consumed. This is the whole fix; the rest of the item is making the existing rules true against a graph that now exists.
- **Rules key on package roots, not `src`.** A resolved workspace import lands in `dist`, and a same-package relative import lands in `src`. An exemption written `^packages/view-model(/|$)` covers both and stops the rules depending on whether a package happens to be built.
- **`no-unresolvable` becomes an error.** It is the rule that would have caught this the day it started. Where a genuinely unresolvable specifier is legitimate — a bundler virtual module, a CSS or asset import — it is excluded by an explicit named pattern, not by dropping the rule.
- **Domain Core is a test-only dependency for the Views.** `view-canvas`, `view-present` and `view-model` build fixtures with `defineInfoschematic` and declare Domain Core as a devDependency. The rules admit that edge for test files only, rather than widening the runtime allowlist, so a Domain Core import in shipped code still fails.
- **Framework neutrality is enforced where it is claimed.** `render-svg` already forbids React; Domain Model, Domain Core and View Model claim the same neutrality in [the architecture guide](../design/architecture.md) and get the same rule.
- **Authored examples are constrained to the domain.** The existing rule forbids the Views and Site; the documented contract is Domain Core alone, so the rule states that and stops an example depending on a renderer or on another example.
- **The guard is guarded.** A test asserts that workspace edges resolve to real package paths, so a future resolver or packaging change cannot quietly return the ruleset to silence. Rule wording is checked by the rules; resolution is checked by the test.
- **Scripts join the cruise.** `scripts/` consumes workspace packages and is repository-owned code; it is cruised, may consume packages, and nothing may import it.

## Steps

- [x] Configure `enhancedResolveOptions` and confirm workspace imports resolve to package paths.
- [x] Re-anchor every ownership rule on package roots so the legal edges pass and the illegal ones are the only failures.
- [x] Add the test-file allowance for Domain Core in `view-model`, `view-canvas` and `view-present`.
- [x] Add `no-unresolvable`, a declared-dependency rule, framework-neutrality rules for Domain Model, Domain Core and View Model, and the tightened authored-example rule.
- [x] Cruise `scripts/` and forbid anything importing it.
- [x] Add `scripts/dependency-boundaries.test.ts`: workspace edges resolve to package paths, and the illegal import from the positive control is rejected by the ruleset.
- [x] Resolve whatever genuine breaches remain, or record them as their own item where the repair exceeds this boundary.
- [x] Update [the architecture guide](../design/architecture.md): include `examples/is-system` in the package graph, and state that the graph is mechanically enforced.

## Files touched

- `.dependency-cruiser.ts` for resolution and every rule
- `scripts/dependency-boundaries.test.ts`, new
- `package.json` only if the cruised root list changes
- `docs/design/architecture.md` for the graph and the enforcement statement
- Package sources only where a genuine breach needs a one-line import repair

## Verify

Prove that a workspace import resolves to a package path rather than a bare specifier, that the positive control — View Model importing View Canvas — is reported as a violation, and that the legal graph passes with no violations. Run `bun run self:check`.

## Dependencies / blocks

None. Found while reviewing the modularity coverage after INFOSCHEMATICS-TOOL-024.

## Documentation impact

### Decision Records

None expected: this enforces the direction ADR-INFOSCHEMATICS-004, ADR-INFOSCHEMATICS-006 and ADR-INFOSCHEMATICS-008 already establish, rather than deciding anything new.

### Specifications

No specification change is expected: the package graph is an architecture boundary, not a product requirement.

### Guides

Update [the architecture guide](../design/architecture.md) with the missing example package and a statement that the documented graph is mechanically enforced.

### Roadmap

Record implementation and verification evidence in this item before acceptance.

## Review

### Delivered

The dependency check now enforces the package graph instead of reporting a clean run over a graph it could not see. Workspace imports resolve into `packages/`, every ownership rule is anchored where a resolved import actually lands, the missing rules exist, `scripts/` is cruised, and a test asserts that the checker is still closed.

### Summary of changes

- `.dependency-cruiser.ts`: added `enhancedResolveOptions` (`exportsFields`, `conditionNames` including `types`, `extensions`) so subpath exports resolve, and `tsPreCompilationDeps: true` so the rules read authored imports rather than the compiler's emit — a type-only React import is a boundary crossing, and the injected `react/jsx-runtime` is nobody's import.
- Re-anchored every ownership rule on package roots through an `owners()` helper, because a resolved workspace import lands in `dist` while a same-package relative import lands in `src`.
- Added `no-unresolvable`, `domain-and-derivation-stay-framework-neutral`, `nothing-imports-repository-scripts`, and `not-to-dev-dep`; tightened `authored-infoschematics-stay-framework-neutral` to Domain Core alone; added `domain-core-is-a-test-only-dependency-for-views` so `defineInfoschematic` stays a test-file edge for the Views.
- `package.json`: `self:verify:depcruise` now includes `scripts` in its roots.
- `scripts/dependency-boundaries.test.ts`, new: asserts workspace edges resolve into `packages/` with nothing unresolved, and that a written negative control — a View Model module importing `@infoschematics/view-canvas` — is reported as a `view-model-stays-generic` violation.
- Repaired the one genuine breach the enforcement found: `packages/view-model/src/tokens.test.ts` imported `scripts/generate-visual-tokens.ts`. The generator-driven cases moved to `scripts/generate-visual-tokens.test.ts`; the package test keeps its token-value assertions.
- `docs/design/architecture.md`: added `examples/is-system` to the package graph and responsibilities, and stated that the graph is mechanically enforced and why the resolution test exists.

### Verification

`bun run self:check` passes: 60 test files, 396 tests, and `✔ no dependency violations found (330 modules, 1031 dependencies cruised)` — against 211 modules and 491 dependencies before, where every cross-package rule matched nothing.

The three claims the item asked for are proved directly. Resolution: the first test asserts each `@infoschematics/*` dependency of `InfoschematicDiagram.tsx` resolves under `packages/` with no `couldNotResolve`. Rejection: the second writes the positive control and asserts `view-model-stays-generic` appears in the cruise violations; before the resolver fix the same import reported `✔ no dependency violations found`. Legal graph: the full cruise above.

### Outstanding concerns

The programmatic `cruise()` call needs `validate: true` alongside `ruleSet` or it builds the graph and evaluates nothing — the first attempt at the negative-control test reported zero violations with `rules: null` on every edge. The test now passes for the right reason, but the failure mode is the same fail-open shape this item exists to fix, one layer up.

`conditionNames` includes `types` so that `vite/client` resolves in the two `vite-env.d.ts` files. That in turn made `not-to-dev-dep` fire on an ambient declaration, so `.d.ts` files are exempted from that rule alongside test files.

The rules cover ownership direction, not module-level layering inside a package: `no-circular` is the only structural rule that applies within one package root.

### Post-change review

The item's boundary held: no source moved between ownership roots and no package's declared dependencies changed. The single source repair — splitting a test that reached into `scripts/` — is a one-line import change in the sense the boundary allows, done by relocating the three affected cases rather than widening a rule to permit the edge.

Worth noting for whoever reads the rules next: the header comment in `.dependency-cruiser.ts` now states the fail-open risk explicitly, because the rules read correctly the whole time they were inert. Nothing about a passing check distinguishes enforcing from vacuous, which is the argument for keeping the resolution assertion in the test suite rather than trusting review.

### Mini recap

Delivered under INFOSCHEMATICS-TOOL-025: workspace-import resolution, package-root rule anchoring, four new rules and one tightened one, `scripts/` in the cruise, a boundary test that proves the checker is closed, one genuine breach repaired, and the architecture guide updated. Verified by `bun run self:check` (396 tests, clean cruise over 330 modules). Outstanding: the `validate: true` requirement in programmatic cruises, and the `types` condition / `.d.ts` exemption pair, both recorded above. Proposed learning route: none outside this record — the durable statements already live in the architecture guide and the configuration's own header comment.

## Done

Accepted 2026-09-08 by Kris Brown on review of the packet above.

## Discussion

### Why not simply trust the review

The rules were written carefully and read correctly; they were wrong only in a way no reading catches, because a passing check looks identical whether it is enforcing or vacuous. That is the argument for the resolution test: a boundary checker that can fail open needs one assertion that it is still closed.
