# Edit authored YAML without losing its shape

Use the Domain Core document API when a host needs to apply structured edits to an Infoschematic YAML source while retaining comments, quoted or block scalars, aliases, and deliberate mapping order. Ordinary rendering can continue to use `parseInfoschematic`.

## Retain the authored document

```ts
import {
  infoschematicDocumentModel,
  infoschematicDocumentSource,
  parseInfoschematicDocument,
} from "@infoschematics/domain-core";

const parsed = parseInfoschematicDocument(source, {
  pathname: "infoschematic.yaml",
});
if (!parsed.ok)
  throw new Error(parsed.issues.map((issue) => issue.message).join("\n"));

const document = parsed.document;
const model = infoschematicDocumentModel(document);
const exactSource = infoschematicDocumentSource(document);
```

`InfoschematicDocument` is opaque. YAML nodes never cross the Domain Core boundary, and the model returned to views is the same validated canonical model produced by the ordinary loader.

## Declare the diagram grid

Every Diagram must declare `gridSize` beside `bounds`; a document that omits it is rejected rather than defaulted:

```yaml
diagram:
  bounds: { x: 0, y: 0, width: 960, height: 540 }
  gridSize: 10
```

Use `10` for the ordinary grid, `1` to place on whole units, a larger value for a coarser lattice, and `0` to disable grid geometry and rounding entirely. Existing documents authored before the field became required need this one line added. Programmatic callers going through `InfoschematicConfig` keep resolving to `10` without a change.

Grid size is geometry, not appearance: it sets what placement snaps to, while the authored grid appearance treatment independently decides whether a lattice is drawn.

## Address edits by fields and stable IDs

```ts
import { applyInfoschematicDocumentEdit } from "@infoschematics/domain-core";

const result = applyInfoschematicDocumentEdit(document, {
  version: 1,
  operations: [
    {
      op: "replace",
      path: [
        { field: "diagram" },
        { field: "cards" },
        { id: "SRC" },
        { field: "label" },
      ],
      value: "Source system",
    },
  ],
});

if (!result.ok)
  throw new Error(result.issues.map((issue) => issue.message).join("\n"));
```

Paths never contain numeric collection indices. An ID segment selects one member of the immediately preceding collection. `add` and `move` may carry `{ before: 'ID' }` or `{ after: 'ID' }`; omit the anchor to append.

Edit values are inert JSON data. A batch is transactional: Domain Core edits a clone, validates the complete Infoschematic and every reference, and returns the original document unchanged on failure. When an edited field is named `elements`, its string values are emitted once in ascending order.

## Retain undo and host authority

A successful result contains the updated opaque `document`, emitted `source`, canonical `model`, sorted `changedElements`, and an `inverse` envelope. Applying the inverse restores the previous semantic value and exact affected source, including comments and scalar style.

The host decides whether the result becomes current and whether to write it to a file. Domain Core and Studio do not perform persistence or resolve concurrent edits.

## Integrate Studio

Pass either established `config` input or an authored `document`, never both. In document mode, `onDocumentChange` receives only a fully validated edit result:

```tsx
<Studio
  document={document}
  onDocumentChange={(change) => {
    preview(change.source);
    acceptWhenReady(change.document);
  }}
/>
```

Studio derives structural and presentation selections from the canonical runtime. It projects typed Card, Fabric, Flow, Region and Overlay draft operations through the explicitly named established-input edit boundary, preserving compact Flow fields such as `link`, `waypoints` and `labelAt` instead of replacing the whole Flow.

The Direct workspace adapts canonical expanded and collapsed Sequences to its focused editor panels. Sequence and Scene changes return through field and stable-ID document paths, so changing one Scene label or focus does not replace the containing Sequence or the top-level presentation collection. Unexposed fields such as presentation switches, Scene visibility and Callout properties survive the edit.

A Scene's `cues` are authored data of exactly that kind. Each cue names a [Diagram Dynamic](../reference/vocabulary.md#diagram-dynamic) the same document declares under `diagram.dynamics` and, at most, `playback: repeat`; it carries no duration, no easing, no timer, and no occurrence key, because the View playing the Scene owns the beat. An edit that adds or removes a cue addresses it by the Scene's stable ID like any other field, and validation rejects a cue naming a Dynamic the Diagram does not declare or the same Dynamic cued twice in one Scene, leaving the document unchanged.

Focus and Dynamics remain separate concepts. A Scene's `focus` says what the audience should be looking at, and the Scene's `cues` say which named change should play while they look; editing one leaves the other as authored, and neither is a way of expressing the other.

When the host supplies the emitted document as the new input, Studio discards only drafts represented by that accepted edit. YAML syntax trees remain inside Domain Core; View packages receive only the validated canonical model and document-edit results.

To enable direct source replacement, also handle `onDocumentReplace`. Studio calls it only with a fully validated document:

```tsx
<Studio
  document={document}
  onDocumentChange={(change) => setDocument(change.document)}
  onDocumentReplace={(replacement) => setDocument(replacement.document)}
/>
```

The Source tab is then available in every Studio mode. Invalid YAML remains in the textarea with diagnostics and does not replace the rendered model. Valid replacements, structured edits, undo and redo share one session-local document history. Copy uses the browser clipboard; persistence remains a host responsibility.
