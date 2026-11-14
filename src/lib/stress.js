// Stress rules in one place. A stress score of 4 or 5 (out of 5) is "high" and triggers the red dot and the break card.

export const HIGH_STRESS = 4

export function isHighStress(value) {
  return value != null && value >= HIGH_STRESS
}