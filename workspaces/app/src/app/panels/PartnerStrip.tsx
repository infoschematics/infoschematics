import type { Stage } from '../hooks/use-stage.ts'
import { useInfoschematic } from '../infoschematic-context.tsx'

/*
 * Who is in the consortium, and what each of them provides.
 *
 * A bank on the control surface rather than a strip along the header. It sat at
 * the top because a visitor should see whose work this is before they see
 * anything else - but it does the same job as the three banks below it, lighting
 * a named set of components and flows and dimming the rest, and a control
 * that behaves like its neighbours should sit with them.
 *
 * A partner's mark where one has been dropped into `src/play/partners/` under
 * the partner's own id, and its name otherwise. One or the other, never both: a
 * wordmark is the name already drawn, so setting it beside the name says it
 * twice.
 */
export function PartnerStrip({ stage }: { stage: Stage }) {
  const { partnerLogos, vendors } = useInfoschematic()
  return (
    <>
      {vendors.map((entry) => (
        <button
          aria-pressed={stage.vendor?.id === entry.id}
          className="partner-button"
          key={entry.id}
          onClick={() => stage.toggleVendor(entry)}
          title={`${entry.label} — ${entry.headline}`}
          type="button"
        >
          {partnerLogos[entry.id] ? (
            <img alt={entry.label} src={partnerLogos[entry.id]} />
          ) : (
            (entry.short ?? entry.label)
          )}
        </button>
      ))}
    </>
  )
}
