import { blankInfoschematic } from '@infoschematics/example-blank'
import { App as InfoschematicApp } from '@infoschematics/react'
import '@infoschematics/react/styles.css'
import { useEffect } from 'react'

export function BlankInfoschematic() {
  useEffect(() => {
    document.title = blankInfoschematic.title
  }, [])

  return <InfoschematicApp config={blankInfoschematic} />
}
