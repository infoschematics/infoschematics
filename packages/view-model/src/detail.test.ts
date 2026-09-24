import { describe, expect, it } from 'vitest'
import type { ResolvedCardTreatment } from './appearance.ts'
import {
  type DetailBand,
  detailBandAnnouncement,
  detailBandFloors,
  detailBandRank,
  detailBandReveals,
  detailBands,
  resolveDetailBand,
  resolveDetailTreatment
} from './detail.ts'

const asked: ResolvedCardTreatment = { compact: false, description: true, identity: true, stereotype: true }

describe('detail bands', () => {
  it('orders the bands from least revealed to most', () => {
    expect([...detailBands]).toEqual(['minimal', 'outline', 'identified', 'full'])
    expect(detailBands.map(detailBandRank)).toEqual([0, 1, 2, 3])
  })

  it('resolves each threshold at the floor and below it', () => {
    /* Every threshold, from both sides, as the record requires: a band that applies at its floor but not a hair
       below it is the whole contract, and an inclusive comparison written exclusive reads identically. */
    for (const band of detailBands) {
      const floor = detailBandFloors[band]
      expect(resolveDetailBand(floor), `${band} applies at its own floor`).toBe(band)
    }

    expect(resolveDetailBand(0.8)).toBe('full')
    expect(resolveDetailBand(0.799_99)).toBe('identified')
    expect(resolveDetailBand(0.6)).toBe('identified')
    expect(resolveDetailBand(0.599_99)).toBe('outline')
    expect(resolveDetailBand(0.4)).toBe('outline')
    expect(resolveDetailBand(0.399_99)).toBe('minimal')
  })

  it('reads a magnified scale as the most revealed band', () => {
    expect(resolveDetailBand(1)).toBe('full')
    expect(resolveDetailBand(8)).toBe('full')
  })

  it('calls a scale that is not a positive number minimal rather than guessing', () => {
    for (const scale of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(resolveDetailBand(scale), `${scale} is not a rendered scale`).toBe('minimal')
    }
  })

  it('withholds rows band by band and never adds one', () => {
    expect(resolveDetailTreatment('minimal', asked)).toEqual({
      compact: false,
      description: false,
      identity: false,
      stereotype: false
    })
    expect(resolveDetailTreatment('outline', asked)).toEqual({
      compact: false,
      description: false,
      identity: false,
      stereotype: true
    })
    expect(resolveDetailTreatment('identified', asked)).toEqual({
      compact: false,
      description: false,
      identity: true,
      stereotype: true
    })
    expect(resolveDetailTreatment('full', asked)).toEqual(asked)
  })

  it('leaves a row the caller withheld withheld at every band', () => {
    const withheld: ResolvedCardTreatment = { compact: true, description: false, identity: false, stereotype: false }
    for (const band of detailBands) {
      expect(resolveDetailTreatment(band, withheld), `${band} restored a row nobody asked for`).toEqual(withheld)
    }
  })

  it('passes compactness through untouched, because it discloses nothing', () => {
    for (const band of detailBands) {
      expect(resolveDetailTreatment(band, { ...asked, compact: true }).compact).toBe(true)
    }
  })

  it('tells a reader what is shown and that the document has not changed', () => {
    for (const band of detailBands) {
      const announcement = detailBandAnnouncement(band)
      expect(announcement).toContain(detailBandReveals[band])
      expect(announcement).toContain('The document has not changed.')
    }
    expect(new Set(detailBands.map((band: DetailBand) => detailBandAnnouncement(band))).size).toBe(detailBands.length)
  })
})
