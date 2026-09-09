import type { Infoschematic } from '@infoschematics/domain-model/model'
import { stringify } from 'yaml'
import { defineInfoschematicModel } from './model.ts'

/** Serialise canonical data as the preferred human-authored YAML representation. */
export const serialiseInfoschematicYaml = (input: Infoschematic): string =>
  stringify(defineInfoschematicModel(input), { lineWidth: 0, version: '1.2' })

/** Serialise canonical data as deterministic JSON interchange. */
export const serialiseInfoschematicJson = (input: Infoschematic): string =>
  `${JSON.stringify(defineInfoschematicModel(input), null, 2)}\n`
