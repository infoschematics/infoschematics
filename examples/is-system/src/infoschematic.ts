/**
 * Generated from `infoschematic.yaml` by `bun run self:examples:generate`. Do not edit.
 *
 * The YAML in this package is the authored source. Edit it, then regenerate.
 */
import { formatInfoschematicIssue, parseInfoschematic } from '@infoschematics/domain-core'

const source = `id: system-explained
title: A system, explained
subtitle: From observed signals to a shared view
description: Observation gathers signals, arrangement gives them structure, illumination draws out meaning, and the result is a view a whole team can share.
diagram:
  bounds: 0 0 1268 248
  appearance:
    surface: blueprint
    grid: major-plus-minor
    card:
      description: true
      stereotype: true
      compact: false
      identity: true
  collections:
    - id: observe
      label: Observe
      appearance:
        color: "#9673a6"
        fill: "#0d1b2a"
    - id: arrange
      label: Arrange
      appearance:
        color: "#6c8ebf"
        fill: "#0d1b2a"
    - id: illuminate
      label: Illuminate
      appearance:
        color: "#b85450"
        fill: "#0d1b2a"
    - id: understand
      label: Understand
      appearance:
        color: "#82b366"
        fill: "#0d1b2a"
  families:
    - id: progression
      label: Progresses to
      description: Each stage hands its result to the next
      color: "#79c9ff"
  cards:
    - id: OBS-01
      label: Signals
      description: Facts, events and relationships
      collection: observe
      stereotype: Observe
      bounds: 64 64 240 120
      ports:
        east: 1
        west: 1
    - id: MAP-02
      label: Structure
      description: Systems, boundaries and flow
      collection: arrange
      stereotype: Arrange
      bounds: 364 64 240 120
      ports:
        east: 1
        west: 1
    - id: LIT-03
      label: Meaning
      description: Stories, scenes and evidence
      collection: illuminate
      stereotype: Illuminate
      bounds: 664 64 240 120
      ports:
        east: 1
        west: 1
    - id: SEE-04
      label: Shared view
      description: Complexity made comprehensible
      collection: understand
      stereotype: Understand
      bounds: 964 64 240 120
      ports:
        east: 1
        west: 1
  regions:
    - id: journey
      label: Infoschematic
      bounds: 24 24 1220 200
      appearance:
        label:
          placement: north-west
          mount: boundary
        cornerRadius: 12
        frame:
          style: solid
        fill: "#12273b24"
  flows:
    - id: SELECT
      family: progression
      link: OBS-01 E1 -> MAP-02 W1
      labelAt: 0.5
    - id: CONNECT
      family: progression
      link: MAP-02 E1 -> LIT-03 W1
      labelAt: 0.5
    - id: REVEAL
      family: progression
      link: LIT-03 E1 -> SEE-04 W1
      labelAt: 0.5
  dynamics:
    - id: signal-observed
      label: A fresh signal arrives
      description: Something new was observed and is on its way into structure.
      kind: signal-flow
      flows:
        - SELECT
    - id: view-revised
      label: The shared view is revised
      description: The shared view changed because meaning was revised.
      kind: emphasise-elements
      elements:
        - SEE-04
  gridSize: 10
scopes:
  - id: system
    label: System
    description: The system being explained
    elements:
      - OBS-01
      - MAP-02
      - LIT-03
      - SEE-04
`

const parsed = parseInfoschematic(source, { pathname: 'infoschematic.yaml' })
if (!parsed.ok) {
  throw new Error(
    ['infoschematic.yaml is not a valid Infoschematic:', ...parsed.issues.map(formatInfoschematicIssue)].join('\n')
  )
}

/** A system, explained */
export const systemExample = parsed.model
