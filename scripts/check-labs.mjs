#!/usr/bin/env node
/**
 * Content integrity check for the whole portal.
 *
 * Fails when:
 *  - a catalog lab is not rendered exactly once on its unit page
 *  - a page renders an unknown or duplicated lab id
 *  - a unit page is missing, or has no/multiple topic trackers
 *  - a topic tracker id does not match the unit
 *  - an authored note references an unknown lab
 *  - a lab URL is not an https PortSwigger web-security URL
 *  - the manifest and the generated catalog disagree on lab count
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, join, basename } from 'node:path'
import { modules, topics, labs, studyUnits } from '../.vitepress/theme/labs.js'

const root = process.cwd()
const errors = []
const warnings = []

const pages = new Map()
for (const unit of studyUnits) {
  const file = resolve(root, unit.file)
  if (!existsSync(file)) {
    errors.push(`Missing page for ${unit.id}: ${unit.file}`)
    continue
  }
  pages.set(unit.id, { file: unit.file, text: readFileSync(file, 'utf8') })
}

const renderedBy = new Map()

// 1. Labs rendered through <LabGroup ids="..."/>
for (const [unitId, page] of pages) {
  for (const match of page.text.matchAll(/<LabGroup\s+ids="([^"]+)"\s*\/>/g)) {
    for (const id of match[1].split(/[,\s]+/).filter(Boolean)) {
      if (!renderedBy.has(id)) renderedBy.set(id, [])
      renderedBy.get(id).push(unitId)
      if (!labs.some((lab) => lab.id === id)) errors.push(`Unknown lab id "${id}" in ${page.file}`)
    }
  }
}

// 2. SQLi labs rendered with <LabCheckbox lab-id="..."/>
for (const module of modules) {
  const page = pages.get(module.id)
  if (!page) continue
  for (const match of page.text.matchAll(/lab-id="([^"]+)"/g)) {
    const id = match[1]
    if (!renderedBy.has(id)) renderedBy.set(id, [])
    renderedBy.get(id).push(module.id)
    if (!labs.some((lab) => lab.id === id)) errors.push(`Unknown lab id "${id}" in ${page.file}`)
    if (!page.text.includes(`{#${id}}`)) errors.push(`Lab ${id} has no anchor {#${id}} in ${page.file}`)
  }
}

for (const lab of labs) {
  const where = renderedBy.get(lab.id) || []
  if (where.length === 0) errors.push(`Lab ${lab.id} (${lab.unit}) is not rendered anywhere`)
  if (where.length > 1) errors.push(`Lab ${lab.id} is rendered ${where.length} times: ${where.join(', ')}`)
  if (lab.unit !== 'sql-injection' && where.length === 1) {
    const expected = studyUnits.find((unit) => unit.id === lab.unit)
    if (expected && where[0] !== expected.id) {
      errors.push(`Lab ${lab.id} belongs to ${expected.id} but is rendered on ${where[0]}`)
    }
  }
  if (!lab.url.startsWith('https://portswigger.net/web-security/')) {
    errors.push(`Lab ${lab.id} has an unexpected URL: ${lab.url}`)
  }
  if (!lab.title || !lab.difficulty) errors.push(`Lab ${lab.id} is missing title or difficulty`)
}

// 3. Exactly one tracker per page, matching the unit id.
for (const unit of studyUnits) {
  const page = pages.get(unit.id)
  if (!page) continue
  const ids = [...page.text.matchAll(/topic-id="([^"]+)"/g)].map((m) => m[1])
  if (ids.length !== 1) errors.push(`Expected exactly one topic tracker in ${page.file}, found ${ids.length}`)
  for (const id of ids) {
    if (id !== unit.id) errors.push(`Tracker "${id}" in ${page.file} does not match unit "${unit.id}"`)
  }
  if (!modules.some((module) => module.id === unit.id)) {
    const groupIds = [...page.text.matchAll(/<LabGroup\s+ids="([^"]+)"/g)].flatMap((m) => m[1].split(/[,\s]+/).filter(Boolean))
    const expected = labs.filter((lab) => lab.unit === unit.id).map((lab) => lab.id)
    for (const id of expected) {
      if (!groupIds.includes(id)) errors.push(`Lab ${id} is missing from <LabGroup> on ${page.file}`)
    }
  }
}

// 4. Authored content must reference real labs and must not be duplicated.
const contentDir = resolve(root, '.vitepress/theme/data/content')
const labIds = new Set(labs.map((lab) => lab.id))
const seenContent = new Map()
for (const file of readdirSync(contentDir).filter((f) => f.endsWith('.js') && f !== 'index.js')) {
  const mod = await import(join(contentDir, file))
  const entries = mod.default || {}
  let withWork = 0
  for (const [id, value] of Object.entries(entries)) {
    if (!labIds.has(id)) errors.push(`Authored content for unknown lab ${id} in content/${file}`)
    if (seenContent.has(id)) errors.push(`Duplicate authored content for ${id} (${seenContent.get(id)} and ${file})`)
    seenContent.set(id, file)
    if (value && value.work) {
      withWork++
      const w = value.work
      if (!Array.isArray(w.hints) || w.hints.length !== 3) errors.push(`Worked example ${id} must have exactly 3 hints`)
      if (!w.request || !w.script) errors.push(`Worked example ${id} is missing request or script`)
      if (!Array.isArray(w.tokens) || w.tokens.length < 3) errors.push(`Worked example ${id} needs at least 3 token rows`)
    }
  }
}

// 5. Catalog and manifest must agree.
const catalogTotal = studyUnits.reduce((n, unit) => n + labs.filter((lab) => lab.unit === unit.id).length, 0)
if (catalogTotal !== labs.length) errors.push(`Unit totals (${catalogTotal}) do not match lab count (${labs.length})`)
if (labs.length !== 272) errors.push(`Expected 272 Academy labs, registry has ${labs.length}`)
if (studyUnits.length !== 35) errors.push(`Expected 35 study units, registry has ${studyUnits.length}`)
if (!topics.length) errors.push('No topic pages registered')

for (const warning of warnings) console.warn(`⚠ ${warning}`)
if (errors.length) {
  for (const error of errors) console.error(`✗ ${error}`)
  console.error(`\n${errors.length} content integrity error(s).`)
  process.exit(1)
}
console.log(
  `✓ ${labs.length} labs across ${studyUnits.length} units; ${seenContent.size} authored records across ` +
    `${new Set(seenContent.values()).size} files; every lab rendered exactly once.`
)
