import { ChevronDown, ChevronUp, ListX, Plus, RotateCcw, Timer, Trash2 } from 'lucide-react'
import { LineList } from './LineList.tsx'
import { holdFor } from './scenes.ts'
import type { SceneList } from './use-scene-list.ts'

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`

const minutes = (ms: number) => {
  const whole = Math.round(ms / 1000)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

/*
 * A story's scenes, and what one says.
 *
 * The scenes are a list here rather than markers on the Infoschematic, because a
 * sequence is the one thing a Infoschematic cannot show: what a scene lights is on the
 * diagram, but which scene comes third is not anywhere. That is the split
 * The lit set is chosen on the Infoschematic, because that is where the things being
 * lit are; the words and the order are chosen here, because a Infoschematic cannot show
 * an order.
 *
 * What a scene lights is added from the Infoschematic selection rather than by a click
 * mode of its own. Selecting a card and pressing a button is a gesture the
 * reader already has, where a mode is one they have to be told about and then
 * remember they are in.
 */
export function SceneListPanel({
  editor,
  selected,
  selectedIsFlow
}: {
  editor: SceneList
  /** What is selected on the Infoschematic, so a scene can be given it. */
  selected: string | null
  selectedIsFlow: boolean
}) {
  const scene = editor.scenes[editor.at]
  const lit = scene ? scene.components.length + scene.flows.length : 0
  const paced = scene ? holdFor(scene.caption) : 0

  return (
    <div className="story-panel">
      <label className="text-row">
        <span>Story</span>
        <select onChange={(event) => editor.choose(event.target.value)} value={editor.chosen}>
          {editor.stories.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </label>

      <div className="scene-tools">
        <span className="scene-run-time" title="Total run time, which follows every hold you set">
          <Timer aria-hidden="true" size={12} /> {minutes(editor.runTime)}
        </span>
        <button
          aria-label="Move this scene earlier"
          disabled={!scene || editor.at === 0}
          onClick={() => editor.move(-1)}
          type="button"
        >
          <ChevronUp aria-hidden="true" size={13} />
        </button>
        <button
          aria-label="Move this scene later"
          disabled={!scene || editor.at >= editor.scenes.length - 1}
          onClick={() => editor.move(1)}
          type="button"
        >
          <ChevronDown aria-hidden="true" size={13} />
        </button>
        <button
          aria-label="Add a scene after this one"
          disabled={!editor.story}
          onClick={() => editor.insert()}
          type="button"
        >
          <Plus aria-hidden="true" size={13} />
        </button>
        <button aria-label="Remove this scene" disabled={!scene} onClick={() => editor.remove()} type="button">
          <Trash2 aria-hidden="true" size={13} />
        </button>
        <button
          aria-label="Clear every scene from this story"
          disabled={editor.scenes.length === 0}
          onClick={() => editor.clear()}
          title="Clear this Story; it will remain editable but cannot start in Present"
          type="button"
        >
          <ListX aria-hidden="true" size={13} />
        </button>
        <button
          aria-label="Discard the edits to this story"
          disabled={!editor.edited}
          onClick={() => editor.revert()}
          title="Discard the edits to this story"
          type="button"
        >
          <RotateCcw aria-hidden="true" size={13} />
        </button>
      </div>

      {editor.story && !editor.canActivate ? (
        <p className="scene-following">
          This Story can be drafted empty, but it needs a valid Scene before it can start in Present.
        </p>
      ) : null}

      {editor.following ? (
        <p className="scene-following">
          Following the run. Edits go to the draft and reach the story when the change set is applied, rather than
          changing what is playing.
        </p>
      ) : null}

      <ol className="scene-list">
        {editor.scenes.map((step, index) => (
          /* A scene's identity is its position - it has no other - and every
             value in the row comes from props, so a reorder has no state to
             carry across. */
          // biome-ignore lint/suspicious/noArrayIndexKey: position is the identity
          <li key={index}>
            <button
              aria-current={index === editor.at}
              className={index === editor.at ? 'scene-row selected' : 'scene-row'}
              disabled={editor.following}
              onClick={() => editor.select(index)}
              type="button"
            >
              <em>{index + 1}</em>
              <span>{step.title || 'Untitled scene'}</span>
              <b>{seconds(step.hold)}</b>
            </button>
          </li>
        ))}
      </ol>

      {editor.story && editor.scenes.length === 0 ? (
        <p className="contract-empty">This Story has no Scenes. Add one to begin its storyboard.</p>
      ) : null}

      {scene ? (
        <div className="scene-fields">
          <label className="text-row">
            <span>Storyboard title</span>
            <input
              onChange={(event) => editor.edit({ title: event.target.value })}
              type="text"
              value={scene.title ?? ''}
            />
          </label>
          <label className="text-row">
            <span>Callout title</span>
            <input
              onChange={(event) => editor.edit({ calloutTitle: event.target.value || undefined })}
              type="text"
              value={scene.calloutTitle ?? ''}
            />
          </label>
          <label className="text-row">
            <span>Caption</span>
            <textarea
              onChange={(event) => editor.edit({ caption: event.target.value })}
              rows={4}
              value={scene.caption}
            />
          </label>
          <label className="text-row">
            <span>Renderer</span>
            <input
              onChange={(event) => editor.edit({ renderer: event.target.value || undefined })}
              type="text"
              value={scene.renderer ?? ''}
            />
          </label>
          <label className="text-row">
            <span>Hold</span>
            <span className="scene-hold">
              <input
                min={0}
                onChange={(event) => editor.edit({ hold: Number(event.target.value) })}
                step={100}
                type="number"
                value={scene.hold}
              />
              {/* The pacing is offered rather than applied. A hold is editorial
                  once it is set, so this is a button and never a side effect of
                  typing a caption. */}
              <button
                disabled={scene.hold === paced}
                onClick={() => editor.edit({ hold: paced })}
                title={`Pace it from the caption — ${seconds(paced)}`}
                type="button"
              >
                Pace
              </button>
            </span>
          </label>

          {/* Takeaways restate the caption in a few short lines, so the hold
              stays derived from the caption alone and a clearer takeaway costs
              no time on the clock. */}
          <LineList
            label="Takeaways"
            lines={scene.takeaways ?? []}
            onChange={(takeaways) => editor.edit({ takeaways: takeaways.filter((line) => line.trim() !== '') })}
            placeholder="Add a takeaway"
          />

          {/* A Story Scene either owns what it lights or plays a scene that does. The
              second is not editable here: the scene is authored elsewhere and
              other stories may play it. */}
          <p className="scene-lit">
            {scene.scene ? (
              <>
                Plays the <b>{scene.scene}</b> scene, which lights {lit} {lit === 1 ? 'thing' : 'things'}. Edit the
                scene to change them.
              </>
            ) : (
              <>
                Lights {lit} {lit === 1 ? 'thing' : 'things'}.{' '}
                <button
                  disabled={!selected}
                  onClick={() => selected && editor.toggle(selected, selectedIsFlow)}
                  type="button"
                >
                  {selected ? `Add or remove ${selected}` : 'Select something on the Infoschematic to add it'}
                </button>
              </>
            )}
          </p>
        </div>
      ) : null}
    </div>
  )
}
