import type { InterfaceConfig } from '@infoschematics/domain-model/interface'
import type { SpecificationGroupConfig } from '@infoschematics/domain-model/specification-group'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { SpecificationTree } from './SpecificationTree.tsx'

const group: SpecificationGroupConfig = {
  hasDocument: true,
  id: 'federation',
  label: 'Federation',
  note: 'Federation specifications.',
  owner: '',
  specifications: ['federation/registry']
}

const within: InterfaceConfig[] = [
  {
    contract: 'API-REGISTRY-001',
    description: 'Registry API.',
    hasDocument: true,
    id: 'federation/registry',
    kind: 'specification',
    label: 'Registry',
    owner: 'federation',
    parent: 'federation',
    prefix: 'registry',
    realisedBy: ['CARD']
  },
  {
    description: 'Discovery interface.',
    hasDocument: true,
    id: 'federation/registry/discovery',
    kind: 'interface',
    label: 'Discovery',
    owner: 'federation',
    parent: 'federation/registry',
    prefix: 'discovery',
    realisedBy: ['FLOW']
  }
]

describe('SpecificationTree', () => {
  it('renders thematic groups with expandable specification branches and no disabled nodes', () => {
    const markup = renderToStaticMarkup(
      <SpecificationTree onHover={vi.fn()} onSelect={vi.fn()} sections={[{ group, within }]} selected={null} />
    )

    expect(markup).toContain('Federation')
    expect(markup).toContain('Registry')
    expect(markup).toContain('aria-label="Expand Registry"')
    expect(markup).not.toContain('disabled')
  })
})
