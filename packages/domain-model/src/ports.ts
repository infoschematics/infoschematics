/** The side of an artefact on which a Flow may terminate. */
export type Side = 'east' | 'north' | 'south' | 'west'

/** A stable reference to a numbered port on one side of an artefact. */
export type PortId = `${'N' | 'E' | 'S' | 'W'}${number}`

/** The authored number of available ports on each artefact side. */
export type PortCounts = Partial<Record<Side, number>>
