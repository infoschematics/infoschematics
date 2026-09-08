---
id: PDR-INFOSCHEMATICS-004
title: Product messaging
date: 2026-09-08
status: current
decision_type: product
decision_type_url: https://knowledgeislands.info/specifications/decision-records/pdr
decision_depends_on: [PDR-INFOSCHEMATICS-003, KDR-INFOSCHEMATICS-001]
---

# PDR-INFOSCHEMATICS-004: Product messaging

## Context

The website, the README, package descriptions, and social metadata each carry a line or two about what Infoschematics is, and until now each was worded ad hoc. The homepage said the product "turns architecture, movement and meaning into one calm, explorable view" and apologised that "the full experience is being assembled" — placeholder copy describing the website's build state rather than the product. Vision, mission, and the sentence used to introduce the product deserve the same treatment the vocabulary already has: decided once, cited everywhere, drifting nowhere.

A schematic explains a thing in operation. The distinction that anchors the messaging is that an Infoschematic is not assembly instructions: it shows what a system does and what moves through it, not how to put it together.

## Decision

The canonical messaging is:

- **Essence** — _A visual instrument for complex systems._
- **Invitation** (headline register) — _See how it works together._ "Works", not "fits": a schematic shows operation, and "fits together" reads as assembly.
- **Definition** (one sentence, introduces the product anywhere) — _An Infoschematic turns a system's architecture and the flows that move through it into one live, explorable view — precise enough for the engineer, clear enough to present to anyone._
- **Mission** (what we do) — _Make complex systems legible: to the people who build them, run them, and depend on them._
- **Vision** (where this goes) — _Serious systems explained by a live instrument, not a stale diagram._

Tone rules for any surface that describes the product:

1. Precise and calm; no marketing hyperbole, no exclamation.
2. Operation over assembly: prefer "works", "moves", "explains" to "fits", "built from", "documents".
3. Never apologise for build state ("is being assembled", "coming soon") in product copy; ship the surface when it can speak plainly.
4. Product concepts keep their canonical names per [KDR-INFOSCHEMATICS-001](KDR-INFOSCHEMATICS-001-product-vocabulary.md); messaging may not coin synonyms.

Surfaces quote these lines verbatim or shorten them without changing their claims. Changing the messaging means amending this record first.

## Consequences

The homepage hero, HTML metadata, README opening, and any future package or release descriptions have one source to quote, and review can point at this record when copy drifts. The cost is ceremony: a better sentence found in passing must land here before it lands on a surface. Vision and mission are deliberately short and unnumbered — they are orientation, not OKRs, and delivery planning stays in the roadmap.
