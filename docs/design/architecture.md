# Architecture

Infoschematics separates authored product data, framework-neutral behaviour, derived visual calculations, output-specific rendering, authored examples, and host publication.

The reasons for this direction are recorded in [the framework-neutral library decision](../decisions/PDR-INFOSCHEMATICS-001-framework-neutral-library.md), [the ownership decision](../decisions/ADR-INFOSCHEMATICS-004-source-sorted-by-ownership.md), [the host-boundary decision](../decisions/ADR-INFOSCHEMATICS-005-host-owned-configuration.md), and [the monorepo-root decision](../decisions/ADR-INFOSCHEMATICS-008-ownership-based-monorepo-roots.md).

## Current package graph

```text
@infoschematics/domain-model
└── no package dependencies

@infoschematics/domain-core
└── @infoschematics/domain-model

@infoschematics/view-model
└── @infoschematics/domain-model

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

@infoschematics/is-blank
└── @infoschematics/domain-core

@infoschematics/is-infoschematics
└── @infoschematics/domain-core

@infoschematics/site
├── @infoschematics/render-svg
├── @infoschematics/view-studio
├── @infoschematics/is-blank
└── @infoschematics/is-infoschematics
```

Dependencies point downward. Domain Model is the dependency root. Domain Core and View Model independently consume it; neither imports an interactive view, authored Infoschematic, or site. Authored Infoschematics do not import interactive views. Site consumes public package exports rather than package internals.

## Ownership roots

Bun treats every package, application, and example as part of one workspace graph, but the physical roots communicate why each unit exists:

- `packages/` contains independently consumable libraries, including Domain, View, and renderer packages.
- `apps/` contains deployable composition roots. The public website follows the shared convention at `apps/site`.
- `examples/` contains independently authored Infoschematic definitions. Their directory and package names use the `is-*` prefix.

## Responsibilities

- `packages/domain-model` owns the dependency-free `InfoschematicConfig` and focused authored product-type modules.
- `packages/domain-core` owns `defineInfoschematic`, defaults, validation, and other framework-neutral domain behaviour.
- `packages/view-model` owns runtime derivation, geometry, ports, routing, guides, placement, editing primitives, and shared visual tokens.
- `packages/view-canvas` owns the interactive React Infoschematic surface, renderer bindings, and Canvas interaction contract.
- `packages/view-present` owns Audience filtering, Scene focus, Story playback, Callouts, and presentation details over Canvas.
- `packages/view-studio` owns Producer-facing Design and Direct capabilities while retaining `App` as a compatibility name for `Studio`.
- `packages/render-svg` owns deterministic, framework-neutral SVG output over Domain Model and View Model.
- `examples/is-blank` owns an independently authored, serialisable blank definition and depends only on Domain Core.
- `examples/is-infoschematics` owns the independently authored, serialisable self-description used by interactive and static hosts and depends only on Domain Core.
- `apps/site` owns the public homepage, documentation presentation, example routing, static assets, and Cloudflare deployment boundary.

Authored Infoschematic examples use the `is-` prefix. Reusable packages and host applications use role-based names. Published package names retain the `@infoschematics/*` namespace.

## Host boundary

A host imports one complete `InfoschematicConfig`, owns the document title, and passes the definition into a view:

```tsx
import { defineInfoschematic } from '@infoschematics/domain-core'
import { App } from '@infoschematics/view-studio'
import '@infoschematics/view-studio/styles.css'

const config = defineInfoschematic({ title: 'My Infoschematic' })

export function Page() {
  return <App config={config} />
}
```

The view derives lookup tables, routed paths, visibility state, and editing state from that prop. Descendants consume derived runtime state through internal application context rather than importing an authored definition.

When `config.id` is absent, an application must not create a shared persistence key. A title-only definition is therefore a safe blank canvas.

## Additive views

[ADR-INFOSCHEMATICS-006](../decisions/ADR-INFOSCHEMATICS-006-additive-views-and-renderers.md) governs the delivered interactive chain:

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

## Renderer boundary

[ADR-INFOSCHEMATICS-009](../decisions/ADR-INFOSCHEMATICS-009-host-provided-versioned-renderers.md) governs the extension boundary. Authored Fabrics, Graphics, and Callouts carry only stable renderer keys and serialisable properties. Configuration never carries JSX, component constructors, callbacks, validators, derived registries, or runtime stores.

Canvas owns immutable, host-provided Fabric and Graphic renderer definitions, runtime property validation, structured diagnostics, and deterministic accessible fallbacks. Present extends the same contract for Callout definitions while retaining ownership of Callout placement, Audience content, and navigation controls. Studio passes the registry through the lower Views and retains compatibility re-exports rather than defining a second contract.

React context distributes one application's supplied registry internally; it is not a mutable public registration surface. Shared SVG definitions and Scope icons remain host-level supporting renderers. They do not change the versioned property contract.

Unknown keys, unsupported definition versions, invalid properties, and duplicate keys are reported through structured host diagnostics without becoming Audience-facing exceptions. A Fabric keeps labelled bounds and interaction geometry, a Graphic receives a labelled placeholder, and a Callout keeps its standard accessible presentation. Static SVG follows the same serialisable input boundary and never imports the React registry.

## Visual token boundary

View Model's readonly `visualTokens` manifest is the source of truth for reusable Canvas visual semantics. It groups semantic values beneath `canvas.geometry`, `canvas.surfaces`, `canvas.text`, `canvas.flows`, `canvas.focus`, `canvas.selection`, and `canvas.output`; token names describe product roles rather than literal colours or measurements.

Canvas consumes the deterministic `packages/view-model/src/tokens.generated.css` projection, whose custom properties use the `--infoschematic-canvas-<group>-<token>` namespace. `scripts/generate-visual-tokens.ts` sorts output lexically, rejects name collisions, and provides a check mode so repository verification fails when generated CSS is stale. Framework-neutral renderers such as SVG import the TypeScript manifest directly and do not depend on generated CSS or an interactive View.

This boundary covers values that must agree across renderers or between TypeScript geometry and rendered output. Canvas-only interaction details remain with Canvas. Present navigation, details, controls, and Callout chrome remain with Present. Studio shell, panel, form, tool, resizer, and Producer-overlay chrome remain with Studio. Authored Scope fills and Flow-family colours remain serialisable Domain Model data. The manifest does not introduce host styling in `InfoschematicConfig` or a general theming API.

## Website role

[ADR-INFOSCHEMATICS-007](../decisions/ADR-INFOSCHEMATICS-007-site-as-public-outlet.md) makes Site the public outlet for packages, canonical consumer documentation, and examples. The homepage may explain Infoschematics visually, but Site does not define product types or reusable behaviour.

The blank and self-describing examples remain separate authored definitions that can be tested and reused independently. The Site mounts the self-describing definition through Studio and renders the same value through the framework-neutral SVG renderer; that composition does not move View or host ownership into the authored package. The former standalone website repository remains outside the monorepo.
