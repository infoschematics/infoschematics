# Specifications

These specifications define the reusable contracts owned by Infoschematics. They describe authored domain data, framework-neutral view calculations and the producer-facing Studio view without depending on one deployed Infoschematic.

## Specification map

- [Domain Model](domain-model.md) defines authored identity, data, geography and relationship rules.
- [View Model](view-model.md) defines geometry, routes, ports, guides and placement calculations.
- [Present View](view-present.md) defines audience-facing filtering, Scene focus, Story playback and presentation controls.
- [Studio View](view-studio.md) defines generic editing sessions, selection, drafts, change consolidation and creation or removal behaviour.

The [vocabulary reference](../reference/vocabulary.md) is the canonical source for product terms. Requirements in these files use that vocabulary but do not redefine it.

## Lineage

The initial requirements were lifted from the topology and editor specifications of `5g-emerge-ibc-2026`. Each migrated requirement records its former identifier so later changes retain a trace back to the behaviour from which the library was extracted.

The migration deliberately excludes IBC and MSF completeness rules, telemetry coverage, contract packs, dashboards, deployment, obsolete storage keys and legacy theatre vocabulary. Those are application concerns, not reusable library contracts.

## Requirement language

`MUST`, `MUST NOT`, `SHOULD` and `MAY` are normative. A verification note names an automated check that exists in this repository. An implementation-surface note identifies relevant code but does not claim that the requirement is automatically verified.

Known missing enforcement belongs in the `Gaps` section of the owning specification rather than being disguised as a verified requirement.
