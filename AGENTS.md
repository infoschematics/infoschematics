# Repository guidance

Infoschematics contains the domain contract, framework-neutral view calculations, interactive views, authored Infoschematics, public guidance, and website. Keep changes inside the ownership root that owns them: reusable libraries under `packages/`, deployable applications under `apps/`, and independently authored Infoschematic examples under `examples/`. Preserve the dependency direction documented in [the architecture guide](docs/design/architecture.md).

Use only the canonical product concepts defined in [the vocabulary reference](docs/reference/vocabulary.md), and preserve durable reasoning in [the decision-record index](docs/decisions/README.md). When a guide, design document, or specification first relies on a canonical concept, link that use to the term's stable vocabulary id.

Authored Infoschematic definitions are serialisable data. They may contain stable renderer keys, but never React components, runtime stores, browser state, callbacks, or derived registries. Hosts own mounting, page metadata, routing, static assets, and deployment.

The public website is an outlet for this repository, not the owner of reusable product behaviour. Preserve the designed homepage, keep authored Infoschematics independent, and place reusable capability in Domain Model, Domain Core, View Model, or the appropriate renderer or View package before consuming it from Site.

The consumer user guide is Site-owned content under `apps/site/content/`; repository documentation remains canonical under `docs/`, with selected documents rendered by Site rather than copied.

A passing suite is not evidence that output looks right. When changing visual treatment, render the result and look at it: a Flow arrowhead that was referenced but never defined, and a light slab painted onto the blueprint backdrop, both survived a fully green run. Some of what output promises is only visible under a preference no default page expresses: the browser suites ask the runner for `prefers-reduced-motion` through a browser command, because a reduced-motion rule read out of the stylesheet is not the rule the browser resolved.

Run `bun run self:check` before committing. It verifies tests, every TypeScript workspace, dependency boundaries, and the production website build.

A check that measures nothing reports success. The dependency-boundary gate cruised `0 modules, 0 dependencies` for as long as the repository was on TypeScript 7, because dependency-cruiser supports `typescript@<7` and every ownership rule matches on resolved paths, so a cruise that resolves nothing satisfies all of them. The checker therefore has its own install root at `tooling/boundaries`, outside the workspace graph, holding a TypeScript it can drive, and `scripts/boundaries.ts` asserts a module floor and a cross-package type-only edge before it will call a clean cruise a pass. Give any new check an assertion about its own coverage; a check whose failure mode is silence is read as evidence.

Suites and typechecks resolve each package to its own source, so a change to a shared package is visible immediately and no build is a prerequisite for running them. The build still runs in the gate, because it is what proves the published shape.

Turborepo owns the task graph. Every workspace declares its own `build`, `typecheck`, and `test`, so those are cacheable per package rather than per repository; the checks that genuinely span workspaces — vocabulary, dependency boundaries, visual treatment parity, the generators, command-line conventions — are root `//#self:*` tasks. A task is replayed when everything it reads is unchanged, which makes `turbo.json`'s `inputs` load-bearing: a task whose `inputs` miss a file it actually reads will report a green it did not earn. Add the file to `inputs` in the same change that makes the task read it, and prove the miss by editing it. `turbo run … --force` reruns regardless.
