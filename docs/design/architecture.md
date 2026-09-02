# Architecture

Infoschematics separates authored product data, framework-neutral calculations, the React runtime, examples and the public website.

```text
@infoschematics/site
  ├── @infoschematics/react
  └── @infoschematics/example-blank
          └── @infoschematics/model
                  └── @infoschematics/core

@infoschematics/react
  ├── @infoschematics/model
  └── @infoschematics/core
```

Dependencies point downward. Core and Model never import React or the site. Examples never import React. The site consumes public package exports rather than package internals.

## Workspaces

- `workspaces/core` — geometry, ports, routing, guides, placement, edit primitives and shared tokens.
- `workspaces/model` — `InfoschematicConfig`, authored product types and `defineInfoschematic` defaults.
- `workspaces/app` — the `@infoschematics/react` React view, application, producer controls and runtime derived from configuration.
- `workspaces/is-blank` — the independently authored, serialisable blank definition. It depends on Model only.
- `workspaces/site` — the public homepage, example routing, static assets and Cloudflare deployment boundary.

Authored Infoschematic configuration workspaces use the `is-` prefix; reusable packages and host applications use role-based workspace names. Published package names retain the `@infoschematics/*` namespace.

## Host boundary

A host creates or imports one complete `InfoschematicConfig`, owns the document title and passes the definition into React:

```tsx
import { defineInfoschematic } from '@infoschematics/model'
import { App } from '@infoschematics/react'
import '@infoschematics/react/styles.css'

const config = defineInfoschematic({ title: 'My Infoschematic' })

export function Page() {
  return <App config={config} />
}
```

React derives lookup tables, routed paths, visibility state and editor state from that prop. Descendants consume the derived runtime through the internal application context; they do not import an authored definition.

When `config.id` is absent, the application must not create a shared persistence key. A title-only definition is therefore a safe blank canvas.

## Renderer boundary

Authored Fabrics, Graphics and Callouts may carry renderer keys and serialisable properties. React maps those keys to visual implementations. Configuration never carries JSX, component constructors or callbacks.

The current built-in Fabric keys are provisional implementation capability. Adding a stable public renderer requires documenting the key, its properties and fallback behaviour before examples rely on it.

## Website role

The website is the public outlet for packages, guidance and examples. Its homepage may explain Infoschematics visually, but it does not define product types or reusable behaviour. The blank example and future self-describing example remain separate authored definitions so they can be tested and reused independently.

The former standalone website repository is not part of this workspace graph. Deployment migration or archival of that repository is a separate operational action.
