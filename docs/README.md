# Documentation

Infoschematics keeps one canonical Markdown source for each repository document. The public site renders selected reference and design material directly from this directory rather than maintaining copies; the consumer user guide is Site-owned content under `apps/site/content/`.

Read the documentation by the question it answers:

- [Decision records](decisions/) explain why the repository and product are shaped as they are.
- [Specifications](specs/) state behaviour that is true now and identify its verification.
- [Design documents](design/) describe where a surface is going, including intent not yet delivered.
- [Guides](guides/) explain maintainer workflows such as hosting and releasing.
- [Reference material](reference/) defines shared language and other facts readers need to look up.
- [Roadmap records](roadmap/) say what work is planned, active, or awaiting review.

These instruments should link to one another rather than repeat one another. A roadmap record can deliver a decision, but it does not become the permanent home of that decision. A design can lead implementation, but it does not claim that unfinished behaviour already exists. A specification records the implemented contract and keeps unimplemented intent under an unnumbered `Gaps` section.

## Public documentation

The consumer user guide is Site-owned content under [`apps/site/content/`](../apps/site/content/), published as an ordered progression under `/docs/` ([ADR-INFOSCHEMATICS-014](decisions/ADR-INFOSCHEMATICS-014-site-owned-user-guide.md)). From this directory the website renders selected documents directly:

- [the vocabulary reference](reference/vocabulary.md), rendered as Terminology;
- [the architecture guide](design/architecture.md), [the visual language guide](design/visual-language.md), [the Present view design](design/view-present.md), and [the Studio view design](design/view-studio.md).

Decision records, specifications, and roadmap records remain maintainer-facing, as do the [Cloudflare hosting guide](guides/cloudflare.md) and the [releasing-packages guide](guides/releasing-packages.md).
