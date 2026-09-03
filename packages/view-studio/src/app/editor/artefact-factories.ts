import type { GraphicConfig } from '@infoschematics/domain-model/graphic'
import type { LaneConfig } from '@infoschematics/domain-model/lane'
import type { ZoneConfig } from '@infoschematics/domain-model/zone'
import type { Box } from '@infoschematics/view-model/geometry'
import {
  createArtefactOperation,
  defineArtefactSelection,
  type ArtefactKind,
  type CreateArtefactOperation,
} from '@infoschematics/view-model/editable'

export type FactoryKind = Extract<ArtefactKind, 'graphic' | 'lane' | 'zone'>

export type FactoryIdentity = Readonly<{ code: null; id: string }>
export type FactoryIdentityAllocator = (kind: FactoryKind) => FactoryIdentity

export type ArtefactFactoryContext = Readonly<{
  allocate: FactoryIdentityAllocator
  at: number
  box: Box
  lane?: Readonly<{ height: number; id: string; y: number }>
}>

export type FactoryCreateOperation =
  | CreateArtefactOperation<'graphic'>
  | CreateArtefactOperation<'lane'>
  | CreateArtefactOperation<'zone'>

const finite = (value: number) => Number.isFinite(value)
const validBox = (box: Box) =>
  finite(box.x) && finite(box.y) && finite(box.width) && finite(box.height) && box.width > 0 && box.height > 0

export const createFactoryIdentityAllocator = (used: Iterable<string> = []): FactoryIdentityAllocator => {
  const ids = new Set(used)
  const sequences: Record<FactoryKind, number> = { graphic: 0, lane: 0, zone: 0 }

  return (kind) => {
    let id: string
    do {
      sequences[kind] += 1
      id = `${kind}-${sequences[kind]}`
    } while (ids.has(id))
    ids.add(id)
    return Object.freeze({ code: null, id })
  }
}

const identityFor = (kind: FactoryKind, context: ArtefactFactoryContext) => {
  const identity = context.allocate(kind)
  return identity.code === null && identity.id.trim() !== '' ? identity : undefined
}

export const createDefaultLane = (
  context: ArtefactFactoryContext,
): CreateArtefactOperation<'lane'> | undefined => {
  if (!validBox(context.box) || !finite(context.at)) return undefined
  const identity = identityFor('lane', context)
  if (!identity) return undefined
  const value: LaneConfig = {
    height: context.box.height,
    id: identity.id,
    label: 'New lane',
    labelY: context.box.y + Math.min(32, context.box.height / 2),
    panel: { ...context.box, radius: 12 },
    y: context.box.y,
    zones: [],
  }
  const target = defineArtefactSelection({ ...identity, geometry: 'lane', kind: 'lane' })
  return createArtefactOperation(target, value, context.at)
}

export const createDefaultZone = (
  context: ArtefactFactoryContext,
): CreateArtefactOperation<'zone'> | undefined => {
  if (!validBox(context.box) || !finite(context.at) || !context.lane?.id.trim()) return undefined
  if (!finite(context.lane.y) || !finite(context.lane.height) || context.lane.height <= 0) return undefined
  const identity = identityFor('zone', context)
  if (!identity) return undefined
  const value: ZoneConfig = {
    fill: '#1f2937',
    id: identity.id,
    label: 'New zone',
    width: context.box.width,
    x: context.box.x,
  }
  const target = defineArtefactSelection({ ...identity, geometry: 'zone', kind: 'zone', laneId: context.lane.id })
  return createArtefactOperation(target, value, context.at)
}

export const createDefaultGraphic = (
  context: ArtefactFactoryContext,
): CreateArtefactOperation<'graphic'> | undefined => {
  if (!validBox(context.box) || !finite(context.at)) return undefined
  const identity = identityFor('graphic', context)
  if (!identity) return undefined
  const value: GraphicConfig = {
    id: identity.id,
    label: 'New graphic',
    placement: { ...context.box },
    properties: {},
    renderer: 'note',
    scopes: [],
  }
  const target = defineArtefactSelection({ ...identity, geometry: 'box', kind: 'graphic' })
  return createArtefactOperation(target, value, context.at)
}

export const createDefaultArtefact = (
  kind: FactoryKind,
  context: ArtefactFactoryContext,
): FactoryCreateOperation | undefined => {
  switch (kind) {
    case 'lane':
      return createDefaultLane(context)
    case 'zone':
      return createDefaultZone(context)
    case 'graphic':
      return createDefaultGraphic(context)
  }
}
