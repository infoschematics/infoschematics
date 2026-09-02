# Architecture

Infoschematics separates authored product data, framework-neutral calculations, the React runtime, examples and the public website.

```text
@infoschematics/domain-model
  └── no workspace dependencies

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

Dependencies point downward. Domain Model is the dependency root. Domain Core and View Model independently consume it, and neither imports an interactive view or the site. Authored Infoschematics never import interactive views. The site consumes public package exports rather than package internals.

## Workspaces

- `workspaces/domain-model` — dependency-free `InfoschematicConfig` and focused authored product-type modules.
- `workspaces/domain-core` — `defineInfoschematic`, defaults, validation and other framework-neutral domain behaviour.
- `workspaces/view-model` — geometry, ports, routing, guides, placement, edit primitives and shared tokens.
- `workspaces/view-studio` — the current combined interactive view, presentation controls, producer controls and runtime derived from configuration.
- `workspaces/is-blank` — an independently authored, serialisable blank definition. It depends on Domain Core only.
- `workspaces/site` — the public homepage, example routing, static assets and Cloudflare deployment boundary.

Authored Infoschematic configuration workspaces use the `is-` prefix; reusable packages and host applications use role-based workspace names. Published package names retain the `@infoschematics/*` namespace.

## Host boundary

A host creates or imports one complete `InfoschematicConfig`, owns the document title and passes the definition into React:

```tsx
import { defineInfoschematic } from '@infoschematics/domain-core'
import { App } from '@infoschematics/view-studio'
import '@infoschematics/view-studio/styles.css'

const config = defineInfoschematic({ title: 'My Infoschematic' })

export function Page() {
  return <App config={config} />
}
```

React derives lookup tables, routed paths, visibility state and editor state from that prop. Descendants consume the derived runtime through the internal application context; they do not import an authored definition.

When `config.id` is absent, the application must not create a shared persistence key. A title-only definition is therefore a safe blank canvas.

## Additive view direction

The current Studio package is the source being separated into an additive view chain:

```text
@infoschematics/view-canvas
        ↓
@infoschematics/view-present
        ↓
@infoschematics/view-studio
```

Canvas owns the reusable Infoschematic component. Present wraps Canvas with Audience navigation and presentation state. Studio wraps Present with Producer-facing Design and Direct capabilities. `@infoschematics/render-svg` will consume the same View Model in parallel to produce deterministic static SVG without React.

## Renderer boundary

Authored Fabrics, Graphics and Callouts may carry renderer keys and serialisable properties. React maps those keys to visual implementations. Configuration never carries JSX, component constructors or callbacks.

The current built-in Fabric keys are provisional implementation capability. Adding a stable public renderer requires documenting the key, its properties and fallback behaviour before examples rely on it.

## Website role

The website is the public outlet for packages, guidance and examples. Its homepage may explain Infoschematics visually, but it does not define product types or reusable behaviour. The blank example and future self-describing example remain separate authored definitions so they can be tested and reused independently.

The former standalone website repository is not part of this workspace graph. Deployment migration or archival of that repository is a separate operational action.
