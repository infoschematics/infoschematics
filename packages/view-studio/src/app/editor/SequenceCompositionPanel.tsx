import { rendererReferenceOf } from '@infoschematics/domain-model/renderer'
import { ChevronDown, ChevronUp, ListX, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { LineList } from './LineList.tsx'
import type { SequenceComposition } from './use-sequence-composition.ts'

/** Sequence and Expanded Scene authoring for Direct mode. */
export function SequenceCompositionPanel({
  editor,
  selected,
  selectedIsFlow
}: {
  editor: SequenceComposition
  selected: string | null
  selectedIsFlow: boolean
}) {
  const [sequenceName, setSequenceName] = useState('')
  const [sceneName, setSceneName] = useState('')
  const { scene, sequence } = editor
  const lit = scene ? (scene.focus.artefacts?.length ?? 0) + (scene.focus.flows?.length ?? 0) : 0

  return (
    <div className="story-panel">
      <label className="text-row">
        <span>Sequence</span>
        <select onChange={(event) => editor.chooseSequence(event.target.value)} value={editor.chosenSequence}>
          {editor.sequences.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </select>
      </label>

      <div className="scene-tools">
        <input
          aria-label="Name a new Sequence"
          onChange={(event) => setSequenceName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || !sequenceName.trim()) return
            editor.addSequence(sequenceName)
            setSequenceName('')
          }}
          placeholder="Name new Sequence"
          type="text"
          value={sequenceName}
        />
        <button
          aria-label="Add a Sequence"
          disabled={!sequenceName.trim()}
          onClick={() => {
            editor.addSequence(sequenceName)
            setSequenceName('')
          }}
          type="button"
        >
          <Plus aria-hidden="true" size={13} />
        </button>
        <button
          aria-label="Remove this Sequence"
          disabled={!sequence}
          onClick={() => editor.removeSequence()}
          type="button"
        >
          <Trash2 aria-hidden="true" size={13} />
        </button>
        <button
          aria-label="Discard edits to Sequences"
          disabled={!editor.edited}
          onClick={() => editor.revert()}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={13} />
        </button>
      </div>

      {sequence ? (
        <div className="scene-fields">
          <label className="text-row">
            <span>Name</span>
            <input
              onChange={(event) => editor.editSequence({ title: event.target.value })}
              type="text"
              value={sequence.title}
            />
          </label>
          <label className="text-row">
            <span>Detail</span>
            <textarea
              onChange={(event) => editor.editSequence({ description: event.target.value })}
              rows={2}
              value={sequence.description ?? ''}
            />
          </label>
        </div>
      ) : (
        <p className="contract-empty">There are no Sequences. Create one to begin composing its Scenes.</p>
      )}

      {sequence ? (
        <>
          <div className="scene-tools">
            <input
              aria-label="Name a new Expanded Scene"
              onChange={(event) => setSceneName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || !sceneName.trim()) return
                editor.addScene(sceneName)
                setSceneName('')
              }}
              placeholder="Name new Scene"
              type="text"
              value={sceneName}
            />
            <button
              aria-label="Add a Expanded Scene"
              disabled={!sceneName.trim()}
              onClick={() => {
                editor.addScene(sceneName)
                setSceneName('')
              }}
              type="button"
            >
              <Plus aria-hidden="true" size={13} />
            </button>
            <button
              aria-label="Move this Expanded Scene earlier"
              disabled={!scene || editor.at === 0}
              onClick={() => editor.move(-1)}
              type="button"
            >
              <ChevronUp aria-hidden="true" size={13} />
            </button>
            <button
              aria-label="Move this Expanded Scene later"
              disabled={!scene || editor.at >= editor.scenes.length - 1}
              onClick={() => editor.move(1)}
              type="button"
            >
              <ChevronDown aria-hidden="true" size={13} />
            </button>
            <button
              aria-label="Remove this Expanded Scene"
              disabled={!scene}
              onClick={() => editor.removeScene()}
              type="button"
            >
              <Trash2 aria-hidden="true" size={13} />
            </button>
            <button
              aria-label="Clear every Scene from this Sequence"
              disabled={editor.scenes.length === 0}
              onClick={() => editor.clear()}
              type="button"
            >
              <ListX aria-hidden="true" size={13} />
            </button>
          </div>

          {!editor.canActivate ? (
            <p className="scene-following">
              This Sequence can be drafted empty, but it needs a valid Scene before it can be shown in Present.
            </p>
          ) : null}

          <ol className="scene-list">
            {editor.scenes.map((entry, index) => (
              <li key={entry.id}>
                <button
                  aria-current={index === editor.at}
                  className={index === editor.at ? 'scene-row selected' : 'scene-row'}
                  onClick={() => editor.chooseScene(index)}
                  type="button"
                >
                  <em>{entry.code}</em>
                  <span>{entry.label}</span>
                  <b>{(entry.focus.artefacts?.length ?? 0) + (entry.focus.flows?.length ?? 0)}</b>
                </button>
              </li>
            ))}
          </ol>
        </>
      ) : null}

      {scene ? (
        <div className="scene-fields">
          <label className="text-row">
            <span>Scene</span>
            <input
              onChange={(event) => editor.editScene({ label: event.target.value })}
              type="text"
              value={scene.label}
            />
          </label>
          <label className="text-row">
            <span>Detail</span>
            <textarea
              onChange={(event) => editor.editScene({ description: event.target.value })}
              rows={2}
              value={scene.description ?? ''}
            />
          </label>
          <label className="text-row">
            <span>Callout title</span>
            <input
              onChange={(event) =>
                editor.editScene({
                  callout: { ...scene.callout, body: scene.callout?.body ?? '', title: event.target.value || undefined }
                })
              }
              type="text"
              value={scene.callout?.title ?? ''}
            />
          </label>
          <label className="text-row">
            <span>Callout</span>
            <textarea
              onChange={(event) => editor.editScene({ callout: { ...scene.callout, body: event.target.value } })}
              rows={3}
              value={scene.callout?.body ?? ''}
            />
          </label>
          <label className="text-row">
            <span>Renderer</span>
            <input
              onChange={(event) =>
                editor.editScene({
                  callout: {
                    ...scene.callout,
                    body: scene.callout?.body ?? '',
                    renderer: event.target.value || undefined
                  }
                })
              }
              type="text"
              value={scene.callout?.renderer ? rendererReferenceOf(scene.callout.renderer).key : ''}
            />
          </label>
          <LineList
            label="Takeaways"
            lines={scene.callout?.takeaways ?? []}
            onChange={(takeaways) =>
              editor.editScene({
                callout: {
                  ...scene.callout,
                  body: scene.callout?.body ?? '',
                  takeaways: takeaways.filter((line) => line.trim() !== '')
                }
              })
            }
            placeholder="Add a takeaway"
          />
          <p className="scene-lit">
            Lights {lit} {lit === 1 ? 'thing' : 'things'}.{' '}
            <button
              disabled={!selected}
              onClick={() => selected && editor.toggle(selected, selectedIsFlow)}
              type="button"
            >
              {selected ? `Add or remove ${selected}` : 'Select something on the Infoschematic to add it'}
            </button>
          </p>
        </div>
      ) : null}
    </div>
  )
}
