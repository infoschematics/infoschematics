import type { InfoschematicConfig } from '@infoschematics/domain-model'
import type { FocusConfig } from '@infoschematics/domain-model/scene'
import {
  type CardDetailOverrides,
  resolveCardDomain,
  resolveRegionTreatment,
  resolveVisualTreatment,
} from '@infoschematics/view-model/appearance'
import { regionGeometry } from '@infoschematics/view-model/region-geometry'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import { visualTokens } from '@infoschematics/view-model/tokens'

const canvasTokens = visualTokens.canvas

export type SvgSceneSelection =
  | { kind: 'standalone'; sceneId: string }
  | { kind: 'theme'; sceneId: string; themeId: string }
  | { kind: 'story'; sceneIndex: number; storyId: string }

export type SvgVisibilityOptions = {
  /** Which authored Graphic overlays to include. Defaults to selected-Scene Graphics. */
  graphics?: 'all' | 'none' | 'scene'
  /** Scope ids to show. Omit this field to show every declared Scope. */
  scopes?: readonly string[]
  /** What to do with content outside the selected Scene. Defaults to `dim`. */
  unfocused?: 'dim' | 'hide' | 'show'
}

export type RenderInfoschematicSvgOptions = {
  /** Override authored Card metadata visibility without removing authored data. */
  cardDetails?: CardDetailOverrides
  /** An authored Scene to render without introducing playback or other motion. */
  scene?: SvgSceneSelection
  visibility?: SvgVisibilityOptions
}

type Attributes = readonly (readonly [name: string, value: boolean | number | string | undefined])[]

type ResolvedFocus = {
  artefacts: ReadonlySet<string>
  flows: ReadonlySet<string>
  graphics: ReadonlySet<string>
}

const xmlText = (value: string) =>
  value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '\uFFFD')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

const xmlAttribute = (value: string) => xmlText(value).replaceAll('"', '&quot;').replaceAll("'", '&apos;')

const number = (value: number) => {
  if (!Number.isFinite(value)) throw new TypeError(`SVG coordinates must be finite numbers; received ${value}`)
  return Object.is(value, -0) ? '0' : String(value)
}

const attributes = (values: Attributes) =>
  values
    .filter((entry): entry is readonly [string, boolean | number | string] => entry[1] !== undefined)
    .map(([name, value]) => ` ${name}="${xmlAttribute(typeof value === 'number' ? number(value) : String(value))}"`)
    .join('')

const line = (depth: number, name: string, values: Attributes, content?: string) => {
  const indentation = '  '.repeat(depth)
  const opening = `${indentation}<${name}${attributes(values)}`
  return content === undefined ? `${opening} />` : `${opening}>${content}</${name}>`
}

const group = (depth: number, values: Attributes, children: readonly string[]) => {
  const indentation = '  '.repeat(depth)
  return [`${indentation}<g${attributes(values)}>`, ...children, `${indentation}</g>`]
}

const focusOf = (focus: FocusConfig | undefined, graphic?: string): ResolvedFocus => ({
  artefacts: new Set(focus?.artefacts ?? []),
  flows: new Set(focus?.flows ?? []),
  graphics: new Set([...(focus?.graphics ?? []), ...(graphic ? [graphic] : [])]),
})

const resolveFocus = (config: InfoschematicConfig, selection: SvgSceneSelection | undefined): ResolvedFocus | undefined => {
  if (!selection) return undefined

  if (selection.kind === 'standalone') {
    const scene = config.standaloneScenes.find((candidate) => candidate.id === selection.sceneId)
    if (!scene) throw new Error(`Unknown Standalone Scene: ${selection.sceneId}`)
    return focusOf(scene.focus)
  }

  if (selection.kind === 'theme') {
    const theme = config.themes.find((candidate) => candidate.id === selection.themeId)
    if (!theme) throw new Error(`Unknown Theme: ${selection.themeId}`)
    const scene = theme.scenes.find((candidate) => candidate.id === selection.sceneId)
    if (!scene) throw new Error(`Unknown Thematic Scene in ${selection.themeId}: ${selection.sceneId}`)
    return focusOf(scene.focus)
  }

  const story = config.stories.find((candidate) => candidate.id === selection.storyId)
  if (!story) throw new Error(`Unknown Story: ${selection.storyId}`)
  const scene = story.scenes[selection.sceneIndex]
  if (!scene) throw new Error(`Unknown Story Scene in ${selection.storyId}: ${selection.sceneIndex}`)
  const source = scene.sourceScene
    ? config.standaloneScenes.find((candidate) => candidate.id === scene.sourceScene)
    : undefined
  if (scene.sourceScene && !source) throw new Error(`Unknown source Scene: ${scene.sourceScene}`)
  return focusOf(
    {
      artefacts: scene.focus?.artefacts ?? source?.focus.artefacts,
      flows: scene.focus?.flows ?? source?.focus.flows,
      graphics: scene.focus?.graphics ?? source?.focus.graphics,
    },
    scene.graphic,
  )
}

const memberIsVisible = (
  entry: { scopes?: readonly string[]; scopeRule?: 'all' | 'any' },
  visibleScopes: ReadonlySet<string>,
) => {
  if (!entry.scopes) return true
  return entry.scopeRule === 'all'
    ? entry.scopes.every((scope) => visibleScopes.has(scope))
    : entry.scopes.some((scope) => visibleScopes.has(scope))
}

const focusClass = (
  id: string,
  focused: ReadonlySet<string> | undefined,
  unfocused: NonNullable<SvgVisibilityOptions['unfocused']>,
) => (focused && !focused.has(id) && unfocused === 'dim' ? ' is-unfocused' : '')

const includedByFocus = (
  id: string,
  focused: ReadonlySet<string> | undefined,
  unfocused: NonNullable<SvgVisibilityOptions['unfocused']>,
) => !focused || focused.has(id) || unfocused !== 'hide'

/**
 * Render one complete, standalone SVG document from serialisable Infoschematic data.
 *
 * The function reads no DOM state and has no renderer registry. Authored Graphics
 * therefore use a labelled geometric fallback in this framework-neutral output.
 */
export const renderInfoschematicSvg = (
  config: InfoschematicConfig,
  options: RenderInfoschematicSvgOptions = {},
): string => {
  const definition = config.infoschematic
  const runtime = createInfoschematicRuntime(config)
  const viewBox = definition.viewBox
  const visualTreatment = resolveVisualTreatment(definition.appearance, options.cardDetails)
  const backdrop =
    visualTreatment.surface === 'blueprint' ? canvasTokens.surfaces.backdrop : canvasTokens.output.backdrop
  const visibleScopes = new Set(options.visibility?.scopes ?? definition.scopes.map((scope) => scope.id))
  const unfocused = options.visibility?.unfocused ?? 'dim'
  const graphicVisibility = options.visibility?.graphics ?? 'scene'
  const focus = resolveFocus(config, options.scene)
  const scopes = new Map(definition.scopes.map((scope) => [scope.id, scope]))
  const domains = definition.domains ?? []
  const families = new Map(definition.flowFamilies.map((family, index) => [family.id, { family, index }]))

  const cards = runtime.infoschematicCards.filter(
    (card) =>
      runtime.infoschematicCardIsVisible(card, visibleScopes) &&
      includedByFocus(card.id, focus?.artefacts, unfocused),
  )
  const fabrics = runtime.infoschematicFabrics.filter(
    (fabric) =>
      runtime.infoschematicFabricIsVisible(fabric, visibleScopes) &&
      includedByFocus(fabric.id, focus?.artefacts, unfocused),
  )
  const points = definition.points.filter(
    (point) => memberIsVisible(point, visibleScopes) && includedByFocus(point.id, focus?.artefacts, unfocused),
  )
  const visibleFamilies = new Set(definition.flowFamilies.map((family) => family.id))
  const flows = runtime.infoschematicFlows.filter(
    (flow) =>
      runtime.infoschematicFlowIsVisible(flow, visibleFamilies, visibleScopes) &&
      includedByFocus(flow.id, focus?.flows, unfocused),
  )
  const graphics = definition.graphics.filter(
    (graphic) =>
      graphicVisibility !== 'none' &&
      memberIsVisible(graphic, visibleScopes) &&
      (graphicVisibility === 'all'
        ? includedByFocus(graphic.id, focus?.graphics, unfocused)
        : Boolean(focus?.graphics.has(graphic.id))),
  )

  const body: string[] = []
  body.push(line(1, 'title', [], xmlText(config.title)))
  if (config.subtitle || config.synopsis) {
    body.push(line(1, 'desc', [], xmlText([config.subtitle, config.synopsis].filter(Boolean).join(' — '))))
  }
  body.push(
    line(1, 'rect', [
      ['class', 'infoschematic-backdrop'],
      ['fill', backdrop],
      ['height', viewBox.height],
      ['width', viewBox.width],
      ['x', viewBox.x],
      ['y', viewBox.y],
    ]),
  )

  if (flows.length > 0) {
    const markers = [...families.values()].map(({ family, index }) =>
      group(
        3,
        [
          ['id', `infoschematic-arrow-${index}`],
          ['markerHeight', 16],
          ['markerUnits', 'userSpaceOnUse'],
          ['markerWidth', 16],
          ['orient', 'auto-start-reverse'],
          ['refX', 12],
          ['refY', 6],
        ],
        [
          line(
            4,
            'path',
            [
              ['d', 'M0 0 L0 12 L12 6 z'],
              ['fill', family.color],
            ],
          ),
        ],
      ).join('\n'),
    )
    body.push(['  <defs>', ...markers, '  </defs>'].join('\n'))
  }

  if (visualTreatment.grid !== 'none') {
    const gridStroke =
      visualTreatment.surface === 'blueprint'
        ? canvasTokens.surfaces.laneStroke
        : canvasTokens.output.laneStroke
    const minorPattern = [
      `    <pattern${attributes([
        ['height', canvasTokens.geometry.gridSize],
        ['id', 'infoschematic-grid-minor'],
        ['patternUnits', 'userSpaceOnUse'],
        ['width', canvasTokens.geometry.gridSize],
      ])}>`,
      line(3, 'path', [
        [
          'd',
          `M ${number(canvasTokens.geometry.gridSize)} 0 V ${number(canvasTokens.geometry.gridSize)} M 0 ${number(canvasTokens.geometry.gridSize)} H ${number(canvasTokens.geometry.gridSize)}`,
        ],
        ['fill', 'none'],
        ['stroke', gridStroke],
        ['stroke-width', 0.5],
      ]),
      '    </pattern>',
    ]
    const patternId = `infoschematic-grid-${visualTreatment.grid}`
    const pattern = [
      `    <pattern${attributes([
        ['height', canvasTokens.geometry.gridMajorSize],
        ['id', patternId],
        ['patternUnits', 'userSpaceOnUse'],
        ['width', canvasTokens.geometry.gridMajorSize],
      ])}>`,
      ...(visualTreatment.grid === 'major-plus-minor'
        ? [
            line(3, 'rect', [
              ['fill', 'url(#infoschematic-grid-minor)'],
              ['height', canvasTokens.geometry.gridMajorSize],
              ['width', canvasTokens.geometry.gridMajorSize],
            ]),
          ]
        : []),
      line(3, 'path', [
        [
          'd',
          `M ${number(canvasTokens.geometry.gridMajorSize)} 0 V ${number(canvasTokens.geometry.gridMajorSize)} M 0 ${number(canvasTokens.geometry.gridMajorSize)} H ${number(canvasTokens.geometry.gridMajorSize)}`,
        ],
        ['fill', 'none'],
        ['stroke', gridStroke],
        ['stroke-width', 1],
      ]),
      '    </pattern>',
    ]
    body.push(
      [
        '  <defs>',
        ...(visualTreatment.grid === 'major-plus-minor' ? minorPattern : []),
        ...pattern,
        '  </defs>',
      ].join('\n'),
    )
    body.push(
      line(1, 'rect', [
        ['class', 'infoschematic-grid'],
        ['fill', `url(#${patternId})`],
        ['height', viewBox.height],
        ['width', viewBox.width],
        ['x', viewBox.x],
        ['y', viewBox.y],
      ]),
    )
  }

  for (const lane of runtime.infoschematicLanes) {
    for (const zone of lane.zones) {
      const box = { height: lane.height, width: zone.width, x: zone.x, y: lane.y }
      const treatment = resolveRegionTreatment('zone', zone.label, zone.appearance, lane.legend)
      const geometry = regionGeometry({
        box,
        label: zone.label,
        radius: lane.panel.radius,
        treatment,
      })
      body.push(
        line(1, 'rect', [
          ['class', 'infoschematic-zone'],
          ['data-id', zone.id],
          ['fill', zone.fill],
          ['height', box.height],
          ['width', box.width],
          ['x', box.x],
          ['y', box.y],
        ]),
      )
      if (geometry.outline) {
        body.push(
          line(1, 'path', [
            ['class', 'infoschematic-zone-frame'],
            ['d', geometry.outline],
            ['data-frame-treatment', treatment.frame],
            ['fill', 'none'],
            ['stroke', canvasTokens.output.laneStroke],
          ]),
        )
      }
      if (geometry.label) {
        body.push(
          line(
            1,
            'text',
            [
              ['class', 'infoschematic-zone-label'],
              ['data-label-placement', geometry.label.placement],
              ['dominant-baseline', geometry.label.dominantBaseline],
              ['fill', canvasTokens.output.textMuted],
              ['font-family', canvasTokens.output.fontFamily],
              ['font-size', canvasTokens.output.metadataFontSize],
              ['text-anchor', geometry.label.textAnchor],
              ['x', geometry.label.x],
              ['y', geometry.label.y],
            ],
            xmlText(zone.label.toUpperCase()),
          ),
        )
      }
    }
    const treatment = resolveRegionTreatment('lane', lane.label, lane.appearance, lane.legend)
    const geometry = regionGeometry({
      box: lane.panel,
      label: lane.label,
      radius: lane.panel.radius,
      treatment,
    })
    if (geometry.outline) {
      body.push(
        line(1, 'path', [
          ['class', 'infoschematic-lane'],
          ['data-frame-treatment', treatment.frame],
          ['data-id', lane.id],
          ['d', geometry.outline],
          ['fill', 'none'],
          ['stroke', canvasTokens.output.laneStroke],
        ]),
      )
    }
    if (geometry.label) {
      body.push(
        line(
          1,
          'text',
          [
            ['class', 'infoschematic-lane-label'],
            ['data-label-placement', geometry.label.placement],
            ['dominant-baseline', geometry.label.dominantBaseline],
            ['fill', canvasTokens.output.textMuted],
            ['font-family', canvasTokens.output.fontFamily],
            ['font-size', canvasTokens.output.metadataFontSize],
            ['text-anchor', geometry.label.textAnchor],
            ['x', geometry.label.x],
            ['y', geometry.label.y],
          ],
          xmlText(lane.label.toUpperCase()),
        ),
      )
    }
  }

  for (const fabric of fabrics) {
    const box = fabric.bounds
    const content = [
      line(2, 'title', [], xmlText(`${fabric.code}: ${fabric.label} · ${fabric.detail}`)),
      line(2, 'rect', [
        ['fill', canvasTokens.output.surface],
        ['height', box.height],
        ['rx', canvasTokens.geometry.cornerRadius],
        ['stroke', canvasTokens.output.stroke],
        ['width', box.width],
        ['x', box.x],
        ['y', box.y],
      ]),
      line(
        2,
        'text',
        [
          ['fill', canvasTokens.output.text],
          ['font-family', canvasTokens.output.fontFamily],
          ['font-size', canvasTokens.output.componentFontSize],
          ['text-anchor', 'middle'],
          ['x', box.x + box.width / 2],
          ['y', box.y + box.height / 2 + 4],
        ],
        xmlText(fabric.appearance?.caption ?? fabric.label),
      ),
    ]
    body.push(
      group(
        1,
        [
          ['class', `infoschematic-fabric${focusClass(fabric.id, focus?.artefacts, unfocused)}`],
          ['data-code', fabric.code],
          ['data-id', fabric.id],
          [
            'opacity',
            focusClass(fabric.id, focus?.artefacts, unfocused)
              ? canvasTokens.output.unfocusedOpacity
              : undefined,
          ],
        ],
        content,
      ).join('\n'),
    )
  }

  for (const flow of flows) {
    const resolved = families.get(flow.family)
    const color = resolved?.family.color ?? canvasTokens.output.fallbackFamily
    const marker = resolved ? `url(#infoschematic-arrow-${resolved.index})` : undefined
    const dimmed = focusClass(flow.id, focus?.flows, unfocused)
    const content = [
      line(2, 'title', [], xmlText(flow.code)),
      line(2, 'path', [
        ['d', flow.d],
        ['fill', 'none'],
        ['stroke', canvasTokens.output.flowPipe],
        ['stroke-linecap', canvasTokens.flows.lineCap],
        ['stroke-linejoin', canvasTokens.flows.lineJoin],
        ['stroke-width', canvasTokens.flows.pipeWidth],
      ]),
      line(2, 'path', [
        ['d', flow.d],
        ['fill', 'none'],
        ['marker-end', flow.bidirectional ? undefined : marker],
        ['marker-start', flow.bidirectional ? marker : undefined],
        ['stroke', color],
        ['stroke-dasharray', flow.dashed ? canvasTokens.flows.dash : undefined],
        ['stroke-linecap', canvasTokens.flows.lineCap],
        ['stroke-linejoin', canvasTokens.flows.lineJoin],
        ['stroke-width', canvasTokens.flows.routeWidth],
      ]),
    ]
    body.push(
      group(
        1,
        [
          ['class', `infoschematic-flow${dimmed}`],
          ['data-code', flow.code],
          ['data-id', flow.id],
          ['opacity', dimmed ? canvasTokens.output.unfocusedOpacity : undefined],
        ],
        content,
      ).join('\n'),
    )
  }

  for (const card of cards) {
    const box = card.bounds
    const scope = scopes.get(card.scope)
    const domain = resolveCardDomain(card, domains)
    const appearance = domain ?? scope
    const dimmed = focusClass(card.id, focus?.artefacts, unfocused)
    const metadataColor =
      visualTreatment.surface === 'blueprint' ? canvasTokens.text.muted : canvasTokens.output.textMuted
    const content = [
      line(2, 'title', [], xmlText(`${card.code}: ${card.label} · ${card.detail}`)),
      line(2, 'rect', [
        ['fill', appearance?.fill ?? canvasTokens.output.surface],
        ['height', box.height],
        ['rx', canvasTokens.geometry.cornerRadius],
        ['stroke', appearance?.color ?? canvasTokens.output.fallbackFamily],
        ['width', box.width],
      ]),
    ]
    if (visualTreatment.card.stereotype && card.stereotype) {
      content.push(
        line(
          2,
          'text',
          [
            ['class', 'infoschematic-card-stereotype'],
            ['fill', metadataColor],
            ['font-family', canvasTokens.output.fontFamily],
            ['font-size', canvasTokens.output.metadataFontSize],
            ['text-anchor', 'start'],
            ['x', 10],
            ['y', 16],
          ],
          xmlText(card.stereotype.toUpperCase()),
        ),
      )
    }
    if (visualTreatment.card.identity) {
      content.push(
        line(
          2,
          'text',
          [
            ['class', 'infoschematic-card-identity'],
            ['fill', metadataColor],
            ['font-family', canvasTokens.output.fontFamily],
            ['font-size', canvasTokens.output.metadataFontSize],
            ['text-anchor', 'end'],
            ['x', box.width - 10],
            ['y', 16],
          ],
          xmlText(card.code),
        ),
      )
    }
    content.push(
      line(
        2,
        'text',
        [
          ['class', 'infoschematic-card-label'],
          ['dominant-baseline', 'middle'],
          ['fill', canvasTokens.output.cardText],
          ['font-family', canvasTokens.output.fontFamily],
          [
            'font-size',
            visualTreatment.card.compact
              ? canvasTokens.output.metadataFontSize
              : canvasTokens.output.componentFontSize,
          ],
          ['text-anchor', 'middle'],
          ['x', box.width / 2],
          ['y', visualTreatment.card.description ? box.height / 2 - 6 : box.height / 2],
        ],
        xmlText(card.label),
      ),
    )
    if (visualTreatment.card.description) {
      content.push(
        line(
          2,
          'text',
          [
            ['class', 'infoschematic-card-description'],
            ['fill', metadataColor],
            ['font-family', canvasTokens.output.fontFamily],
            ['font-size', canvasTokens.output.metadataFontSize],
            ['text-anchor', 'middle'],
            ['x', box.width / 2],
            ['y', box.height / 2 + 14],
          ],
          xmlText(card.detail),
        ),
      )
    }
    body.push(
      group(
        1,
        [
          ['class', `infoschematic-card${dimmed}`],
          ['data-compact', visualTreatment.card.compact],
          ['data-code', card.code],
          ['data-domain', domain?.id],
          ['data-id', card.id],
          ['data-stereotype', card.stereotype],
          ['opacity', dimmed ? canvasTokens.output.unfocusedOpacity : undefined],
          ['transform', `translate(${number(box.x)} ${number(box.y)})`],
        ],
        content,
      ).join('\n'),
    )
  }

  for (const point of points) {
    const scope = point.scopes.map((scopeId) => scopes.get(scopeId)).find(Boolean)
    const dimmed = focusClass(point.id, focus?.artefacts, unfocused)
    body.push(
      group(
        1,
        [
          ['class', `infoschematic-point${dimmed}`],
          ['data-code', point.code],
          ['data-id', point.id],
          ['opacity', dimmed ? canvasTokens.output.unfocusedOpacity : undefined],
        ],
        [
          line(2, 'title', [], xmlText(`${point.code}: ${point.label}`)),
          line(2, 'circle', [
            ['cx', point.point.x],
            ['cy', point.point.y],
            ['fill', scope?.fill ?? canvasTokens.output.backdrop],
            ['r', canvasTokens.geometry.pointRadius],
            ['stroke', scope?.color ?? canvasTokens.output.fallbackFamily],
            ['stroke-width', 2],
          ]),
        ],
      ).join('\n'),
    )
  }

  for (const graphic of graphics) {
    if (!graphic.placement) continue
    const box = graphic.placement
    const dimmed = focusClass(graphic.id, focus?.graphics, unfocused)
    body.push(
      group(
        1,
        [
          ['class', `infoschematic-graphic${dimmed}`],
          ['data-id', graphic.id],
          ['data-renderer', graphic.renderer],
          ['opacity', dimmed ? canvasTokens.output.unfocusedOpacity : undefined],
        ],
        [
          line(2, 'rect', [
            ['fill', canvasTokens.output.graphicFill],
            ['height', box.height],
            ['stroke', canvasTokens.output.stroke],
            ['stroke-dasharray', '6 4'],
            ['width', box.width],
            ['x', box.x],
            ['y', box.y],
          ]),
          line(
            2,
            'text',
            [
              ['dominant-baseline', 'middle'],
              ['fill', canvasTokens.output.textMuted],
              ['font-family', canvasTokens.output.fontFamily],
              ['font-size', canvasTokens.output.metadataFontSize],
              ['text-anchor', 'middle'],
              ['x', box.x + box.width / 2],
              ['y', box.y + box.height / 2],
            ],
            xmlText(graphic.label ?? graphic.renderer),
          ),
        ],
      ).join('\n'),
    )
  }

  return [
    `<svg${attributes([
        ['xmlns', 'http://www.w3.org/2000/svg'],
        ['aria-label', `${config.title} structural Infoschematic`],
        ['data-grid-treatment', visualTreatment.grid],
        ['data-surface-treatment', visualTreatment.surface],
      ['height', viewBox.height],
      ['preserveAspectRatio', 'xMidYMid meet'],
      ['role', 'img'],
      ['viewBox', `${number(viewBox.x)} ${number(viewBox.y)} ${number(viewBox.width)} ${number(viewBox.height)}`],
      ['width', viewBox.width],
    ])}>`,
    ...body,
    '</svg>',
  ].join('\n')
}
