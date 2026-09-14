# Render from the command line

Use the `infoschematics` command when a build, documentation pipeline, or shell script needs deterministic SVG from a canonical YAML or JSON Infoschematic. The command does not start a browser and does not execute authored code.

## Install

The CLI is part of the coordinated package release but has not yet been published. Once a release is available, install the package in a Node 22 or later project:

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

The accepted file extensions are `.yaml`, `.yml`, and `.json`. TypeScript remains a programmatic authoring option: execute or compile it in your own application, then call `@infoschematics/render-svg` with its defined model. The command will not load a `.ts` file.

## Handle diagnostics

SVG is the only successful standard output. Help uses status `0`; usage and unsupported input use `2`; read failures use `3`; malformed or invalid documents use `4`; output write failures use `5`. Every failure diagnostic goes to standard error, so a failed render cannot mix an error message into an SVG stream.

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
