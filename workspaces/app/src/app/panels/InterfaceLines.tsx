import type { InterfaceConfig } from '@infoschematics/model'
import { type RuntimeFlow, type RuntimeIdentity, useInfoschematic } from '../infoschematic-context.tsx'

/*
 * What on the stage answers for a specification.
 *
 * Two lists, because there are two relationships and they are not the same
 * claim. A flow carries a specification: the traffic on it meets that document.
 * A card offers one: the card implements it, whether or not anything drawn
 * calls it. Only the second can be said about the SCAL APIs, which describe an
 * adapter-to-component relationship the diagram draws as containment rather
 * than as a line - so counting flows alone reported four published contracts as
 * unreachable when each is implemented by a card in plain view.
 */
export function InterfaceLines({
  cards,
  flows,
  interfaceEntry
}: {
  cards: readonly RuntimeIdentity[]
  flows: readonly RuntimeFlow[]
  interfaceEntry: InterfaceConfig | undefined
}) {
  const { topologyEndpointLabels } = useInfoschematic()
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
                  {topologyEndpointLabels.get(line.source) ?? line.source} →{' '}
                  {topologyEndpointLabels.get(line.target) ?? line.target}
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
