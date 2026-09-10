import { useInfoschematic } from '@infoschematics/view-canvas'

/** Diagram elements claimed by the selected specification node or branch. */
export function InterfaceLines({ realisedBy }: { realisedBy: readonly string[] }) {
  const { config, infoschematicEndpointLabels, infoschematicFlows, infoschematicRegister } = useInfoschematic()
  const flows = new Map(infoschematicFlows.map((flow) => [flow.id, flow]))
  const identities = new Map(infoschematicRegister.all.map((entry) => [entry.id, entry]))
  const regions = new Map(config.infoschematic.regions.map((entry) => [entry.id, entry]))
  const overlays = new Map(config.infoschematic.graphics.map((entry) => [entry.id, entry]))

  if (realisedBy.length === 0) {
    return <p className="contract-empty">No diagram elements currently realise this node.</p>
  }

  return (
    <div className="contract-flows">
      <p className="eyebrow">Realised by</p>
      <ul className="contract-operations">
        {realisedBy.map((id) => {
          const flow = flows.get(id)
          if (flow) {
            return (
              <li key={id}>
                <code>{flow.code}</code>
                <span>
                  {infoschematicEndpointLabels.get(flow.source) ?? flow.source} →{' '}
                  {infoschematicEndpointLabels.get(flow.target) ?? flow.target}
                </span>
                <em>Flow</em>
              </li>
            )
          }

          const identity = identities.get(id)
          if (identity) {
            return (
              <li key={id}>
                <code>{identity.code}</code>
                <span>{identity.label}</span>
                <em>{identity.kind[0]?.toUpperCase() + identity.kind.slice(1)}</em>
              </li>
            )
          }

          const region = regions.get(id)
          const overlay = overlays.get(id)
          return (
            <li key={id}>
              <code>{id}</code>
              <span>{region?.label ?? overlay?.label ?? id}</span>
              <em>{region ? 'Region' : overlay ? 'Overlay' : 'Diagram element'}</em>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
