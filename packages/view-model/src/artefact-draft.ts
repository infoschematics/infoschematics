import type { InfoschematicConfig } from '@infoschematics/domain-model'
import type { CardConfig } from '@infoschematics/domain-model/card'
import type { FabricConfig } from '@infoschematics/domain-model/fabric'
import type { FlowConfig } from '@infoschematics/domain-model/flow'
import type { GraphicConfig } from '@infoschematics/domain-model/graphic'
import type { LaneConfig } from '@infoschematics/domain-model/lane'
import type { FocusConfig } from '@infoschematics/domain-model/scene'
import type { StorySceneConfig } from '@infoschematics/domain-model/story'
import type { ZoneConfig } from '@infoschematics/domain-model/zone'

import type {
  ArtefactKind,
  ArtefactOperation,
  ArtefactSelection,
  ArtefactValueByKind,
  BoxGeometry,
  LaneGeometry,
  ZoneGeometry,
} from './editable.ts'

type SelectionFor<K extends ArtefactKind> = Extract<ArtefactSelection, { kind: K }>

/**
 * Replaces one complete authored artefact value while retaining its identity and
 * authored-array position. Flow route and display properties are edited through
 * this operation because a Flow has no generic move or resize operation.
 */
export type ReplaceArtefactPropertiesOperation<
  K extends ArtefactKind = ArtefactKind,
> = Readonly<{
  operation: 'replace-properties'
  target: SelectionFor<K>
  value: ArtefactValueByKind[K]
}>

type AnyReplaceOperation = {
  [K in ArtefactKind]: ReplaceArtefactPropertiesOperation<K>
}[ArtefactKind]

export type ArtefactDraftOperation = ArtefactOperation | AnyReplaceOperation

export type ArtefactOperationRejection = Readonly<{
  index: number
  operation: ArtefactDraftOperation
  reason:
    | 'duplicate-identity'
    | 'invalid-geometry'
    | 'invalid-operation'
    | 'missing-target'
    | 'stale-order'
}>

export type ApplyArtefactOperationsResult = Readonly<{
  config: InfoschematicConfig
  rejected: readonly ArtefactOperationRejection[]
}>

const cloneSerialisable = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneSerialisable(entry)) as T
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneSerialisable(entry)]),
    ) as T
  }

  return value
}

const insertAt = <T>(values: readonly T[], value: T, at: number): readonly T[] => {
  const index = Math.min(Math.max(0, Math.trunc(at)), values.length)
  return [...values.slice(0, index), value, ...values.slice(index)]
}

const replaceAt = <T>(values: readonly T[], index: number, value: T): readonly T[] =>
  values.map((entry, candidate) => (candidate === index ? value : entry))

const moveAt = <T>(values: readonly T[], from: number, to: number): readonly T[] => {
  const value = values[from]
  if (value === undefined) return values

  const without = [...values.slice(0, from), ...values.slice(from + 1)]
  const destination = Math.min(Math.max(0, Math.trunc(to)), without.length)
  return [...without.slice(0, destination), value, ...without.slice(destination)]
}

const matchesTarget = (
  value: { id: string; code?: string },
  target: ArtefactSelection,
): boolean =>
  value.id === target.id &&
  (target.code === null || ('code' in value && value.code === target.code))

const matchesReplacement = (operation: AnyReplaceOperation): boolean =>
  matchesTarget(operation.value, operation.target)

const finite = (...values: readonly number[]): boolean => values.every(Number.isFinite)

const validLaneGeometry = (geometry: LaneGeometry): boolean =>
  finite(geometry.y, geometry.height) && geometry.height > 0

const validZoneGeometry = (geometry: ZoneGeometry): boolean =>
  finite(geometry.x, geometry.width) && geometry.width > 0

const validBoxGeometry = (geometry: BoxGeometry): boolean =>
  finite(
    geometry.box.x,
    geometry.box.y,
    geometry.box.width,
    geometry.box.height,
  ) &&
  geometry.box.width > 0 &&
  geometry.box.height > 0

const withDefinition = (
  config: InfoschematicConfig,
  infoschematic: InfoschematicConfig['infoschematic'],
): InfoschematicConfig => ({ ...config, infoschematic })

const allZones = (config: InfoschematicConfig): readonly ZoneConfig[] =>
  config.infoschematic.lanes.flatMap((lane) => lane.zones)

const valuesForKind = (
  config: InfoschematicConfig,
  kind: ArtefactKind,
): readonly { id: string; code?: string }[] => {
  switch (kind) {
    case 'lane':
      return config.infoschematic.lanes
    case 'zone':
      return allZones(config)
    case 'fabric':
      return config.infoschematic.fabrics
    case 'card':
      return config.infoschematic.cards
    case 'flow':
      return config.infoschematic.flows
    case 'graphic':
      return config.infoschematic.graphics
  }
}

const duplicatesIdentity = (
  config: InfoschematicConfig,
  target: ArtefactSelection,
): boolean =>
  valuesForKind(config, target.kind).some(
    (value) =>
      value.id === target.id ||
      (target.code !== null && 'code' in value && value.code === target.code),
  )

const createArtefact = (
  config: InfoschematicConfig,
  operation: Extract<ArtefactOperation, { operation: 'create' }>,
): InfoschematicConfig | undefined => {
  if (!Number.isFinite(operation.at) || !matchesTarget(operation.value, operation.target)) {
    return undefined
  }

  const definition = config.infoschematic
  switch (operation.target.kind) {
    case 'lane':
      return withDefinition(config, {
        ...definition,
        lanes: insertAt(
          definition.lanes,
          cloneSerialisable(operation.value as LaneConfig),
          operation.at,
        ),
      })
    case 'zone': {
      const target = operation.target as SelectionFor<'zone'>
      const laneIndex = definition.lanes.findIndex(
        (lane) => lane.id === target.laneId,
      )
      if (laneIndex < 0) return undefined
      const lane = definition.lanes[laneIndex]
      if (!lane) return undefined
      return withDefinition(config, {
        ...definition,
        lanes: replaceAt(definition.lanes, laneIndex, {
          ...lane,
          zones: insertAt(
            lane.zones,
            cloneSerialisable(operation.value as ZoneConfig),
            operation.at,
          ),
        }),
      })
    }
    case 'fabric':
      return withDefinition(config, {
        ...definition,
        fabrics: insertAt(
          definition.fabrics,
          cloneSerialisable(operation.value as FabricConfig),
          operation.at,
        ),
      })
    case 'card':
      return withDefinition(config, {
        ...definition,
        cards: insertAt(
          definition.cards,
          cloneSerialisable(operation.value as CardConfig),
          operation.at,
        ),
      })
    case 'flow':
      return withDefinition(config, {
        ...definition,
        flows: insertAt(
          definition.flows,
          cloneSerialisable(operation.value as FlowConfig),
          operation.at,
        ),
      })
    case 'graphic':
      return withDefinition(config, {
        ...definition,
        graphics: insertAt(
          definition.graphics,
          cloneSerialisable(operation.value as GraphicConfig),
          operation.at,
        ),
      })
  }
}

const applyGeometry = (
  config: InfoschematicConfig,
  operation: Extract<ArtefactOperation, { operation: 'move' | 'resize' }>,
): InfoschematicConfig | undefined => {
  const definition = config.infoschematic
  switch (operation.target.kind) {
    case 'lane': {
      if (operation.geometry.role !== 'lane' || !validLaneGeometry(operation.geometry)) {
        return undefined
      }
      const index = definition.lanes.findIndex((lane) =>
        matchesTarget(lane, operation.target),
      )
      const lane = definition.lanes[index]
      if (!lane) return undefined
      const geometry = operation.geometry
      return withDefinition(config, {
        ...definition,
        lanes: replaceAt(definition.lanes, index, {
          ...lane,
          height: geometry.height,
          panel: {
            ...lane.panel,
            height: geometry.height,
            y: geometry.y,
          },
          y: geometry.y,
        }),
      })
    }
    case 'zone': {
      const target = operation.target as SelectionFor<'zone'>
      if (
        operation.geometry.role !== 'zone' ||
        !validZoneGeometry(operation.geometry) ||
        operation.geometry.laneId !== target.laneId
      ) {
        return undefined
      }
      const laneIndex = definition.lanes.findIndex(
        (lane) => lane.id === target.laneId,
      )
      const lane = definition.lanes[laneIndex]
      if (!lane) return undefined
      const zoneIndex = lane.zones.findIndex((zone) =>
        matchesTarget(zone, operation.target),
      )
      const zone = lane.zones[zoneIndex]
      if (!zone) return undefined
      const geometry = operation.geometry
      return withDefinition(config, {
        ...definition,
        lanes: replaceAt(definition.lanes, laneIndex, {
          ...lane,
          zones: replaceAt(lane.zones, zoneIndex, {
            ...zone,
            width: geometry.width,
            x: geometry.x,
          }),
        }),
      })
    }
    case 'fabric':
    case 'card': {
      if (operation.geometry.role !== 'box' || !validBoxGeometry(operation.geometry)) {
        return undefined
      }
      const key = operation.target.kind === 'fabric' ? 'fabrics' : 'cards'
      const values = definition[key]
      const index = values.findIndex((value) => matchesTarget(value, operation.target))
      const value = values[index]
      if (!value) return undefined
      const updated = {
        ...value,
        placement: { ...value.placement, box: cloneSerialisable(operation.geometry.box) },
      }
      return withDefinition(config, { ...definition, [key]: replaceAt(values, index, updated) })
    }
    case 'graphic': {
      if (operation.geometry.role !== 'box' || !validBoxGeometry(operation.geometry)) {
        return undefined
      }
      const index = definition.graphics.findIndex((graphic) =>
        matchesTarget(graphic, operation.target),
      )
      const graphic = definition.graphics[index]
      if (!graphic) return undefined
      return withDefinition(config, {
        ...definition,
        graphics: replaceAt(definition.graphics, index, {
          ...graphic,
          placement: cloneSerialisable(operation.geometry.box),
        }),
      })
    }
  }
}

const reordered = <T extends { id: string; code?: string }>(
  values: readonly T[],
  target: ArtefactSelection,
  from: number,
  to: number,
): readonly T[] | undefined => {
  const actual = values.findIndex((value) => matchesTarget(value, target))
  if (actual < 0 || actual !== Math.trunc(from)) return undefined
  return moveAt(values, actual, to)
}

const reorderArtefact = (
  config: InfoschematicConfig,
  operation: Extract<ArtefactOperation, { operation: 'reorder' }>,
): InfoschematicConfig | undefined => {
  if (!Number.isFinite(operation.from) || !Number.isFinite(operation.to)) return undefined
  const definition = config.infoschematic

  if (operation.target.kind === 'zone') {
    const target = operation.target as SelectionFor<'zone'>
    const laneIndex = definition.lanes.findIndex(
      (lane) => lane.id === target.laneId,
    )
    const lane = definition.lanes[laneIndex]
    if (!lane) return undefined
    const actual = lane.zones.findIndex((zone) => matchesTarget(zone, operation.target))
    if (actual < 0 || actual !== Math.trunc(operation.from)) return undefined
    return withDefinition(config, {
      ...definition,
      lanes: replaceAt(definition.lanes, laneIndex, {
        ...lane,
        zones: moveAt(lane.zones, actual, operation.to),
      }),
    })
  }

  switch (operation.target.kind) {
    case 'lane': {
      const lanes = reordered(
        definition.lanes,
        operation.target,
        operation.from,
        operation.to,
      )
      return lanes ? withDefinition(config, { ...definition, lanes }) : undefined
    }
    case 'fabric': {
      const fabrics = reordered(
        definition.fabrics,
        operation.target,
        operation.from,
        operation.to,
      )
      return fabrics ? withDefinition(config, { ...definition, fabrics }) : undefined
    }
    case 'card': {
      const cards = reordered(
        definition.cards,
        operation.target,
        operation.from,
        operation.to,
      )
      return cards ? withDefinition(config, { ...definition, cards }) : undefined
    }
    case 'flow': {
      const flows = reordered(
        definition.flows,
        operation.target,
        operation.from,
        operation.to,
      )
      return flows ? withDefinition(config, { ...definition, flows }) : undefined
    }
    case 'graphic': {
      const graphics = reordered(
        definition.graphics,
        operation.target,
        operation.from,
        operation.to,
      )
      return graphics ? withDefinition(config, { ...definition, graphics }) : undefined
    }
  }
}

const withoutGraphicInFocus = (
  focus: FocusConfig | undefined,
  graphicId: string,
): FocusConfig | undefined =>
  focus?.graphics?.includes(graphicId)
    ? { ...focus, graphics: focus.graphics.filter((id) => id !== graphicId) }
    : focus

const withoutGraphicInStoryScene = (
  scene: StorySceneConfig,
  graphicId: string,
): StorySceneConfig => {
  const focus = withoutGraphicInFocus(scene.focus, graphicId)
  if (scene.graphic !== graphicId) {
    return focus === scene.focus ? scene : { ...scene, focus }
  }

  const { graphic: _graphic, ...withoutGraphic } = scene
  return focus === scene.focus ? withoutGraphic : { ...withoutGraphic, focus }
}

const removeArtefact = (
  config: InfoschematicConfig,
  operation: Extract<ArtefactOperation, { operation: 'remove' }>,
): InfoschematicConfig | undefined => {
  const definition = config.infoschematic
  switch (operation.target.kind) {
    case 'lane': {
      const index = definition.lanes.findIndex((lane) =>
        matchesTarget(lane, operation.target),
      )
      if (index < 0) return undefined
      return withDefinition(config, {
        ...definition,
        lanes: definition.lanes.filter((_, candidate) => candidate !== index),
      })
    }
    case 'zone': {
      const target = operation.target as SelectionFor<'zone'>
      const laneIndex = definition.lanes.findIndex(
        (lane) => lane.id === target.laneId,
      )
      const lane = definition.lanes[laneIndex]
      if (!lane) return undefined
      const zoneIndex = lane.zones.findIndex((zone) =>
        matchesTarget(zone, operation.target),
      )
      if (zoneIndex < 0) return undefined
      return withDefinition(config, {
        ...definition,
        lanes: replaceAt(definition.lanes, laneIndex, {
          ...lane,
          zones: lane.zones.filter((_, candidate) => candidate !== zoneIndex),
        }),
      })
    }
    case 'fabric': {
      const index = definition.fabrics.findIndex((fabric) =>
        matchesTarget(fabric, operation.target),
      )
      if (index < 0) return undefined
      const removedId = operation.target.id
      return withDefinition(config, {
        ...definition,
        fabrics: definition.fabrics.filter((_, candidate) => candidate !== index),
        flows: definition.flows.filter(
          (flow) => flow.source !== removedId && flow.target !== removedId,
        ),
      })
    }
    case 'card': {
      const index = definition.cards.findIndex((card) =>
        matchesTarget(card, operation.target),
      )
      if (index < 0) return undefined
      const removedIds = new Set([operation.target.id])
      let added = true
      while (added) {
        added = false
        for (const card of definition.cards) {
          if (card.wraps && removedIds.has(card.wraps) && !removedIds.has(card.id)) {
            removedIds.add(card.id)
            added = true
          }
        }
      }
      return withDefinition(config, {
        ...definition,
        cards: definition.cards.filter((card) => !removedIds.has(card.id)),
        flows: definition.flows.filter(
          (flow) => !removedIds.has(flow.source) && !removedIds.has(flow.target),
        ),
      })
    }
    case 'flow': {
      const index = definition.flows.findIndex((flow) =>
        matchesTarget(flow, operation.target),
      )
      if (index < 0) return undefined
      return withDefinition(config, {
        ...definition,
        flows: definition.flows.filter((_, candidate) => candidate !== index),
      })
    }
    case 'graphic': {
      const index = definition.graphics.findIndex((graphic) =>
        matchesTarget(graphic, operation.target),
      )
      if (index < 0) return undefined
      const graphicId = operation.target.id
      return {
        ...withDefinition(config, {
          ...definition,
          graphics: definition.graphics.filter((_, candidate) => candidate !== index),
        }),
        standaloneScenes: config.standaloneScenes.map((scene) => ({
          ...scene,
          focus: withoutGraphicInFocus(scene.focus, graphicId) ?? scene.focus,
        })),
        stories: config.stories.map((story) => ({
          ...story,
          scenes: story.scenes.map((scene) =>
            withoutGraphicInStoryScene(scene, graphicId),
          ),
        })),
        themes: config.themes.map((theme) => ({
          ...theme,
          scenes: theme.scenes.map((scene) => ({
            ...scene,
            focus: withoutGraphicInFocus(scene.focus, graphicId) ?? scene.focus,
          })),
        })),
      }
    }
  }
}

const replaceProperties = (
  config: InfoschematicConfig,
  operation: AnyReplaceOperation,
): InfoschematicConfig | undefined => {
  if (!matchesReplacement(operation)) return undefined
  const definition = config.infoschematic
  const replacement = cloneSerialisable(operation.value)

  if (operation.target.kind === 'zone') {
    const target = operation.target as SelectionFor<'zone'>
    const laneIndex = definition.lanes.findIndex(
      (lane) => lane.id === target.laneId,
    )
    const lane = definition.lanes[laneIndex]
    if (!lane) return undefined
    const index = lane.zones.findIndex((zone) => matchesTarget(zone, operation.target))
    if (index < 0) return undefined
    return withDefinition(config, {
      ...definition,
      lanes: replaceAt(definition.lanes, laneIndex, {
        ...lane,
        zones: replaceAt(lane.zones, index, replacement as ZoneConfig),
      }),
    })
  }

  switch (operation.target.kind) {
    case 'lane': {
      const index = definition.lanes.findIndex((value) =>
        matchesTarget(value, operation.target),
      )
      return index < 0
        ? undefined
        : withDefinition(config, {
            ...definition,
            lanes: replaceAt(definition.lanes, index, replacement as LaneConfig),
          })
    }
    case 'fabric': {
      const index = definition.fabrics.findIndex((value) =>
        matchesTarget(value, operation.target),
      )
      return index < 0
        ? undefined
        : withDefinition(config, {
            ...definition,
            fabrics: replaceAt(
              definition.fabrics,
              index,
              replacement as FabricConfig,
            ),
          })
    }
    case 'card': {
      const index = definition.cards.findIndex((value) =>
        matchesTarget(value, operation.target),
      )
      return index < 0
        ? undefined
        : withDefinition(config, {
            ...definition,
            cards: replaceAt(definition.cards, index, replacement as CardConfig),
          })
    }
    case 'flow': {
      const index = definition.flows.findIndex((value) =>
        matchesTarget(value, operation.target),
      )
      return index < 0
        ? undefined
        : withDefinition(config, {
            ...definition,
            flows: replaceAt(definition.flows, index, replacement as FlowConfig),
          })
    }
    case 'graphic': {
      const index = definition.graphics.findIndex((value) =>
        matchesTarget(value, operation.target),
      )
      return index < 0
        ? undefined
        : withDefinition(config, {
            ...definition,
            graphics: replaceAt(
              definition.graphics,
              index,
              replacement as GraphicConfig,
            ),
          })
    }
  }
}

/** Applies immutable Design operations in arrival order and reports stale input. */
export const applyArtefactOperations = (
  config: InfoschematicConfig,
  operations: readonly ArtefactDraftOperation[],
): ApplyArtefactOperationsResult => {
  let current = cloneSerialisable(config)
  const rejected: ArtefactOperationRejection[] = []

  operations.forEach((operation, index) => {
    let next: InfoschematicConfig | undefined
    let reason: ArtefactOperationRejection['reason'] = 'missing-target'

    switch (operation.operation) {
      case 'create':
        if (duplicatesIdentity(current, operation.target)) {
          reason = 'duplicate-identity'
        } else {
          next = createArtefact(current, operation)
          reason = 'invalid-operation'
        }
        break
      case 'move':
      case 'resize':
        next = applyGeometry(current, operation)
        reason = 'invalid-geometry'
        break
      case 'reorder': {
        next = reorderArtefact(current, operation)
        reason = valuesForKind(current, operation.target.kind).some((value) =>
          matchesTarget(value, operation.target),
        )
          ? 'stale-order'
          : 'missing-target'
        break
      }
      case 'remove':
        next = removeArtefact(current, operation)
        break
      case 'replace-properties':
        next = replaceProperties(current, operation)
        reason = 'invalid-operation'
        break
      default:
        reason = 'invalid-operation'
    }

    if (next) {
      current = next
    } else {
      rejected.push({ index, operation, reason })
    }
  })

  return { config: current, rejected: Object.freeze(rejected) }
}
