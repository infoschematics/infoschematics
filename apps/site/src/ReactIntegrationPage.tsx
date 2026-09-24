import { DestinationDemo } from './DestinationDemo.tsx'
import { DocumentPage } from './DocumentPage.tsx'
import type { DocumentationRoute } from './routes.ts'

/** The React integration guide with the addressing mechanism running underneath it, as `OverviewPage` does. */
export function ReactIntegrationPage({ route }: { route: DocumentationRoute }) {
  return (
    <DocumentPage
      anatomy={<DestinationDemo />}
      route={route}
      supplementalOutline={[{ depth: 2, slug: 'try-an-address', label: 'Try an address' }]}
    />
  )
}
