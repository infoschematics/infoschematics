import { Plus, X } from 'lucide-react'

/*
 * A list of short lines, edited in place.
 *
 * Written for a scene's takeaways and kept general, because a list of short
 * strings is a shape this editor will meet again and the alternative was
 * leaving takeaways to the change set for want of a control.
 *
 * Each line is its own field rather than one field of newline-separated text.
 * The second is quicker to build and wrong: a takeaway is an item, so removing
 * the third one should be a control beside the third one, not a matter of
 * deleting the right run of characters.
 */
export function LineList({
  label,
  lines,
  onChange,
  placeholder
}: {
  label: string
  lines: readonly string[]
  onChange: (next: readonly string[]) => void
  placeholder?: string
}) {
  const replace = (at: number, value: string) => onChange(lines.map((line, index) => (index === at ? value : line)))

  return (
    <div className="line-list">
      <span className="line-list-label">{label}</span>
      <div className="line-list-rows">
        {lines.map((line, index) => (
          /* A line's identity is its position - it has no other - and every
             value in the row comes from props. */
          // biome-ignore lint/suspicious/noArrayIndexKey: position is the identity
          <div className="line-list-row" key={index}>
            <input onChange={(event) => replace(index, event.target.value)} type="text" value={line} />
            <button
              aria-label={`Remove line ${index + 1}`}
              onClick={() => onChange(lines.filter((_, at) => at !== index))}
              type="button"
            >
              <X aria-hidden="true" size={12} />
            </button>
          </div>
        ))}
        <button className="line-list-add" onClick={() => onChange([...lines, ''])} type="button">
          <Plus aria-hidden="true" size={12} /> {placeholder ?? 'Add a line'}
        </button>
      </div>
    </div>
  )
}
