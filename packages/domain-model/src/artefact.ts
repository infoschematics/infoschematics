export type ArtefactIdentity = {
  id: string
  code: string
  label: string
  detail: string
  scopes: readonly string[]
  scopeRule?: 'all' | 'any'
  conformsTo?: readonly string[]
  services?: readonly string[]
  /** Whether this element draws its own code permanently, overriding the Diagram's default. */
  identity?: boolean
}
