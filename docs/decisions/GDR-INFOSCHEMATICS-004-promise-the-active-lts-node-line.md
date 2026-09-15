---
id: GDR-INFOSCHEMATICS-004
title: Promise the Active LTS Node line
date: 2026-09-15
status: current
decision_type: governance
decision_type_url: https://knowledgeislands.info/specifications/decision-records/gdr
decision_depends_on: [GDR-INFOSCHEMATICS-003]
---

# GDR-INFOSCHEMATICS-004: Promise the Active LTS Node line

## Context

Eight published packages and the repository root each declared `engines.node: ">=22"`. Nothing chose 22 deliberately; it was the Active LTS line when the manifests were written, and it stayed while the line moved on. Node 22 entered maintenance on 2025-10-21, 24 became Active LTS a week later, and the repository had already followed in practice everywhere except the manifests — `mise.toml` pins `node = "lts"`, the release workflow publishes on Node 24, and development runs on 24.

That left `engines` as the one place still describing a runtime nobody here uses, and it had a second consequence. `@types/node` was held at its 24 line, and the hold's reason was that the definitions describe the oldest Node the packages promise. With the promise at 22 and the types at 24, the repository was typing against APIs a package it supported might not have — the hold was correct in its reasoning and wrong in its arithmetic, because the number it deferred to was stale.

The alternative to a moving floor is a fixed one: pick a version and raise it only when it goes end-of-life. That maximises consumer reach and is the right choice for a widely-depended-upon library, but it means the repository develops against a runtime it does not test on, and `@types/node` then has to be held back for years to stay honest. Nothing here needs that reach yet: no package has been published, so the floor costs no existing consumer anything, and this is the cheapest moment it will ever be to set the policy.

## Decision

`engines.node` names the **Active LTS** Node line — today `>=24` — across the root and every published package, and `@types/node` tracks the same line rather than the compiler or the newest release. The two move together, deliberately, as one change.

The floor follows Active LTS rather than Current: a package promising a line that is still six weeks from LTS would be asking consumers onto a runtime their own platforms will not have. It follows Active LTS rather than Maintenance because a maintenance line receives security fixes only, and typing against it holds development back for the benefit of consumers who do not exist.

Raising the floor is a published-contract change and is made as its own commit, with the specifications and guides that name a Node version amended in the same pass. Decision records are not amended: an earlier record naming Node 22 states what was decided then, and this record is where the line moved.

## Consequences

The floor is not automatic. Node 26 becomes Active LTS on 2026-10-28, and `mise.toml`'s `node = "lts"` will roll the development toolchain onto it while `engines` still says 24 — which is sound, because the field is a floor rather than a ceiling, but it means nothing will fail to remind anyone that the promise is a line behind. Raising it stays a decision, taken when the packages are ready to stop supporting the line below.

`@types/node` no longer needs a dependency hold. Its constraint is now stated here rather than as a standing exception, and a dependency update that offers 26 is refused on the same grounds any other floor change is: the promise has not moved yet.

Once packages are published, a further raise becomes a breaking change for consumers on the line being dropped, and gets the release treatment that implies. Until the first publish it is free, which is the reason to take it now rather than inherit 22 into a release.
