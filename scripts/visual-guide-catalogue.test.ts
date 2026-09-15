import { describe, expect, it } from 'vitest'
import { guideAppearanceOptions } from '../apps/site/src/visual-guide/curriculum.ts'
import { appearanceOptions } from '../packages/domain-model/src/option-catalogue.ts'

describe('visual guide appearance catalogue projection', () => {
  it('matches every canonical option, control shape, value, and range', () => {
    const projected = Object.fromEntries(
      Object.entries(appearanceOptions).map(([key, descriptor]) => [
        key,
        {
          control: descriptor.control,
          ...(descriptor.range ? { range: descriptor.range } : {}),
          values: descriptor.values
        }
      ])
    )

    expect(guideAppearanceOptions).toEqual(projected)
  })
})
