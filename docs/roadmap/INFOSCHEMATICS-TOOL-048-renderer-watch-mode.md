---
id: INFOSCHEMATICS-TOOL-048
area: TOOL
title: Renderer watch mode
theme: tool
horizon: future
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-14T07:02:11Z
---

# Renderer watch mode

## Goal

Let command-line users keep a rendered output up to date while editing its YAML or JSON source.

## Context

The renderer command currently performs one explicit input-to-output conversion and exits. Authoring loops must rerun it manually or supply their own file watcher.

## Boundary

This item does not start an HTTP server, edit source documents, choose a general task runner, or make rendering failures overwrite the last successful output.

## Discussion

### Failure behaviour

A watch process should report invalid intermediate source clearly, retain the last valid output, and resume automatically after the source becomes valid again.

### Watch boundary

Shaping must define whether only the named source is watched or whether supported include and asset dependencies can participate without turning the command into a build system.
