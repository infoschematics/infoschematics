import {
  artefactDestination,
  Canvas,
  type DestinationResolution,
  type InfoschematicDestination,
  scopeDestination
} from '@infoschematics/view-canvas'
import '@infoschematics/view-canvas/styles.css'
import { useState } from 'react'
import { destinationSpecimen } from './destination-specimen.ts'

/**
 * Reading an address out of this page's own URL, which is the whole of the host's half of the contract.
 *
 * `ADR-INFOSCHEMATICS-005` keeps routing with the host, so the spelling — `?artefact=`, `?scope=` — is this site's
 * choice and nothing in any package knows it. Another host is free to use a fragment, a path segment, or no address
 * at all. What crosses the boundary is an authored identity.
 */
export const destinationFromSearch = (search: string): InfoschematicDestination | null => {
  const parameters = new URLSearchParams(search)
  const artefact = parameters.get('artefact')
  if (artefact) return artefactDestination(artefact)
  const scope = parameters.get('scope')
  return scope ? scopeDestination(scope) : null
}

const addressOf = (destination: InfoschematicDestination) =>
  destination.kind === 'artefact' ? `?artefact=${destination.code}` : `?scope=${destination.id}`

const links: readonly InfoschematicDestination[] = [
  artefactDestination('INTAKE'),
  artefactDestination('STORE'),
  artefactDestination('CLIENT'),
  scopeDestination('edge'),
  /* Deliberately broken: the address a document outlived. It has to be visible in the guide, because the behaviour
     it demonstrates — nothing happens, and the drawing is still there — is the one a reader has to be able to rely
     on before they will put an address in prose they cannot edit later. */
  artefactDestination('GONE-01')
]

const describe = (at: DestinationResolution) =>
  at.outcome === 'resolved'
    ? `Arrived at ${at.label}, holding ${at.selection.length === 1 ? 'one element' : `${at.selection.length} elements`}.`
    : `Nothing here answers to that address (${at.reason}). The document is drawn in full.`

/**
 * The mechanism working from a host: an address in the page, a destination in the Diagram, and a reader taken to it.
 *
 * The buttons write the address into this page's history rather than into component state, so what the reader sees is
 * driven by the URL they could have arrived on — which is the point. Copying the address out of the bar and pasting it
 * into someone else's prose is the use this exists for.
 */
export function DestinationDemo() {
  const [destination, setDestination] = useState<InfoschematicDestination | null>(() =>
    typeof window === 'undefined' ? null : destinationFromSearch(window.location.search)
  )
  const [reported, setReported] = useState<DestinationResolution | null>(null)

  const goTo = (next: InfoschematicDestination) => {
    window.history.replaceState(null, '', `${window.location.pathname}${addressOf(next)}`)
    setDestination(next)
  }

  return (
    <section aria-labelledby="try-an-address" className="visual-guide__section">
      <h2 id="try-an-address">Try an address</h2>
      <p>
        This page reads <code>?artefact=</code> and <code>?scope=</code> out of its own address and hands the result to
        the Diagram below. Arriving centres the viewport on the named part and selects it; it changes nothing else, and
        it never starts the Dynamic the document declares over <code>STORE</code>.
      </p>
      <nav aria-label="Destinations in the example Infoschematic">
        <ul className="destination-demo__links">
          {links.map((link) => (
            <li key={addressOf(link)}>
              <button onClick={() => goTo(link)} type="button">
                {addressOf(link)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <figure className="visual-guide__anatomy">
        <Canvas config={destinationSpecimen} destination={destination} onDestination={setReported} />
        <figcaption aria-live="polite" data-destination-report="true">
          {reported ? describe(reported) : 'No destination. The whole document is shown.'}
        </figcaption>
      </figure>
    </section>
  )
}
