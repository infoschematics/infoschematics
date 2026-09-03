import { systemExample } from '@infoschematics/is-system'
import { App as InfoschematicApp } from '@infoschematics/view-studio'
import '@infoschematics/view-studio/styles.css'
import { useEffect } from 'react'

export const systemExampleDocumentTitle = `${systemExample.title} · Infoschematics`

/** Site owns route metadata and mounting; the shared example owns authored content. */
export function SystemExample() {
  useEffect(() => {
    document.title = systemExampleDocumentTitle
  }, [])

  return <InfoschematicApp config={systemExample} />
}
