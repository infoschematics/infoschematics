import { createHash } from 'node:crypto'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineInfoschematicModel, infoschematicModelOf } from '@infoschematics/domain-core'
import type { Infoschematic, InfoschematicConfig } from '@infoschematics/domain-model'
import type { RenderInfoschematicSvgOptions, SvgSceneSelection } from '@infoschematics/render-svg'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { establishedInfoschematicOf } from '@infoschematics/view-model/compatibility'

type SharpInstance = {
  ensureAlpha(): SharpInstance
  greyscale(): SharpInstance
  png(): SharpInstance
  raw(): SharpInstance
  resize(options: { fit: 'fill'; height: number; width: number }): SharpInstance
  toBuffer(): Promise<Buffer>
  toBuffer(options: { resolveWithObject: true }): Promise<{
    data: Buffer
    info: { channels: number; height: number; width: number }
  }>
}

type Sharp = {
  (input: Buffer): SharpInstance
  versions: { sharp: string; vips: string }
}

type PresentationState = {
  key: string
  scene?: SvgSceneSelection
}

type Evidence = {
  gridSha256: string
  key: string
  pixelSha256: string
  semanticSha256: string
  svgSha256: string
  visualSample: string
}

export type IbcVisualManifest = {
  fixture: {
    package: string
    source: string
  }
  modelSha256: string
  raster: {
    channels: 4
    height: number
    maximumChangedSampleRatio: number
    maximumMeanChannelDelta: number
    renderer: string
    sampleHeight: number
    sampleWidth: number
    width: number
  }
  states: Evidence[]
  version: 2
}

const usage = `Usage:
  bun scripts/ibc-visual-compatibility.ts capture --fixture <IBC package> --manifest <file> --output <directory>
  bun scripts/ibc-visual-compatibility.ts compare --fixture <IBC package> --manifest <file> --output <directory>`

const argumentsOf = (args: readonly string[]) => {
  const mode = args[0]
  if (mode !== 'capture' && mode !== 'compare') throw new Error(usage)

  const value = (flag: string) => {
    const index = args.indexOf(flag)
    const found = index >= 0 ? args[index + 1] : undefined
    if (!found) throw new Error(`${usage}\n\nMissing ${flag}.`)
    return resolve(found)
  }

  return {
    fixture: value('--fixture'),
    manifest: value('--manifest'),
    mode,
    output: value('--output')
  }
}

const sha256 = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')

const stable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stable(entry)])
    )
  }
  return value
}

const grid = { columns: 48, rows: 32 } as const

const gridPoint = (config: InfoschematicConfig, point: { x: number; y: number }) => {
  const { x, y, width, height } = config.infoschematic.viewBox
  return {
    column: Math.max(0, Math.min(grid.columns - 1, Math.floor(((point.x - x) / width) * grid.columns))),
    row: Math.max(0, Math.min(grid.rows - 1, Math.floor(((point.y - y) / height) * grid.rows)))
  }
}

const gridBox = (config: InfoschematicConfig, box: { x: number; y: number; width: number; height: number }) => ({
  from: gridPoint(config, box),
  to: gridPoint(config, { x: box.x + box.width, y: box.y + box.height })
})

const gridRoute = (config: InfoschematicConfig, points: readonly { x: number; y: number }[]) => {
  const { width, height } = config.infoschematic.viewBox
  const step = Math.min(width / grid.columns, height / grid.rows) / 2
  const cells = new Set<string>()

  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]
    const to = points[index]
    if (!from || !to) continue
    const distance = Math.hypot(to.x - from.x, to.y - from.y)
    const samples = Math.max(1, Math.ceil(distance / step))
    for (let sample = 0; sample <= samples; sample += 1) {
      const ratio = sample / samples
      const cell = gridPoint(config, {
        x: from.x + (to.x - from.x) * ratio,
        y: from.y + (to.y - from.y) * ratio
      })
      cells.add(`${cell.column},${cell.row}`)
    }
  }

  return [...cells].sort((left, right) => {
    const [leftColumn, leftRow] = left.split(',').map(Number)
    const [rightColumn, rightRow] = right.split(',').map(Number)
    return (leftRow ?? 0) - (rightRow ?? 0) || (leftColumn ?? 0) - (rightColumn ?? 0)
  })
}

const routeEnds = (config: InfoschematicConfig, points: readonly { x: number; y: number }[]) => {
  const start = points[0]
  const end = points.at(-1)
  if (!start || !end) throw new Error('A Flow route must contain its source and target points.')
  return { end: gridPoint(config, end), start: gridPoint(config, start) }
}

export const ibcPresentationStates = (config: InfoschematicConfig): PresentationState[] => [
  { key: 'default' },
  ...config.standaloneScenes.map((scene) => ({
    key: `standalone--${scene.id}`,
    scene: { kind: 'standalone' as const, sceneId: scene.id }
  })),
  ...config.themes.flatMap((theme) =>
    theme.scenes.map((scene) => ({
      key: `theme--${theme.id}--${scene.id}`,
      scene: { kind: 'theme' as const, sceneId: scene.id, themeId: theme.id }
    }))
  ),
  ...config.stories.flatMap((story) =>
    story.scenes.map((scene, sceneIndex) => ({
      key: `story--${story.id}--${sceneIndex.toString().padStart(2, '0')}--${scene.id ?? 'scene'}`,
      scene: { kind: 'story' as const, sceneIndex, storyId: story.id }
    }))
  )
]

const focusOf = (config: InfoschematicConfig, selection: SvgSceneSelection | undefined) => {
  if (!selection) return null
  if (selection.kind === 'standalone') {
    return config.standaloneScenes.find((scene) => scene.id === selection.sceneId)?.focus ?? null
  }
  if (selection.kind === 'theme') {
    return (
      config.themes
        .find((theme) => theme.id === selection.themeId)
        ?.scenes.find((scene) => scene.id === selection.sceneId)?.focus ?? null
    )
  }

  const scene = config.stories.find((story) => story.id === selection.storyId)?.scenes[selection.sceneIndex]
  if (!scene) return null
  const source = scene.sourceScene
    ? config.standaloneScenes.find((candidate) => candidate.id === scene.sourceScene)?.focus
    : undefined
  return scene.focus ?? source ?? null
}

const semanticProjection = (config: InfoschematicConfig, selection: SvgSceneSelection | undefined) => ({
  appearance: config.infoschematic.appearance,
  cards: config.infoschematic.cards.map(({ code, domain, id, label, scope, stereotype, wraps }) => ({
    code,
    domain,
    id,
    label,
    scope,
    stereotype,
    wraps
  })),
  fabrics: config.infoschematic.fabrics.map(({ appearance, code, id, label, scope }) => ({
    appearance,
    code,
    id,
    label,
    scope
  })),
  flows: config.infoschematic.flows.map(
    ({ bidirectional, code, dashed, family, id, label, source, sourcePort, target, targetPort }) => ({
      bidirectional,
      code,
      dashed,
      family,
      id,
      label,
      source,
      sourcePort,
      target,
      targetPort
    })
  ),
  focus: focusOf(config, selection),
  graphics: config.infoschematic.graphics.map(({ id, label, properties, renderer, scopes }) => ({
    id,
    label,
    properties,
    renderer,
    scopes
  })),
  points: config.infoschematic.points.map(({ code, id, label, ports, scopes }) => ({
    code,
    id,
    label,
    ports,
    scopes
  })),
  regions: config.infoschematic.regions.map(({ box: _box, ...region }) => region),
  selection
})

const layoutProjection = (config: InfoschematicConfig) => ({
  grid,
  cards: config.infoschematic.cards.map(({ code, placement }) => ({
    code,
    box: gridBox(config, placement.box)
  })),
  fabrics: config.infoschematic.fabrics.map(({ code, placement }) => ({
    code,
    box: gridBox(config, placement.box)
  })),
  flows: config.infoschematic.flows.map(({ code, points, source, sourcePort, target, targetPort }) => ({
    cells: gridRoute(config, points),
    code,
    ...routeEnds(config, points),
    source,
    sourcePort,
    target,
    targetPort
  })),
  graphics: config.infoschematic.graphics.map(({ id, placement }) => ({
    box: placement ? gridBox(config, placement) : 'diagram',
    id
  })),
  points: config.infoschematic.points.map(({ code, point }) => ({
    at: gridPoint(config, point),
    code
  })),
  regions: config.infoschematic.regions.map(({ box, id }) => ({
    box: gridBox(config, box),
    id
  }))
})

const loadFixture = async (fixture: string) => {
  const source = join(fixture, 'src/index.ts')
  const module = (await import(pathToFileURL(source).href)) as {
    fiveGEmerge?: Infoschematic | InfoschematicConfig
  }
  if (!module.fiveGEmerge) throw new Error(`Expected fiveGEmerge export from ${source}.`)
  const authored = module.fiveGEmerge
  const model = defineInfoschematicModel('diagram' in authored ? authored : infoschematicModelOf(authored))
  return { config: establishedInfoschematicOf(model), model, source }
}

const loadSharp = async (fixture: string): Promise<Sharp> => {
  let directory = fixture
  while (true) {
    for (const modulePath of ['dist/index.mjs', 'lib/index.js']) {
      const candidate = join(directory, 'node_modules/sharp', modulePath)
      try {
        await access(candidate)
        const module = (await import(pathToFileURL(candidate).href)) as {
          default: Sharp
        }
        return module.default
      } catch {
        // Continue through known Sharp entry points and parent workspaces.
      }
    }
    const parent = dirname(directory)
    if (parent === directory) throw new Error(`Could not resolve Sharp from fixture workspace: ${fixture}`)
    directory = parent
  }
}

const renderEvidence = async (
  config: InfoschematicConfig,
  output: string,
  sharp: Sharp
): Promise<{ evidence: Evidence[]; height: number; width: number }> => {
  const { height, width } = config.infoschematic.viewBox
  const evidence: Evidence[] = []
  await mkdir(output, { recursive: true })

  for (const state of ibcPresentationStates(config)) {
    const options: RenderInfoschematicSvgOptions = state.scene ? { scene: state.scene } : {}
    const svg = renderInfoschematicSvg(config, options)
    const png = await sharp(Buffer.from(svg)).resize({ fit: 'fill', height, width }).png().toBuffer()
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    if (info.channels !== 4 || info.height !== height || info.width !== width) {
      throw new Error(`Unexpected raster dimensions for ${state.key}.`)
    }
    const visualSample = await sharp(png)
      .resize({ fit: 'fill', height: grid.rows, width: grid.columns })
      .greyscale()
      .raw()
      .toBuffer()

    await writeFile(join(output, `${state.key}.svg`), svg)
    await writeFile(join(output, `${state.key}.png`), png)
    evidence.push({
      gridSha256: sha256(JSON.stringify(stable(layoutProjection(config)))),
      key: state.key,
      pixelSha256: sha256(data),
      semanticSha256: sha256(JSON.stringify(stable(semanticProjection(config, state.scene)))),
      svgSha256: sha256(svg),
      visualSample: visualSample.toString('base64')
    })
  }

  return { evidence, height, width }
}

export const compareIbcVisualManifests = (expected: IbcVisualManifest, actual: IbcVisualManifest) => {
  const expectedByKey = new Map(expected.states.map((state) => [state.key, state]))
  const actualByKey = new Map(actual.states.map((state) => [state.key, state]))
  const failures: string[] = []

  for (const key of new Set([...expectedByKey.keys(), ...actualByKey.keys()])) {
    const before = expectedByKey.get(key)
    const after = actualByKey.get(key)
    if (!before) failures.push(`${key}: added state`)
    else if (!after) failures.push(`${key}: removed state`)
    else {
      if (before.semanticSha256 !== after.semanticSha256) failures.push(`${key}: semantic projection changed`)
      if (before.gridSha256 !== after.gridSha256) failures.push(`${key}: grid topology changed`)

      const expectedSample = Buffer.from(before.visualSample, 'base64')
      const actualSample = Buffer.from(after.visualSample, 'base64')
      if (expectedSample.length !== actualSample.length) {
        failures.push(`${key}: perceptual sample dimensions changed`)
      } else {
        let absoluteDelta = 0
        let changed = 0
        for (let index = 0; index < expectedSample.length; index += 1) {
          const delta = Math.abs((expectedSample.at(index) ?? 0) - (actualSample.at(index) ?? 0))
          absoluteDelta += delta
          if (delta > 32) changed += 1
        }
        const meanChannelDelta = absoluteDelta / expectedSample.length / 255
        const changedSampleRatio = changed / expectedSample.length
        if (meanChannelDelta > expected.raster.maximumMeanChannelDelta) {
          failures.push(`${key}: perceptual mean delta ${meanChannelDelta.toFixed(4)} exceeds tolerance`)
        }
        if (changedSampleRatio > expected.raster.maximumChangedSampleRatio) {
          failures.push(`${key}: perceptual changed-cell ratio ${changedSampleRatio.toFixed(4)} exceeds tolerance`)
        }
      }
    }
  }

  if (failures.length > 0) throw new Error(`IBC visual compatibility failed:\n${failures.join('\n')}`)
}

const main = async () => {
  const args = argumentsOf(process.argv.slice(2))
  const { config, model } = await loadFixture(args.fixture)
  const sharp = await loadSharp(args.fixture)
  const rendered = await renderEvidence(config, args.output, sharp)
  const manifest: IbcVisualManifest = {
    fixture: { package: basename(args.fixture), source: 'src/index.ts' },
    modelSha256: sha256(JSON.stringify(stable(model))),
    raster: {
      channels: 4,
      height: rendered.height,
      maximumChangedSampleRatio: 0.05,
      maximumMeanChannelDelta: 0.02,
      renderer: `sharp@${sharp.versions.sharp}/libvips@${sharp.versions.vips}`,
      sampleHeight: grid.rows,
      sampleWidth: grid.columns,
      width: rendered.width
    },
    states: rendered.evidence,
    version: 2
  }

  if (args.mode === 'capture') {
    await mkdir(dirname(args.manifest), { recursive: true })
    await writeFile(args.manifest, `${JSON.stringify(manifest, null, 2)}\n`)
    console.log(`Captured ${manifest.states.length} IBC states in ${args.manifest}.`)
    return
  }

  const expected = JSON.parse(await readFile(args.manifest, 'utf8')) as IbcVisualManifest
  if (expected.modelSha256 !== manifest.modelSha256) throw new Error('IBC compatibility model changed.')
  compareIbcVisualManifests(expected, manifest)
  console.log(
    `Matched ${manifest.states.length} IBC states: semantics and grid topology match; rasters are within tolerance.`
  )
}

if (import.meta.main) await main()
