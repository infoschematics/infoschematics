import { type ReactNode, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { getDocumentationRoute, isBlankExamplePath, isInfoschematicsExamplePath } from './routes.ts'

async function resolvePage(pathname: string): Promise<ReactNode> {
  const documentationRoute = getDocumentationRoute(pathname)

  if (documentationRoute) {
    const { DocumentPage } = await import('./DocumentPage.tsx')
    document.title = `${documentationRoute.title} · Infoschematics`
    return <DocumentPage route={documentationRoute} />
  }

  if (isBlankExamplePath(pathname)) {
    const { BlankInfoschematic } = await import('./BlankInfoschematic.tsx')
    return <BlankInfoschematic />
  }

  if (isInfoschematicsExamplePath(pathname)) {
    const { InfoschematicsExample } = await import('./InfoschematicsExample.tsx')
    return <InfoschematicsExample />
  }

  const { App } = await import('./App.tsx')
  return <App />
}
const rootElement = document.getElementById('root')

if (rootElement) {
  const page = await resolvePage(window.location.pathname)
  createRoot(rootElement).render(<StrictMode>{page}</StrictMode>)
}
