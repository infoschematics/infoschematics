import { DocumentPage } from './DocumentPage.tsx'
import { OverviewAnatomy } from './OverviewAnatomy.tsx'
import type { DocumentationRoute } from './routes.ts'

export function OverviewPage({ route }: { route: DocumentationRoute }) {
  return (
    <DocumentPage
      anatomy={<OverviewAnatomy />}
      route={route}
      supplementalOutline={[{ depth: 2, slug: 'labelled-example', label: 'A labelled Infoschematic' }]}
    />
  )
}
