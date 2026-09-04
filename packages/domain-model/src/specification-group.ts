import type { InterfaceConfig } from './interface.ts'

export type SpecificationGroupConfig = {
  id: string
  label: string
  note: string
  owner: string
  document: InterfaceConfig['document']
}
