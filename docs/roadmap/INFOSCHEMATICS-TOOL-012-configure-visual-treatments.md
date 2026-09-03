---
id: INFOSCHEMATICS-TOOL-012
area: TOOL
title: Configure visual treatments
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Let authored configuration and explicit render options control the reusable visual treatments needed to express an Infoschematic consistently across interactive and static outputs.

## Context

The homepage reference composition uses a blueprint background, framed regions, compact Cards, identity labels and deliberate title placement. The visual-language guidance describes these ideas, but the Domain and renderer contracts do not yet say which choices are authored meaning, output policy or fixed visual language.

`INFOSCHEMATICS-SITE-001` will place the bespoke homepage treatment beside generated SVG from `is-infoschematics`. That comparison supplies concrete evidence for the smallest reusable contract rather than making the homepage itself the implementation specification.

## Boundary

This item does not add arbitrary per-element CSS, website-specific renderer branches or executable values to `InfoschematicConfig`. It does not design or implement Flow animation and signalling, which belongs to `INFOSCHEMATICS-TOOL-013`.

## Shaping

Inventory the comparison gaps and classify each choice before designing fields: authored product meaning belongs in Domain Model configuration, output-specific visibility belongs in render options, and invariant visual language belongs in shared renderer tokens.

The shaping pass must cover blueprint or grid visibility and major-line treatment; Lane and Zone borders, corner radii, notches and optional labels; label and title alignment; and optional Standard Card identity tags, stereotypes, descriptions and family or domain treatment. It must establish defaults, inheritance and Canvas/SVG parity without making every CSS property public API.

Promotion to `next` requires an approved minimal configuration vocabulary, representative before-and-after fixtures, backward-compatible defaults and a clear owner for every treatment shared by Canvas and static SVG.

## Discussion

### Configuration boundary

Configuration should express stable visual meaning and intentional presentation choices, not renderer implementation detail. A render option may hide identity tags or descriptions without deleting authored data, while a Card family or domain remains authored classification.

### Renderer parity

Canvas and static SVG should interpret shared treatments consistently. Studio-only editing aids remain outside published output, and the homepage must not become a privileged rendering mode.
