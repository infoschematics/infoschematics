---
id: INFOSCHEMATICS-SITE-009
area: SITE
title: Playground three formats
theme: site-experience
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
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

- [ ] Add `packages/domain-core/src/typescript-document.ts`: a hand-rolled tokenizer and recursive-descent parser (no new dependency, nothing evaluated). Accepts, strictly: comments; optional `import type { … } from '…'` lines; exactly one `export const <name>[: <TypeIdentifier>] = <object-literal>` or `export default <object-literal>`; object literals with identifier or string keys; string values with standard escapes; JSON-shaped numbers; `true`/`false`; arrays; trailing commas. Rejects everything else — identifier values, call expressions, template literals, spreads, computed keys, `satisfies`, arithmetic — each with a path-addressed diagnostic.
- [ ] Extend `packages/domain-core/src/parse.ts`: `InfoschematicFormat` gains `'typescript'`, the extensions map gains `'.ts'`, and the new branch feeds the parsed literal through the existing metadata-strip → schema → `defineInfoschematic` pipeline so all three formats share one validation path and diagnostic shape.
- [ ] Add `packages/domain-core/src/typescript-document.test.ts`: accepts the format-parity TS fixture byte-for-byte; rejects each forbidden construct (identifier value, call expression, template literal, spread, computed key, two exports, no export) with a distinguishable diagnostic.
- [ ] Extend `scripts/format-parity.test.ts`: the `.ts` fixture parsed via `parseInfoschematic` renders byte-identical SVG to the JSON and YAML forms.
- [ ] Add `playgroundPath = '/playground/'` and `isPlaygroundPath` to `apps/site/src/routes.ts`; add `'playground'` to `SiteSection` and a `Playground` nav entry in `apps/site/src/SiteNav.tsx`; wire the route in `apps/site/src/main.tsx` in the lazy-import-and-set-title pattern.
- [ ] Add `apps/site/src/Playground.tsx`: three format tabs, each an independent buffer seeded with the format-parity definition in that form; a `<textarea>` parsed on change (debounced) via `parseInfoschematic(text, { format })`; valid input renders via `renderInfoschematicSvg`, invalid input lists issues via `formatInfoschematicIssue` with the last good render kept dimmed behind.
- [ ] Seed the buffers by `?raw` imports of `scripts/fixtures/format-parity.{ts,json,yaml}`; if dependency-cruiser rejects `apps/site → scripts/`, fall back to site-local copies with a test asserting they parse to the same config as the fixtures.
- [ ] Add playground styles to `apps/site/src/styles.css` in the existing idiom; add a playground component test covering tab rendering, a valid edit updating the preview, and a broken edit showing path-addressed issues.
- [ ] Update `docs/specs/domain-core.md` (supported formats gain `typescript` with the subset grammar contract) and `docs/guides/authoring.md` (a strict-subset `.ts` document loads without compiling; link the playground). Decide during implementation whether ADR-INFOSCHEMATICS-013 needs an amendment and record the outcome here.

## Files touched

- `packages/domain-core/src/typescript-document.ts` (new), `packages/domain-core/src/typescript-document.test.ts` (new), `packages/domain-core/src/parse.ts`
- `scripts/format-parity.test.ts`
- `apps/site/src/Playground.tsx` (new), `apps/site/src/routes.ts`, `apps/site/src/SiteNav.tsx`, `apps/site/src/main.tsx`, `apps/site/src/styles.css`
- `docs/specs/domain-core.md`, `docs/guides/authoring.md`

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

Pending.

## Discussion

### Why the TypeScript parser lives in Domain Core

A site-local parser would hide a reusable "TypeScript as data format" capability inside the Site application, against the AGENTS.md rule that reusable capability lands in Domain Model, Domain Core, or a View package before Site consumes it. Domain Core already owns the parse boundary and its diagnostic shape; adding the format there means the CLI (`self:examples:render`) gains `.ts` document loading for free and the playground consumes exactly the shipped contract — which is the point of using it to validate `INFOSCHEMATICS-TOOL-020`.

### Why three independent buffers

Auto-converting between tabs needs a TypeScript emitter for no authoring benefit, and independent buffers are what make the playground a parity check: the same definition authored three ways, validated identically, matching how `scripts/format-parity.test.ts` already proves the loader.
