---
id: INFOSCHEMATICS-TOOL-041
area: TOOL
title: Initial package publication
theme: tool
horizon: waiting-for
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T15:39:09Z
updated_at: 2026-09-21T23:55:00Z
---

# Initial package publication

## Goal

Publish the verified public Infoschematics package set to the configured registry in dependency order so external consumers can install it without cloning the repository.

## Context

The release contract, package metadata, version-coordination checks, clean-consumer pack smoke test, and release guide have landed. Publication is an external, irreversible version-allocation operation and was previously mixed into post-delivery hardening. It needs its own authority window and recovery boundary.

## Boundary

This item does not change package APIs, select new versions without reviewing the dependency-closed set, alter registry ownership, improvise credentials, publish examples or applications, push unrelated commits, or combine publication with renderer, responsive, or governance work.

## Waiting condition

Move this item to Next only when npm scope ownership and trusted-publishing configuration are confirmed for every public package, the intended dependency-closed version set is named, the release commit is clean and verified, and the user explicitly authorises that publication run.

## Current state

The waiting condition is **not met**. The repository-side preparation is in good shape and the defect that would have made a first run publish an incomplete set has been fixed; the registry-side confirmations still do not exist.

What is in place:

- The public set is eight packages, fixed in dependency-first order at `scripts/release/packages.ts:12-21`, and `scripts/release/release.test.ts:47-57` asserts that order by name.
- All eight manifests read version `0.1.0` with `publishConfig.access: public`, and `validateReleaseManifests` refuses drift: a private package, a missing description, a non-MIT licence, a wrong `repository.directory`, an internal range that is not the coordinated version, or a dependency out of build order (`scripts/release/packages.ts:64-124`).
- `engines.node` is `>=22` on every published manifest, enforced against `releaseNodeEngine` at `scripts/release/packages.ts:27` and `:97-98`, as `GDR-INFOSCHEMATICS-004` decided. That is now a deliberate published-contract policy rather than an accident of the toolchain.
- `bun run self:packages:pack-smoke` passes for all eight, which is the clean-consumer install, import, server-render, and CLI-invocation evidence the guide calls the required dry run (`docs/guides/repository-releasing-packages.md:27`).
- `docs/guides/repository-releasing-packages.md` describes the whole workflow, and `.github/workflows/release-npm.yml` implements a `workflow_dispatch`-only, tag-checked, environment-gated, OIDC-provenance publication that refuses to overwrite an existing version (`:112-116`).

## Outstanding

1. **The workflow's package list is fixed.** It published seven of the eight packages, because `.github/workflows/release-npm.yml` carried the set twice as hand-written shell arrays and both copies omitted `packages/cli`. `INFOSCHEMATICS-TOOL-070` corrected it in `f4720a00`: the CLI is in both the version check and the publish loop, and `scripts/release/workflow.test.ts` now asserts the workflow's lists agree with `releasePackages`, so the arrays cannot drift back. That record was delivered, accepted, and pruned, which is why it no longer appears in this item's `blocked_by`.
2. **No registry- or GitHub-side confirmation is recorded anywhere.** The guide requires the organisation to control the `@infoschematics` scope and all eight names, a trusted publisher bound per package to this repository with workflow `release-npm.yml`, environment `npm`, and allowed action `npm publish`, a GitHub environment named `npm` with reviewer protection, and a ruleset protecting `v*` tags (`docs/guides/repository-releasing-packages.md:7-9`). None of that is observable from the tree, and none of it has been evidenced. Until each is confirmed, the first leg of the waiting condition is simply unanswered.
3. **The npm version floor is not enforced.** Trusted publishing needs npm 11.5.1 or later (`docs/guides/repository-releasing-packages.md:9`), but `actions/setup-node` at `.github/workflows/release-npm.yml:37-42` pins only the Node line and the workflow never asserts the npm version it got. A runner whose bundled npm is below the floor fails at the publish step, after `self:check` and `self:release:verify` have already run.
4. **There is no release commit or tag to name.** `git tag -l` is empty, so nothing yet satisfies "the release commit is clean and verified"; the workflow accepts only an existing tag whose commit matches the checkout (`.github/workflows/release-npm.yml:57-66`). The intended version set is implicitly `0.1.0` because that is what the manifests read, but it has not been named as a decision, and the changelog text the guide requires as Release notes (`docs/guides/repository-releasing-packages.md:17`) does not exist in any form.
5. **No authorisation exists.** The repository owner has not authorised a publication run, and nothing in this assessment constitutes one.

Items 3 and 4 are repository work that can proceed without any registry credential. Items 2 and 5 are the owner's to answer and cannot be discharged from inside the tree.

## Release shape

When unblocked, shape one execution plan from the release guide that runs local verification, inspects each packed tarball, publishes in dependency order, verifies registry installation from a clean consumer, records exact versions and provenance, and stops on the first failure. A partial publication is repaired forward; published versions are never overwritten.

## Dependencies / blocks

Blocked by the unrecorded registry configuration and the absent authorisation, both described under Outstanding. Neither is a roadmap dependency, because neither can be discharged from inside this repository. The workflow gap that once blocked it became `INFOSCHEMATICS-TOOL-070` and was delivered on its own verification, which is exactly what keeping it separate was for: fixing it was ordinary repository work rather than progress towards publishing.

## Discussion

### Authority

Local readiness and a green pack smoke do not grant registry authority. The explicit release instruction must identify the version set and applies only to the verified commit. Publication is outward-facing and irreversible: no assessment of readiness, including this one, is a go-ahead.

### Recovery

Because registry versions are immutable, a partial release cannot be rolled back by republishing the same version. Recovery uses the coordinated release contract and a new forward version where required.

### Separation

Keeping publication independent lets renderer and site work proceed without waiting for credentials, while preventing a broad hardening task from accidentally acquiring release authority.

### Whether a workflow that can publish an incomplete set should be able to run at all

The CLI omission was invisible because the workflow restates the package set in shell instead of reading `releasePackages`. Fixing the list closes this instance; the open question is whether the workflow should be able to name a set at all, or whether it should fail unless its set is generated from the same source `check-versions` and `pack-smoke` already read. The second is stricter and costs a generation step in a YAML file that cannot import TypeScript, so the answer is not obviously yes — but the first leaves the next divergence to be found the same way this one was, which is to say by someone reading it before a release rather than by anything that runs.
