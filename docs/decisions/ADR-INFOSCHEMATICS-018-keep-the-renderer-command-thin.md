---
id: ADR-INFOSCHEMATICS-018
title: Keep the renderer command thin
date: 2026-09-13
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on:
  [ADR-INFOSCHEMATICS-006, ADR-INFOSCHEMATICS-010, ADR-INFOSCHEMATICS-013]
---

# ADR-INFOSCHEMATICS-018: Keep the renderer command thin

## Context

People and automated pipelines need to render authored Infoschematics without cloning the repository or writing a host application. The canonical parser already accepts inert YAML and JSON, and the static renderer already produces deterministic SVG. Putting filesystem and process behaviour into either library would mix a Node command surface with reusable domain or rendering behaviour. Executing TypeScript input would also contradict the serialisable authoring boundary.

## Decision

Publish a Node 22 ESM package named `@infoschematics/cli` with the `infoschematics` binary. Its `render` command reads `.yaml`, `.yml`, `.json`, or standard input, parses exclusively through Domain Core, renders exclusively through the static SVG renderer, and writes SVG to standard output unless an output path is explicit. Diagnostics use standard error and stable exit codes. The command never loads or executes TypeScript modules.

## Consequences

The command remains a replaceable adapter over public libraries rather than a second model or renderer. Pipes and file-based build systems can consume it safely, while programmatic authors continue to import libraries and own any TypeScript execution themselves. The CLI joins the coordinated release set and its packed binary must pass clean-consumer smoke tests before release.
