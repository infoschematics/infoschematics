import type { GraphicConfig } from '@infoschematics/domain-model/graphic'
import type { RegionConfig } from '@infoschematics/domain-model/region'
import type { Box } from '@infoschematics/view-model/geometry'
import {
  createArtefactOperation,
  defineArtefactSelection,
  type ArtefactKind,
  type CreateArtefactOperation,
} from '@infoschematics/view-model/editable'

export type FactoryKind = Extract<ArtefactKind, 'graphic' | 'region'>

export type FactoryIdentity = Readonly<{ code: null; id: string }>
export type FactoryIdentityAllocator = (kind: FactoryKind) => FactoryIdentity

export type ArtefactFactoryContext = Readonly<{
  allocate: FactoryIdentityAllocator
  at: number
  box: Box
}>

export type FactoryCreateOperation =
  | CreateArtefactOperation<'graphic'>
  | CreateArtefactOperation<'region'>

const finite = (value: number) => Number.isFinite(value)
const validBox = (box: Box) =>
  finite(box.x) && finite(box.y) && finite(box.width) && finite(box.height) && box.width > 0 && box.height > 0

export const createFactoryIdentityAllocator = (used: Iterable<string> = []): FactoryIdentityAllocator => {
  const ids = new Set(used)
  const sequences: Record<FactoryKind, number> = { graphic: 0, region: 0 }

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

export const createDefaultRegion = (
  context: ArtefactFactoryContext,
): CreateArtefactOperation<'region'> | undefined => {
  if (!validBox(context.box) || !finite(context.at)) return undefined
  const identity = identityFor('region', context)
  if (!identity) return undefined
  const value: RegionConfig = {
    box: { ...context.box, radius: 12 },
    frame: { style: 'solid' },
    id: identity.id,
    label: 'New region',
  }
  const target = defineArtefactSelection({ ...identity, geometry: 'box', kind: 'region' })
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
    case 'region':
      return createDefaultRegion(context)
    case 'graphic':
      return createDefaultGraphic(context)
  }
}
