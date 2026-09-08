---
id: INFOSCHEMATICS-SITE-009
area: SITE
title: Playground three formats
theme: site-experience
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: e48be9b9627f57bbc948dc7a132805fd7e022e21
---

## Goal

Add a public playground page at `/playground/` with three format tabs — TypeScript, JSON, YAML — where a definition can be edited and is validated and rendered live, exercising the loader boundary `INFOSCHEMATICS-TOOL-020` delivered. The TypeScript tab parses a very strict TypeScript **subset as a document format** — structurally matched and parsed as data, never executed; there is no TypeScript runtime in the browser.

## Context

`INFOSCHEMATICS-TOOL-020` (awaiting-review; its delivery is on `main`, so it is context here, not a blocker) added `parseInfoschematic` to Domain Core: JSON and YAML documents validate through the Zod contract mirror and normalise through `defineInfoschematic`, returning path-addressed diagnostics. TypeScript remains the one form that needs compiling — the parity fixture `scripts/fixtures/format-parity.ts` is loaded by import, not parsed as a document. A playground validates that loader contract with real interactive use, and closes the TypeScript asymmetry by making `typescript` a third document format in Domain Core, per the AGENTS.md rule that reusable capability lands in Domain Core before Site consumes it.

Requested directly by the user: "a playground tab that allows for the TS, JSON and YAML forms to be then played with — sandboxed to just what is supported (so the TS is really a very strict TypeScript subset as the format, not a full TypeScript runtime) — this will help validate INFOSCHEMATICS-TOOL-020."

## Boundary

No auto-conversion between the three forms (three independent buffers). No full code editor dependency (CodeMirror/Monaco), syntax highlighting, or schema-driven autocompletion — a plain `<textarea>` suffices. No execution of any TypeScript; `defineInfoschematic(...)` call syntax is rejected in documents. No changes to `INFOSCHEMATICS-TOOL-020`'s record itself.

## Current state

`parseInfoschematic` (`packages/domain-core/src/parse.ts`) supports `'json' | 'yaml'` only. The site has no playground route; `SiteSection` is `'docs' | 'examples' | 'visual-guide'`. The format-parity definition exists authored three ways under `scripts/fixtures/format-parity.{ts,json,yaml}`, with the TS form loaded by import in `scripts/format-parity.test.ts`.

## Steps

- [x] Add `packages/domain-core/src/typescript-document.ts`: a hand-rolled tokenizer and recursive-descent parser (no new dependency, nothing evaluated). Accepts, strictly: comments; optional `import type { … } from '…'` lines; exactly one `export const <name>[: <TypeIdentifier>] = <object-literal>` or `export default <object-literal>`; object literals with identifier or string keys; string values with standard escapes; JSON-shaped numbers; `true`/`false`; arrays; trailing commas. Rejects everything else — identifier values, call expressions, template literals, spreads, computed keys, `satisfies`, arithmetic — each with a path-addressed diagnostic.
- [x] Extend `packages/domain-core/src/parse.ts`: `InfoschematicFormat` gains `'typescript'`, the extensions map gains `'.ts'`, and the new branch feeds the parsed literal through the existing metadata-strip → schema → `defineInfoschematic` pipeline so all three formats share one validation path and diagnostic shape.
- [x] Add `packages/domain-core/src/typescript-document.test.ts`: accepts the format-parity TS fixture byte-for-byte; rejects each forbidden construct (identifier value, call expression, template literal, spread, computed key, two exports, no export) with a distinguishable diagnostic.
- [x] Extend `scripts/format-parity.test.ts`: the `.ts` fixture parsed via `parseInfoschematic` renders byte-identical SVG to the JSON and YAML forms.
- [x] Add `playgroundPath = '/playground/'` and `isPlaygroundPath` to `apps/site/src/routes.ts`; add `'playground'` to `SiteSection` and a `Playground` nav entry in `apps/site/src/SiteNav.tsx`; wire the route in `apps/site/src/main.tsx` in the lazy-import-and-set-title pattern.
- [x] Add `apps/site/src/Playground.tsx`: three format tabs, each an independent buffer seeded with the format-parity definition in that form; a `<textarea>` parsed on change (debounced) via `parseInfoschematic(text, { format })`; valid input renders via `renderInfoschematicSvg`, invalid input lists issues via `formatInfoschematicIssue` with the last good render kept dimmed behind.
- [x] Seed the buffers by `?raw` imports of `scripts/fixtures/format-parity.{ts,json,yaml}`; if dependency-cruiser rejects `apps/site → scripts/`, fall back to site-local copies with a test asserting they parse to the same config as the fixtures.
- [x] Add playground styles to `apps/site/src/styles.css` in the existing idiom; add a playground component test covering tab rendering, a valid edit updating the preview, and a broken edit showing path-addressed issues.
- [x] Update `docs/specs/domain-core.md` (supported formats gain `typescript` with the subset grammar contract) and `docs/guides/authoring.md` (a strict-subset `.ts` document loads without compiling; link the playground). Decided during implementation: ADR-INFOSCHEMATICS-013 amended — the TypeScript-document grammar is recorded as part of the same validation boundary.

## Files touched

- `packages/domain-core/src/typescript-document.ts` (new), `packages/domain-core/src/typescript-document.test.ts` (new), `packages/domain-core/src/parse.ts`, `packages/domain-core/src/index.ts`
- `scripts/format-parity.test.ts`
- `apps/site/src/Playground.tsx` (new), `apps/site/src/Playground.test.tsx` (new), `apps/site/src/playground/seeds/format-parity.{ts.txt,json,yaml}` (new), `apps/site/src/routes.ts`, `apps/site/src/SiteNav.tsx`, `apps/site/src/main.tsx`, `apps/site/src/styles.css`, `apps/site/package.json` (adds the `@infoschematics/domain-core` dependency), `bun.lock`
- `docs/specs/domain-core.md`, `docs/guides/authoring.md`, `docs/decisions/ADR-INFOSCHEMATICS-013-validation-mirrors-the-contract.md` (amendment)

## Verify

`bun run self:check`. New tests: `typescript-document.test.ts` accept/reject coverage; extended `scripts/format-parity.test.ts` proving byte-identical SVG from the parsed `.ts` document; playground component test. Manually walk `/playground/` on a dev server across all three tabs, confirming live render on valid input and path-addressed diagnostics on broken input.

## Dependencies / blocks

None recorded. `INFOSCHEMATICS-TOOL-020`'s delivery is already on `main`; it is referenced as context rather than a blocker so this item's activation does not depend on that record's acceptance.

## Documentation impact

### Decision Records

Possible amendment to ADR-INFOSCHEMATICS-013 (validation mirrors the contract) noting the TypeScript-document grammar is part of the same validation boundary — decided during implementation.

### Specifications

`docs/specs/domain-core.md` supported-formats section gains `typescript` and the subset grammar contract.

### Guides

`docs/guides/authoring.md` notes strict-subset `.ts` documents load without compiling and links the playground.

### Roadmap

None beyond this item.

## Review

### Delivered

A public `/playground/` page with three format tabs — TypeScript, JSON, YAML — each an independent buffer seeded with the format-parity definition, validated and rendered live through `parseInfoschematic`. `typescript` is a third document format in Domain Core: `parseTypescriptDocument` reads a strict literal subset as data, never executing anything, and the CLI gains `.ts` document loading through the shared extensions map with no further change.

### Summary of changes

- `packages/domain-core/src/typescript-document.ts`: hand-rolled recursive-descent parser for the strict subset (comments, `import type` lines, one exported object literal; strings, plain decimal numbers, booleans, arrays, nesting, trailing commas). Rejections — identifier values, call expressions, template literals, spreads, computed keys, runtime imports, `satisfies`, non-decimal numbers, second exports — carry a dotted path and line/column.
- `packages/domain-core/src/parse.ts`: `InfoschematicFormat` gains `'typescript'`, extensions gain `.ts`, and the new branch feeds the same metadata-strip → schema → `defineInfoschematic` pipeline, so all three formats share one diagnostic shape.
- Site: `Playground.tsx` (tabs, debounced parse, SVG preview with last-good render dimmed, `formatInfoschematicIssue` list), route/nav/title wiring, styles in the existing idiom.
- Seeds are site-local copies (the TS one stored as `.ts.txt` so neither `tsc` nor dependency-cruiser treats it as a module); `scripts/format-parity.test.ts` holds them in step with the fixtures.
- Docs: CORE-002 records the subset grammar contract, the authoring guide's document section covers `.ts` and links the playground, ADR-INFOSCHEMATICS-013 is amended.

### Verification

`bun run self:check` passes end to end (packages build, visual tokens, schema, all workspace tests, typecheck, dependency boundaries, production site build). New coverage: `typescript-document.test.ts` (13 tests, accept and reject grammar), format-parity gains the `.ts`-as-document byte-identical SVG assertion and the seed-parity assertion, `Playground.test.tsx` covers tab render, valid preview, path-addressed issues, and rejection of executable TypeScript.

### Outstanding concerns

- The interactive dev-server walk across the three tabs was not performed in this non-interactive session; static component tests and the production build stand in for it, and it remains a review step.
- The `?raw`-seeded copies are byte-independent of the fixtures by design (editor `$schema` noise dropped); the parity is semantic, enforced by test, not byte equality.

### Post-change review

The planned `?raw` import of `scripts/fixtures/` was indeed rejected by the `nothing-imports-repository-scripts` boundary, and a real `.ts` seed inside `apps/site` would itself have violated `site-does-not-own-product-model`, so the planned fallback (site-local copies, `.txt`-suffixed TS seed, scripts-side parity test) was taken. `Preview` is exported solely for the component test, noted inline.

### Mini recap

Three-format playground shipped at `/playground/`; TypeScript is now a first-class document format in Domain Core, parsed as data and proven render-identical to JSON and YAML.

## Discussion

### Why the TypeScript parser lives in Domain Core

A site-local parser would hide a reusable "TypeScript as data format" capability inside the Site application, against the AGENTS.md rule that reusable capability lands in Domain Model, Domain Core, or a View package before Site consumes it. Domain Core already owns the parse boundary and its diagnostic shape; adding the format there means the CLI (`self:examples:render`) gains `.ts` document loading for free and the playground consumes exactly the shipped contract — which is the point of using it to validate `INFOSCHEMATICS-TOOL-020`.

### Why three independent buffers

Auto-converting between tabs needs a TypeScript emitter for no authoring benefit, and independent buffers are what make the playground a parity check: the same definition authored three ways, validated identically, matching how `scripts/format-parity.test.ts` already proves the loader.
