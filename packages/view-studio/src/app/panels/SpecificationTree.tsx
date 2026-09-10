import type { InterfaceConfig } from '@infoschematics/domain-model/interface'
import type { InfoschematicRuntime } from '@infoschematics/view-model/runtime'
import { type CSSProperties, useState } from 'react'

type SpecificationSection = InfoschematicRuntime['infoschematicSpecificationSections'][number]

const uniqueSorted = (values: readonly string[]) =>
  [...new Set(values)].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))

const descendantNodes = (entry: InterfaceConfig, within: readonly InterfaceConfig[]) =>
  within.filter((candidate) => candidate.id === entry.id || candidate.id.startsWith(`${entry.id}/`))

const selectionFor = (entry: InterfaceConfig, within: readonly InterfaceConfig[]): InterfaceConfig => {
  const descendants = descendantNodes(entry, within)
  const operations =
    entry.kind === 'operation'
      ? []
      : descendants
          .filter((candidate) => candidate.kind === 'operation')
          .map((candidate) => ({
            description: candidate.description || undefined,
            id: candidate.id,
            label: candidate.label,
            realisedBy: candidate.realisedBy
          }))

  return {
    ...entry,
    operations: operations.length > 0 ? operations : entry.operations,
    realisedBy: uniqueSorted(descendants.flatMap((candidate) => candidate.realisedBy ?? []))
  }
}

const groupSelection = ({ group, within }: SpecificationSection): InterfaceConfig => {
  const operations = within
    .filter((entry) => entry.kind === 'operation')
    .map((entry) => ({
      description: entry.description || undefined,
      id: entry.id,
      label: entry.label,
      realisedBy: entry.realisedBy
    }))
  return {
    description: group.note,
    hasDocument: group.hasDocument,
    id: group.id,
    label: group.label,
    operations: operations.length > 0 ? operations : undefined,
    owner: group.owner,
    prefix: group.id,
    realisedBy: uniqueSorted(within.flatMap((entry) => entry.realisedBy ?? []))
  }
}

export function SpecificationTree({
  onHover,
  onSelect,
  sections,
  selected
}: {
  onHover: (elements: readonly string[] | null) => void
  onSelect: (entry: InterfaceConfig) => void
  sections: readonly SpecificationSection[]
  selected: InterfaceConfig | null
}) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(sections.map(({ group }) => group.id)))
  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const branch = (entry: InterfaceConfig, within: readonly InterfaceConfig[], depth: number) => {
    const children = within.filter((candidate) => candidate.parent === entry.id)
    const chosen = selectionFor(entry, within)
    const open = expanded.has(entry.id)
    return (
      <div className="specification-branch" key={entry.id}>
        <div className="specification-tree-row" style={{ '--specification-depth': depth } as CSSProperties}>
          {children.length > 0 ? (
            <button
              aria-label={`${open ? 'Collapse' : 'Expand'} ${entry.label}`}
              aria-expanded={open}
              className="specification-disclosure"
              onClick={() => toggle(entry.id)}
              type="button"
            >
              {open ? '−' : '+'}
            </button>
          ) : (
            <span className="specification-disclosure-spacer" />
          )}
          <button
            aria-pressed={selected?.id === entry.id}
            className="specification-node"
            onBlur={() => onHover(null)}
            onClick={() => onSelect(chosen)}
            onFocus={() => onHover(chosen.realisedBy ?? [])}
            onPointerEnter={() => onHover(chosen.realisedBy ?? [])}
            onPointerLeave={() => onHover(null)}
            title={entry.description}
            type="button"
          >
            <span>{entry.label}</span>
            <small>{entry.kind}</small>
          </button>
        </div>
        {open && children.length > 0 ? (
          <div className="specification-tree-children">{children.map((child) => branch(child, within, depth + 1))}</div>
        ) : null}
      </div>
    )
  }

  return (
    <nav aria-label="Specification tree" className="specification-tree">
      {sections.map((section) => {
        const { group, within } = section
        const groupEntry = groupSelection(section)
        const open = expanded.has(group.id)
        const roots = within.filter(
          (entry) =>
            entry.parent === group.id || (!entry.parent && entry.kind !== 'interface' && entry.kind !== 'operation')
        )
        return (
          <section className="specification-group" key={group.id}>
            <div className="specification-tree-row" style={{ '--specification-depth': 0 } as CSSProperties}>
              <button
                aria-label={`${open ? 'Collapse' : 'Expand'} ${group.label}`}
                aria-expanded={open}
                className="specification-disclosure"
                onClick={() => toggle(group.id)}
                type="button"
              >
                {open ? '−' : '+'}
              </button>
              <button
                aria-pressed={selected?.id === group.id}
                className="specification-node specification-group-node"
                onBlur={() => onHover(null)}
                onClick={() => onSelect(groupEntry)}
                onFocus={() => onHover(groupEntry.realisedBy ?? [])}
                onPointerEnter={() => onHover(groupEntry.realisedBy ?? [])}
                onPointerLeave={() => onHover(null)}
                title={group.note}
                type="button"
              >
                <span>{group.label}</span>
                <small>{roots.length}</small>
              </button>
            </div>
            {open ? (
              <div className="specification-tree-children">{roots.map((entry) => branch(entry, within, 1))}</div>
            ) : null}
          </section>
        )
      })}
    </nav>
  )
}
