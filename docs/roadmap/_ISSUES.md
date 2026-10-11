---
areas: { SITE: 32, TOOL: 150 }
---

# Roadmap issue ledger

This ledger reserves fixed issuing-area namespaces. Allocate the next work item in its area as one greater than that area's high-water mark; never lower a value or reuse an issued number after a record is pruned. Reserve a number by committing this ledger's advance on its own before writing the record. Areas are not mutable themes or groups.

- `SITE` reserves through `032`.
- `TOOL` reserves through `150`.

## Ideas

Ideas are kept here when a work record is cancelled but the thought is worth keeping. An idea holds no number; capture it as a new record through `ki-next` when it is taken up.

- **One word for mode.** The reader's ground is called mode everywhere a reader or author sees it, since `ADR-INFOSCHEMATICS-037`, but internal names still say scheme: `useColourScheme`, `colourSchemeAttribute`, `colourSchemeStorageKey` and `ColourSchemeButton` in `packages/view-canvas/src/colour-scheme.ts`, `RenderedScheme`, and the Site gallery's `SchemeGallery`, `schemeSpecimen` and `.scheme-gallery`. A naming-only sweep of about thirty files. Two points need a decision rather than a sweep: `data-infoschematic-scheme` and `infoschematics.colour-scheme` are observable by a host page and a returning reader's browser, so moving them needs a one-time migration or a stated decision that the remembered choice is expendable; and `--scheme` stays as a published command-line spelling under `CLI-013`. Kept on 2026-10-11 in place of the cancelled `INFOSCHEMATICS-TOOL-143`.
