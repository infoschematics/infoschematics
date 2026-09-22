---
id: INFOSCHEMATICS-TOOL-122
area: TOOL
title: Dependencies past their window
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T15:30:00Z
updated_at: 2026-09-22T15:30:00Z
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

## Discussion

Surfaced on 2026-09-22 during a recap, as a standing audit failure rather than anything this session caused.

The reason it is captured rather than done on the spot: a Vitest major has to be verified by running the browser suites and looking at what they render, per `AGENTS.md`, and a green run after a runner upgrade is exactly the case where a passing suite is weakest evidence — a browser command that silently stops being honoured would leave the colour-scheme cases asserting the default preference in both directions. The `emulateColourScheme` command is the specific thing to re-prove.

Worth deciding in the same pass: whether the 14-day window is the right figure for a repository with this much browser surface, or whether the majors want a longer one. That is a question for `ki-engineering`'s standard rather than for this repository, and belongs upstream if the answer is that the window is wrong.
