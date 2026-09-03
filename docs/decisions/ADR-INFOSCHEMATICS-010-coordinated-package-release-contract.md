---
id: ADR-INFOSCHEMATICS-010
title: Coordinated package release contract
date: 2026-09-03
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-006, ADR-INFOSCHEMATICS-008]
---

# ADR-INFOSCHEMATICS-010: Coordinated package release contract

## Context

Infoschematics packages are developed together but consumed outside the repository through npm. Publishing TypeScript source or workspace-relative assumptions would make consumer behaviour depend on the consumer's toolchain, while independently versioning interdependent packages could create combinations the repository never verified. React View packages also expose CSS whose import and tree-shaking behaviour must remain explicit.

The public set now includes seven packages. Studio depends on Domain Core, Domain Model, View Model, Canvas, and Present; Present depends on Canvas; Canvas and the static SVG renderer depend on View Model. A release therefore needs one dependency-closed contract rather than a collection of unrelated package uploads.

## Decision

Every public package emits unbundled ESM JavaScript, source maps, and TypeScript declarations under `dist/`. Each package export map names every supported JavaScript, declaration, and CSS entry point explicitly and points only into `dist/`; source files, wildcard exports, and private internals are not part of the public release surface. Runtime dependencies remain external rather than bundled.

CSS is opt-in through explicit subpath imports. `@infoschematics/view-model/tokens.css` and each React View package's `styles.css` entry remain marked side-effectful so a consumer optimiser cannot discard an intentional style import. JavaScript-only packages declare no side effects.

Published ESM and declarations support Node 22 and later. Browser-oriented React packages also support server rendering under that Node floor, with React and React DOM retained as peer dependencies where required. Release automation uses a current Node 24 environment compatible with npm trusted publishing.

One release assigns the same exact SemVer to the following dependency-closed set and uses exact versions for internal package dependencies:

1. `@infoschematics/domain-model`
2. `@infoschematics/domain-core`
3. `@infoschematics/view-model`
4. `@infoschematics/render-svg`
5. `@infoschematics/view-canvas`
6. `@infoschematics/view-present`
7. `@infoschematics/view-studio`

Build, pack inspection, and clean Node and browser-oriented consumer checks complete for the whole set before publication. Publication uses one immutable `v<version>` repository tag, dependency-first order, npm trusted publishing from the protected GitHub `npm` environment, OIDC, and provenance. No long-lived npm publish token is stored in the repository or GitHub environment.

## Consequences

Consumers receive stable JavaScript, declarations, and stylesheet entry points without compiling repository source or knowing the monorepo layout. Explicit export maps intentionally reject private subpath imports, and each CSS import remains a visible host decision.

Any public-package change coordinates all seven versions, dependency ranges, changelog, and release tag even if only one package implementation changed. A failed partial publication cannot overwrite an npm version; the release owner must deprecate the affected version when appropriate and fix forward with a new coordinated patch.

Examples and Site remain outside the public package set. Publication remains a separately human-authorised operation after local and CI release verification; preparing release artefacts does not itself publish anything.
