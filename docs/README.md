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

The website currently publishes:

- [the authoring guide](guides/authoring.md);
- [the React integration guide](guides/react-integration.md);
- [the vocabulary reference](reference/vocabulary.md).

Architecture, decision records, specifications, and roadmap records remain maintainer-facing unless publication would help a consumer understand a supported contract. The maintainer-facing [Cloudflare hosting guide](guides/cloudflare.md) records the dashboard-owned deployment settings.
