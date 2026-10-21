/**
 * Single source of truth for the whole portal.
 *
 * Two inputs:
 *   data/sql-labs.js — the hand-authored SQL injection manifest (5 modules, 18 labs)
 *   data/catalog.js  — the complete PortSwigger Academy catalog (31 topics, 272 labs)
 *
 * Organized into a 6-Stage Guided Learning Path (35 study units total).
 */
import { modules as sqlModules, labs as sqlLabs } from './data/sql-labs.js'
import catalog from './data/catalog.js'

export const modules = sqlModules.map((m, idx) => ({
  ...m,
  short: `SQLi 0${idx} · ${m.short || m.title}`
}))

export const topics = catalog.topics
  .filter((topic) => topic.id !== 'sql-injection')
  .map((topic) => ({
    id: topic.id,
    title: topic.title,
    short: topic.title,
    phase: topic.phase,
    path: `/${topic.slug}/`,
    slug: topic.slug,
    file: `${topic.slug}/index.md`,
    blurb: topic.blurb,
    labIds: topic.labs.map((lab) => lab.id)
  }))

const topicById = new Map(catalog.topics.map((topic) => [topic.id, topic]))
const rawUnitMap = new Map([...modules, ...topics].map((u) => [u.id, u]))

const STAGE_DEFINITIONS = [
  {
    id: 'stage-1',
    number: 1,
    icon: '🔎',
    shortTitle: 'Stage 1 · Recon',
    title: 'Stage 1 · First Steps & Recon',
    subtitle: 'Learn how web apps leak clues, how file paths resolve, and how to observe server behavior before attacking.',
    unitIds: [
      'information-disclosure',
      'path-traversal',
      'essential-skills'
    ]
  },
  {
    id: 'stage-2',
    number: 2,
    icon: '🔐',
    shortTitle: 'Stage 2 · Logins & Logic',
    title: 'Stage 2 · Logins, Accounts & Logic',
    subtitle: 'Follow how websites verify identity, enforce permissions, and trust multi-step workflows.',
    unitIds: [
      'authentication',
      'access-control-vulnerabilities',
      'business-logic-vulnerabilities',
      'oauth-authentication',
      'jwt'
    ]
  },
  {
    id: 'stage-3',
    number: 3,
    icon: '🗄️',
    shortTitle: 'Stage 3 · Databases & Backend',
    title: 'Stage 3 · Databases & Backend Systems',
    subtitle: 'Trace what happens when user input crosses into SQL queries, NoSQL filters, shell commands, XML parsers, and internal networks.',
    unitIds: [
      'sql-injection/fundamentals',
      'sql-injection/union-attacks',
      'sql-injection/database-fingerprinting',
      'sql-injection/blind',
      'sql-injection/waf-bypass-xml',
      'nosql-injection',
      'os-command-injection',
      'server-side-request-forgery-ssrf',
      'xml-external-entity-xxe-injection'
    ]
  },
  {
    id: 'stage-4',
    number: 4,
    icon: '🌐',
    shortTitle: 'Stage 4 · Browser Bugs',
    title: 'Stage 4 · Breaking the Browser',
    subtitle: 'See how malicious pages trick browsers into running scripts, forging requests, or leaking cross-origin data.',
    unitIds: [
      'cross-site-scripting',
      'cross-site-request-forgery-csrf',
      'dom-based-vulnerabilities',
      'clickjacking',
      'cross-origin-resource-sharing-cors',
      'websockets'
    ]
  },
  {
    id: 'stage-5',
    number: 5,
    icon: '⚡',
    shortTitle: 'Stage 5 · APIs, Files & AI',
    title: 'Stage 5 · Files, APIs & Modern Stacks',
    subtitle: 'Investigate file upload handlers, REST/GraphQL endpoints, timing windows, and AI prompt boundaries.',
    unitIds: [
      'file-upload-vulnerabilities',
      'api-testing',
      'graphql-api-vulnerabilities',
      'race-conditions',
      'web-llm-attacks'
    ]
  },
  {
    id: 'stage-6',
    number: 6,
    icon: '🧠',
    shortTitle: 'Stage 6 · Deep Internals',
    title: 'Stage 6 · Deep Protocol & Engine Internals',
    subtitle: 'Master reverse proxies, cache keys, HTTP parsing desyncs, object deserialization, and template/prototype internals.',
    unitIds: [
      'http-request-smuggling',
      'web-cache-poisoning',
      'web-cache-deception',
      'insecure-deserialization',
      'prototype-pollution',
      'server-side-template-injection',
      'http-host-header-attacks'
    ]
  }
]

const READING_MINUTES = {
  'sql-injection/fundamentals': 14,
  'sql-injection/union-attacks': 15,
  'sql-injection/database-fingerprinting': 14,
  'sql-injection/blind': 18,
  'sql-injection/waf-bypass-xml': 12
}

let stepCounter = 0
export const phases = STAGE_DEFINITIONS.map((stage) => {
  const stageUnits = stage.unitIds
    .map((id) => {
      const base = rawUnitMap.get(id)
      if (!base) return null
      stepCounter += 1
      const labCount = (base.labIds ? base.labIds.length : sqlLabs.filter((l) => l.module === id).length)
      return {
        ...base,
        stageId: stage.id,
        stageNumber: stage.number,
        stageTitle: stage.title,
        stageShort: stage.shortTitle,
        stageIcon: stage.icon,
        stepNumber: stepCounter,
        readingMinutes: READING_MINUTES[id] || Math.max(6, Math.min(16, 5 + Math.round(labCount * 0.6)))
      }
    })
    .filter(Boolean)

  return {
    ...stage,
    units: stageUnits
  }
})

export const studyUnits = phases.flatMap((phase) => phase.units)

const academyLabs = catalog.topics
  .filter((topic) => topic.id !== 'sql-injection')
  .flatMap((topic) =>
    topic.labs.map((lab) => ({
      ...lab,
      unit: topic.id,
      module: topic.id,
      topic: topic.id,
      path: `/${topic.slug}/`
    }))
  )

const rawLabs = [
  ...sqlLabs.map((lab) => ({ ...lab, unit: lab.module, topic: 'sql-injection' })),
  ...academyLabs
]

const rawLabsByUnit = new Map()
for (const lab of rawLabs) {
  if (!rawLabsByUnit.has(lab.unit)) rawLabsByUnit.set(lab.unit, [])
  rawLabsByUnit.get(lab.unit).push(lab)
}

// Order `labs` in the exact 6-Stage Learning Path order so "Next Recommended Lab"
// always follows the curriculum from Stage 1 to Stage 6.
export const labs = studyUnits.flatMap((unit) => rawLabsByUnit.get(unit.id) || [])

export const totalLabs = labs.length

const labIndex = new Map(labs.map((lab) => [lab.id, lab]))
const unitIndex = new Map(studyUnits.map((unit) => [unit.id, unit]))

export function labsFor(unitId) {
  return labs.filter((lab) => lab.unit === unitId)
}

export function labById(id) {
  return labIndex.get(id) || null
}

export function unitById(id) {
  return unitIndex.get(id) || null
}

export function unitByPath(routePath) {
  if (!routePath) return null
  const baseEnv = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  const basePrefix = baseEnv !== '/' ? baseEnv.replace(/\/$/, '') : ''
  let clean = routePath
  if (basePrefix && clean.startsWith(basePrefix)) {
    clean = clean.slice(basePrefix.length) || '/'
  }
  clean = clean
    .replace(/^\/websec-decompiled(?=\/)/, '')
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/')
  return (
    studyUnits.find((u) => {
      const uClean = u.path.replace(/\.html$/, '').replace(/\/index$/, '/')
      return uClean === clean || `${uClean}/` === clean || uClean === `${clean}/`
    }) || null
  )
}

export function topicForLab(id) {
  const lab = labIndex.get(id)
  return lab ? topicById.get(lab.topic) : null
}
