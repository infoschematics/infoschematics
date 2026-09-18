import { type ReactNode, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { getComponentRoute, getDocumentationRoute, isDocsIndexPath, isPlaygroundPath } from './routes.ts'

async function resolvePage(pathname: string): Promise<ReactNode> {
  const documentationRoute = getDocumentationRoute(pathname)

  if (documentationRoute) {
    if (isDocsIndexPath(pathname)) {
      const { OverviewPage } = await import('./OverviewPage.tsx')
      document.title = `${documentationRoute.title} · Infoschematics`
      return <OverviewPage route={documentationRoute} />
    }
    const { DocumentPage } = await import('./DocumentPage.tsx')
    document.title = `${documentationRoute.title} · Infoschematics`
    return <DocumentPage route={documentationRoute} />
  }

  const componentRoute = getComponentRoute(pathname)
  if (componentRoute) {
    const { VisualGuide } = await import('./VisualGuide.tsx')
    document.title = `${componentRoute.title} · Infoschematics`
    return <VisualGuide route={componentRoute} />
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
  const page = await resolvePage(window.location.pathname)
  createRoot(rootElement).render(<StrictMode>{page}</StrictMode>)
}
