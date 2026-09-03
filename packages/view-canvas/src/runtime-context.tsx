import { createContext, useContext } from 'react'
import type { InfoschematicRuntime } from '@infoschematics/view-model/runtime'

export const InfoschematicContext = createContext<InfoschematicRuntime | null>(null)

export const useInfoschematic = () => {
  const runtime = useContext(InfoschematicContext)
  if (!runtime) throw new Error('Infoschematic components must be rendered within Canvas')
  return runtime
}
