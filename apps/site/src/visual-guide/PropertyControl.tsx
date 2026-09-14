import { type GuidePropertyKey, guideProperties, propertyLabels } from './curriculum.ts'
import type { GuidePropertyValue } from './specimens.ts'

type PropertyControlProps = {
  propertyKey: GuidePropertyKey
  value: GuidePropertyValue
  onChange: (value: GuidePropertyValue) => void
}

export const choiceLabel = (propertyKey: GuidePropertyKey, choice: string) => {
  if (propertyKey === 'canvas.surface' && choice === 'neutral') return 'default (neutral)'
  if (propertyKey === 'canvas.grid') {
    return (
      {
        none: 'No grid',
        major: 'Major lines',
        'major-plus-minor': 'Major + minor lines',
        dots: 'Major dots'
      }[choice] ?? choice
    )
  }
  if (propertyKey === 'card.variant') return `${choice} card`
  return choice.replaceAll('-', ' ')
}

export function PropertyControl({ propertyKey, value, onChange }: PropertyControlProps) {
  const descriptor = guideProperties[propertyKey]
  const inputId = `components-${propertyKey.replaceAll('.', '-')}`

  if (descriptor.control === 'flag') {
    return (
      <label className="visual-guide-control visual-guide-control--flag" htmlFor={inputId}>
        <span>{propertyLabels[propertyKey]}</span>
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
        <span>{propertyLabels[propertyKey]}</span>
        <select id={inputId} onChange={(event) => onChange(event.currentTarget.value)} value={String(value)}>
          {descriptor.values?.map((choice) => (
            <option key={choice} value={choice}>
              {choiceLabel(propertyKey, choice)}
            </option>
          ))}
        </select>
      </label>
    )
  }

  if (descriptor.control === 'colour') {
    return (
      <label className="visual-guide-control" htmlFor={inputId}>
        <span>{propertyLabels[propertyKey]}</span>
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

  if (descriptor.control === 'text') {
    return (
      <label className="visual-guide-control" htmlFor={inputId}>
        <span>{propertyLabels[propertyKey]}</span>
        <input
          id={inputId}
          onChange={(event) => onChange(event.currentTarget.value)}
          type="text"
          value={String(value)}
        />
      </label>
    )
  }

  return (
    <label className="visual-guide-control" htmlFor={inputId}>
      <span>{propertyLabels[propertyKey]}</span>
      <span className="visual-guide-number-value">
        <input
          id={inputId}
          max={descriptor.range?.max}
          min={descriptor.range?.min}
          onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
          step={descriptor.range?.step ?? 1}
          type="range"
          value={Number(value)}
        />
        <output htmlFor={inputId}>{Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 2)}</output>
      </span>
    </label>
  )
}
