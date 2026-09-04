import type { Placement } from '@infoschematics/view-model/editable'
import type { PortCounts, Side } from '@infoschematics/view-model/ports'
import { usePersistentState } from '../hooks/use-persistent-state.ts'
import { useInfoschematic } from '@infoschematics/view-canvas'
import { Part } from '../panels/Part.tsx'
import { PlacementPanel } from '../panels/PlacementPanel.tsx'
import { ComponentControls } from './ComponentControls.tsx'
import { FlowEnds } from './FlowEnds.tsx'
import { TextControls } from './TextControls.tsx'
import type { TextDraft, TextField } from './use-editor.ts'

// The controls for whatever is selected. What the editor turns on, and what it
// can add, went to `EditorTools` above the split: those act on the editor rather
// than on the selection, and a control that acts on the editor should not scroll
// away with a long list of properties.
//
// Position is read-only and shown for any kind of selection; attachment points
// are only ever a component's, so they stay gated on selectedComponent.
export function EditorPanel({
  code,
  identity,
  onPlace,
  onPortCount,
  onRetext,
  placement,
  selected,
  selectedCounts,
  textDraft
}: {
  code: string | null
  /** What the model says the selection is called, where it is called anything. */
  identity: Readonly<Partial<Record<string, string>>> | undefined
  onPlace: (code: string, axis: 'x' | 'y', value: number) => void
  onPortCount: (code: string, side: Side, count: number) => void
  onRetext: (code: string, field: TextField, value: string) => void
  placement: Placement | undefined
  selected: string | null
  selectedCounts: PortCounts
  textDraft: TextDraft | undefined
}) {
  const { config } = useInfoschematic()
  /*
   * Which sets are shut, remembered like every other choice about how the panel
   * is presented. Kept by the name of the set rather than by what is selected:
   * a reader working on ports wants the ports open on the next card too, and
   * being handed all three back each time they select something is the
   * behaviour the register was folded to avoid.
   */
  const [shut, setShut] = usePersistentState<Record<string, boolean>>(
    config.id && `${config.id}.properties.shut`,
    {}
  )
  const toggle = (part: string) => setShut((current) => ({ ...current, [part]: !current[part] }))

  return (
    <div className="editor-panel">
      <p className="eyebrow pane-heading">PROPERTIES</p>
      {/*
       * Three sets, in the order the questions are asked: what this is, where
       * it sits, what meets it. A card and a flow both answer all three -
       * a card offers ports and a line lands on two of them - so both read the
       * same way down the panel rather than each having its own arrangement.
       *
       * Everything else on the Infoschematic answers only the middle one. A region,
       * a port and a waypoint get the single panel they always had, and
       * it keeps saying which of those it is, since no identity set will.
       */}
      {code && identity ? (
        <Part onToggle={() => toggle('identity')} open={!shut.identity} title="Identity">
          <TextControls
            code={code}
            draft={textDraft}
            isFlow={identity.family !== undefined}
            onChange={(field, value) => onRetext(code, field, value)}
            value={identity}
          />
        </Part>
      ) : null}
      {placement && code ? (
        <Part
          onToggle={() => toggle('dimensions')}
          open={!shut.dimensions}
          // Everything else on the Infoschematic answers only this question, so its set
          // keeps saying which kind of thing is selected - nothing else will.
          title={identity ? 'Dimensions' : placement.label}
        >
          <PlacementPanel code={code} onPlace={(axis, value) => onPlace(code, axis, value)} placement={placement} />
        </Part>
      ) : null}
      {code && placement?.kind === 'route' ? (
        <Part onToggle={() => toggle('attachment')} open={!shut.attachment} title="Attachment">
          <FlowEnds from={placement.from} to={placement.to} />
        </Part>
      ) : null}
      {selected && placement?.kind === 'box' ? (
        <Part onToggle={() => toggle('attachment')} open={!shut.attachment} title="Attachment">
          <ComponentControls
            box={placement.box}
            counts={selectedCounts}
            onChange={(side, count) => onPortCount(selected, side, count)}
          />
        </Part>
      ) : null}
      {!placement && !selected ? (
        <p className="contract-empty editor-empty">
          Select a component, a region, or a flow label to see where it sits.
        </p>
      ) : null}
    </div>
  )
}
