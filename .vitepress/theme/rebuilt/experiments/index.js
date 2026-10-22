import {foundations} from './foundations.js'
import {backend} from './backend.js'
import {browser} from './browser.js'
import {applications} from './applications.js'
import {infrastructure} from './infrastructure.js'
import {fieldwork} from './fieldwork.js'
import {advancedSystems} from './advanced.js'
const baseSystems={...foundations,...backend,...browser,...applications,...infrastructure,...fieldwork}
export const lessonSystems=Object.fromEntries(Object.entries(baseSystems).map(([id,models])=>[id,[...models,...(advancedSystems[id]||[])]]))
export function experimentFor(moduleId,index){return lessonSystems[moduleId]?.[index]}
