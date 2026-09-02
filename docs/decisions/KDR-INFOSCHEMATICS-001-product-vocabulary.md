---
id: KDR-INFOSCHEMATICS-001
title: Product vocabulary
date: 2026-09-02
status: current
decision_type: knowledge
decision_type_url: https://knowledgeislands.info/specifications/decision-records/kdr
decision_depends_on: [PDR-INFOSCHEMATICS-003]
---

# KDR-INFOSCHEMATICS-001: Product vocabulary

## Context

The domain, views, renderers, authored configurations, documentation, and interfaces need the same concepts to carry the same names. Allowing node, component, service, and Card to compete for one concept makes package boundaries and public APIs ambiguous.

## Decision

Infoschematics uses one layered vocabulary. Product terms describe authored data and presentation material. Production terms describe how a Producer creates and presents that product to an Audience. Code names follow the package responsibility that owns them.

The canonical current terms live in [the vocabulary reference](../reference/vocabulary.md). This record owns why one vocabulary exists; the reference owns the words themselves.

Retired public concepts are not reintroduced as synonyms. Ordinary domain prose may still use the same English words where they do not name Infoschematics concepts.

## Consequences

Documentation, interfaces, types, and package names can be checked against one source without repeating the glossary in decisions or roadmap records. Renames must map a concept to an owner before changing symbols. A new public term requires a distinct concept, not merely a familiar metaphor.
