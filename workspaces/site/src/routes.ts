export const blankExamplePath = '/examples/blank/'

export function isBlankExamplePath(pathname: string) {
  return pathname === blankExamplePath || pathname === blankExamplePath.slice(0, -1)
}
