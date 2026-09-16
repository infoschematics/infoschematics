import { readFile, rm, writeFile } from 'node:fs/promises'

import { cruise, getAvailableTranspilers, type ICruiseResult } from 'dependency-cruiser'
import { afterEach, describe, expect, it } from 'vitest'

import configuration from '../.dependency-cruiser.ts'
import { assess, type Cruise, crossPackageTypeOnly, moduleFloor } from './boundaries.ts'

/**
 * A boundary checker can fail open. If workspace imports stop resolving, every
 * ownership rule matches nothing and the cruise reports a clean run that proves
 * nothing at all — which is exactly what this repository shipped until now. The
 * rules check the graph; these tests check that there is a graph to check.
 */
const cruiseOptions = {
  ...configuration.options,
  outputType: 'json' as const,
  ruleSet: { forbidden: configuration.forbidden },
  validate: true
}

const graphOf = async (...files: readonly string[]): Promise<ICruiseResult> => {
  const { output } = await cruise([...files], cruiseOptions)
  return typeof output === 'string' ? (JSON.parse(output) as ICruiseResult) : output
}

/** A View Model module that reaches into a React View: the boundary this repository cares most about. */
const control = 'packages/view-model/src/boundary-control.tmp.ts'

afterEach(async () => {
  await rm(control, { force: true })
})

describe('dependency boundaries', () => {
  it('resolves a workspace import to the package that owns it', async () => {
    const graph = await graphOf('packages/view-canvas/src/InfoschematicDiagram.tsx')
    const module = graph.modules.find((candidate) => candidate.source.endsWith('InfoschematicDiagram.tsx'))
    const workspace = (module?.dependencies ?? []).filter((dependency) =>
      dependency.module.startsWith('@infoschematics/')
    )

    expect(workspace.length).toBeGreaterThan(0)
    expect(workspace.every((dependency) => !dependency.couldNotResolve)).toBe(true)
    expect(workspace.every((dependency) => dependency.resolved.startsWith('packages/'))).toBe(true)
  })

  it('rejects an import that crosses an ownership boundary', async () => {
    await writeFile(control, "import '@infoschematics/view-canvas'\n")
    const graph = await graphOf(control)

    expect(graph.summary.violations.map((violation) => violation.rule.name)).toContain('view-model-stays-generic')
  })
})

/** A cruise shaped like a healthy one, as the assessment sees it. */
const healthy: Cruise = {
  modules: [
    {
      dependencies: [{ dependencyTypes: ['type-only'], resolved: 'packages/view-model/src/runtime.ts' }],
      source: 'packages/view-canvas/src/index.ts'
    }
  ],
  summary: { totalCruised: moduleFloor, violations: [] }
}

describe('the boundary cruise assessment', () => {
  it('accepts a cruise that read the repository', () => {
    expect(assess(healthy)).toEqual([])
  })

  it('rejects a cruise that read nothing', () => {
    const vacuous = assess({ modules: [], summary: { totalCruised: 0, violations: [] } })
    expect(vacuous.some((reason) => reason.includes('below the floor'))).toBe(true)
  })

  it('rejects a plausible-looking fraction of the repository, not merely zero', () => {
    const partial = assess({ ...healthy, summary: { totalCruised: moduleFloor - 1, violations: [] } })
    expect(partial.some((reason) => reason.includes('below the floor'))).toBe(true)
  })

  it('rejects a cruise whose parser cannot see a type-only crossing', () => {
    const valueOnly = assess({
      modules: [
        {
          dependencies: [{ dependencyTypes: ['import'], resolved: 'packages/view-model/src/runtime.ts' }],
          source: 'packages/view-canvas/src/index.ts'
        }
      ],
      summary: { totalCruised: moduleFloor, violations: [] }
    })
    expect(valueOnly.some((reason) => reason.includes('type-only'))).toBe(true)
  })

  it('counts a type-only dependency inside one package as no crossing', () => {
    const internal: Cruise = {
      modules: [
        {
          dependencies: [{ dependencyTypes: ['type-only'], resolved: 'packages/view-canvas/src/model.ts' }],
          source: 'packages/view-canvas/src/index.ts'
        }
      ],
      summary: { totalCruised: moduleFloor, violations: [] }
    }
    expect(crossPackageTypeOnly(internal)).toBe(0)
  })
})

describe('the boundary tooling install root', () => {
  const manifestOf = async (path: string) =>
    JSON.parse(await readFile(path, 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

  /** The major a specification asks for, ignoring the range operator in front of it. */
  const major = (specification: string) => Number(specification.replace(/^\D*/, '').split('.')[0])

  /** The first TypeScript major dependency-cruiser refuses, read from the checker rather than restated here. */
  const refusedMajor = () => {
    const supported = getAvailableTranspilers().find((transpiler) => transpiler.name === 'typescript')?.version
    const upper = supported?.match(/<\s*(\d+)/)?.[1]

    expect(upper).toBeDefined()
    return Number(upper)
  }

  it('names the same dependency-cruiser as the repository', async () => {
    const [repository, tooling] = await Promise.all([
      manifestOf('package.json'),
      manifestOf('tooling/boundaries/package.json')
    ])
    expect(tooling.dependencies?.['dependency-cruiser']).toBe(repository.devDependencies?.['dependency-cruiser'])
  })

  it('pins a TypeScript the checker can actually drive', async () => {
    const tooling = await manifestOf('tooling/boundaries/package.json')
    expect(major(tooling.dependencies?.typescript ?? '')).toBeLessThan(refusedMajor())
  })

  it('still declares the hold it is enforcing', async () => {
    // When this fails, dependency-cruiser drives the repository's own TypeScript and `tooling/boundaries` can go.
    const repository = await manifestOf('package.json')
    expect(major(repository.devDependencies?.typescript ?? '')).toBeGreaterThanOrEqual(refusedMajor())
  })
})
