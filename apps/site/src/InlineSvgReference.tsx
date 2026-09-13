import { type RenderInfoschematicSvgOptions, renderInfoschematicSvg } from '@infoschematics/render-svg'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export const inlineSvgArtefactKinds = ['region', 'fabric', 'flow', 'card', 'point', 'overlay'] as const

export type InlineSvgArtefactKind = (typeof inlineSvgArtefactKinds)[number]

export type InlineSvgArtefact = Readonly<{
  id: string
  kind: InlineSvgArtefactKind
}>

export type InlineSvgAction = InlineSvgArtefact &
  Readonly<{
    label: string
  }>

type InlineSvgInteractionHandlers = Readonly<{
  onActivate: (artefact: InlineSvgArtefact) => void
  onHover: (artefact: InlineSvgArtefact | null) => void
}>

const artefactSelector = '[data-artefact-id][data-artefact-kind]'
const artefactKindSet = new Set<string>(inlineSvgArtefactKinds)

const isElementTarget = (target: EventTarget | null): target is Element =>
  Boolean(target && typeof (target as Element).closest === 'function')

/**
 * Resolve only a renderer-owned outer artefact group in this host's direct SVG.
 * No child markup, CSS class, native id, or document-wide query is part of the contract.
 */
export function resolveInlineSvgArtefact(target: EventTarget | null, host: HTMLElement): InlineSvgArtefact | null {
  if (!isElementTarget(target)) return null

  const candidate = target.closest(artefactSelector)
  const mountedSvg = host.querySelector(':scope > svg')
  if (!candidate || !mountedSvg || !host.contains(candidate) || candidate.closest('svg') !== mountedSvg) {
    return null
  }

  const id = candidate.getAttribute('data-artefact-id')
  const kind = candidate.getAttribute('data-artefact-kind')
  return id && kind && artefactKindSet.has(kind) ? { id, kind: kind as InlineSvgArtefactKind } : null
}

/**
 * Bind one inline renderer result. Call the returned teardown before replacing
 * the markup or discarding the host.
 */
export function mountInlineSvgInteractions(host: HTMLElement, handlers: InlineSvgInteractionHandlers): () => void {
  const handlePointerOver = (event: Event) => {
    handlers.onHover(resolveInlineSvgArtefact(event.target, host))
  }
  const handlePointerLeave = () => handlers.onHover(null)
  const handleClick = (event: Event) => {
    const artefact = resolveInlineSvgArtefact(event.target, host)
    if (artefact) handlers.onActivate(artefact)
  }

  host.addEventListener('pointerover', handlePointerOver)
  host.addEventListener('pointerleave', handlePointerLeave)
  host.addEventListener('click', handleClick)

  return () => {
    host.removeEventListener('pointerover', handlePointerOver)
    host.removeEventListener('pointerleave', handlePointerLeave)
    host.removeEventListener('click', handleClick)
  }
}

export type InlineSvgReferenceProps = Readonly<{
  actions?: readonly InlineSvgAction[]
  input: Parameters<typeof renderInfoschematicSvg>[0]
  onActivate?: (action: InlineSvgAction) => void
  options?: Omit<RenderInfoschematicSvgOptions, 'resourceIdPrefix'>
  resourceIdPrefix: string
}>

const sameArtefact = (left: InlineSvgArtefact, right: InlineSvgArtefact) =>
  left.id === right.id && left.kind === right.kind

const noActions: readonly InlineSvgAction[] = []

/**
 * Site-owned reference host for inspectable static output. The authored input
 * remains inert; this host owns transient interaction state and action policy.
 */
export function InlineSvgReference({
  actions = noActions,
  input,
  onActivate,
  options,
  resourceIdPrefix
}: InlineSvgReferenceProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<InlineSvgArtefact | null>(null)
  const [selected, setSelected] = useState<InlineSvgArtefact | null>(null)
  const svg = useMemo(
    () => renderInfoschematicSvg(input, { ...options, resourceIdPrefix }),
    [input, options, resourceIdPrefix]
  )

  const activate = useCallback(
    (artefact: InlineSvgArtefact) => {
      const action = actions.find((candidate) => sameArtefact(candidate, artefact))
      if (!action) return
      setSelected(action)
      onActivate?.(action)
    },
    [actions, onActivate]
  )

  useEffect(() => {
    const host = hostRef.current
    setHovered(null)
    setSelected(null)
    if (!host || !svg.startsWith('<svg')) return
    return mountInlineSvgInteractions(host, { onActivate: activate, onHover: setHovered })
  }, [activate, svg])

  const inspected = hovered ?? selected

  return (
    <section aria-label="Inline Infoschematic reference">
      <div
        className="inline-svg-reference__diagram"
        // This markup is produced locally by renderInfoschematicSvg, which XML-escapes
        // authored values and emits no script or inline event attributes.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: this accepts only local renderer output, never arbitrary HTML
        dangerouslySetInnerHTML={{ __html: svg }}
        ref={hostRef}
      />
      {actions.length > 0 ? (
        <div className="inline-svg-reference__actions">
          {actions.map((action) => (
            <button key={`${action.kind}:${action.id}`} onClick={() => activate(action)} type="button">
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
      <p aria-live="polite" className="inline-svg-reference__status" role="status">
        {inspected ? `${inspected.kind} ${inspected.id}` : 'Hover an artefact or use an action to inspect the diagram.'}
      </p>
    </section>
  )
}
