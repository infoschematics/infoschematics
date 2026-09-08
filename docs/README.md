# Documentation

Infoschematics keeps one canonical Markdown source for each document. The public site renders selected guides and reference material directly from this directory rather than maintaining copies.

Read the documentation by the question it answers:

- [Decision records](decisions/) explain why the repository and product are shaped as they are.
- [Specifications](specs/) state behaviour that is true now and identify its verification.
- [Design documents](design/) describe where a surface is going, including intent not yet delivered.
- [Guides](guides/) explain how to use Infoschematics.
- [Reference material](reference/) defines shared language and other facts readers need to look up.
- [Roadmap records](roadmap/) say what work is planned, active, or awaiting review.

These instruments should link to one another rather than repeat one another. A roadmap record can deliver a decision, but it does not become the permanent home of that decision. A design can lead implementation, but it does not claim that unfinished behaviour already exists. A specification records the implemented contract and keeps unimplemented intent under an unnumbered `Gaps` section.

## Public documentation

The website publishes this directory's guides, reference material, design documents, and specifications under `/docs/`, mirroring this tree's structure:

- [the authoring guide](guides/authoring.md);
- [the React integration guide](guides/react-integration.md);
- [the vocabulary reference](reference/vocabulary.md);
- [the architecture guide](design/architecture.md), [the visual language guide](design/visual-language.md), [the Present view design](design/view-present.md), and [the Studio view design](design/view-studio.md);
- every specification under [`specs/`](specs/).

Decision records and roadmap records remain maintainer-facing. The maintainer-facing [Cloudflare hosting guide](guides/cloudflare.md) and [releasing-packages guide](guides/releasing-packages.md) also stay off the public site.
