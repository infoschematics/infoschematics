import { standardArtworkSchemaVersion } from '@infoschematics/view-model/standard-artwork'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import type { FabricRendererProps, RendererProperties } from './renderer-contract.ts'
import {
  defineInfoschematicRenderers,
  InfoschematicRenderersContext,
  resolveInfoschematicRenderer,
  useInfoschematicRenderers
} from './renderers.tsx'
import { standardFabricRenderers, standardGraphicRenderers } from './standard-renderers.tsx'

const acceptsProperties = (properties: RendererProperties | undefined) => ({
  valid: true as const,
  properties: properties ?? {}
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
          )
        }
      ]
    })

    expectTypeOf(registry.fabrics[0].key).toEqualTypeOf<'typed-fabric'>()
    expect(Object.isFrozen(registry)).toBe(true)
    expect(Object.isFrozen(registry.fabrics)).toBe(true)
    expect(Object.isFrozen(registry.fabrics[0])).toBe(true)
  })

  it('snapshots inputs, reports duplicate key-version pairs and resolves the first definition', () => {
    const onDiagnostic = vi.fn()
    const definitions = [
      {
        key: 'same',
        schemaVersion: 1,
        validateProperties: acceptsProperties,
        component: FirstFabric
      },
      {
        key: 'same',
        schemaVersion: 1,
        validateProperties: acceptsProperties,
        component: SecondFabric
      }
    ]
    const registry = defineInfoschematicRenderers({ fabrics: definitions, onDiagnostic })

    definitions[0] = { ...definitions[0], key: 'changed' }

    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'duplicate-key', key: 'same', kind: 'fabric' })
    )
    expect(resolveInfoschematicRenderer(registry, 'fabric', 'same', { label: 'kept' })?.Component).toBe(FirstFabric)
  })

  it('selects the exact authored schema version while scalar references request version one', () => {
    const registry = defineInfoschematicRenderers({
      fabrics: [
        {
          key: 'versioned',
          schemaVersion: 1,
          validateProperties: acceptsProperties,
          component: FirstFabric
        },
        {
          key: 'versioned',
          schemaVersion: 2,
          validateProperties: acceptsProperties,
          component: SecondFabric
        }
      ]
    })

    expect(resolveInfoschematicRenderer(registry, 'fabric', 'versioned', undefined)?.Component).toBe(FirstFabric)
    expect(
      resolveInfoschematicRenderer(registry, 'fabric', { key: 'versioned', version: 2 }, undefined)?.Component
    ).toBe(SecondFabric)
  })

  it('reports unknown keys, unsupported versions and invalid or throwing validators', () => {
    const onDiagnostic = vi.fn()
    const registry = defineInfoschematicRenderers({
      fabrics: [
        {
          key: 'future',
          schemaVersion: 2,
          validateProperties: acceptsProperties,
          component: FirstFabric
        },
        {
          key: 'invalid',
          schemaVersion: 1,
          validateProperties: () => ({ valid: false as const, reason: 'expected label' }),
          component: FirstFabric
        },
        {
          key: 'throws',
          schemaVersion: 1,
          validateProperties: () => {
            throw new Error('bad validator')
          },
          component: FirstFabric
        }
      ],
      onDiagnostic
    })

    expect(resolveInfoschematicRenderer(registry, 'fabric', 'missing', undefined, 'fabric-1')).toBeUndefined()
    expect(resolveInfoschematicRenderer(registry, 'fabric', 'future', undefined, 'fabric-2')).toBeUndefined()
    expect(resolveInfoschematicRenderer(registry, 'fabric', 'invalid', {}, 'fabric-3')).toBeUndefined()
    expect(resolveInfoschematicRenderer(registry, 'fabric', 'throws', {}, 'fabric-4')).toBeUndefined()

    expect(onDiagnostic.mock.calls.map(([diagnostic]) => diagnostic.code)).toEqual([
      'unknown-key',
      'unsupported-version',
      'invalid-properties',
      'invalid-properties'
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
        // biome-ignore lint/a11y/noSvgWithoutTitle: test-only markup asserting server-rendered content, not user-facing
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
      </InfoschematicRenderersContext>
    )

    expect(markup).toContain('id="definition"')
    expect(markup).toContain('data-icon="scope"')
  })

  /*
   * The standard catalogue is offered, not imposed (`EXTEND-008`). A host that registers a treatment under one of
   * its keys must still be the one that draws, or the catalogue would silently take a document's appearance away
   * from the host that was asked for it. The reverse — resolving to the catalogue where a host registered nothing —
   * is what makes the keys standard, and it must arrive without a diagnostic, because nothing is wrong.
   */
  it('lets a host registration win a standard key, and answers the key itself where none is registered', () => {
    const onDiagnostic = vi.fn()
    const registry = defineInfoschematicRenderers({
      fabrics: [
        {
          key: 'message-bus',
          schemaVersion: standardArtworkSchemaVersion,
          validateProperties: acceptsProperties,
          component: FirstFabric
        }
      ],
      onDiagnostic
    })

    expect(resolveInfoschematicRenderer(registry, 'fabric', 'message-bus', {}, 'fabric-1')?.Component).toBe(FirstFabric)
    expect(resolveInfoschematicRenderer(registry, 'fabric', 'object-store', {}, 'fabric-2')?.Component).toBe(
      standardFabricRenderers.find((definition) => definition.key === 'object-store')?.component
    )
    expect(resolveInfoschematicRenderer(registry, 'graphic', 'cycle', {}, 'graphic-1')?.Component).toBe(
      standardGraphicRenderers.find((definition) => definition.key === 'cycle')?.component
    )
    expect(onDiagnostic).not.toHaveBeenCalled()
  })

  /*
   * A standard key at a version the catalogue does not offer is an unsupported version, not an unknown key: the
   * product does know the key, and an author told that it is unknown would go looking for a host registration
   * that was never the problem.
   */
  it('reports a standard key at an unavailable version, and rejects properties the catalogue cannot draw', () => {
    const onDiagnostic = vi.fn()
    const registry = defineInfoschematicRenderers({ onDiagnostic })

    expect(
      resolveInfoschematicRenderer(
        registry,
        'fabric',
        { key: 'object-store', version: standardArtworkSchemaVersion + 1 },
        undefined,
        'fabric-1'
      )
    ).toBeUndefined()
    expect(
      resolveInfoschematicRenderer(registry, 'fabric', 'object-store', { platters: -2 }, 'fabric-2')
    ).toBeUndefined()

    expect(onDiagnostic.mock.calls.map(([diagnostic]) => diagnostic.code)).toEqual([
      'unsupported-version',
      'invalid-properties'
    ])
    expect(onDiagnostic).toHaveBeenLastCalledWith(
      expect.objectContaining({ artefactId: 'fabric-2', key: 'object-store', kind: 'fabric' })
    )
  })
})
