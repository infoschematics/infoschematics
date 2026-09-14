import { formatInfoschematicIssue } from '@infoschematics/domain-core'
import { useState } from 'react'
import type { StudioSourcePanelController } from '../editor/document-history.ts'

export function SourcePanel({ controller }: Readonly<{ controller: StudioSourcePanelController }>) {
  const [copyStatus, setCopyStatus] = useState('')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(controller.draft)
      setCopyStatus('YAML copied.')
    } catch {
      setCopyStatus('Copy failed. Select the source and copy it manually.')
    }
  }

  return (
    <div className="source-panel">
      <div className="compact-heading source-panel-heading">
        <div>
          <p className="eyebrow">AUTHORED DOCUMENT</p>
          <h2>YAML source</h2>
        </div>
        <fieldset className="source-panel-history">
          <legend className="visually-hidden">Source history</legend>
          <button disabled={!controller.canUndo} onClick={controller.undo} type="button">
            Undo
          </button>
          <button disabled={!controller.canRedo} onClick={controller.redo} type="button">
            Redo
          </button>
        </fieldset>
      </div>
      <p className="register-note">
        Edit the retained document directly. Studio validates the complete Infoschematic before asking the host to
        accept a replacement.
      </p>
      <label className="source-panel-editor">
        <span className="visually-hidden">Infoschematic YAML source</span>
        <textarea
          aria-invalid={controller.issues.length > 0}
          onChange={(event) => controller.setDraft(event.target.value)}
          spellCheck={false}
          value={controller.draft}
        />
      </label>
      {controller.issues.length > 0 ? (
        <div className="source-panel-errors" role="alert">
          <p>Source was not applied. The last valid Infoschematic is still active.</p>
          <ul>
            {controller.issues.map((issue) => (
              <li key={formatInfoschematicIssue(issue)}>{formatInfoschematicIssue(issue)}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="source-panel-actions">
        <button onClick={() => void copy()} type="button">
          Copy YAML
        </button>
        <button disabled={!controller.dirty} onClick={controller.reset} type="button">
          Reset
        </button>
        <button disabled={!controller.canReplace || !controller.dirty} onClick={controller.replace} type="button">
          Apply source
        </button>
      </div>
      <p aria-live="polite" className="source-panel-status">
        {copyStatus}
      </p>
    </div>
  )
}
