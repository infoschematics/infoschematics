import { useInfoschematic } from '../infoschematic-context.tsx'
import type { TextDraft, TextField } from './use-editor.ts'

/*
 * What a thing is called and what kind of thing it is.
 *
 * The last of the editor's properties to become editable, and it waited on
 * ADR-IBC2026-003 rather than on the work: while a code was counted off from
 * its scope, changing a card's scope reissued its identity and renumbered its
 * neighbours. Codes are authored now, so a card can change what it is without
 * changing what it is called by.
 *
 * A card takes an identifier, a name, a subtitle and a scope; a line takes an
 * identifier and a family. All are registry properties rather than geometry,
 * which is why they hand back lines for a different file than a drag does.
 */
export function TextControls({
  code,
  draft,
  isFlow,
  onChange,
  value,
}: {
  code: string
  /** What has been typed but not yet applied, which is what the field shows. */
  draft: TextDraft | undefined
  isFlow: boolean
  onChange: (field: TextField, value: string) => void
  /** What the model says today, which is what an untouched field shows. */
  value: TextDraft
}) {
  const { infoschematicFamilies, infoschematicScopes } = useInfoschematic()
  const shown = (field: TextField) => draft?.[field] ?? value[field] ?? ''

  return (
    <div className="text-controls">
      {/*
       * The code, because that is what identifies this thing to a reader. The
       * registry also carries a `satcom-to-player` sort of identifier, which is
       * how one entry refers to another in the file - but it is not what the
       * Infoschematic shows, not what a change-set line is keyed by, and not what
       * anyone says out loud. ADR-IBC2026-003 named the codes the authored
       * identity, and this is the panel agreeing with it.
       *
       * Read rather than typed. Every draft in the editor is keyed by code, so
       * changing one here would have to re-key each of them at once, and a
       * half-renamed set of drafts is a worse thing to own than a rename done
       * in the file.
       */}
      <div className="text-row">
        <span>ID</span>
        <output>{code}</output>
      </div>

      {isFlow ? (
        <label className="text-row">
          <span>Family</span>
          <select onChange={(event) => onChange('family', event.target.value)} value={shown('family')}>
            {infoschematicFamilies.map((family) => (
              <option key={family.id} value={family.id}>
                {family.prefix} · {family.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <>
          <label className="text-row">
            <span>Name</span>
            <input onChange={(event) => onChange('name', event.target.value)} type="text" value={shown('name')} />
          </label>
          <label className="text-row">
            <span>Detail</span>
            <input onChange={(event) => onChange('detail', event.target.value)} type="text" value={shown('detail')} />
          </label>
          <label className="text-row">
            <span>Scope</span>
            <select onChange={(event) => onChange('group', event.target.value)} value={shown('group')}>
              {infoschematicScopes.map((scope) => (
                <option key={scope.id} value={scope.id}>
                  {scope.prefix} · {scope.label}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </div>
  )
}
