---
id: INFOSCHEMATICS-TOOL-049
area: TOOL
title: Renderer preview server
theme: tool
horizon: future
status: draft
candidate: true
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-13T20:08:57Z
---

# Renderer preview server

## Goal

Let local command-line users preview a rendered Infoschematic through a small, explicitly started development server.

## Context

The renderer command emits a file and owns no server lifecycle. A local preview currently requires another host even when the user only needs to inspect output during authoring.

## Boundary

This item does not provide production hosting, remote access by default, collaborative editing, Studio, or a general static-site server.

## Discussion

### Relationship to watching

The server may reuse a separately delivered watch capability, but it remains a distinct outcome with network binding, lifecycle, error-page, and browser-refresh responsibilities.

### Safety

Shaping must define loopback-only defaults, port selection, shutdown, source-path exposure, caching, and invalid-document behaviour before implementation.
