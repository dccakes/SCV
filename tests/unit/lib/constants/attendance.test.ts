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
      expect(LIKELIHOOD_WEIGHTS[i + 1]).toBeGreaterThan(LIKELIHOOD_WEIGHTS[i]!)
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
    expect(DEFAULT_LIKELIHOOD_WEIGHT).toBeGreaterThan(LIKELIHOOD_WEIGHTS[3]!)
    expect(DEFAULT_LIKELIHOOD_WEIGHT).toBeLessThan(LIKELIHOOD_WEIGHTS[4]!)
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
