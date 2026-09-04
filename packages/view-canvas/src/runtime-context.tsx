import type { InfoschematicRuntime } from '@infoschematics/view-model/runtime'
import { createContext, useContext } from 'react'

export const InfoschematicContext = createContext<InfoschematicRuntime | null>(null)

export const useInfoschematic = () => {
  const runtime = useContext(InfoschematicContext)
  if (!runtime) throw new Error('Infoschematic components must be rendered within Canvas')
  return runtime
}
