import { rm, writeFile } from 'node:fs/promises'

import { cruise, type ICruiseResult } from 'dependency-cruiser'
import { afterEach, describe, expect, it } from 'vitest'

import configuration from '../.dependency-cruiser.ts'

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
