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

@infoschematics/view-studio
├── @infoschematics/domain-core
├── @infoschematics/domain-model
└── @infoschematics/view-model

@infoschematics/is-blank
└── @infoschematics/domain-core

@infoschematics/site
├── @infoschematics/view-studio
└── @infoschematics/is-blank
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
- `packages/view-model` owns geometry, ports, routing, guides, placement, editing primitives, and shared visual tokens.
- `packages/view-studio` owns the current combined interactive view, presentation controls, Producer controls, and runtime state derived from configuration.
- `examples/is-blank` owns an independently authored, serialisable blank definition and depends only on Domain Core.
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

## Additive view direction

[ADR-INFOSCHEMATICS-006](../decisions/ADR-INFOSCHEMATICS-006-additive-views-and-renderers.md) establishes the intended interactive chain:

```text
@infoschematics/view-canvas
        ↓
@infoschematics/view-present
        ↓
@infoschematics/view-studio
```

Canvas owns the reusable Infoschematic component. Present wraps Canvas with Audience navigation and presentation state. Studio wraps Present with Producer-facing Design and Direct capabilities.

`@infoschematics/render-svg` consumes the same View Model in parallel and produces deterministic static SVG without React. Future renderers can target other outputs without acquiring interactive-view dependencies.

## Renderer boundary

Authored Fabrics, Graphics, and Callouts may carry renderer keys and serialisable properties. A renderer maps those keys to visual implementations. Configuration never carries JSX, component constructors, callbacks, or runtime stores.

Current built-in Fabric keys are provisional implementation capability. A stable public renderer requires a documented key, property contract, and fallback behaviour before examples rely on it.

## Website role

[ADR-INFOSCHEMATICS-007](../decisions/ADR-INFOSCHEMATICS-007-site-as-public-outlet.md) makes Site the public outlet for packages, canonical consumer documentation, and examples. The homepage may explain Infoschematics visually, but Site does not define product types or reusable behaviour.

The blank example and future self-describing example remain separate authored definitions so they can be tested and reused independently. The former standalone website repository is outside this monorepo.
