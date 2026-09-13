import { homepageInfoschematic } from '@infoschematics/is-infoschematics'
import { type InlineSvgAction, InlineSvgReference } from './InlineSvgReference.tsx'

type HomepageGuideAction = InlineSvgAction & Readonly<{ href: string }>

export const homepageGuideActions = [
  { href: '/docs/visual-guide/#anatomy', id: 'STR-01', kind: 'card', label: 'Structure — visual guide' },
  { href: '/docs/authoring/#add-presentation-material', id: 'PRS-02', kind: 'card', label: 'Presentation — authoring' },
  { href: '/docs/', id: 'INFO-03', kind: 'card', label: 'Infoschematic — getting started' },
  { href: '/docs/static-rendering/', id: 'OUT-04', kind: 'card', label: 'Rendered — static rendering' },
  { href: '/docs/present/', id: 'OUT-05', kind: 'card', label: 'Presented — present view' }
] as const satisfies readonly HomepageGuideAction[]

export function HomepageGuideDiagram() {
  const handleActivate = (action: InlineSvgAction) => {
    const destination = homepageGuideActions.find(
      (candidate) => candidate.id === action.id && candidate.kind === action.kind
    )

    if (destination && typeof window !== 'undefined') {
      window.location.assign(destination.href)
    }
  }

  return (
    <InlineSvgReference
      actions={homepageGuideActions}
      input={homepageInfoschematic}
      onActivate={handleActivate}
      options={{ annotations: true }}
      resourceIdPrefix="homepage"
    />
  )
}
