/**
 * Authored per-lab notes and worked examples, merged into one lookup table.
 * Each module under ./content exports { [labId]: { note?, work? } }.
 * `work` is optional: labs without it render as compact index rows.
 */
const files = import.meta.glob(['./*.js', '!./index.js'], { eager: true })

const merged = {}
const errors = []

for (const [path, mod] of Object.entries(files)) {
  const entries = mod.default || {}
  for (const [id, value] of Object.entries(entries)) {
    if (merged[id]) errors.push(`duplicate content for ${id} (${path})`)
    merged[id] = value
  }
}

if (errors.length && import.meta.env.DEV) console.warn('[websec]', errors)

export const labContent = merged

export function contentFor(id) {
  return merged[id] || null
}
