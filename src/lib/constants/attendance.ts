/**
 * Attendance Likelihood Constants
 *
 * Probability weights for estimating event attendance based on
 * household likelihood ratings. Derived from industry wedding
 * attendance data (RSVPify, The Knot, Zola).
 */

/**
 * Maps the 1-5 likelihoodOfAttending scale to attendance probability.
 */
export const LIKELIHOOD_WEIGHTS: Record<number, number> = {
  1: 0.15, // Unlikely — outer circle / destination guests
  2: 0.35, // Not Sure — out-of-town acquaintances
  3: 0.55, // Maybe — casual friends / average out-of-town
  4: 0.8, // Likely — close friends, extended family
  5: 0.95, // Very Likely — immediate family, bridal party
}

/**
 * Weight used when a household has no likelihood set (null).
 */
export const DEFAULT_LIKELIHOOD_WEIGHT = 0.65

/**
 * Display labels for the 1-5 likelihoodOfAttending scale.
 */
export const LIKELIHOOD_LABELS = ['Unlikely', 'Not Sure', 'Maybe', 'Likely', 'Very Likely'] as const
