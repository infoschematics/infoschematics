---
id: ADR-INFOSCHEMATICS-023
title: Keep the preview server local and in memory
date: 2026-09-15
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-017]
---

# ADR-INFOSCHEMATICS-023: Keep the preview server local and in memory

## Context

`infoschematics render --serve` is the first listening socket this product publishes. Everything before it was a filter: read a path, write a path, exit. A server that runs on an author's machine while they edit has defaults that are a security contract rather than a convenience, and the usual shape for a development preview — serve a directory, watch everything under it, bind all interfaces so a phone on the same network can look — is exactly the shape that leaks a working tree.

`ADR-INFOSCHEMATICS-017` already decided that the command treats its input as inert data rather than code. A preview that served files by pathname would undo the spirit of that: the command would go from reading one document the user named to exposing whatever a request asked for.

## Decision

The preview server binds loopback (`127.0.0.1`) by default, holds the current render in memory, and serves exactly three resources: the preview page at `/`, the render at `/render`, and a refresh stream at `/events`. Every other pathname returns 404 without consulting the filesystem, so there is no path traversal to get wrong — the server has no code that turns a request into a file.

Widening the binding requires `--host`, which prints a plain statement that the preview is now reachable from the network and is a development server rather than a host. The default port is fixed and an occupied port is a failure with its own status, `6`, rather than a silent move to another port: a preview whose address changes under you is worse than one that tells you to close the other session.

Refresh is Server-Sent Events from `node:http`, and the page reloads itself. Nothing beyond the Node standard library enters the package, so `CLI-005` and the coordinated release are unaffected.

A document that stops validating puts its diagnostic on the page above the last render that worked. The preview never blanks while you type, which is the same retained-output contract watch mode has, made visible.

## Consequences

The preview is useless for showing someone else your work without `--host`, and that is the intended friction: the flag is where the decision to expose is made, and it says so at the time. Reviewing on a phone means naming an interface deliberately.

Serving from memory means the preview and a `--output` file can differ if the write fails, and the preview is the one that is right. It also means nothing under the working directory is reachable even by accident, which is worth more than the symmetry.

Production hosting, multi-document navigation, and collaborative editing are not deferred follow-ups of this record; a product that wants them should decide them on their own terms rather than by widening a development preview.
