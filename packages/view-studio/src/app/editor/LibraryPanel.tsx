import {
  instantiateLibraryTemplate,
  isValidLibraryFlowContext,
  libraryTemplates,
  type LibraryContext,
  type LibraryCreateOperation,
  type LibraryTemplate,
} from './library.ts'

export type LibraryPanelProps = Readonly<{
  context: LibraryContext
  onInstantiate: (operation: LibraryCreateOperation) => void
  templates?: readonly LibraryTemplate[]
}>

/** A narrow picker: placement and persistence remain responsibilities of its caller. */
export function LibraryPanel({ context, onInstantiate, templates = libraryTemplates }: LibraryPanelProps) {
  const available = templates.filter(
    (template) => template.seed.kind !== 'flow' || isValidLibraryFlowContext(context.flow),
  )

  return (
    <section aria-label="Library" className="library-panel">
      <h3>Library</h3>
      <ul>
        {available.map((template) => (
          <li key={template.metadata.key}>
            <button
              aria-label={`Add ${template.metadata.label}`}
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
