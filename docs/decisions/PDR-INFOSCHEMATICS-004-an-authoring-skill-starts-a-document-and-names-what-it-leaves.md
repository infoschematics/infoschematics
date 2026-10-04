---
id: PDR-INFOSCHEMATICS-004
title: An authoring skill starts a document and names what it leaves
date: 2026-10-04
status: current
decision_type: product
decision_type_url: https://knowledgeislands.info/specifications/decision-records/pdr
decision_depends_on: [PDR-INFOSCHEMATICS-001, ADR-INFOSCHEMATICS-017, ADR-INFOSCHEMATICS-036]
---

# PDR-INFOSCHEMATICS-004: An authoring skill starts a document and names what it leaves

## Context

Everything downstream of an authored [Infoschematic](../reference/vocabulary.md#infoschematic) exists: the Diagram draws it, `infoschematics render` emits it, Present shows it, Studio edits it, and `infoschematics check` says what its drawing gets wrong. The first step does not. A newcomer starts from a blank serialisable definition, which is a blank page and a vocabulary at the same time.

A generating model can take that step, and the product has no automatic layout to place what it generates. Adjacent agent-authored diagram tools show that none is needed: a model places parts acceptably when it commits to a representation pattern before placing anything, writes a candidate rather than reasoning about coordinates in prose, and repairs against a checker one diagnosed thing at a time. The pattern is this repository's representation guidance, and the checker is [ADR-INFOSCHEMATICS-036](ADR-INFOSCHEMATICS-036-a-checker-measures-a-drawing-and-never-repairs-it.md).

Instructions that teach a contract have to change when the contract changes. A skill maintained elsewhere can only follow a contract change after it has shipped; one versioned beside the contract can be held to it in the same commit.

## Decision

**The product offers an Agent Skill, `infoschematics-authoring`, from this repository.** It lives at `skills/infoschematics-authoring/`, versioned with the schema, vocabulary and checker it teaches, and is installed by placing that directory where an agent runtime discovers skills. The repository declares the Agent Skills standard in its Knowledge Islands configuration, so its own audit holds the skill to that standard; it publishes no other skill.

**Its output is a starting point, not a deliverable.** The skill writes one canonical YAML document from a plain-language description, or amends an existing one, good enough to open in Studio and correct there. Amendment is a first-class mode: it changes what was asked for and leaves every other identity as it was.

**An unresolved document is a legitimate result, and the skill reports it as one.** The repair loop runs under a bounded stop rule. When it stops with findings, the skill names each remaining finding and says that Studio or a conversation is where it is settled. Claiming a clean result it did not achieve is the one failure it must not have, because that is the outcome a person cannot act on.

**The skill consumes the contract and adds nothing to it.** It reads property names, option values, renderer keys and rule codes from the repository or the published schema at authoring time rather than carrying a copy. It places parts the way an author does and lets the checker judge, so automatic layout stays outside the product. Authored output stays serialisable data, and the command it runs keeps its input inert per [ADR-INFOSCHEMATICS-017](ADR-INFOSCHEMATICS-017-the-renderer-command-is-thin-and-its-input-is-inert.md). A skill that needed a contract change would be evidence that a package should own the behaviour instead.

## Consequences

A newcomer can begin from a sentence instead of a schema, and Studio becomes the expected second step rather than a sign that generation failed. The checker's machine-readable findings gain a second consumer whose needs keep them honest: a finding that names no identity or carries no measurement is one a repair loop cannot act on.

The repository now owns an agent surface. A change to the schema, the vocabulary, the representation guidance or the checker's output can invalidate the skill's instructions, so a contract change reviews the skill in the same change. The skill names where each catalogue lives and never lists one, which keeps that review to procedure rather than content.

Generation quality is bounded by the model running the skill. The product promises the procedure and the honesty of its report, not the quality of any particular drawing, and the representation guidance and checker remain the levers for improving it.
