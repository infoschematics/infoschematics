import { type AppearanceOptionKey, guideAppearanceOptions, optionLabels } from './curriculum.ts'
import type { AppearanceOptionValue } from './specimens.ts'

type AppearanceControlProps = {
  optionKey: AppearanceOptionKey
  value: AppearanceOptionValue
  onChange: (value: AppearanceOptionValue) => void
}

export function AppearanceControl({ optionKey, value, onChange }: AppearanceControlProps) {
  const descriptor = guideAppearanceOptions[optionKey]
  const inputId = `visual-guide-${optionKey.replaceAll('.', '-')}`

  if (descriptor.control === 'flag') {
    return (
      <label className="visual-guide-control visual-guide-control--flag" htmlFor={inputId}>
        <span>{optionLabels[optionKey]}</span>
        <input
          checked={Boolean(value)}
          id={inputId}
          onChange={(event) => onChange(event.currentTarget.checked)}
          type="checkbox"
        />
      </label>
    )
  }

  if (descriptor.control === 'choice') {
    return (
      <label className="visual-guide-control" htmlFor={inputId}>
        <span>{optionLabels[optionKey]}</span>
        <select id={inputId} onChange={(event) => onChange(event.currentTarget.value)} value={String(value)}>
          {descriptor.values.map((choice) => (
            <option key={choice} value={choice}>
              {choice.replaceAll('-', ' ')}
            </option>
          ))}
        </select>
      </label>
    )
  }

  if (descriptor.control === 'colour') {
    return (
      <label className="visual-guide-control" htmlFor={inputId}>
        <span>{optionLabels[optionKey]}</span>
        <span className="visual-guide-colour-value">
          <input
            id={inputId}
            onChange={(event) => onChange(event.currentTarget.value)}
            type="color"
            value={String(value)}
          />
          <code>{String(value)}</code>
        </span>
      </label>
    )
  }

  return (
    <label className="visual-guide-control" htmlFor={inputId}>
      <span>{optionLabels[optionKey]}</span>
      <span className="visual-guide-number-value">
        <input
          id={inputId}
          max={descriptor.range?.max}
          min={descriptor.range?.min}
          onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
          step={optionKey === 'region.frame.opacity' ? 0.1 : 1}
          type="range"
          value={Number(value)}
        />
        <output htmlFor={inputId}>{Number(value)}</output>
      </span>
    </label>
  )
}
