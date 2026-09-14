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
updated_at: 2026-09-13T15:39:09Z
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

## Release shape

When unblocked, shape one execution plan from the release guide that runs local verification, inspects each packed tarball, publishes in dependency order, verifies registry installation from a clean consumer, records exact versions and provenance, and stops on the first failure. A partial publication is repaired forward; published versions are never overwritten.

## Discussion

### Authority

Local readiness and a green pack smoke do not grant registry authority. The explicit release instruction must identify the version set and applies only to the verified commit.

### Recovery

Because registry versions are immutable, a partial release cannot be rolled back by republishing the same version. Recovery uses the coordinated release contract and a new forward version where required.

### Separation

Keeping publication independent lets renderer and site work proceed without waiting for credentials, while preventing a broad hardening task from accidentally acquiring release authority.
