import { ChevronDown, ChevronUp, ListX, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { LineList } from './LineList.tsx'
import type { ThemeComposition } from './use-theme-composition.ts'

/** Theme and Thematic Scene authoring for Direct mode. */
export function ThemeCompositionPanel({
  editor,
  selected,
  selectedIsFlow,
}: {
  editor: ThemeComposition
  selected: string | null
  selectedIsFlow: boolean
}) {
  const [themeName, setThemeName] = useState('')
  const [sceneName, setSceneName] = useState('')
  const { scene, theme } = editor
  const lit = scene ? (scene.focus.artefacts?.length ?? 0) + (scene.focus.flows?.length ?? 0) : 0

  return (
    <div className="story-panel">
      <label className="text-row">
        <span>Theme</span>
        <select onChange={(event) => editor.chooseTheme(event.target.value)} value={editor.chosenTheme}>
          {editor.themes.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </select>
      </label>

      <div className="scene-tools">
        <input
          aria-label="Name a new Theme"
          onChange={(event) => setThemeName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || !themeName.trim()) return
            editor.addTheme(themeName)
            setThemeName('')
          }}
          placeholder="Name new Theme"
          type="text"
          value={themeName}
        />
        <button
          aria-label="Add a Theme"
          disabled={!themeName.trim()}
          onClick={() => {
            editor.addTheme(themeName)
            setThemeName('')
          }}
          type="button"
        >
          <Plus aria-hidden="true" size={13} />
        </button>
        <button aria-label="Remove this Theme" disabled={!theme} onClick={() => editor.removeTheme()} type="button">
          <Trash2 aria-hidden="true" size={13} />
        </button>
        <button
          aria-label="Discard edits to Themes"
          disabled={!editor.edited}
          onClick={() => editor.revert()}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={13} />
        </button>
      </div>

      {theme ? (
        <div className="scene-fields">
          <label className="text-row">
            <span>Name</span>
            <input onChange={(event) => editor.editTheme({ title: event.target.value })} type="text" value={theme.title} />
          </label>
          <label className="text-row">
            <span>Detail</span>
            <textarea
              onChange={(event) => editor.editTheme({ description: event.target.value })}
              rows={2}
              value={theme.description ?? ''}
            />
          </label>
        </div>
      ) : (
        <p className="contract-empty">There are no Themes. Create one to begin composing its Scenes.</p>
      )}

      {theme ? (
        <>
          <div className="scene-tools">
            <input
              aria-label="Name a new Thematic Scene"
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
              aria-label="Add a Thematic Scene"
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
              aria-label="Move this Thematic Scene earlier"
              disabled={!scene || editor.at === 0}
              onClick={() => editor.move(-1)}
              type="button"
            >
              <ChevronUp aria-hidden="true" size={13} />
            </button>
            <button
              aria-label="Move this Thematic Scene later"
              disabled={!scene || editor.at >= editor.scenes.length - 1}
              onClick={() => editor.move(1)}
              type="button"
            >
              <ChevronDown aria-hidden="true" size={13} />
            </button>
            <button
              aria-label="Remove this Thematic Scene"
              disabled={!scene}
              onClick={() => editor.removeScene()}
              type="button"
            >
              <Trash2 aria-hidden="true" size={13} />
            </button>
            <button
              aria-label="Clear every Scene from this Theme"
              disabled={editor.scenes.length === 0}
              onClick={() => editor.clear()}
              type="button"
            >
              <ListX aria-hidden="true" size={13} />
            </button>
          </div>

          {!editor.canActivate ? (
            <p className="scene-following">
              This Theme can be drafted empty, but it needs a valid Scene before it can be shown in Present.
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
            <input onChange={(event) => editor.editScene({ label: event.target.value })} type="text" value={scene.label} />
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
                  callout: { ...scene.callout, body: scene.callout?.body ?? '', title: event.target.value || undefined },
                })
              }
              type="text"
              value={scene.callout?.title ?? ''}
            />
          </label>
          <label className="text-row">
            <span>Callout</span>
            <textarea
              onChange={(event) =>
                editor.editScene({ callout: { ...scene.callout, body: event.target.value } })
              }
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
                    renderer: event.target.value || undefined,
                  },
                })
              }
              type="text"
              value={scene.callout?.renderer ?? ''}
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
                  takeaways: takeaways.filter((line) => line.trim() !== ''),
                },
              })
            }
            placeholder="Add a takeaway"
          />
          <p className="scene-lit">
            Lights {lit} {lit === 1 ? 'thing' : 'things'}.{' '}
            <button disabled={!selected} onClick={() => selected && editor.toggle(selected, selectedIsFlow)} type="button">
              {selected ? `Add or remove ${selected}` : 'Select something on the Infoschematic to add it'}
            </button>
          </p>
        </div>
      ) : null}
    </div>
  )
}
