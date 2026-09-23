---
id: ADR-INFOSCHEMATICS-018
title: Unify presentation sequences
date: 2026-09-14
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-005, ADR-INFOSCHEMATICS-006]
---

# ADR-INFOSCHEMATICS-018: Unify presentation sequences

## Context

Themes and Stories both own ordered Scenes, but each name fixes two independent presentation choices. A Theme exposes every Scene separately and advances manually; a Story exposes one entry and advances automatically. Those coupled forms cannot express an expanded sequence that can play automatically or a collapsed sequence that advances manually. Story `question` also occupies the same explanatory role as a Sequence or Scene description.

Scenes are serialisable presentation material owned by their containing collection. Sharing them through inheritance or source references would make the visible result depend on hidden relationships and would allow reused material to change at a distance.

## Decision

Infoschematics uses one canonical Sequence concept. Every Sequence owns its Scenes directly and requires a `presentation` block whose `display`, `timed`, and `callouts` fields independently govern selection shape, automatic progression, and Callout visibility. Sequence and Scene `description` fields carry explanatory or interrogative copy; the canonical model has no `question` field. The compatibility boundary translates established Themes and Stories into explicit Sequences while their established public input remains supported.

## Consequences

Authors can express all four expanded or collapsed and timed or manual combinations without inventing another container type. Callouts can be enabled independently of selection and timing behaviour, and copied Scenes remain explicit owned data. Runtime and View code gain one presentation collection while the compatibility boundary temporarily retains established Theme and Story inputs. Studio copying, rather than a domain relationship, remains the mechanism for intentional Scene reuse.

## References

- [ADR-INFOSCHEMATICS-005](ADR-INFOSCHEMATICS-005-host-owned-configuration.md) -- keeps authored configuration serialisable and host-owned.
- [ADR-INFOSCHEMATICS-006](ADR-INFOSCHEMATICS-006-additive-views-and-renderers.md) -- defines the additive View boundary that consumes presentation material.
