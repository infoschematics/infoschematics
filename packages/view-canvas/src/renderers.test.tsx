import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import type { FabricRendererProps, RendererProperties } from './renderers.tsx'
import {
  defineInfoschematicRenderers,
  InfoschematicRenderersContext,
  resolveInfoschematicRenderer,
  useInfoschematicRenderers,
} from './renderers.tsx'

const acceptsProperties = (properties: RendererProperties | undefined) => ({
  valid: true as const,
  properties: properties ?? {},
})

const FirstFabric = ({ properties }: FabricRendererProps & { properties: RendererProperties }) => (
  <text data-renderer={properties.label}>first</text>
)

const SecondFabric = () => <text>second</text>

describe('renderer registry', () => {
  it('preserves literal definitions and property inference', () => {
    const registry = defineInfoschematicRenderers({
      fabrics: [
        {
          key: 'typed-fabric',
          schemaVersion: 1,
          validateProperties: (properties: RendererProperties | undefined) =>
            typeof properties?.label === 'string'
              ? { valid: true as const, properties: { label: properties.label } }
              : { valid: false as const, reason: 'label is required' },
          component: ({ properties }: FabricRendererProps & { properties: Readonly<{ label: string }> }) => (
            <text>{properties.label}</text>
          ),
        },
      ],
    })

    expectTypeOf(registry.fabrics[0].key).toEqualTypeOf<'typed-fabric'>()
    expect(Object.isFrozen(registry)).toBe(true)
    expect(Object.isFrozen(registry.fabrics)).toBe(true)
    expect(Object.isFrozen(registry.fabrics[0])).toBe(true)
  })

  it('snapshots inputs, reports duplicate keys and resolves the first definition', () => {
    const onDiagnostic = vi.fn()
    const definitions = [
      {
        key: 'same',
        schemaVersion: 1,
        validateProperties: acceptsProperties,
        component: FirstFabric,
      },
      {
        key: 'same',
        schemaVersion: 1,
        validateProperties: acceptsProperties,
        component: SecondFabric,
      },
    ]
    const registry = defineInfoschematicRenderers({ fabrics: definitions, onDiagnostic })

    definitions[0] = { ...definitions[0], key: 'changed' }

    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'duplicate-key', key: 'same', kind: 'fabric' }),
    )
    expect(resolveInfoschematicRenderer(registry, 'fabric', 'same', { label: 'kept' })?.Component).toBe(FirstFabric)
  })

  it('reports unknown keys, unsupported versions and invalid or throwing validators', () => {
    const onDiagnostic = vi.fn()
    const registry = defineInfoschematicRenderers({
      fabrics: [
        {
          key: 'future',
          schemaVersion: 2,
          validateProperties: acceptsProperties,
          component: FirstFabric,
        },
        {
          key: 'invalid',
          schemaVersion: 1,
          validateProperties: () => ({ valid: false as const, reason: 'expected label' }),
          component: FirstFabric,
        },
        {
          key: 'throws',
          schemaVersion: 1,
          validateProperties: () => {
            throw new Error('bad validator')
          },
          component: FirstFabric,
        },
      ],
      onDiagnostic,
    })

    expect(resolveInfoschematicRenderer(registry, 'fabric', 'missing', undefined, 'fabric-1')).toBeUndefined()
    expect(resolveInfoschematicRenderer(registry, 'fabric', 'future', undefined, 'fabric-2')).toBeUndefined()
    expect(resolveInfoschematicRenderer(registry, 'fabric', 'invalid', {}, 'fabric-3')).toBeUndefined()
    expect(resolveInfoschematicRenderer(registry, 'fabric', 'throws', {}, 'fabric-4')).toBeUndefined()

    expect(onDiagnostic.mock.calls.map(([diagnostic]) => diagnostic.code)).toEqual([
      'unknown-key',
      'unsupported-version',
      'invalid-properties',
      'invalid-properties',
    ])
    expect(onDiagnostic).toHaveBeenLastCalledWith(expect.objectContaining({ artefactId: 'fabric-4' }))
  })

  it('retains definitions and scope icons through context during server rendering', () => {
    const Definitions = () => <linearGradient id="definition" />
    const ScopeIcon = () => <path data-icon="scope" />
    const Consumer = () => {
      const renderers = useInfoschematicRenderers()
      const HostDefinitions = renderers.definitions
      const HostIcon = renderers.scopeIcons?.scope
      return (
        <svg>
          {HostDefinitions ? <HostDefinitions /> : null}
          {HostIcon ? <HostIcon aria-hidden={true} size={12} /> : null}
        </svg>
      )
    }
    const registry = defineInfoschematicRenderers({ definitions: Definitions, scopeIcons: { scope: ScopeIcon } })

    const markup = renderToStaticMarkup(
      <InfoschematicRenderersContext value={registry}>
        <Consumer />
      </InfoschematicRenderersContext>,
    )

    expect(markup).toContain('id="definition"')
    expect(markup).toContain('data-icon="scope"')
  })
})
