---
id: ADR-INFOSCHEMATICS-021
title: Keep example packages copyable rather than published
date: 2026-09-15
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-010, ADR-INFOSCHEMATICS-020]
---

# ADR-INFOSCHEMATICS-021: Keep example packages copyable rather than published

## Context

Making each example a complete package raises an obvious follow-on question: should any of them be published to npm? They now have manifests, descriptions, commands, READMEs, and a verified clean-copy path, which is most of what publication asks for.

The value an example carries is the copy someone makes of it. Its reader wants to own the result — rename it, change the Cards, delete two thirds of it — and an installed dependency is the opposite of that. An installed example cannot be edited, and an example nobody edits is documentation with a package manifest.

Publication also has a real cost here. `ADR-INFOSCHEMATICS-010` binds the public packages to one coordinated version, and adding example packages to that set would make a wording change in a demonstration diagram a reason to move the version of the domain contract. Keeping them out of the release set keeps the release meaning what it says.

## Decision

Example packages stay `private: true` and are not published. Portability is provided by copyability, not by the registry: each package's `check` and `render` commands run against its own YAML using the published `@infoschematics/cli`, and `bun run self:packages:pack-smoke` proves it by copying each example directory outside the monorepo, installing it against packed tarballs of the public packages, and rendering it there.

`releasePackages` in `scripts/release/packages.ts` remains the fixed public set. An example is verified by the release harness without being a member of it.

## Consequences

A reader is directed to copy a directory rather than install a dependency, which is what the material is for. Example content can change freely without touching a published version.

The clean-copy case in the pack smoke is now the gate that keeps copyability true; without it this decision would be a claim rather than a verified property. That case costs a copy, an install, and a render per example in `bun run self:release:verify`.

If a demonstration ever needs to be consumed rather than copied — a shared fixture for downstream test suites, say — that is a different artefact with a different name, and it needs its own decision rather than a quiet flip of `private` on an example.
