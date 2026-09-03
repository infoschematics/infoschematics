import { infoschematicsExample } from '@infoschematics/is-infoschematics'
import { App as InfoschematicApp } from '@infoschematics/view-studio'
import '@infoschematics/view-studio/styles.css'
import { useEffect } from 'react'

export const infoschematicsExampleDocumentTitle = `${infoschematicsExample.title} · Infoschematics`

/** Site owns route metadata and mounting; the shared example owns authored content. */
export function InfoschematicsExample() {
  useEffect(() => {
    document.title = infoschematicsExampleDocumentTitle
  }, [])

  return <InfoschematicApp config={infoschematicsExample} />
}
