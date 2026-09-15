/**
 * Generated from `infoschematic.yaml` by `bun run self:examples:generate`. Do not edit.
 *
 * The YAML in this package is the authored source. Edit it, then regenerate.
 */
import { formatInfoschematicIssue, parseInfoschematic } from '@infoschematics/domain-core'

const source = `id: INFOSCHEMATIC
title: Infoschematics
diagram:
  bounds: 0 0 1920 1080
  appearance:
    surface: blueprint
    grid: major-plus-minor
    card:
      description: false
      stereotype: false
      compact: false
      identity: false
  gridSize: 10
`

const parsed = parseInfoschematic(source, { pathname: 'infoschematic.yaml' })
if (!parsed.ok) {
  throw new Error(
    ['infoschematic.yaml is not a valid Infoschematic:', ...parsed.issues.map(formatInfoschematicIssue)].join('\n')
  )
}

/** A blank Infoschematic */
export const blankInfoschematic = parsed.model
