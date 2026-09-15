---
id: ADR-INFOSCHEMATICS-021
title: Keep command-line input inert
date: 2026-09-15
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-018, PDR-INFOSCHEMATICS-001]
---

# ADR-INFOSCHEMATICS-021: Keep command-line input inert

## Context

`ADR-INFOSCHEMATICS-018` made the renderer command a thin adapter that reads `.yaml`, `.yml`, `.json`, or standard input, and `CLI-004` in [the command-line rendering specification](../specs/command-line-rendering.md) states the matching rejection of executable TypeScript. Programmatic authors have asked whether a trusted project could hand the command a TypeScript module that exports a canonical model, so that a build pipeline could render a definition-time model without writing a host application.

The request is real: a TypeScript definition can express a model that repeats coordinates, shares constants, and compiles under the same types as the rest of a consumer's application. Nothing in the product prevents authoring that way. What is at stake is whether the _command_ grows the capability to execute it.

Parsing data and loading a module are different acts. `bun run` style execution runs arbitrary code with the invoking user's authority — imports, environment access, network calls, filesystem writes — before any Infoschematic exists to validate. A command that decides to execute based on a filename extension makes that escalation invisible: `infoschematics render model.ts` looks exactly like `infoschematics render model.yaml` in a Makefile, a CI job, or a documentation pipeline, and a renamed or attacker-chosen path silently changes which of the two happens.

The workaround is also already complete rather than hypothetical. `scripts/render-example.ts` imports the authored example packages directly and renders them through `@infoschematics/render-svg` with no CLI bridge at all. A consumer with a TypeScript definition writes the same handful of lines and keeps execution inside a file they own, where its trust properties are legible.

## Decision

Retain `CLI-004` unchanged: the published command accepts only inert canonical documents, and rejects executable TypeScript with guidance towards the programmatic libraries. Executing a consumer's TypeScript is the consumer's own step, taken in their own script, before the canonical document or in-memory model reaches this product.

Extension-driven auto-detection of executable input is rejected permanently, not merely deferred. If trusted-input execution is ever revisited, it may only arrive as an explicit option whose name states that it runs code, never as a consequence of the pathname; its documentation must carry the trust boundary alongside it; and it must still parse the resulting value through Domain Core rather than trusting the module's shape. That is a future decision with its own record, not an implementation detail of this one.

Two alternatives were weighed and declined. A `--typescript` flag that loads a module through a runtime loader was declined because it puts a code-execution surface into a package whose value is being a safe pipeline component, and because the honest naming of such a flag makes its awkwardness explicit rather than removing it. A separate executable-input command was declined because it duplicates argument handling, diagnostics, and release smoke for a workflow already served by four lines of consumer code.

## Consequences

The command stays a data-in, SVG-out filter that a pipeline can run against untrusted paths without reasoning about code execution, and `CLI-005`'s narrow dependency set stays narrow. No product behaviour changes: `CLI-004` keeps its conforming status and gains a citation to this record, and the CLI's usage text and [the command-line rendering guide](../guides/rendering-from-the-command-line.md) keep pointing rejected TypeScript input at the supported programmatic path.

The cost lands on TypeScript authors, who write their own render script rather than invoking one command. That cost is bounded and visible, where the cost of the alternative is an execution surface that is easy to invoke by accident.
