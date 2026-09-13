---
id: INFOSCHEMATICS-TOOL-051
area: TOOL
title: Inline browser verification
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-13T20:08:57Z
---

# Inline browser verification

## Goal

Complete a real-browser host-lifecycle check for inline Canvas rendering so integration behaviour has direct interaction evidence in addition to automated server-rendering coverage.

## Context

Inline SVG integration has automated host-lifecycle, server-rendering, identity, and accessibility evidence. Its attempted browser-control review could not run because the browser integration failed to initialise, so hover, selection, mounting, and unmounting were not manually exercised in an embedding host.

## Boundary

This item does not reopen the accepted inline-rendering contract, duplicate automated coverage without purpose, or broaden into general Canvas editing regression work. Any defect found becomes a separately scoped repair only when it falls outside this verification item.

## Shaping

Create the smallest host fixture that mounts two independent inline Canvases, exercises hover and selection, checks stable SVG identity and accessible naming, unmounts and remounts one instance, and records browser evidence. Promote when a supported browser runner is available and the exact fixture and evidence location are agreed.

## Discussion

### Evidence boundary

The missing evidence is browser interaction, not another static snapshot. A passing run should demonstrate host lifecycle and instance isolation through observable DOM behaviour.

### Defect handling

Fix a narrow defect inside this work only when the repair is required to complete the stated browser check and does not change the accepted integration contract.
