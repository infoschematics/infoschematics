/**
 * One switch, shared by every surface this repository hosts.
 *
 * Its icon is drawn here rather than taken from an icon set, because Studio has an icon dependency and the website
 * deliberately does not: a shared control that needed `lucide-react` would be a control the site could not use
 * without acquiring one. The mark is the scheme being moved to, so the button shows where it goes rather than where
 * it is, and `aria-pressed` carries the state a glyph cannot.
 */
import { type ColourScheme, otherColourScheme, useColourScheme } from './colour-scheme.ts'

const schemeLabel: Readonly<Record<ColourScheme, string>> = { dark: 'dark', light: 'light' }

/* A sun for light, a crescent for dark. Stroked, so it inherits `currentColor` like the icons beside it. */
function SchemeMark({ scheme }: { scheme: ColourScheme }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={14}
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={1.6}
      viewBox="0 0 16 16"
      width={14}
    >
      {scheme === 'light' ? (
        <>
          <circle cx="8" cy="8" r="3.1" />
          <path d="M8 1.4v1.6M8 13v1.6M1.4 8h1.6M13 8h1.6M3.3 3.3l1.1 1.1M11.6 11.6l1.1 1.1M12.7 3.3l-1.1 1.1M4.4 11.6l-1.1 1.1" />
        </>
      ) : (
        <path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z" />
      )}
    </svg>
  )
}

/**
 * A reader's colour-scheme switch.
 *
 * `className` is the host's, because the button has to sit inside whichever bank of controls already exists around
 * it; the behaviour, the name and the state are not the host's to get wrong.
 */
export function ColourSchemeButton({ className = 'icon-button' }: { className?: string }) {
  const [scheme, choose] = useColourScheme()
  const next = otherColourScheme(scheme)

  return (
    <button
      aria-label={`Switch to the ${schemeLabel[next]} colour scheme`}
      aria-pressed={scheme === 'dark'}
      className={`${className} colour-scheme-button`}
      onClick={() => choose(next)}
      title={`Switch to the ${schemeLabel[next]} colour scheme`}
      type="button"
    >
      <SchemeMark scheme={next} />
    </button>
  )
}
