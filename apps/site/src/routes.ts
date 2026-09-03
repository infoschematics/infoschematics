export const blankExamplePath = '/examples/blank/'
export const infoschematicsExamplePath = '/examples/infoschematics/'
export const systemExamplePath = '/examples/system/'

export const documentationRoutes = [
  {
    key: 'authoring',
    path: '/guides/authoring/',
    title: 'Authoring Infoschematics'
  },
  {
    key: 'react-integration',
    path: '/guides/react-integration/',
    title: 'React integration'
  },
  {
    key: 'vocabulary',
    path: '/reference/vocabulary/',
    title: 'Infoschematics vocabulary'
  }
] as const

export type DocumentationRoute = (typeof documentationRoutes)[number]

export function isBlankExamplePath(pathname: string) {
  return pathname === blankExamplePath || pathname === blankExamplePath.slice(0, -1)
}

export function isInfoschematicsExamplePath(pathname: string) {
  return pathname === infoschematicsExamplePath || pathname === infoschematicsExamplePath.slice(0, -1)
}

export function isSystemExamplePath(pathname: string) {
  return pathname === systemExamplePath || pathname === systemExamplePath.slice(0, -1)
}

export function getDocumentationRoute(pathname: string): DocumentationRoute | undefined {
  return documentationRoutes.find(
    (route) => pathname === route.path || pathname === route.path.slice(0, -1)
  )
}
