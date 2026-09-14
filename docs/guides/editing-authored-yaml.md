# Edit authored YAML without losing its shape

Use the Domain Core document API when a host needs to apply structured edits to an Infoschematic YAML source while retaining comments, quoted or block scalars, aliases, and deliberate mapping order. Ordinary rendering can continue to use `parseInfoschematic`.

## Retain the authored document

```ts
import {
  infoschematicDocumentModel,
  infoschematicDocumentSource,
  parseInfoschematicDocument
} from '@infoschematics/domain-core'

const parsed = parseInfoschematicDocument(source, { pathname: 'infoschematic.yaml' })
if (!parsed.ok) throw new Error(parsed.issues.map((issue) => issue.message).join('\n'))

const document = parsed.document
const model = infoschematicDocumentModel(document)
const exactSource = infoschematicDocumentSource(document)
```

`InfoschematicDocument` is opaque. YAML nodes never cross the Domain Core boundary, and the model returned to views is the same validated canonical model produced by the ordinary loader.

## Address edits by fields and stable IDs

```ts
import { applyInfoschematicDocumentEdit } from '@infoschematics/domain-core'

const result = applyInfoschematicDocumentEdit(document, {
  version: 1,
  operations: [
    {
      op: 'replace',
      path: [
        { field: 'diagram' },
        { field: 'cards' },
        { id: 'SRC' },
        { field: 'label' }
      ],
      value: 'Source system'
    }
  ]
})

if (!result.ok) throw new Error(result.issues.map((issue) => issue.message).join('\n'))
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
    preview(change.source)
    acceptWhenReady(change.document)
  }}
/>
```

Studio derives structural and presentation selections from the canonical runtime. It projects typed Card, Fabric, Flow, Region and Overlay draft operations through the explicitly named established-input edit boundary, preserving compact Flow fields such as `link`, `waypoints` and `labelAt` instead of replacing the whole Flow.

Direct mode adapts canonical expanded and collapsed Sequences to its focused editor panels. Sequence and Scene changes return through field and stable-ID document paths, so changing one Scene label or focus does not replace the containing Sequence or the top-level presentation collection. Unexposed fields such as presentation switches, Scene visibility and Callout properties survive the edit.

When the host supplies the emitted document as the new input, Studio discards only drafts represented by that accepted edit. YAML syntax trees remain inside Domain Core; View packages receive only the validated canonical model and document-edit results.
