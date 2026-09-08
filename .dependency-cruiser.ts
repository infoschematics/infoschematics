/**
 * Architectural dependency rules for the Infoschematics workspace families.
 *
 * Resolution is configured explicitly: a workspace import is a subpath export,
 * and without `enhancedResolveOptions` nothing resolves into `packages/` at all.
 * Every cross-package rule then matches nothing and the check passes empty, so
 * the resolution assertion in `scripts/dependency-boundaries.test.ts` is part of
 * this configuration rather than an extra.
 *
 * A resolved workspace import lands in the exporting package's built output and
 * a relative import lands in its source, so rules are anchored on package roots:
 * `packages/view-model/dist` and `packages/view-model/src` are one owner.
 */
import type { IConfiguration } from 'dependency-cruiser'

/** One or more package roots, matching both a built import and a source one. */
const owners = (...names: readonly string[]) => `^packages/(${names.join('|')})(/|$)`

/** Everything this repository owns; anything else is a third-party dependency. */
const workspace = '^(packages|apps|examples|scripts)/'

const testFile = '\\.test\\.[cm]?[jt]sx?$'

/** React, however the installer laid it out, and however it was written. */
const reactRuntime = '(^|/)node_modules/react(-dom)?/|^react(-dom)?(/|$)'

const config: IConfiguration = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'A cycle is two owners disagreeing about who is on top.',
      severity: 'error',
      from: {},
      to: { circular: true }
    },
    {
      name: 'no-unresolvable',
      comment:
        'An import that does not resolve is an unchecked import: every ownership rule below matches on resolved paths, so unresolvable dependencies would pass silently.',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true }
    },
    {
      name: 'studio-is-mounted-not-borrowed',
      comment: "src/app is Studio's composition root: entry mounts it, nothing else reaches into it.",
      severity: 'error',
      from: {
        path: '^packages/view-studio/src',
        pathNot: '^packages/view-studio/src/(app|index\\.ts)'
      },
      to: { path: '^packages/view-studio/src/app' }
    },
    {
      name: 'entry-stays-thin',
      comment: 'src/index.ts only exports the public Studio surface and compatibility types from lower Views.',
      severity: 'error',
      from: { path: '^packages/view-studio/src/index\\.ts$' },
      to: {
        pathNot: `^packages/view-studio/src/app|${owners('view-canvas', 'view-present')}|node_modules`
      }
    },
    {
      name: 'canvas-depends-only-on-models',
      comment: 'Canvas may consume Domain Model and View Model, but not higher Views, examples, or applications.',
      severity: 'error',
      from: { path: '^packages/view-canvas/' },
      to: {
        path: workspace,
        pathNot: owners('domain-core', 'domain-model', 'view-model', 'view-canvas')
      }
    },
    {
      name: 'present-builds-on-canvas',
      comment: 'Present may add Audience behaviour over Canvas, but never depend on Studio, examples, or applications.',
      severity: 'error',
      from: { path: '^packages/view-present/' },
      to: {
        path: workspace,
        pathNot: owners('domain-core', 'domain-model', 'view-model', 'view-canvas', 'view-present')
      }
    },
    {
      name: 'studio-builds-on-lower-views',
      comment: 'Studio may compose Domain, Canvas, and Present capabilities, but lower owners never point back to it.',
      severity: 'error',
      from: { path: '^packages/view-studio/' },
      to: {
        path: workspace,
        pathNot: owners('domain-core', 'domain-model', 'view-model', 'view-canvas', 'view-present', 'view-studio')
      }
    },
    {
      name: 'domain-core-is-a-test-only-dependency-for-views',
      comment:
        'A View builds fixtures with defineInfoschematic in its tests, where Domain Core is a declared devDependency. Shipped View code consumes the serialisable contract and derives from View Model.',
      severity: 'error',
      from: { path: '^packages/view-(model|canvas|present)/', pathNot: testFile },
      to: { path: owners('domain-core') }
    },
    {
      name: 'static-renderer-stays-framework-neutral',
      comment: 'Static SVG may consume Domain Model and View Model, but no React or interactive View package.',
      severity: 'error',
      from: { path: '^packages/render-svg/' },
      to: {
        path: `${workspace}|${reactRuntime}`,
        pathNot: owners('domain-model', 'view-model', 'render-svg')
      }
    },
    {
      name: 'view-model-stays-generic',
      comment: 'The view model may consume domain data, but never application, authored-example or deployment code.',
      severity: 'error',
      from: { path: '^packages/view-model/' },
      to: {
        path: workspace,
        pathNot: owners('domain-core', 'domain-model', 'view-model')
      }
    },
    {
      name: 'domain-model-has-no-workspace-dependencies',
      comment: 'The serialisable domain contract is the dependency root and imports no other workspace.',
      severity: 'error',
      from: { path: '^packages/domain-model/' },
      to: {
        path: workspace,
        pathNot: owners('domain-model')
      }
    },
    {
      name: 'domain-core-depends-only-on-domain-model',
      comment: 'Domain behaviour may consume the domain contract but no view, example or deployment workspace.',
      severity: 'error',
      from: { path: '^packages/domain-core/' },
      to: {
        path: workspace,
        pathNot: owners('domain-core', 'domain-model')
      }
    },
    {
      name: 'domain-and-derivation-stay-framework-neutral',
      comment:
        'Domain Model, Domain Core and View Model are consumed by static output as well as by React Views: a framework import here would make the framework-neutral chain a fiction.',
      severity: 'error',
      from: { path: '^packages/(domain-model|domain-core|view-model)/' },
      to: { path: reactRuntime }
    },
    {
      name: 'library-stays-reusable',
      comment: 'Reusable artwork may reach the view model, never Studio application state.',
      severity: 'error',
      from: { path: '^packages/view-studio/src/library' },
      to: { path: '^packages/view-studio/src/app' }
    },
    {
      name: 'authored-infoschematics-stay-framework-neutral',
      comment:
        'An authored Infoschematic is serialisable data over the domain contract: never a view, a renderer, a deployment host, or another example.',
      severity: 'error',
      from: { path: '^examples/is-[^/]+/' },
      to: {
        path: workspace,
        pathNot: `${owners('domain-core', 'domain-model')}|^examples/is-[^/]+/`
      }
    },
    {
      name: 'site-does-not-own-product-model',
      comment: 'The site consumes public packages; it does not reach into domain or view-model internals.',
      severity: 'error',
      from: { path: '^apps/site/' },
      to: { path: owners('domain-model', 'view-model') }
    },
    {
      name: 'nothing-imports-repository-scripts',
      comment: 'Repository scripts consume the workspace to check and generate it; no shipped code depends on them.',
      severity: 'error',
      from: { path: '^(packages|apps|examples)/' },
      to: { path: '^scripts/' }
    },
    {
      name: 'not-to-dev-dep',
      comment:
        'Shipped code may only import what its package declares as a runtime or peer dependency. A test or an ambient declaration may reach the toolchain.',
      severity: 'error',
      from: { path: '^(packages|apps|examples)/', pathNot: `${testFile}|\\.d\\.ts$` },
      to: { dependencyTypes: ['npm-dev'] }
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    // Read each module's own imports rather than the compiler's emit: a type-only
    // import of React is as much of a boundary crossing as a value one, and the
    // automatic JSX runtime the compiler injects is nobody's import.
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'types', 'default'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts']
    }
  }
}

export default config
