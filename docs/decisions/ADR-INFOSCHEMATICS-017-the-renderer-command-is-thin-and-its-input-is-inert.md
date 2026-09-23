---
id: ADR-INFOSCHEMATICS-017
title: The renderer command is thin and its input is inert
date: 2026-09-15
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on:
  [PDR-INFOSCHEMATICS-001, ADR-INFOSCHEMATICS-006, ADR-INFOSCHEMATICS-010, ADR-INFOSCHEMATICS-013]
---

# ADR-INFOSCHEMATICS-017: The renderer command is thin and its input is inert

## Context

People and automated pipelines need to render authored Infoschematics without cloning the repository or writing a host application. The canonical parser already accepts inert YAML and JSON, and the static renderer already produces deterministic SVG. Putting filesystem and process behaviour into either library would mix a Node command surface with reusable domain or rendering behaviour.

The harder half of the question is what the command will accept. Programmatic authors have asked whether a trusted project could hand it a TypeScript module that exports a canonical model, so that a build pipeline could render a definition-time model without writing a host application. The request is real: a TypeScript definition can express a model that repeats coordinates, shares constants, and compiles under the same types as the rest of a consumer's application. Nothing in the product prevents authoring that way. What is at stake is whether the _command_ grows the capability to execute it.

Parsing data and loading a module are different acts. `bun run` style execution runs arbitrary code with the invoking user's authority — imports, environment access, network calls, filesystem writes — before any Infoschematic exists to validate. A command that decides to execute based on a filename extension makes that escalation invisible: `infoschematics render model.ts` looks exactly like `infoschematics render model.yaml` in a Makefile, a CI job, or a documentation pipeline, and a renamed or attacker-chosen path silently changes which of the two happens.

The workaround is also already complete rather than hypothetical. `scripts/render-example.ts` renders authored documents through `@infoschematics/render-svg` with no CLI bridge at all, and a consumer holding a TypeScript definition rather than a document writes the same handful of lines against the same library. Execution stays inside a file the consumer owns, which leaves the trust properties legible.

## Decision

Publish a Node 22 ESM package named `@infoschematics/cli` with the `infoschematics` binary. Its `render` command reads `.yaml`, `.yml`, `.json`, or standard input, parses exclusively through Domain Core, renders exclusively through the static SVG renderer, and writes SVG to standard output unless an output path is explicit. Diagnostics use standard error and stable exit codes.

**The command accepts only inert canonical documents.** It never loads or executes TypeScript modules, and rejects them with guidance towards the programmatic libraries. Executing a consumer's TypeScript is the consumer's own step, taken in their own script, before the canonical document or in-memory model reaches this product.

Extension-driven auto-detection of executable input is rejected permanently, not merely deferred. If trusted-input execution is ever revisited, it may only arrive as an explicit option whose name states that it runs code, never as a consequence of the pathname; its documentation must carry the trust boundary alongside it; and it must still parse the resulting value through Domain Core rather than trusting the module's shape. That is a future decision with its own record, not an implementation detail of this one.

Two alternatives were weighed and declined. A `--typescript` flag that loads a module through a runtime loader was declined because it puts a code-execution surface into a package whose value is being a safe pipeline component, and because the honest naming of such a flag makes its awkwardness explicit rather than removing it. A separate executable-input command was declined because it duplicates argument handling, diagnostics, and release smoke for a workflow already served by four lines of consumer code.

## Consequences

The command remains a replaceable adapter over public libraries rather than a second model or renderer. It stays a data-in, SVG-out filter that a pipeline can run against untrusted paths without reasoning about code execution, and `CLI-005`'s narrow dependency set stays narrow. Programmatic authors continue to import libraries and own any TypeScript execution themselves; the CLI's usage text and [the command-line rendering guide](../guides/host-rendering-from-the-command-line.md) point rejected TypeScript input at the supported programmatic path.

The cost lands on TypeScript authors, who write their own render script rather than invoking one command. That cost is bounded and visible, where the cost of the alternative is an execution surface that is easy to invoke by accident.

The CLI joins the coordinated release set and its packed binary must pass clean-consumer smoke tests before release.
