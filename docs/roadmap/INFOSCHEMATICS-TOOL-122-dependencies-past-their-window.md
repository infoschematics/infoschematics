---
id: INFOSCHEMATICS-TOOL-122
area: TOOL
title: Dependencies past their window
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T15:30:00Z
updated_at: 2026-09-22T17:30:00Z
---

# Dependencies past their window

## Goal

The repository's dependencies are current enough that `ki repo audit --skill ki-engineering` passes on `DEPS-1`, and the one update that is a real decision has been taken deliberately rather than deferred by inaction.

## Context

`DEPS-1` fails on five packages beyond the 14-day adoption window: `@types/react-dom` 19.2.5, `@vitest/browser-playwright` 4.1.11, `lint-staged` 17.4.1, `rumdl` 0.2.64 and `vitest` 4.1.11. `bun outdated` also reports `@biomejs/biome`, `@types/node`, `@types/react`, `dependency-cruiser` and `knip` behind their latest, inside the window.

Four of the five are patch or minor and carry no argument. The fifth is: `vitest` and `@vitest/browser-playwright` are both a major behind, 4.1.11 to 5.0.x, and they move together. This repository leans on browser mode harder than most — six browser suites across View Canvas, View Studio and Site, a custom `emulateColourScheme` browser command that several colour-scheme cases depend on, and `vitest.browser.config.ts` in three workspaces — so a major there is a change to the evidence every visual requirement rests on, not a version bump.

`@types/node` is a separate judgement: the repository runs 22.20.x against a latest of 26.x, and `GDR-INFOSCHEMATICS-004` promises the oldest supported Node line, so the types should track that promise rather than the newest release.

## Boundary

Dependency currency and the toolchain choices inside it. It does not include the other two standing `ki-engineering` findings, which are configuration rather than versions and are captured in `INFOSCHEMATICS-TOOL-123`.

Where an update cannot be taken, the outcome is a recorded dependency hold with its reason, which is what `DEPS-1` asks for — not an item left open.

## Current state

`ki repo audit --skill ki-engineering` reports `DEPS-1` against five packages past the 14-day adoption window: `@types/react-dom` 19.2.5, `@vitest/browser-playwright` 4.1.11, `lint-staged` 17.4.1, `rumdl` 0.2.64 and `vitest` 4.1.11. `bun outdated` additionally shows `@biomejs/biome` 2.5.12, `@types/node` 22.20.2, `@types/react` 19.2.18, `dependency-cruiser` 18.3.1 and `knip` 6.34.0 behind their latest, all still inside the window.

Two of those carry a real judgement. `vitest` and `@vitest/browser-playwright` are a major behind — 4.1.11 to 5.0.x — and move together; the repository runs six browser suites across View Canvas, View Studio and Site, three `vitest.browser.config.ts` files, and a custom `emulateColourScheme` browser command that every colour-scheme requirement's evidence depends on. `@types/node` is at 22.20.x against a latest of 26.x, and `GDR-INFOSCHEMATICS-004` promises the oldest supported Node line, so the types should track that promise rather than the newest release.

## Steps

- [ ] Take the patch and minor updates that carry no argument — `@biomejs/biome`, `@types/react`, `@types/react-dom`, `dependency-cruiser`, `knip`, `lint-staged`, `rumdl` — in one change, and run the full gate behind them.
- [ ] Take Vitest 4 to 5 with `@vitest/browser-playwright` together, then re-prove the browser evidence rather than trusting a green run: the `emulateColourScheme` command and the reduced-motion cases are the two places a browser-mode major is most likely to change behaviour quietly.
- [ ] Decide `@types/node` against `GDR-INFOSCHEMATICS-004`'s oldest-supported-line promise and pin deliberately, so the audit stops reading it as neglect.
- [ ] Record any update deliberately not taken as a dependency hold with its reason, which is what `DEPS-1` asks for; do not leave this item open standing in for that record.
- [ ] Capture the browser look for at least one colour-scheme case after the Vitest major, per `AGENTS.md`.

## Files touched

`package.json` and the workspace `package.json` files carrying the affected dependencies, `bun.lock`, the three `vitest.browser.config.ts` files and any browser-command setup the major moves, and wherever the repository records a dependency hold.

## Verify

`bun run self:check` in full, then `ki repo audit --skill ki-engineering` showing `DEPS-1` clear or reporting only recorded holds. `turbo run … --force` for the browser suites, since a replayed cache would report a green earned under the old runner.

## Dependencies / blocks

Nothing blocks it. It is adjacent to `INFOSCHEMATICS-TOOL-123`, which covers the other two standing `ki-engineering` findings — those are configuration rather than versions, and the two are worth doing in one sitting without being one item.

## Documentation impact

### Decision Records

None expected. If the `@types/node` pin turns into a general policy about tracking the supported runtime rather than the latest release, that is a Decision Record and would be written as one.

### Specifications

None. No user-observable behaviour changes.

### Guides

None, unless the Vitest major changes how a contributor runs the browser suites, in which case `AGENTS.md` carries the correction.

### Roadmap

If the 14-day window turns out to be wrong for a repository with this much browser surface, or if majors want a longer window than patches, that is a question about `ki-engineering`'s standard rather than about this repository, and belongs upstream.

## Discussion

Surfaced on 2026-09-22 during a recap, as a standing audit failure rather than anything this session caused.

The reason it is captured rather than done on the spot: a Vitest major has to be verified by running the browser suites and looking at what they render, per `AGENTS.md`, and a green run after a runner upgrade is exactly the case where a passing suite is weakest evidence — a browser command that silently stops being honoured would leave the colour-scheme cases asserting the default preference in both directions. The `emulateColourScheme` command is the specific thing to re-prove.

Worth deciding in the same pass: whether the 14-day window is the right figure for a repository with this much browser surface, or whether the majors want a longer one. That is a question for `ki-engineering`'s standard rather than for this repository, and belongs upstream if the answer is that the window is wrong.

### Adoption

Adopted into Now on 2026-09-22 while shaping the queue before a pause, as the stability work worth doing before the roadmap goes quiet. The Vitest major is the part that could be split out if it proves expensive; the rest is routine currency.
