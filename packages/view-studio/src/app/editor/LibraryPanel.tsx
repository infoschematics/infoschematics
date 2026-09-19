import {
  instantiateLibraryTemplate,
  isValidLibraryFlowContext,
  type LibraryContext,
  type LibraryCreateOperation,
  type LibraryTemplate,
  libraryTemplates
} from './library.ts'

export type LibraryPanelProps = Readonly<{
  context: LibraryContext
  onInstantiate: (operation: LibraryCreateOperation) => void
  templates?: readonly LibraryTemplate[]
}>

/** A narrow picker: placement and persistence remain responsibilities of its caller. */
export function LibraryPanel({ context, onInstantiate, templates = libraryTemplates }: LibraryPanelProps) {
  const available = templates.filter(
    (template) => template.seed.kind !== 'flow' || isValidLibraryFlowContext(context.flow)
  )

  return (
    <section aria-label="Library" className="library-panel">
      <p className="eyebrow pane-heading">LIBRARY</p>
      {/* A library entry is not a fifth kind. It is a starting point that produces one of the kinds above, and
          sitting directly beneath those buttons is exactly where that would be misread. */}
      <p className="library-note">Starting points that create one of the elements above.</p>
      <ul className="library-list">
        {available.map((template) => (
          <li key={template.metadata.key}>
            <button
              aria-label={`Add ${template.metadata.label}`}
              className="library-item"
              onClick={() => {
                const operation = instantiateLibraryTemplate(template, context)
                if (operation) onInstantiate(operation)
              }}
              title={template.metadata.description}
              type="button"
            >
              <span>{template.metadata.label}</span>
              <small>{template.metadata.description}</small>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
