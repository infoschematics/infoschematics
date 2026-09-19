export type IconName = 'copy' | 'expand' | 'reset'

/* Shared by the frame and the snippet toolbar it mounts, so the two cannot drift into different glyphs. */
export function Icon({ name }: { name: IconName }) {
  const paths = {
    copy: (
      <>
        <rect height="10" rx="1" width="9" x="6" y="6" />
        <path d="M4 4h9v2M4 4v9h2" />
      </>
    ),
    expand: (
      <>
        <path d="M3 8V3h5M3 3l5 5M13 8v5H8M13 13l-5-5" />
      </>
    ),
    reset: (
      <>
        <path d="M3 7a5 5 0 1 1 1 5" />
        <path d="M3 3v4h4" />
      </>
    )
  } as const

  return (
    <svg aria-hidden="true" className="demo-frame__icon" viewBox="0 0 16 16">
      {paths[name]}
    </svg>
  )
}
