import type { InterfaceConfig } from '@infoschematics/domain-model/interface'
import { type RuntimeFlow, type RuntimeIdentity, useInfoschematic } from '../infoschematic-context.tsx'

/*
 * What the Infoschematic answers for a specification.
 *
 * A Flow carries a specification, while a Card offers one whether or not a
 * drawn Flow calls it. Counting only routed specifications would report an
 * offered contract as unreachable even when its Card is in plain view.
 */
export function InterfaceLines({
  cards,
  flows,
  interfaceEntry,
}: {
  cards: readonly RuntimeIdentity[]
  flows: readonly RuntimeFlow[]
  interfaceEntry: InterfaceConfig | undefined
}) {
  const { infoschematicEndpointLabels } = useInfoschematic()
  if (!interfaceEntry) return null

  const nothing = cards.length === 0 && flows.length === 0

  return (
    <div className="contract-flows">
      {flows.length > 0 ? (
        <>
          <p className="eyebrow">Flows that carry it</p>
          <p className="contract-meta">
            Annotated <code>{interfaceEntry.prefix}</code>, whatever colour the flow family gives them.
          </p>
          <ul className="contract-operations">
            {flows.map((line) => (
              <li key={line.id}>
                <code>{line.code}</code>
                <span>
                  {infoschematicEndpointLabels.get(line.source) ?? line.source} →{' '}
                  {infoschematicEndpointLabels.get(line.target) ?? line.target}
                </span>
                {line.operation ? <em>{line.operation}</em> : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {cards.length > 0 ? (
        <>
          <p className="eyebrow">Cards that offer it</p>
          <ul className="contract-operations">
            {cards.map((card) => (
              <li key={card.code}>
                <code>{card.code}</code>
                <span>{card.label}</span>
                {card.detail ? <em>{card.detail}</em> : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {nothing ? <p className="contract-empty">{interfaceEntry.description}</p> : null}
    </div>
  )
}
