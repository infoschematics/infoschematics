import { type ReactNode, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { canonicalSiteLocation, getDocumentationRoute, isPlaygroundPath, isVisualGuidePath } from './routes.ts'

async function resolvePage(pathname: string): Promise<ReactNode> {
  const documentationRoute = getDocumentationRoute(pathname)

  if (documentationRoute) {
    const { DocumentPage } = await import('./DocumentPage.tsx')
    document.title = `${documentationRoute.title} · Infoschematics`
    return <DocumentPage route={documentationRoute} />
  }

  if (isVisualGuidePath(pathname)) {
    const { VisualGuide } = await import('./VisualGuide.tsx')
    document.title = 'Visual guide · Infoschematics'
    return <VisualGuide />
  }

  if (isPlaygroundPath(pathname)) {
    const { Playground } = await import('./Playground.tsx')
    document.title = 'Playground · Infoschematics'
    return <Playground />
  }

  const { App } = await import('./App.tsx')
  return <App />
}
const rootElement = document.getElementById('root')

if (rootElement) {
  const canonicalLocation = canonicalSiteLocation(window.location.pathname, window.location.search)
  if (canonicalLocation.pathname !== window.location.pathname || canonicalLocation.search !== window.location.search) {
    window.history.replaceState(
      null,
      '',
      `${canonicalLocation.pathname}${canonicalLocation.search}${window.location.hash}`
    )
  }
  const page = await resolvePage(canonicalLocation.pathname)
  createRoot(rootElement).render(<StrictMode>{page}</StrictMode>)
}
