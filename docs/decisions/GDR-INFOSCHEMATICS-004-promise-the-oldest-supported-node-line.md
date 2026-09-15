---
id: GDR-INFOSCHEMATICS-004
title: Promise the oldest supported Node line
date: 2026-09-15
status: current
decision_type: governance
decision_type_url: https://knowledgeislands.info/specifications/decision-records/gdr
decision_depends_on: [GDR-INFOSCHEMATICS-003]
---

# GDR-INFOSCHEMATICS-004: Promise the oldest supported Node line

## Context

Eight published packages and the repository root declare `engines.node`, and nothing had ever chosen the value. It was `>=22` because 22 was the Active LTS line when the manifests were written, and it stayed while the line moved on. That left a second question unanswered: `@types/node` was held at its 24 line on the grounds that the definitions describe the oldest Node the packages promise, which made the hold correct in its reasoning and wrong in its arithmetic — it deferred to a number nobody was maintaining.

Seven of the eight packages never execute in Node. They are React libraries that run in a browser, so their `engines.node` is not a claim about running our code; it is a claim about the toolchain a consumer builds with. Only `@infoschematics/cli` has a Node runtime of its own.

The obvious anchor was therefore the React ecosystem: promise what React promises. React declares `engines.node: ">=0.10.0"`, a field untouched since 2014, and `react-dom` declares no `engines` at all. So the answer is real but empty — React imposes no Node requirement on anything that depends on it, and a policy delegating to that field would be the same mistake as the stale `>=22`, deferring to a number nobody maintains.

Two anchors that are maintained were considered. The **Active LTS** line is the version the ecosystem develops against, and following it keeps the repository typing against exactly what it runs. It is also the wrong end of the range: it names a floor higher than anything requires, so a consumer building a browser bundle on the previous LTS is warned off a library that never runs in Node at all, for nothing. Node's **support window** is the other end and is what actually matters — below it, a consumer is on a runtime receiving no security fixes, which is a floor worth stating.

## Decision

`engines.node` names the **oldest Node line still in support** — today `>=22`, since 20 reached end-of-life on 2026-04-30 — across the root and every published package, and `@types/node` tracks the same line.

The floor moves when that line goes end-of-life, not when a newer one becomes LTS. Raising it is a published-contract change, made as its own commit, with the specifications and guides that name a Node version amended in the same pass.

Nothing here promises the runtime the repository develops on. `mise.toml` pins `node = "lts"` and the release workflow publishes on the current LTS, which is how it should be: the floor is a promise to consumers about the oldest runtime supported, and the development pin is a choice about where the work happens. They are allowed to differ, and the gate holds the floor through `releaseNodeEngine` in `scripts/release/packages.ts` so the promise cannot drift by accident again.

`@types/node` on the floor rather than the newest release is the part that carries weight. It means a Node API added after 22 does not typecheck here, which is the point: `@infoschematics/cli` must not compile against something a Node 22 consumer will not have. That keeps a dependency hold standing, now with the number it should always have had.

## Consequences

The repository types against an older Node than it runs. That is deliberate and it costs something real — a script or a CLI change cannot reach for a newer `node:` API without first moving the floor, deliberately, as a contract change. The alternative is compiling against APIs a supported consumer lacks, which is worse and silent.

The floor will not move on its own. Node 22 leaves support on 2027-04-30, and nothing in the gate will fail before then; what the gate does enforce is that every manifest, the packed tarballs, and the release fixtures agree on whatever the floor currently is.

Consumers on an end-of-life Node are outside the promise but not blocked: `engines` is advisory in npm unless a consumer opts into strict enforcement, so the field documents what is supported and tested rather than refusing to install.
