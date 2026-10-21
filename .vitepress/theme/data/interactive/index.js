import part1 from './part1.js'
import part2 from './part2.js'
import part3 from './part3.js'

export const INTERACTIVE_UNITS = {
  ...part1,
  ...part2,
  ...part3
}

export function interactiveFor(unitId) {
  if (!unitId) return null
  return INTERACTIVE_UNITS[unitId] || null
}
