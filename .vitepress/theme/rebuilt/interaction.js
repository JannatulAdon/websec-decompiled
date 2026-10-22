// Clickable examples are data for the existing bounded models, never executable code.
const extras = {
 'foundations:0': { path: ['/items/7', '/items/8', '/items/abcd'] },
 'foundations:1': { session: ['alice-session', 'bob-session', ''] },
 'information-disclosure:0': { product: ['7', '8', 'abcd'] },
 'information-disclosure:1': { path: ['/debug', '/backup/unknown.bak', '/backup/settings.txt.bak'] },
 'path-traversal:0': { path: ['cat.png', '../notes.txt', '/srv/notes.txt'] },
 'access-control:0': { actor: ['alice', 'bob'], invoice: ['41', '42', '99'] },
 'investigation:1': { actor: ['alice', 'bob'], invoice: ['41', '42', '99'] },
 'sql-injection:0': { category: ['Books', 'Gifts', "Books'", "Books' OR '1'='1'-- "] },
 'business-logic:0': { quantity: ['1', '3', '-3', '11'] },
 'ssti:0': { name: ['Alice', '{{7*7}}', '7*7'] },
 'api-testing:0': { method: ['GET', 'POST', 'DELETE'], path: ['/api/v1/items/7', '/api/v1/items/99'] },
 'csrf:0': { token: ['alice-token', 'bob-token', ''], method: ['POST', 'GET'] },
 'encoding:0': { value: ['notes.txt', '../notes.txt', '%2e%2e%2fnotes.txt', '%252e%252e%252fnotes.txt'] }
}
export function examplesFor(config, moduleId, index, field) {
 const initial = [config.control[field.key], config.probe[field.key]].map(String)
 const named = extras[`${moduleId}:${index}`]?.[field.key]
 const parenthetical = field.label.match(/\(([^)]+)\)/)?.[1]
 let enumerated = []
 if (parenthetical && / or |,/.test(parenthetical)) {
  const candidates = parenthetical.replace(/ or /g, ',').split(',').map(s=>s.trim())
  if (candidates.every(s=>/^[\w.-]+$/.test(s)) && initial.every(s=>candidates.includes(s))) enumerated=candidates
 }
 if (initial.every(s=>['yes','no'].includes(s))) enumerated=['yes','no']
 return [...new Set([...(named || []),...initial,...enumerated])]
}
export function shortValue(value) {
 const text=String(value)
 return text===''?'(absent)':text.length>54?text.slice(0,51)+'…':text
}
export function appFor(moduleId,index) {
 if (moduleId==='foundations' && index===0) return {name:'Field Supply',section:'Product browser',kind:'products',address:'shop.example.test'}
 if (moduleId==='information-disclosure' && index===0) return {name:'Field Supply',section:'Product lookup',kind:'product',address:'shop.example.test/product'}
 if (['access-control','investigation'].includes(moduleId)&& (moduleId==='access-control'?index===0:index===1)) return {name:'Papertrail',section:'Private invoices',kind:'invoice',address:'billing.example.test/invoice'}
 if (moduleId==='sql-injection'&&index===0) return {name:'Field Supply',section:'Catalogue search',kind:'catalogue',address:'shop.example.test/catalogue'}
 if (moduleId==='business-logic'&&index===0) return {name:'Field Supply',section:'Checkout',kind:'cart',address:'shop.example.test/cart'}
 if (moduleId==='path-traversal') return {name:'Little Gallery',section:'File preview',kind:'files',address:'gallery.example.test/image'}
 if (['authentication','oauth','jwt','access-control','csrf'].includes(moduleId)||moduleId==='foundations'&&index===1) return {name:'Member space',section:'Account & permissions',kind:'account',address:'accounts.example.test'}
 if (['xss','dom','ssti','llm'].includes(moduleId)) return {name:'Preview Studio',section:'Content preview',kind:'preview',address:'preview.example.test'}
 if (['cache-poisoning','cache-deception','request-smuggling','host-header','race-conditions'].includes(moduleId)) return {name:'Request Desk',section:'Delivery & shared state',kind:'network',address:'gateway.example.test'}
 return {name:'Workbench',section:'Local application',kind:'tool',address:'workbench.example.test'}
}
