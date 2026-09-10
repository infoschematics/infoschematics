import type { InterfaceConfig } from './interface.ts'

export type SpecificationGroupConfig = {
  id: string
  label: string
  note: string
  owner: string
  hasDocument: boolean
  /** Full paths of the Specifications directly in this group. */
  specifications?: readonly InterfaceConfig['id'][]
}
