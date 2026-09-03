import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkReleaseVersions } from './check-versions.ts'
import {
  type PackageManifest,
  type ReleasePackage,
  releasePackages,
  releaseRepositoryUrl,
  repositoryRoot,
} from './packages.ts'

export type PackedPackage = Readonly<{
  entry: ReleasePackage
  files: readonly string[]
  manifest: PackageManifest
  tarball: string
}>

const run = async (command: readonly string[], cwd: string) => {
  const executable = command[0]
  if (!executable) throw new Error('Cannot run an empty command')

  return new Promise<string>((resolvePromise, reject) => {
    const child = spawn(executable, command.slice(1), { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', (exitCode) => {
      if (exitCode !== 0) {
        reject(new Error(`${command.join(' ')} failed in ${cwd}:\n${stderr || stdout}`))
        return
      }
      resolvePromise(stdout.trim())
    })
  })
}

const tarEntries = async (tarball: string) =>
  (await run(['tar', '-tzf', tarball], repositoryRoot))
    .split('\n')
    .map((entry) => entry.replace(/^package\//, ''))
    .filter((entry) => entry && !entry.endsWith('/'))
    .sort()

const packedManifest = async (tarball: string): Promise<PackageManifest> => {
  const contents = await run(['tar', '-xOzf', tarball, 'package/package.json'], repositoryRoot)
  return JSON.parse(contents) as PackageManifest
}

const targetValues = (value: unknown): string[] => {
  if (typeof value === 'string') return [value]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  return Object.values(value).flatMap(targetValues)
}

const targetPattern = (target: string) => target.replace(/^\.\//, '')
const patternExpression = (pattern: string) =>
  new RegExp(`^${pattern.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.+)')}$`)

const matchingFiles = (target: string, files: readonly string[]) => {
  const pattern = targetPattern(target)
  if (!pattern.includes('*')) return files.includes(pattern) ? [pattern] : []
  const expression = patternExpression(pattern)
  return files.filter((file) => expression.test(file))
}

const exportTargets = (value: unknown) => {
  const all = targetValues(value)
  return {
    runtime: all.filter((target) => /\.(?:c|m)?js$/.test(target)),
    styles: all.filter((target) => target.endsWith('.css')),
    types: all.filter((target) => /\.d\.(?:c|m)?ts$/.test(target)),
  }
}

export function validatePackedPackage(
  entry: ReleasePackage,
  manifest: PackageManifest,
  files: readonly string[],
): string[] {
  const errors: string[] = []
  const exports = typeof manifest.exports === 'object' && manifest.exports ? manifest.exports : {}
  const allowed = /^(?:package\.json|README(?:\.[^.]+)?|LICENSE(?:\.[^.]+)?|CHANGELOG(?:\.[^.]+)?|dist\/)/i

  if (manifest.name !== entry.name) errors.push(`packed package name must be ${entry.name}`)
  if (!manifest.version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version)) {
    errors.push('packed package version must be fixed semver')
  }
  if (!manifest.description?.trim()) errors.push('packed package description is required')
  if (manifest.license !== 'MIT') errors.push('packed package license must be MIT')
  if (manifest.type !== 'module') errors.push('packed package type must be module')
  if (manifest.private === true) errors.push('packed package cannot be private')
  if (!manifest.files?.includes('dist')) errors.push('packed package files metadata must include dist')
  if (typeof manifest.repository !== 'object' || manifest.repository.url !== releaseRepositoryUrl) {
    errors.push(`packed package repository.url must be ${releaseRepositoryUrl}`)
  }
  if (typeof manifest.repository !== 'object' || manifest.repository.directory !== entry.directory) {
    errors.push(`packed package repository.directory must be ${entry.directory}`)
  }
  if (manifest.engines?.node !== '>=22') errors.push('packed package engines.node must be >=22')
  if (manifest.publishConfig?.access !== 'public') errors.push('packed package publishConfig.access must be public')
  if (!files.includes('package.json')) errors.push('tarball must contain package.json')
  if (!files.includes('dist/LICENSE')) errors.push('tarball must contain dist/LICENSE')
  if (Object.keys(exports).length === 0) errors.push('packed package must expose at least one public entry')

  for (const file of files) {
    if (!allowed.test(file)) errors.push(`unexpected tarball file: ${file}`)
    if (/(^|\/)(?:src|test|tests|__tests__)(\/|$)|\.test\.[^.]+$/.test(file)) {
      errors.push(`source or test file must not be packed: ${file}`)
    }
  }

  for (const cssExport of entry.cssExports) {
    if (!(cssExport in exports)) errors.push(`missing required CSS export ${cssExport}`)
  }

  for (const [subpath, value] of Object.entries(exports)) {
    const targets = exportTargets(value)
    const css = subpath.endsWith('.css') || targets.styles.length > 0
    if (css) {
      if (targets.styles.length === 0) errors.push(`${subpath} must expose a CSS file`)
      for (const target of targets.styles) {
        if (!target.startsWith('./dist/')) errors.push(`${subpath} must target dist, received ${target}`)
        if (matchingFiles(target, files).length === 0) errors.push(`${subpath} CSS target is missing: ${target}`)
      }
      continue
    }
    if (targets.runtime.length === 0) errors.push(`${subpath} must expose ESM runtime JavaScript`)
    if (targets.types.length === 0) errors.push(`${subpath} must expose declaration types`)
    for (const target of [...targets.runtime, ...targets.types]) {
      if (!target.startsWith('./dist/')) errors.push(`${subpath} must target dist, received ${target}`)
      if (matchingFiles(target, files).length === 0) errors.push(`${subpath} target is missing: ${target}`)
    }
  }

  return errors
}

const wildcardSpecifiers = (name: string, subpath: string, value: unknown, files: readonly string[]) => {
  const runtime = exportTargets(value).runtime[0]
  if (!runtime || !subpath.includes('*') || !runtime.includes('*')) return []
  const expression = patternExpression(targetPattern(runtime))
  return matchingFiles(runtime, files).flatMap((file) => {
    const match = expression.exec(file)
    const replacement = match?.[1]
    return replacement ? [`${name}/${subpath.slice(2).replace('*', replacement)}`] : []
  })
}

export function publicEntrySpecifiers(packed: PackedPackage) {
  const exports = typeof packed.manifest.exports === 'object' && packed.manifest.exports ? packed.manifest.exports : {}
  const javascript: string[] = []
  const styles: string[] = []
  for (const [subpath, value] of Object.entries(exports)) {
    const targets = exportTargets(value)
    if (targets.styles.length > 0 || subpath.endsWith('.css')) {
      styles.push(subpath === '.' ? packed.entry.name : `${packed.entry.name}/${subpath.slice(2)}`)
      continue
    }
    if (subpath.includes('*')) javascript.push(...wildcardSpecifiers(packed.entry.name, subpath, value, packed.files))
    else javascript.push(subpath === '.' ? packed.entry.name : `${packed.entry.name}/${subpath.slice(2)}`)
  }
  return { javascript: [...new Set(javascript)].sort(), styles: [...new Set(styles)].sort() }
}

const packOne = async (entry: ReleasePackage, destination: string): Promise<PackedPackage> => {
  const sourceManifest = JSON.parse(
    await readFile(resolve(repositoryRoot, entry.directory, 'package.json'), 'utf8'),
  ) as PackageManifest
  const filename = `${entry.name.replace('@infoschematics/', 'infoschematics-')}-${sourceManifest.version}.tgz`
  await run(
    ['bun', 'pm', 'pack', '--destination', destination, '--ignore-scripts', '--quiet'],
    resolve(repositoryRoot, entry.directory),
  )
  const tarball = resolve(destination, filename)
  return { entry, files: await tarEntries(tarball), manifest: await packedManifest(tarball), tarball }
}

const consumerSource = (javascript: readonly string[], styles: readonly string[]) => `
import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { defineInfoschematic } from '@infoschematics/domain-core'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { Studio } from '@infoschematics/view-studio'

const entries = ${JSON.stringify(javascript)}
for (const specifier of entries) await import(specifier)

const config = defineInfoschematic({ title: 'Release smoke' })
if (config.infoschematic.viewBox.width !== 1200) throw new Error('Title-only config did not normalise')
const svg = renderInfoschematicSvg(config)
if (!svg.startsWith('<svg') || !svg.includes('Release smoke')) throw new Error('Static SVG import did not render')
const markup = renderToStaticMarkup(React.createElement(Studio, { config }))
if (!markup.includes('<h1>Release smoke</h1>')) throw new Error('Studio server render failed')

const styles = ${JSON.stringify(styles)}
for (const [index, specifier] of styles.entries()) {
  const entry = \`css-entry-\${index}.ts\`
  await writeFile(entry, \`import '\${specifier}'\n\`)
  try {
    execFileSync('bun', ['build', entry, '--outdir', \`css-dist-\${index}\`, '--target', 'browser'], { stdio: 'pipe' })
  } catch (error) {
    const stderr = error && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : String(error)
    throw new Error(\`Public CSS entry \${specifier} failed to bundle:\n\${stderr}\`)
  }
}

console.log(JSON.stringify({ imported: entries.length + styles.length, studio: true, svg: true }))
`

const smokeConsumer = async (packed: readonly PackedPackage[], directory: string) => {
  const entries = packed.flatMap(publicEntrySpecifiers)
  const javascript = entries.flatMap(({ javascript }) => javascript)
  const styles = entries.flatMap(({ styles }) => styles)
  const dependencies = Object.fromEntries([
    ...packed.map(({ entry, tarball }) => [entry.name, `file:${tarball}`]),
    ['react', '19.2.0'],
    ['react-dom', '19.2.0'],
  ])
  const overrides = Object.fromEntries(packed.map(({ entry, tarball }) => [entry.name, `file:${tarball}`]))
  await mkdir(directory, { recursive: true })
  await writeFile(
    join(directory, 'package.json'),
    `${JSON.stringify({ name: 'infoschematics-release-smoke', private: true, type: 'module', dependencies, overrides }, null, 2)}\n`,
  )
  await writeFile(join(directory, 'smoke.ts'), consumerSource(javascript, styles))
  await run(['bun', 'install', '--production', '--ignore-scripts'], directory)
  return run(['bun', 'run', 'smoke.ts'], directory)
}

export async function packAndSmoke() {
  await checkReleaseVersions()
  const temporary = await mkdtemp(join(tmpdir(), 'infoschematics-release-'))
  const tarballDirectory = join(temporary, 'tarballs')
  await mkdir(tarballDirectory, { recursive: true })
  try {
    const packed: PackedPackage[] = []
    for (const entry of releasePackages) packed.push(await packOne(entry, tarballDirectory))
    const errors = packed.flatMap((item) =>
      validatePackedPackage(item.entry, item.manifest, item.files).map((error) => `${item.entry.name}: ${error}`),
    )
    if (errors.length > 0) throw new Error(`Packed package inspection failed:\n- ${errors.join('\n- ')}`)
    const smoke = await smokeConsumer(packed, join(temporary, 'consumer'))
    return {
      packages: packed.map(({ entry, tarball }) => ({ name: entry.name, tarball: basename(tarball) })),
      smoke: JSON.parse(smoke) as unknown,
    }
  } finally {
    if (!process.argv.includes('--keep-temp')) await rm(temporary, { force: true, recursive: true })
    else console.log(`Release smoke retained at ${temporary}`)
  }
}

const invokedDirectly = process.argv[1] ? resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false

if (invokedDirectly) {
  try {
    console.log(JSON.stringify(await packAndSmoke(), null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
