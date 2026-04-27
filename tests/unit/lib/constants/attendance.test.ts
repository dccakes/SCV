/**
 * Tests for attendance likelihood constants
 */

import { DEFAULT_LIKELIHOOD_WEIGHT, LIKELIHOOD_LABELS, LIKELIHOOD_WEIGHTS } from '~/lib/constants'

describe('LIKELIHOOD_WEIGHTS', () => {
  it('should map all 5 scale values to probabilities', () => {
    expect(Object.keys(LIKELIHOOD_WEIGHTS)).toHaveLength(5)
  })

  it('should have correct weights for each scale value', () => {
    expect(LIKELIHOOD_WEIGHTS[1]).toBe(0.15)
    expect(LIKELIHOOD_WEIGHTS[2]).toBe(0.35)
    expect(LIKELIHOOD_WEIGHTS[3]).toBe(0.55)
    expect(LIKELIHOOD_WEIGHTS[4]).toBe(0.8)
    expect(LIKELIHOOD_WEIGHTS[5]).toBe(0.95)
  })

  it('should have weights that increase with scale value', () => {
    for (let i = 1; i < 5; i++) {
      const currentWeight = LIKELIHOOD_WEIGHTS[i]
      const nextWeight = LIKELIHOOD_WEIGHTS[i + 1]

      expect(currentWeight).toBeDefined()
      expect(nextWeight).toBeDefined()

      if (currentWeight === undefined || nextWeight === undefined) {
        throw new Error(`Expected weights for scale values ${i} and ${i + 1}`)
      }

      expect(nextWeight).toBeGreaterThan(currentWeight)
    }
  })

  it('should have all weights between 0 and 1 exclusive', () => {
    for (const weight of Object.values(LIKELIHOOD_WEIGHTS)) {
      expect(weight).toBeGreaterThan(0)
      expect(weight).toBeLessThan(1)
    }
  })
})

describe('DEFAULT_LIKELIHOOD_WEIGHT', () => {
  it('should be 0.65', () => {
    expect(DEFAULT_LIKELIHOOD_WEIGHT).toBe(0.65)
  })

  it('should fall between the Maybe and Likely weights', () => {
    const maybeWeight = LIKELIHOOD_WEIGHTS[3]
    const likelyWeight = LIKELIHOOD_WEIGHTS[4]

    expect(maybeWeight).toBeDefined()
    expect(likelyWeight).toBeDefined()

    if (maybeWeight === undefined || likelyWeight === undefined) {
      throw new Error('Expected Maybe and Likely weights to be defined')
    }

    expect(DEFAULT_LIKELIHOOD_WEIGHT).toBeGreaterThan(maybeWeight)
    expect(DEFAULT_LIKELIHOOD_WEIGHT).toBeLessThan(likelyWeight)
  })
})

describe('LIKELIHOOD_LABELS', () => {
  it('should have 5 labels matching the 5-point scale', () => {
    expect(LIKELIHOOD_LABELS).toHaveLength(5)
  })

  it('should have correct label values in order', () => {
    expect(LIKELIHOOD_LABELS[0]).toBe('Unlikely')
    expect(LIKELIHOOD_LABELS[1]).toBe('Not Sure')
    expect(LIKELIHOOD_LABELS[2]).toBe('Maybe')
    expect(LIKELIHOOD_LABELS[3]).toBe('Likely')
    expect(LIKELIHOOD_LABELS[4]).toBe('Very Likely')
  })
})
