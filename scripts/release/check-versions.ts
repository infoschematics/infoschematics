import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
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

const invokedDirectly = process.argv[1] ? resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false

if (invokedDirectly) {
  try {
    const result = await checkReleaseVersions()
    if (process.argv.includes('--json')) console.log(JSON.stringify(result, null, 2))
    else console.log(`Release packages ${result.version}: ${result.buildOrder.join(' -> ')}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
