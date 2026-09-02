import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { SceneLibraryEditor } from './use-scene-library.ts'

/*
 * The scenes themselves, made and named here rather than only in the config.
 *
 * A scene is the atom - one set of components lit together - and until now the
 * editor could arrange scenes into a story and could not make one, which is the
 * wrong way round since the story is what depends on them.
 *
 * What a scene lights is chosen by clicking the stage, exactly as it is for a
 * story's own beats. One gesture for one idea, whichever layer is being edited.
 */
export function SceneLibraryPanel({
  editor,
  selected,
  selectedIsFlow
}: {
  editor: SceneLibraryEditor
  selected: string | null
  selectedIsFlow: boolean
}) {
  const [naming, setNaming] = useState('')
  const scene = editor.scene
  const lit = scene ? scene.components.length + scene.flows.length : 0
  const isPlayed = scene ? editor.played.has(scene.id) : false

  return (
    <div className="scene-list-panel">
      <div className="scene-tools">
        <input
          onChange={(event) => setNaming(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || !naming.trim()) return
            editor.add(naming)
            setNaming('')
          }}
          placeholder="Name a new scene"
          type="text"
          value={naming}
        />
        <button
          aria-label="Add a scene"
          disabled={!naming.trim()}
          onClick={() => {
            editor.add(naming)
            setNaming('')
          }}
          type="button"
        >
          <Plus aria-hidden="true" size={13} />
        </button>
        {/* A scene a story plays cannot go: the beat would keep its own lists
            and quietly light nothing. The title says which story to look at. */}
        <button
          aria-label="Remove this scene"
          disabled={!scene || isPlayed}
          onClick={() => editor.remove()}
          title={isPlayed ? 'A story plays this scene, so it cannot be removed' : 'Remove this scene'}
          type="button"
        >
          <Trash2 aria-hidden="true" size={13} />
        </button>
        <button
          aria-label="Discard the edits to the scenes"
          disabled={!editor.edited}
          onClick={() => editor.revert()}
          title="Discard the edits to the scenes"
          type="button"
        >
          <RotateCcw aria-hidden="true" size={13} />
        </button>
      </div>

      <ol className="scene-list">
        {editor.library.map((entry) => (
          <li key={entry.id}>
            <button
              aria-current={entry.id === editor.chosen}
              className={entry.id === editor.chosen ? 'scene-row selected' : 'scene-row'}
              onClick={() => editor.choose(entry.id)}
              type="button"
            >
              <em>{entry.code}</em>
              <span>{entry.label}</span>
              <b>{entry.components.length + entry.flows.length}</b>
            </button>
          </li>
        ))}
      </ol>

      {scene ? (
        <div className="scene-fields">
          <label className="text-row">
            <span>Name</span>
            <input onChange={(event) => editor.edit({ label: event.target.value })} type="text" value={scene.label} />
          </label>
          <label className="text-row">
            <span>Detail</span>
            <textarea
              onChange={(event) => editor.edit({ description: event.target.value })}
              rows={3}
              value={scene.description}
            />
          </label>

          <p className="scene-lit">
            Lights {lit} {lit === 1 ? 'thing' : 'things'}.{' '}
            <button
              disabled={!selected}
              onClick={() => selected && editor.toggle(selected, selectedIsFlow)}
              type="button"
            >
              {selected ? `Add or remove ${selected}` : 'Click something on the stage to add it'}
            </button>
          </p>
        </div>
      ) : null}
    </div>
  )
}
