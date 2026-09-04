import { useInfoschematic } from '@infoschematics/view-canvas'
import { X } from 'lucide-react'

// What the keyboard does and what the Infoschematic is made of, side by side. The two
// answer the questions a visitor arrives with - how do I drive this, and what
// am I looking at - and both are asked at the same moment, so both are here.

// Grouped by when a binding applies, because most of them only mean something
// in one mode and a flat list would imply they always work.
const groups = [
  {
    bindings: [
      ['?', 'Show and hide this'],
      ['Esc', 'Close it']
    ],
    label: 'Anywhere'
  },
  {
    bindings: [
      ['←  →', 'Step back and forward'],
      ['Space', 'Hold and release the auto-advance'],
      ['Esc', 'Stop the Story']
    ],
    label: 'While a Story runs'
  },
  {
    bindings: [
      ['←  →', 'Step to the previous or next Thematic Scene, wrapping at either end'],
      ['Esc', 'Clear the Theme']
    ],
    label: 'While a Theme is open'
  },
  {
    bindings: [
      ['← ↑ → ↓', 'Nudge the selected handle one unit'],
      ['Shift + arrow', 'Nudge it ten'],
      ['⌘Z / Ctrl+Z', 'Undo'],
      ['⇧⌘Z / Ctrl+Shift+Z', 'Redo'],
      ['Shift, held', 'Offer to add or remove a waypoint on the selected flow'],
      ['Delete', 'Mark the selection for removal, and lines a card cannot lose'],
      ['Drag port to port', 'Make a flow between them, choosing its family at the drop'],
      ['Esc', 'Clear the selection']
    ],
    label: 'In edit mode'
  }
] as const

/*
 * What a shape on the Infoschematic means.
 *
 * Authored, unlike the two lists below it, because the taxonomy says what the
 * colours are and nothing says what the forms are - a reader seeing an adapter
 * clasping a card has no way to learn that containment is the relationship.
 */
const forms = [
  ['Card', 'An artefact that originates, transforms or consumes a Flow.'],
  [
    'Card held in a socket',
    'An Adapter and the Card it adapts. Containment is the relationship, so no line is drawn between them.'
  ],
  ['Fabric', 'A background region that Flows cross rather than originate in.'],
  ['Line', 'A flow. Its colour is the family it carries, and its label is its code.'],
  ['Broken line', 'A logical relationship rather than a carried Flow.'],
  ['Two arrowheads', 'The relationship runs both ways.']
] as const

export function ShortcutOverlay({ onClose }: { onClose: () => void }) {
  const { infoschematicFamilies, infoschematicScopes } = useInfoschematic()
  return (
    <div className="shortcut-overlay">
      <button aria-label="Close" className="shortcut-scrim" onClick={onClose} type="button" />
      <section aria-label="Keyboard shortcuts and legend" aria-modal="true" className="shortcut-card" role="dialog">
        <div className="compact-heading">
          <p className="eyebrow">Keyboard and legend</p>
          <button
            aria-label="Close"
            className="icon-button dismiss"
            onClick={onClose}
            title="Close · escape"
            type="button"
          >
            <X aria-hidden="true" size={14} />
          </button>
        </div>

        <div className="shortcut-columns">
          <div>
            {groups.map((group) => (
              <div className="shortcut-group" key={group.label}>
                <p className="contract-meta">{group.label}</p>
                <dl className="shortcut-rows">
                  {group.bindings.map(([keys, meaning]) => (
                    <div className="shortcut-row" key={`${group.label}-${keys}`}>
                      <dt>
                        <kbd>{keys}</kbd>
                      </dt>
                      <dd>{meaning}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          <div>
            {/* Both lists are read from the taxonomy rather than written out
                again, so a colour here is the colour on the Infoschematic by
                construction and a family added to the model appears here. */}
            <div className="shortcut-group">
              <p className="contract-meta">Architecture scope, which a card is outlined in</p>
              <dl className="legend-rows">
                {infoschematicScopes.map((scope) => (
                  <div className="legend-row" key={scope.id}>
                    <dt>
                      <span className="legend-swatch" style={{ background: scope.color }} />
                      <kbd>{scope.prefix}</kbd>
                    </dt>
                    <dd>
                      {scope.label} — {scope.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="shortcut-group">
              <p className="contract-meta">Flow family, which a flow is drawn in</p>
              <dl className="legend-rows">
                {infoschematicFamilies.map((family) => (
                  <div className="legend-row" key={family.id}>
                    <dt>
                      <span className="legend-rule" style={{ background: family.color }} />
                      <kbd>{family.prefix}</kbd>
                    </dt>
                    <dd>
                      {family.label} — {family.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="shortcut-group">
              <p className="contract-meta">What a shape means</p>
              <dl className="legend-rows">
                {forms.map(([form, meaning]) => (
                  <div className="legend-row form" key={form}>
                    <dt>{form}</dt>
                    <dd>{meaning}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
