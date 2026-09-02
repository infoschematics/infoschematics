---
id: PDR-INFOSCHEMATICS-003
title: The product is called Infoschematic
date: 2026-08-31
status: current
decision_type: product
decision_type_url: https://knowledgeislands.info/specifications/decision-records/pdr
decision_depends_on: [PDR-INFOSCHEMATICS-001]
---

# PDR-INFOSCHEMATICS-003: The product is called Infoschematic

## Context

The reusable library and the authored thing it produces need a shared name. The product shows how a system is put together and what moves through it: more structural than an infographic and more explanatory than an implementation diagram.

Names based on `schema` were rejected because this repository also handles configuration and interface specifications, where schema already has a precise meaning.

## Decision

The tool is **Infoschematics** and an authored product is **an Infoschematic**. The plural names the organisation and package scope; the singular names one complete authored product.

`infoschematic` is the naming stem for repositories, packages, types, and public documentation where a more specific role name is not clearer.

## Consequences

Every contract can name its subject directly. The name places charts, mind maps, and unconstrained drawing outside the product boundary. Package names remain role-based under `@infoschematics/*` rather than repeating the product name in every package.
