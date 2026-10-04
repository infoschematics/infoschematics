/**
 * One control, shared by every surface this repository hosts.
 *
 * Three choices rather than a toggle, because there are three answers a reader can give and a toggle offers two of
 * them: a ground, the other ground, and declining to pick — following the machine as it goes dark at dusk. A switch
 * that only ever stored a ground left a reader no way back to the third once they had pressed it.
 *
 * The choices are labelled without a noun — light, dark, system — and the group carries the name. Its icons are drawn
 * here rather than taken from an icon set, because Studio has an icon dependency and the website deliberately does
 * not: a shared control that needed `lucide-react` would be a control the site could not use without acquiring one.
 *
 * The name still says button; the internal naming sweep is `INFOSCHEMATICS-TOOL-143`.
 */
import { type ColourSchemeChoice, useColourScheme } from './colour-scheme.ts'

const choices: readonly ColourSchemeChoice[] = ['light', 'dark', 'system']

const choiceLabel: Readonly<Record<ColourSchemeChoice, string>> = { dark: 'Dark', light: 'Light', system: 'System' }

/* A sun, a crescent, and a disc half in each. Stroked, so each inherits `currentColor` like the icons beside it. */
function SchemeMark({ choice }: { choice: ColourSchemeChoice }) {
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
      {choice === 'light' ? (
        <>
          <circle cx="8" cy="8" r="3.1" />
          <path d="M8 1.4v1.6M8 13v1.6M1.4 8h1.6M13 8h1.6M3.3 3.3l1.1 1.1M11.6 11.6l1.1 1.1M12.7 3.3l-1.1 1.1M4.4 11.6l-1.1 1.1" />
        </>
      ) : choice === 'dark' ? (
        <path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z" />
      ) : (
        <>
          <circle cx="8" cy="8" r="5.6" />
          <path d="M8 2.4a5.6 5.6 0 0 1 0 11.2Z" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  )
}

/**
 * A reader's colour-scheme control: light, dark, or system.
 *
 * `className` is the host's and goes on each choice, because the choices have to sit inside whichever bank of
 * controls already exists around them; the behaviour, the names and the pressed state are not the host's to get
 * wrong. A host showing one document that locks its mode does not mount this at all — a control a reader can press
 * that changes nothing is worse than no control.
 */
export function ColourSchemeButton({ className = 'icon-button' }: { className?: string }) {
  const { choice, choose } = useColourScheme()

  return (
    <fieldset aria-label="Colour scheme" className="colour-scheme-control">
      {choices.map((option) => (
        <button
          aria-label={choiceLabel[option]}
          aria-pressed={choice === option}
          className={`${className} colour-scheme-button`}
          data-colour-scheme-choice={option}
          key={option}
          onClick={() => choose(option)}
          title={choiceLabel[option]}
          type="button"
        >
          <SchemeMark choice={option} />
        </button>
      ))}
    </fieldset>
  )
}
