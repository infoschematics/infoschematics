# Render from the command line

Use the `infoschematics` command when a build, documentation pipeline, or shell script needs a deterministic SVG or PNG from a canonical YAML or JSON Infoschematic. The command does not start a browser and does not execute authored code.

## Install

The CLI is part of the coordinated package release but has not yet been published. Once a release is available, install the package in a Node 24 or later project:

```bash
npm install --save-dev @infoschematics/cli
```

Repository contributors can build and run the same binary from this workspace:

```bash
bun run --cwd packages/cli build
node packages/cli/dist/bin.js --help
```

## Render a file

SVG goes to standard output unless an output path is given:

```bash
infoschematics render architecture.yaml > architecture.svg
infoschematics render architecture.json --output architecture.svg
```

YAML, JSON, and standard input all pass through the same canonical parser. Equivalent documents therefore produce byte-identical output:

```bash
generate-infoschematic | infoschematics render - > architecture.svg
```

The accepted file extensions are `.yaml`, `.yml`, and `.json`. The command will not load a `.ts` file.

## Render a PNG

SVG is the default and existing invocations are unchanged. Ask for a raster image with `--format png`:

```bash
infoschematics render architecture.yaml --format png > architecture.png
infoschematics render architecture.yaml --format png --scale 2 --output architecture@2x.png
```

`--scale` multiplies the document's own pixel size, so `--scale 2` doubles both dimensions without changing the diagram. Standard output stays binary-clean, so redirecting or piping the bytes is safe. `--scale` and `--font` apply to raster output only and are rejected as usage errors when the output stays SVG.

Conversion runs through a pinned build of resvg rather than a browser, chosen in [ADR-INFOSCHEMATICS-024](../decisions/ADR-INFOSCHEMATICS-024-rasterise-with-a-native-resvg-binding.md). There is no background option: the renderer already paints an opaque backdrop across the whole image, so there is no transparency behind it to fill.

### Pin fonts for reproducible text

Everything except text is fully determined by the document: the same input renders to identical bytes every time on one machine, and equivalent YAML and JSON produce the same image. Text is drawn with whatever fonts the machine has, so a render on a build agent can differ from a render on your laptop.

Name the font files to remove that variable. `--font` is repeatable and, once given, the host font stack is ignored entirely:

```bash
infoschematics render architecture.yaml --format png \
  --font ./fonts/Inter-Regular.ttf --font ./fonts/Inter-SemiBold.ttf \
  --output architecture.png
```

A font file the command cannot read fails with status `3` rather than quietly falling back, because a silent fallback would produce exactly the machine-dependent output the option exists to prevent.

## Keep an output up to date while editing

`--watch` renders once and then again after every save, until you interrupt it:

```bash
infoschematics render architecture.yaml --output architecture.svg --watch
```

It needs `--output`, because a stream nobody re-reads is not a useful loop, and it needs a file rather than standard input. Only the named document is watched: this is a rendering loop, not a build system.

A document caught mid-edit does not destroy your last good output. The diagnostic goes to standard error, `architecture.svg` keeps its previous contents, and the next save that validates replaces it — no restart needed. A burst of rapid saves produces one render, and a save that replaces the file rather than modifying it, as many editors do, keeps working.

Press `Ctrl-C` to stop. The watcher is released and the command exits with status `130`, which is distinct from every rendering failure status, so a script can tell an interrupted loop from a broken document.

Raster output works the same way, so `--watch --format png --output architecture.png` keeps a PNG current while you edit.

## Preview in a browser

`--serve` renders the document and serves it to a browser, refreshing the page every time you save:

```bash
infoschematics render architecture.yaml --serve
```

The address is printed on standard error: `http://127.0.0.1:4680/`. Pass `--port` for a different one, or `--port 0` to let the operating system choose. An occupied port fails with status `6` rather than quietly moving, so the address you were given is the address you keep.

The preview is a development server, not hosting. It binds loopback, so nothing on your network can reach it, and it serves exactly three things from memory: the page, the current render, and the refresh stream. No pathname reaches a file — not the document, not its directory, not anything beside it. When a document stops validating, the diagnostic appears on the page above the last render that worked, so the preview never blanks while you type.

To show the preview on another device, name an interface deliberately:

```bash
infoschematics render architecture.yaml --serve --host 0.0.0.0
```

The command says plainly that the preview is now reachable from the network. The reasoning behind these defaults is in [ADR-INFOSCHEMATICS-025](../decisions/ADR-INFOSCHEMATICS-025-keep-the-preview-server-local-and-in-memory.md).

Add `--output architecture.svg` to keep a file current at the same time, and `--format png` to preview the raster instead. `Ctrl-C` releases the socket and the watcher and exits with status `130`.

## Render a TypeScript definition

The command reads inert documents only, and deliberately never executes a module: loading one would run code with your authority before any Infoschematic exists to validate, and [ADR-INFOSCHEMATICS-021](../decisions/ADR-INFOSCHEMATICS-021-keep-command-line-input-inert.md) keeps that step yours rather than the command's. Import the definition in a script you own and render it through the library:

```ts
import { writeFile } from 'node:fs/promises'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { architecture } from './architecture.ts'

await writeFile('architecture.svg', renderInfoschematicSvg(architecture))
```

This is the same renderer the command calls, over the same canonical model, so an equivalent YAML document produces the same SVG — the command adds only a trailing newline for shell use. This repository renders its own authored examples exactly this way in `scripts/render-example.ts`.

## Handle diagnostics

Rendered output — SVG text or PNG bytes — is the only successful standard output. Help uses status `0`; usage and unsupported input use `2`; read failures use `3`; malformed or invalid documents use `4`; output write and raster-conversion failures use `5`; a preview port that cannot be bound uses `6`; and an interrupted watch or preview session uses `130`. Every failure diagnostic goes to standard error, so a failed render cannot mix an error message into a rendered stream.

For example:

```bash
if ! infoschematics render architecture.yaml --output architecture.svg; then
  echo "Infoschematic rendering failed" >&2
  exit 1
fi
```

Use [`@infoschematics/domain-core`](../specs/authoring.md) and [`@infoschematics/render-svg`](../specs/static-rendering.md) directly when an application needs parsed-model access or renderer options beyond the document command.

## Fit Card detail to a static output

The library renderer preserves authored Card detail unless the caller opts into a target size. Supply `responsiveCardDetails` when the SVG will be displayed at a known size:

```ts
const svg = renderInfoschematicSvg(model, {
  responsiveCardDetails: { width: 960, height: 640 }
})
```

The target becomes the SVG's width and height while its authored view box and geometry remain unchanged. At progressively smaller scales the shared output policy withholds description, identity, and stereotype rows in that order. Card labels and accessible authored metadata remain available.

Use `cardDetails` to set the maximum detail the output may show. Responsive resolution can hide a requested optional row when it would be too small, but it never enables a row disabled by `cardDetails`. Omit `responsiveCardDetails` when exact compatibility with authored output treatment is required.
