import { useInfoschematic } from '@infoschematics/view-canvas'
import { useEffect, useRef } from 'react'
import { usePersistentState } from '../hooks/use-persistent-state.ts'
import { Part } from './Part.tsx'

/*
 * What the Infoschematic contains, as a list.
 *
 * Three parts, because there are three kinds of component: the cards, the
 * fabrics they sit in, and the flows between them. Component is all three, so
 * the part holding the cards is called Cards - a part called Components beside
 * a part called Flows uses narrowly the one word the vocabulary widened.
 *
 * An adapter card is a component like any other and is listed under its own scope
 * rather than under the card it holds. It belongs to its own Scope, and filing
 * it under the Card it holds would misstate that ownership.
 *
 * The external points are not a fourth part. They have no box, no ports and no
 * scope; their codes appear only in a flow's tooltip and the editor's placement
 * panel; and every flow row already names them in words. A section for
 * them listed three codes a reader of this panel will never meet, in order to
 * explain three names spelled out beside them.
 *
 * Nothing here is authored. A flow's identity is its two ends and the interface
 * it carries; a card's is its name, its subtitle, its scope and what it
 * implements. Both were already in the model, so the register was complete the
 * day it was written and cannot drift from the diagram.
 */

// Cards and fabrics from the register, which is where what a thing is now
// lives. This panel is named for the concept and was rebuilding it: three
// separate reads of the model to answer the one question the register answers.
function Row({
  code,
  detail,
  name,
  onPoint,
  pointed
}: {
  code: string
  detail: string
  name: string
  onPoint: (code: string | null) => void
  pointed: boolean
}) {
  const row = useRef<HTMLDivElement>(null)

  /*
   * Brought into view when the Infoschematic is pointing at it.
   *
   * Focusing a row says nothing if the row is eighty entries down a scrolling
   * panel, which is where most of them are: pointing at a line on the Infoschematic lit
   * something the reader could not see. `nearest` rather than `center` so a row
   * already on screen does not jump under the eye that is reading it.
   */
  useEffect(() => {
    if (pointed) row.current?.scrollIntoView({ block: 'nearest' })
  }, [pointed])

  return (
    <div
      className={pointed ? 'register-row pointed' : 'register-row'}
      onPointerEnter={() => onPoint(code)}
      onPointerLeave={() => onPoint(null)}
      ref={row}
    >
      <dt>{code}</dt>
      <dd>
        <span className="register-name">{name}</span>
        <span className="register-detail">{detail}</span>
      </dd>
    </div>
  )
}

export function ModelRegister({
  hovered,
  onPoint
}: {
  /** What the Infoschematic is pointing at, so the row for it lights with it. */
  hovered: string | null
  onPoint: (code: string | null) => void
}) {
  const runtime = useInfoschematic()
  const {
    config,
    infoschematicEndpointLabels,
    infoschematicFamilies,
    infoschematicFlows,
    infoschematicInterfaceById,
    infoschematicRegister,
    infoschematicScopes
  } = runtime
  const cards = infoschematicRegister.all.filter((entry) => entry.kind === 'card')
  const fabrics = infoschematicRegister.all.filter((entry) => entry.kind === 'fabric')
  const heldBy = new Map(cards.filter((card) => card.wraps).map((adapter) => [adapter.code, adapter.wraps as string]))
  const endpointName = (id: string) => infoschematicEndpointLabels.get(id) ?? id
  const [shut, setShut] = usePersistentState<Record<string, boolean>>(config.id && `${config.id}.register.shut`, {})
  const toggle = (part: string) => setShut((current) => ({ ...current, [part]: !current[part] }))

  const row = (code: string, name: string, detail: string) => (
    <Row code={code} detail={detail} key={code} name={name} onPoint={onPoint} pointed={hovered === code} />
  )

  return (
    <div className="model-register">
      <Part
        count={cards.length}
        note="Cards that originate, transform or consume flows, grouped by the Scope their code prefix names. An Adapter is listed under its own Scope and names the Card it holds."
        onToggle={() => toggle('cards')}
        open={!shut.cards}
        title="Cards"
      >
        {infoschematicScopes.map((scope) => {
          const within = cards.filter((card) => card.group === scope.id)
          if (within.length === 0) return null
          return (
            <div className="register-group" key={scope.id}>
              <p className="contract-meta">
                <span className="register-swatch" style={{ background: scope.color }} />
                {scope.prefix} · {scope.label}
              </p>
              <dl className="register-rows">
                {within.map((card) => {
                  const holds = heldBy.get(card.code)
                  // Provides rather than implements: `services` is a grouping tag,
                  // not a reference to anything. What a card implements is
                  // `conformsTo`, and the Specifications tab is where it is read.
                  const implement = card.services?.length ? `provides ${card.services.join(', ')}` : undefined
                  const held = holds ? `holds ${endpointName(holds)}` : undefined
                  return row(card.code, card.label, [card.detail, held, implement].filter(Boolean).join(' · '))
                })}
              </dl>
            </div>
          )
        })}
      </Part>

      <Part
        count={fabrics.length}
        note="Background regions that Flows cross rather than start in. A Fabric participates through its authored placement and ports."
        onToggle={() => toggle('fabrics')}
        open={!shut.fabrics}
        title="Fabrics"
      >
        <dl className="register-rows">
          {fabrics.map((fabric) => row(fabric.code, fabric.label, fabric.detail ?? ''))}
        </dl>
      </Part>

      <Part
        count={infoschematicFlows.length}
        note="Each flow names what it joins and the interface it carries. Two flows carrying the same interface are the same contract met by different components."
        onToggle={() => toggle('flows')}
        open={!shut.flows}
        title="Flows"
      >
        {infoschematicFamilies.map((family) => {
          const carried = infoschematicFlows.filter((flow) => flow.family === family.id)
          if (carried.length === 0) return null
          return (
            <div className="register-group" key={family.id}>
              <p className="contract-meta">
                <span className="register-rule" style={{ background: family.color }} />
                {family.prefix} · {family.label}
              </p>
              <dl className="register-rows">
                {carried.map((flow) => {
                  /*
                   * Two different relationships, told apart.
                   *
                   * `conformsTo` is alternatives: where a flow names two, the
                   * theme decides which is true and the flow cannot. `over`
                   * is a payload on a transport, which is not a choice at all.
                   * Rendering these relationships differently avoids presenting
                   * a transport relationship as an alternative.
                   */
                  const named = (id: string) => infoschematicInterfaceById.get(id)?.label ?? id
                  const alternatives = (flow.conformsTo ?? []).map(named).join(' or ')
                  const conforms = flow.over ? `${alternatives} over ${named(flow.over)}` : alternatives
                  return row(
                    flow.code,
                    `${endpointName(flow.source)} → ${endpointName(flow.target)}`,
                    [conforms || 'Carriage, to no specification of its own', flow.operation].filter(Boolean).join(' · ')
                  )
                })}
              </dl>
            </div>
          )
        })}
      </Part>
    </div>
  )
}
