#!/usr/bin/env bun
import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, extname, join, resolve, sep } from 'node:path'
import { formatInfoschematicIssue, parseInfoschematic } from '../../packages/domain-core/src/index.ts'
import { renderInfoschematicSvg } from '../../packages/render-svg/src/index.ts'
import { type CliSpec, isDirectInvocation, runCli } from '../cli.ts'
import { type ExamplePackage, examplePackages, examplesRoot } from '../examples.ts'
import { checkReleaseVersions } from './check-versions.ts'
import {
  type PackageManifest,
  type ReleasePackage,
  releaseNodeEngine,
  releasePackages,
  releaseRepositoryUrl,
  repositoryRoot
} from './packages.ts'

export type PackedPackage = Readonly<{
  entry: ReleasePackage
  files: readonly string[]
  manifest: PackageManifest
  tarball: string
}>

type CommandOutcome = Readonly<{ exitCode: number | null; stderr: string; stdout: string }>

const runOutcome = async (command: readonly string[], cwd: string, stdin?: string): Promise<CommandOutcome> => {
  const executable = command[0]
  if (!executable) throw new Error('Cannot run an empty command')

  return new Promise<CommandOutcome>((resolvePromise, reject) => {
    const child = spawn(executable, command.slice(1), { cwd, stdio: ['pipe', 'pipe', 'pipe'] })
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
    child.on('close', (exitCode) => resolvePromise({ exitCode, stderr, stdout }))
    child.stdin.end(stdin)
  })
}

const run = async (command: readonly string[], cwd: string) => {
  const outcome = await runOutcome(command, cwd)
  if (outcome.exitCode !== 0) {
    throw new Error(`${command.join(' ')} failed in ${cwd}:\n${outcome.stderr || outcome.stdout}`)
  }
  return outcome.stdout.trim()
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
  new RegExp(
    `^${pattern
      .split('*')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('(.+)')}$`
  )

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
    types: all.filter((target) => /\.d\.(?:c|m)?ts$/.test(target))
  }
}

export function validatePackedPackage(
  entry: ReleasePackage,
  manifest: PackageManifest,
  files: readonly string[]
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
  if (manifest.engines?.node !== releaseNodeEngine)
    errors.push(`packed package engines.node must be ${releaseNodeEngine}`)
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

  const binaries = typeof manifest.bin === 'string' ? { [entry.name]: manifest.bin } : (manifest.bin ?? {})
  for (const [name, target] of Object.entries(binaries)) {
    if (!target.startsWith('./dist/')) errors.push(`${name} binary must target dist, received ${target}`)
    if (!files.includes(target.replace(/^\.\//, ''))) errors.push(`${name} binary target is missing: ${target}`)
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
    await readFile(resolve(repositoryRoot, entry.directory, 'package.json'), 'utf8')
  ) as PackageManifest
  const filename = `${entry.name.replace('@infoschematics/', 'infoschematics-')}-${sourceManifest.version}.tgz`
  await run(
    ['bun', 'pm', 'pack', '--destination', destination, '--ignore-scripts', '--quiet'],
    resolve(repositoryRoot, entry.directory)
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
    ['react-dom', '19.2.0']
  ])
  const overrides = Object.fromEntries(packed.map(({ entry, tarball }) => [entry.name, `file:${tarball}`]))
  await mkdir(directory, { recursive: true })
  await writeFile(
    join(directory, 'package.json'),
    `${JSON.stringify({ name: 'infoschematics-release-smoke', private: true, type: 'module', dependencies, overrides }, null, 2)}\n`
  )
  await writeFile(join(directory, 'smoke.ts'), consumerSource(javascript, styles))
  await run(['bun', 'install', '--production', '--ignore-scripts'], directory)

  const cli = join(directory, 'node_modules', '.bin', 'infoschematics')
  const yaml = 'id: CLI\ntitle: Release CLI smoke\ndiagram:\n  bounds: 0 0 100 100\n  gridSize: 10\n'
  const json = `${JSON.stringify({ id: 'CLI', title: 'Release CLI smoke', diagram: { bounds: '0 0 100 100', gridSize: 10 } })}\n`
  await writeFile(join(directory, 'model.yaml'), yaml)
  await writeFile(join(directory, 'model.json'), json)
  await writeFile(join(directory, 'malformed.yaml'), 'id: [\n')

  const yamlRender = await runOutcome([cli, 'render', 'model.yaml'], directory)
  const jsonRender = await runOutcome([cli, 'render', 'model.json'], directory)
  const stdinRender = await runOutcome([cli, 'render', '-'], directory, yaml)
  if (
    yamlRender.exitCode !== 0 ||
    jsonRender.exitCode !== 0 ||
    stdinRender.exitCode !== 0 ||
    yamlRender.stderr ||
    jsonRender.stderr ||
    stdinRender.stderr ||
    !yamlRender.stdout.startsWith('<svg') ||
    yamlRender.stdout !== jsonRender.stdout ||
    yamlRender.stdout !== stdinRender.stdout
  ) {
    throw new Error('Packed renderer command did not produce byte-identical clean SVG from YAML, JSON, and stdin.')
  }

  const fileRender = await runOutcome([cli, 'render', 'model.yaml', '--output', 'model.svg'], directory)
  if (fileRender.exitCode !== 0 || fileRender.stdout || fileRender.stderr) {
    throw new Error('Packed renderer command did not keep explicit file output off standard streams.')
  }
  if ((await readFile(join(directory, 'model.svg'), 'utf8')) !== yamlRender.stdout) {
    throw new Error('Packed renderer command file output differs from standard output.')
  }

  // A raster render exercises the packed third-party engine, which the workspace suite never installs from a tarball.
  // What it proves is agreement, not correctness: it compares the packed render with the workspace render and with
  // itself, so two identically wrong pictures satisfy it. Every PNG the command line emitted hung an unrotated
  // arrowhead off its target for as long as this check was green. Fidelity is CLI-007 and is held by looking.
  await run([cli, 'render', 'model.yaml', '--format', 'png', '--output', 'packed.png'], directory)
  await run([cli, 'render', 'model.json', '--format', 'png', '--output', 'repeated.png'], directory)
  await run(
    [
      process.execPath,
      join(repositoryRoot, 'packages', 'cli', 'dist', 'bin.js'),
      'render',
      'model.yaml',
      '--format',
      'png',
      '--output',
      'workspace.png'
    ],
    directory
  )
  const [raster, repeated, workspace] = await Promise.all(
    ['packed.png', 'repeated.png', 'workspace.png'].map((name) => readFile(join(directory, name)))
  )
  if (!raster?.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    throw new Error('Packed renderer command did not write a PNG for --format png.')
  }
  if (!raster.equals(repeated ?? Buffer.alloc(0)) || !raster.equals(workspace ?? Buffer.alloc(0))) {
    throw new Error('Packed renderer command raster output is not byte-identical across runs and with the workspace.')
  }

  const failures = await Promise.all([
    runOutcome([cli, 'render', 'malformed.yaml'], directory),
    runOutcome([cli, 'render', 'missing.yaml'], directory),
    runOutcome([cli, 'render', 'model.ts'], directory)
  ])
  if (failures.some((outcome) => outcome.exitCode === 0 || outcome.stdout || !outcome.stderr)) {
    throw new Error('Packed renderer command failure diagnostics contaminated standard output or returned success.')
  }

  return run(['bun', 'run', 'smoke.ts'], directory)
}

/** The SVG an example's `render` command writes beside a document. */
const previewOf = (source: string) => `${basename(source, extname(source))}.svg`

/** Render the copy's generated export and compare it with the document the copy also renders through the command. */
const exampleConsumerSource = (example: ExamplePackage) => `
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { ${example.documents.map((document) => document.export).join(', ')} } from './src/index.ts'

const rendered = ${JSON.stringify(
  Object.fromEntries(example.documents.map((document) => [document.export, previewOf(document.source)]))
)}
for (const [name, model] of Object.entries({ ${example.documents.map((document) => document.export).join(', ')} })) {
  const svg = renderInfoschematicSvg(model)
  const document = await Bun.file(rendered[name]).text()
  if (svg.trim() !== document.trim()) {
    throw new Error(\`Generated export \${name} does not render what its document renders.\`)
  }
}

console.log(JSON.stringify({ exports: Object.keys(rendered).length }))
`

/**
 * Every example must work for someone who copied its directory out, not only inside this workspace.
 *
 * The copy installs packed tarballs instead of the workspace, runs the package's own documented `check` and `render`
 * commands, and is compared against what this repository renders from the same document. An example that renders only
 * in the monorepo is not a copyable example, and nothing else would notice the difference.
 */
const exampleCopySmoke = async (packed: readonly PackedPackage[], directory: string) => {
  const tarballs = new Map(packed.map(({ entry, tarball }) => [entry.name, `file:${tarball}`]))
  const overrides = Object.fromEntries(tarballs)
  const renderer = tarballs.get('@infoschematics/render-svg')
  if (!renderer) throw new Error('Release set no longer packs the static renderer the example copies verify against.')

  const copies: { example: string; rendered: number }[] = []
  for (const example of await examplePackages()) {
    const destination = join(directory, example.directory)
    await cp(join(examplesRoot, example.directory), destination, {
      filter: (source) => !source.includes(`${sep}node_modules`),
      recursive: true
    })

    const manifestPath = join(destination, 'package.json')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as PackageManifest
    const retarget = (section: Readonly<Record<string, string>> = {}) =>
      Object.fromEntries(Object.entries(section).map(([name, range]) => [name, tarballs.get(name) ?? range]))
    await writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          ...manifest,
          dependencies: retarget(manifest.dependencies),
          devDependencies: { ...retarget(manifest.devDependencies), '@infoschematics/render-svg': renderer },
          overrides
        },
        null,
        2
      )}\n`
    )
    await run(['bun', 'install', '--ignore-scripts'], destination)

    await run(['bun', 'run', 'check'], destination)
    await run(['bun', 'run', 'render'], destination)

    for (const document of example.documents) {
      const source = await readFile(join(destination, document.source), 'utf8')
      const parsed = parseInfoschematic(source, { pathname: document.source })
      if (!parsed.ok) {
        throw new Error(
          [
            `Copied example ${example.directory}/${document.source} no longer parses:`,
            ...parsed.issues.map(formatInfoschematicIssue)
          ].join('\n')
        )
      }
      const preview = await readFile(join(destination, previewOf(document.source)), 'utf8')
      if (preview.trim() !== renderInfoschematicSvg(parsed.model).trim()) {
        throw new Error(
          `Copied example ${example.directory}/${document.source} rendered differently outside the monorepo.`
        )
      }
    }

    await writeFile(join(destination, 'example-smoke.ts'), exampleConsumerSource(example))
    const outcome = JSON.parse(await run(['bun', 'run', 'example-smoke.ts'], destination)) as { exports: number }
    copies.push({ example: example.name, rendered: outcome.exports })
  }
  return copies
}

export type PackAndSmokeOptions = Readonly<{
  /** Retain the temporary pack and consumer directory for inspection. Defaults to off. */
  keepTemp?: boolean
}>

export async function packAndSmoke({ keepTemp = false }: PackAndSmokeOptions = {}) {
  await checkReleaseVersions()
  const temporary = await mkdtemp(join(tmpdir(), 'infoschematics-release-'))
  const tarballDirectory = join(temporary, 'tarballs')
  await mkdir(tarballDirectory, { recursive: true })
  try {
    const packed: PackedPackage[] = []
    for (const entry of releasePackages) packed.push(await packOne(entry, tarballDirectory))
    const errors = packed.flatMap((item) =>
      validatePackedPackage(item.entry, item.manifest, item.files).map((error) => `${item.entry.name}: ${error}`)
    )
    if (errors.length > 0) throw new Error(`Packed package inspection failed:\n- ${errors.join('\n- ')}`)
    const smoke = await smokeConsumer(packed, join(temporary, 'consumer'))
    const examples = await exampleCopySmoke(packed, join(temporary, 'examples'))
    return {
      examples,
      packages: packed.map(({ entry, tarball }) => ({ name: entry.name, tarball: basename(tarball) })),
      smoke: JSON.parse(smoke) as unknown
    }
  } finally {
    if (keepTemp) console.log(`Release smoke retained at ${temporary}`)
    else await rm(temporary, { force: true, recursive: true })
  }
}

export const spec: CliSpec = {
  describe: 'Pack every public package and import it from a clean consumer, proving the published surface works.',
  flags: {
    json: { describe: 'Report packed tarballs and smoke results as JSON.', kind: 'boolean' },
    'keep-temp': { describe: 'Retain the temporary pack and consumer directory for inspection.', kind: 'boolean' }
  },
  run: 'self:packages:pack-smoke',
  script: 'scripts/release/pack-smoke.ts'
}

if (isDirectInvocation(import.meta.url)) {
  await runCli(spec, async (parsed) => {
    const result = await packAndSmoke({ keepTemp: parsed.boolean('keep-temp') })
    if (parsed.boolean('json')) {
      console.log(JSON.stringify(result, null, 2))
      return
    }
    for (const { name, tarball } of result.packages) console.log(`${name} -> ${tarball}`)
    console.log(`Clean-consumer smoke passed for ${result.packages.length} packages.`)
    for (const { example, rendered } of result.examples) console.log(`${example} copied clean -> ${rendered} rendered`)
  })
}
