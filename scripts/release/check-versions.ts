#!/usr/bin/env bun
import { type CliSpec, isDirectInvocation, runCli } from '../cli.ts'
import { coordinatedVersion, readReleaseManifests, releasePackages, validateReleaseManifests } from './packages.ts'

export async function checkReleaseVersions() {
  const manifests = await readReleaseManifests()
  const errors = validateReleaseManifests(manifests)
  if (errors.length > 0) throw new Error(`Release package validation failed:\n- ${errors.join('\n- ')}`)
  return {
    buildOrder: releasePackages.map(({ name }) => name),
    packageCount: releasePackages.length,
    version: coordinatedVersion(manifests)
  } as const
}

export const spec: CliSpec = {
  describe: 'Verify every public package declares one coordinated release version and consistent publication metadata.',
  flags: {
    json: { describe: 'Report the coordinated version and build order as JSON.', kind: 'boolean' }
  },
  run: 'self:packages:check-versions',
  script: 'scripts/release/check-versions.ts'
}

if (isDirectInvocation(import.meta.url)) {
  await runCli(spec, async (parsed) => {
    const result = await checkReleaseVersions()
    if (parsed.boolean('json')) console.log(JSON.stringify(result, null, 2))
    else console.log(`Release packages ${result.version}: ${result.buildOrder.join(' -> ')}`)
  })
}
