import { blankInfoschematic } from '@infoschematics/is-blank'
import { App as InfoschematicApp } from '@infoschematics/view-studio'
import '@infoschematics/view-studio/styles.css'
import { useEffect } from 'react'

export function BlankInfoschematic() {
  useEffect(() => {
    document.title = blankInfoschematic.title
  }, [])

  return <InfoschematicApp config={blankInfoschematic} />
}
