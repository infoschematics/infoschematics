# Architecture

[Infoschematics](/docs/reference/vocabulary/#infoschematic) separates authored product data, framework-neutral behaviour, derived visual calculations, output-specific rendering, authored examples, and host publication.

The reasons for this direction are recorded in [the framework-neutral library decision](../PDR-INFOSCHEMATICS-001-an-infoschematic-is-an-authored-definition-not-a-drawing.md), [the ownership decision](../ADR-INFOSCHEMATICS-004-source-sorted-by-ownership.md), [the host-boundary decision](../ADR-INFOSCHEMATICS-005-host-owned-configuration.md), and [the monorepo-root decision](../ADR-INFOSCHEMATICS-008-ownership-based-monorepo-roots.md).

## Current package graph

```text
@infoschematics/domain-model
└── no package dependencies

@infoschematics/domain-core
└── @infoschematics/domain-model

@infoschematics/view-model
├── @infoschematics/domain-model
└── @infoschematics/domain-core

@infoschematics/view-canvas
├── @infoschematics/domain-model
└── @infoschematics/view-model

@infoschematics/view-present
├── @infoschematics/domain-model
├── @infoschematics/view-model
└── @infoschematics/view-canvas

@infoschematics/view-studio
├── @infoschematics/domain-core
├── @infoschematics/domain-model
├── @infoschematics/view-model
├── @infoschematics/view-canvas
└── @infoschematics/view-present

@infoschematics/render-svg
├── @infoschematics/domain-model
└── @infoschematics/view-model

@infoschematics/cli
├── @infoschematics/domain-core
├── @infoschematics/render-svg
└── @infoschematics/view-model

@infoschematics/is-blank
└── @infoschematics/domain-core

@infoschematics/is-infoschematics
└── @infoschematics/domain-core

@infoschematics/is-system
└── @infoschematics/domain-core

@infoschematics/is-showcase
└── @infoschematics/domain-core

@infoschematics/site
├── @infoschematics/domain-core
├── @infoschematics/render-svg
├── @infoschematics/view-canvas
├── @infoschematics/view-present
├── @infoschematics/view-studio
├── @infoschematics/is-blank
├── @infoschematics/is-infoschematics
└── @infoschematics/is-showcase
```

Dependencies point downward. Domain Model is the dependency root. Domain Core validates and normalises its serialisable contract; View Model consumes that canonical behaviour before deriving renderer-neutral runtime state. Neither imports an interactive View, authored Infoschematic, or Site. Authored Infoschematics do not import interactive Views. Site consumes public package exports rather than package internals.

This graph is mechanically enforced. `.dependency-cruiser.ts` states each ownership boundary as a rule, `bun run self:boundaries:verify` runs them over every source root including `scripts/`, and `bun run self:check` fails on a violation. Because a boundary checker fails silently when its imports stop resolving, the check reports what it measured and refuses a clean cruise that measured too little: `scripts/boundaries.ts` holds a module floor and a count of cross-package type-only dependencies, and `scripts/dependency-boundaries.test.ts` asserts that workspace imports still resolve into `packages/` and that an illegal import is still reported. A clean cruise means the rules ran, not that nothing was checked.

The checker reads TypeScript through the TypeScript compiler API, and dependency-cruiser supports `typescript@<7` while this repository is on TypeScript 7. So the checker has its own install root at `tooling/boundaries` — outside the workspace graph, holding the TypeScript it can drive — and the check installs it with a frozen lockfile before cruising. Its fallback parser is not enough: it reads `import type` but not a type-only re-export, and `tsPreCompilationDeps` is on precisely because a type-only crossing is a crossing. When dependency-cruiser supports the repository's own TypeScript, `scripts/dependency-boundaries.test.ts` fails on the hold it declares and the install root can go.

## Ownership roots

Bun treats every package, application, and example as part of one workspace graph, but the physical roots communicate why each unit exists:

- `packages/` contains independently consumable libraries, including Domain, View, and renderer packages.
- `apps/` contains deployable composition roots. The public website follows the shared convention at `apps/site`.
- `examples/` contains independently authored Infoschematic definitions. Their directory and package names use the `is-*` prefix.

## Responsibilities

- `packages/domain-model` owns the dependency-free canonical `Infoschematic` data contract and the established `InfoschematicConfig` compatibility input.
- `packages/domain-core` owns canonical parsing, definition, defaults, validation, serialisation, document editing, and established-input normalisation.
- `packages/view-model` owns canonical runtime derivation, geometry, ports, routing, guides, placement, editing primitives, and shared visual tokens.
- `packages/view-canvas` owns the interactive React Infoschematic surface, renderer bindings, and Canvas interaction contract.
- `packages/view-present` owns Audience filtering, Scene focus, Sequence playback, Callouts, and presentation details over Canvas.
- `packages/view-studio` owns Producer-facing Design and Direct capabilities while retaining `App` as a compatibility name for `Studio`.
- `packages/render-svg` owns deterministic, framework-neutral SVG output over Domain Model and View Model.
- `packages/cli` owns Node command parsing, streams, files, and exit behaviour over Domain Core and the static renderer.
- `examples/is-blank` owns an independently authored, serialisable blank definition and depends only on Domain Core.
- `examples/is-infoschematics` owns independently authored, serialisable homepage-overview and self-description definitions used by static and interactive hosts and depends only on Domain Core.
- `examples/is-system` owns the independently authored, serialisable four-stage journey definition and depends only on Domain Core.
- `examples/is-showcase` owns an independently authored, serialisable definition exercising every capability the document contract offers, and depends only on Domain Core.
- `apps/site` owns the public homepage, documentation presentation, example routing, static assets, and Cloudflare deployment boundary.

Authored Infoschematic examples use the `is-` prefix. Reusable packages and host applications use role-based names. Published package names retain the `@infoschematics/*` namespace.

## Example package contract

Every example package is a copyable starting point rather than a fixture the repository happens to share. Each one authors its Infoschematic as canonical YAML beside its manifest, declares what it contains under an `infoschematics.examples` key, ships a generated typed export for browser consumers, and carries a README, a `check` command, and a `render` command that work unchanged after the directory is copied out of this repository.

The YAML is the single authored source. The typed export is generated from it by `bun run self:examples:generate`, embeds the exact document it was generated from, and parses that document at import time, so a consumer's model and a reader's document cannot disagree. `bun run self:examples:verify` fails the repository check when a committed export no longer matches its YAML. Two hand-maintained copies of one diagram would drift silently, which is the reason for generating rather than authoring the export; [ADR-INFOSCHEMATICS-020](../ADR-INFOSCHEMATICS-020-generate-example-exports-from-authored-yaml.md) records the trade.

Discovery follows the same metadata. `scripts/render-example.ts` builds its renderable catalogue from what the packages declare rather than from a list held in the script, so adding an example is a change to that package alone.

## Host boundary

A host imports one complete canonical `Infoschematic`, owns the document title, and passes the definition into a View:

```tsx
import { defineInfoschematicModel } from "@infoschematics/domain-core";
import { App } from "@infoschematics/view-studio";
import "@infoschematics/view-studio/styles.css";

const config = defineInfoschematicModel({
  id: "MY-DIAGRAM",
  title: "My Infoschematic",
  diagram: { bounds: { x: 0, y: 0, width: 1200, height: 800 } },
});

export function Page() {
  return <App config={config} />;
}
```

View Model normalises either supported input once, then derives lookup tables, routed paths, visibility state, and editing state from the canonical value. Descendants consume the derived runtime through internal context rather than importing or re-projecting authored data. `InfoschematicConfig` remains accepted only at the public compatibility boundary; Canvas, Present, Studio presentation, and static rendering consume canonical runtime concepts internally. Compatibility-only Studio source-edit projections remain explicitly named until the document-edit protocol owns them.

Canonical `id` values are persistence keys. Established configurations preserve the earlier optional-id behaviour: when their id is absent, Studio does not create a shared persistence key, so a title-only established definition remains a safe blank canvas.

Runtime construction is not allowed to throw for a document the contract accepted: any geometry a renderer refuses to express is refused or reported at the edit, which is why every route derivation reaches the one orthogonal construction (`COMPOSE-002` in [the composition specification](../../specs/composition.md)). That is the product's obligation, not the host's, and no host containment substitutes for it. A host still holds the second half: both interactive Views build the runtime inside a render-time memo, so a throw from construction unmounts the tree that contains it — the Diagram, the surrounding chrome and the draft's undo history alike. A host mounting a View in a page that carries anything else should wrap it in an error boundary, so a defect in construction costs one failed surface rather than the page. This is a recommendation to hosts rather than a requirement on them, because a host cannot be asked to compensate for a contract the product owns.

## Additive views

[ADR-INFOSCHEMATICS-006](../ADR-INFOSCHEMATICS-006-additive-views-and-renderers.md) governs the delivered interactive chain:

```text
@infoschematics/view-canvas
        ↓
@infoschematics/view-present
        ↓
@infoschematics/view-studio
```

Canvas owns the reusable Infoschematic component. Present wraps Canvas with Audience navigation and presentation state. Studio consumes the lower View contracts and adds Producer-facing Design and Direct capabilities while retaining its integrated compatibility composition.

`@infoschematics/render-svg` consumes the same View Model in parallel and produces deterministic static SVG without React. Future renderers can target other outputs without acquiring interactive-view dependencies.

Hosts choose the narrowest surface that provides the behaviour they need. Canvas accepts optional visibility, flow, interaction, and renderer inputs; Present owns Audience session behaviour; Studio adds authoring controls. Static consumers call `renderInfoschematicSvg` without a DOM or React runtime.

A host may display static SVG as an inert image or insert the generated string into its own document for scoped inspection. In the inline mode the host owns a unique renderer-resource prefix, event listeners, transient state, accessible controls, replacement, and teardown. It may rely only on the outer `data-artefact-id` and `data-artefact-kind` metadata contract, not renderer child markup or document-wide native IDs. Inline DOM mutation never updates the authored model; persistent editing still flows through Canvas or Studio followed by rerendering.

## Renderer boundary

[ADR-INFOSCHEMATICS-009](../ADR-INFOSCHEMATICS-009-host-provided-versioned-renderers.md) governs the extension boundary. Authored Fabrics, Overlays and Callouts carry only stable renderer keys and serialisable properties. Configuration never carries JSX, component constructors, callbacks, validators, derived registries, or runtime stores.

Canvas owns immutable, host-provided Fabric and Overlay renderer definitions, runtime property validation, structured diagnostics, and deterministic accessible fallbacks. Present extends the same contract for Callout definitions while retaining ownership of Callout placement, Audience content, and navigation controls. Studio passes the registry through the lower Views and retains compatibility re-exports rather than defining a second contract.

React context distributes one application's supplied registry internally; it is not a mutable public registration surface. Shared SVG definitions and Scope icons remain host-level supporting renderers. They do not change the versioned property contract.

Unknown keys, unsupported definition versions, invalid properties, and duplicate keys are reported through structured host diagnostics without becoming Audience-facing exceptions. A Fabric keeps labelled bounds and interaction geometry, a Overlay receives a labelled placeholder, and a Callout keeps its standard accessible presentation. Static SVG follows the same serialisable input boundary and never imports the React registry.

## Visual token boundary

View Model's readonly `visualTokens` manifest is the source of truth for reusable Canvas visual semantics. It groups semantic values beneath `canvas.geometry`, `canvas.surfaces`, `canvas.text`, `canvas.flows`, `canvas.focus`, `canvas.selection`, and `canvas.output`; token names describe product roles rather than literal colours or measurements.

Canvas consumes the deterministic `packages/view-model/src/tokens.generated.css` projection, whose custom properties use the `--infoschematic-canvas-<group>-<token>` namespace. `scripts/generate-visual-tokens.ts` sorts output lexically, rejects name collisions, and provides a check mode so repository verification fails when generated CSS is stale. Framework-neutral renderers such as SVG import the TypeScript manifest directly and do not depend on generated CSS or an interactive View.

This boundary covers values that must agree across renderers or between TypeScript geometry and rendered output. Canvas-only interaction details remain with Canvas. Present navigation, details, controls, and Callout chrome remain with Present. Studio shell, panel, form, tool, resizer, and Producer-overlay chrome remain with Studio. Authored Scope fills and Flow-family colours remain serialisable Domain Model data. The manifest does not introduce host styling in `InfoschematicConfig` or a general theming API.

## Website role

[ADR-INFOSCHEMATICS-007](../ADR-INFOSCHEMATICS-007-site-as-public-outlet.md) makes Site the public outlet for packages, canonical consumer documentation, and examples. The homepage may explain Infoschematics visually, but Site does not define product types or reusable behaviour.

The blank and self-describing examples remain separate authored definitions that can be tested and reused independently. The Site mounts the self-describing definition through Studio and renders the same value through the framework-neutral SVG renderer; that composition does not move View or host ownership into the authored package. The former standalone website repository remains outside the monorepo.
