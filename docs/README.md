# Documentation

Infoschematics keeps one canonical Markdown source for each repository document. The public site renders selected reference and design material directly from this directory rather than maintaining copies; the consumer user guide is Site-owned content under `apps/site/content/`.

Read the documentation by the question it answers:

- [Decision records](decisions/) explain why the repository and product are shaped as they are, with the material that supports them — design documents, surveys — in [`decisions/references/`](decisions/references/).
- [Specifications](specs/) state behaviour that is true now and identify its verification.
- [Guides](guides/) explain how, one audience per guide: `host-` for developers building on the packages, `repository-` for people working on Infoschematics itself.
- [Reference material](reference/) defines shared language and other facts readers need to look up.
- [Roadmap records](roadmap/) say what work is planned, active, or awaiting review.

These instruments should link to one another rather than repeat one another. A roadmap record can deliver a decision, but it does not become the permanent home of that decision. A design can lead implementation, but it does not claim that unfinished behaviour already exists. A specification records the implemented contract and keeps unimplemented intent under an unnumbered `Gaps` section.

## Public documentation

The consumer user guide is Site-owned content under [`apps/site/content/`](../apps/site/content/), published as an ordered progression under `/docs/` ([ADR-INFOSCHEMATICS-014](decisions/ADR-INFOSCHEMATICS-014-site-owned-user-guide.md)). From this directory the website renders selected documents directly:

- [the vocabulary reference](reference/vocabulary.md), rendered as Terminology;
- [the architecture design](decisions/references/design-architecture.md), [the visual language design](decisions/references/design-visual-language.md), [the Present view design](decisions/references/design-view-present.md), and [the Studio view design](decisions/references/design-view-studio.md).

Decision records, specifications, and roadmap records remain maintainer-facing, as do the `repository-` guides.

## Product research

[Related tools and inspiration](decisions/references/related-tools.md) collects adjacent projects and the trade-offs their answers make visible. It sits in [`decisions/references/`](decisions/references/) with the other material that supports the records without being one, and [PDR-INFOSCHEMATICS-003](decisions/PDR-INFOSCHEMATICS-003-adjacent-projects-inform-rather-than-supply.md) states what it is for: adjacent projects inform this product's reasoning and never supply it.
