# Repair loop

The checker measures and never repairs. Each round reads what it measured, changes one diagnosed thing, and asks again. Resolve the command as [the source map](sources.md#the-checker) describes.

## Contents

- [Validity before drawing](#validity-before-drawing)
- [One round](#one-round)
- [Stop rule](#stop-rule)
- [Confirm an amendment left the rest alone](#confirm-an-amendment-left-the-rest-alone)

## Validity before drawing

Exit `4` means the document is not yet an Infoschematic. The message names a dotted path and what is wrong at it; fix exactly that path, re-reading the schema for the property concerned, and run the check again. Validity faults come first because no drawing finding exists until the document parses.

## One round

1. Run `check <file> --json` and read `findings` in the order given — ordered by rule, then by the identities concerned, so a repaired finding leaves the list rather than reshuffling it.
2. Key off `rule`, `concerns` and `measured`; those are the machine-readable part. `reads` is the sentence a person would see, and `repairs` is a list of English sentences describing legal ways to clear the finding, not edits to apply. Read `docs/specs/diagnostics.md` for what a rule measures when the sentence is not enough.
3. Take the first `error`. Choose the repair that keeps the representation pattern intact — usually moving or resizing within the same lane, widening a gutter, moving a port, or routing a Flow through a gutter — and make that one change. Prefer moving the part with fewer Flows attached.
4. Re-run the check and confirm the finding left the list without a new error appearing. If a new error appeared, the repair moved the problem; undo it and try the next repair offered.
5. Once no error remains, treat each `observation` as a judgement: clear it when one small change does so without disturbing anything else, and otherwise leave it for the hand-over.

## Stop rule

Stop at the first of:

- the check exits `0` and every remaining observation was considered;
- eight rounds have run since the candidate was written;
- two consecutive rounds end with the same number of errors or more;
- the only repairs left would remove a part, a Flow, or a label the description asked for, or change what the drawing means.

On stopping, undo any round that ended worse than the one before it, then hand over with every remaining finding named. Stopping with findings is a correct result, not a failure to apologise for.

## Confirm an amendment left the rest alone

Before the first edit, copy the document. After the last check, compare the two by identity rather than by eye. With Bun available:

```bash
bun -e '
const read = async (path) => Bun.YAML.parse(await Bun.file(path).text())
const [before, after] = [await read(process.argv[1]), await read(process.argv[2])]
const entries = (doc) => {
  const out = new Map()
  for (const [scope, value] of [...Object.entries(doc), ...Object.entries(doc.diagram ?? {}).map(([k, v]) => [`diagram.${k}`, v])])
    if (Array.isArray(value)) for (const item of value) if (item && item.id) out.set(`${scope}.${item.id}`, JSON.stringify(item))
  return out
}
const [a, b] = [entries(before), entries(after)]
for (const key of new Set([...a.keys(), ...b.keys()]))
  if (a.get(key) !== b.get(key)) console.log(!a.has(key) ? "added" : !b.has(key) ? "removed" : "changed", key)
' before.yaml after.yaml
```

Every identity it prints must be one the request concerned, or a Flow whose endpoint the request moved. Anything else is an unrequested change: undo it, or name it in the hand-over with the reason it could not be avoided. Top-level fields that carry no `id`, such as `title` or `diagram.bounds`, are compared with `diff -u` on the two files.
