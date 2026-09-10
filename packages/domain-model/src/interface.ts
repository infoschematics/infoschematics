export type InterfaceConfig = {
  /** Full canonical identity path. */
  id: string
  /** Local id retained for compact labels and legacy consumers. */
  prefix: string
  owner: string
  hasDocument: boolean
  documents?: readonly { code?: string; href?: string; version?: string }[]
  /** First document projected for established single-document readers. */
  contract?: string
  href?: string
  version?: string
  label: string
  description: string
  kind?: 'specification' | 'interface' | 'operation'
  parent?: string
  realisedBy?: readonly string[]
  operations?: readonly {
    id: string
    label: string
    description?: string
    realisedBy?: readonly string[]
  }[]
}
