// One-time editorial authoring tool. Output keys are stable lab IDs, never title regexes.
import {writeFileSync} from 'node:fs'
import catalog from '../.vitepress/theme/data/catalog.js'
const reviewed={
'sql-injection':['0','0','0 1 2','0 1 2','0 1 2','0 1 2','0 1','0 1','0 1 2','0 1','0 3 7','0 3 7','0 3','0 4','0 4 7','0 4','0 4 7','0 6'],
xss:['0 1','0 1','0 dom:0','0 dom:0','0 3 dom:4','0 dom:4','1','1 3','2 encoding:2','0 1','3 8','0 dom:0','0 dom:0','1 4','1 4','1 4','1 4','2','2 7 encoding:2','1 2 7 encoding:2','2 7','0 5 foundations:5','0 5','0 5 csrf:1','3 8','3 6 8','1 4 6','3 4','1 6 9','0 6'],
csrf:['0','0 1','0 1','0 1','1 2','1 2','0 1 3','3 5','3 5 foundations:2','4','4'],
clickjacking:['0','0 1','0 1','0 2 dom:0','0 2'],
dom:['0 1','0 1 xss:3','0 1','0 2 xss:3','0 2','3','3 xss:1'],
cors:['0 foundations:2 foundations:5','0 1','0 2'],
xxe:['0','0 1 ssrf:0','0 2','0 2','0 2','0 3','4','0 4 file-upload:1','0 3'],
ssrf:['0','0','0 3','0 1 4','0 2','0 3 5 command-injection:3','0 1 4'],
'request-smuggling':['0 1','0 1','0 2','0 2','0 2 8','0 2 8','0 2 8 xss:0','3 4','0 3','3','3 4','5','5','0','0','0 1','0 8 cache-poisoning:0','0 8 cache-deception:0','3 7 access-control:2','3 7 8 cache-poisoning:0','5 foundations:0','6'],
'command-injection':['0','0 1','0 2','0 3','0 3'],
ssti:['0','0 1 4','0 1 2','0 1 3','0 2','0 2 3','0 2 3'],
'path-traversal':['0','0','0 1','0 2 encoding:0','0 3','0 3'],
'access-control':['0 1','0 1 information-disclosure:1','1','1 api-testing:1','0','0','0 investigation:2','0','0','2','2','3','4'],
authentication:['0','2','3','0','0','1 5','0 5','2 3','4','4','3 host-header:0','3 6','1 5','1 2 5'],
websockets:['0 xss:0','0 1 2'],
'cache-poisoning':['0','0 1','0 3','0 3','0 1','0 1','0 1 5','0 2','0 2','0 3 dom:0','0 1 3','0 4','0 4'],
deserialization:['0','0 1','0 1','1 2','1 2','1 2','1 2','1 2 4','1 2 4','1 2 3 4 file-upload:0'],
'information-disclosure':['0','1','1','0 3','2'],
'business-logic':['0','0 1','1 3','0 2','0 5','0 3','1','1','1 authentication:2','0 2','4','3'],
'host-header':['0','1','0 2 cache-poisoning:0','1 ssrf:0','1 2 ssrf:1','1 3','0 xss:9'],
oauth:['0','0 3 ssrf:0','0 1','0 2','0 2','0 2 4 dom:1'],
'file-upload':['0','0 1','0 2 path-traversal:0','0 2 4','0 2','0 1','0 3 race-conditions:0'],
jwt:['0','0 1','0 1','0 2','0 2 ssrf:1','0 3 path-traversal:0','0 4','0 4 5'],
'essential-skills':['0 2','0 1 2'],
'prototype-pollution':['0','0 1','0 1 2','0 2','0 1 2','0 4','0 3','0 2 3','0 4','0 4'],
graphql:['0','0','0 1','0 2 authentication:1','0 3 csrf:0'],
'race-conditions':['0 1','0 1 authentication:5','0 1 2','0 1 2','0 1 3','0 1 2'],
'nosql-injection':['0 encoding:3','0 1','0 2 sql-injection:7','0 2 3'],
'api-testing':['0','0 2 encoding:3','0','0 1','0 3 encoding:0'],
llm:['0','0 1 3','0 1','0 2 xss:0','0 1 3','0 1 3','0 1 2 3','0 1 3 4'],
'cache-deception':['0','0 1','0 2','0 2','0 1 2 3']
}
const entries={}
for(const topic of catalog.topics){const authored=reviewed[topic.slug];if(!authored||authored.length!==topic.labs.length)throw Error('Audit length mismatch: '+topic.slug);topic.labs.forEach((lab,i)=>{entries[lab.id]={module:topic.slug,skills:authored[i].split(' ').map(token=>token.includes(':')?token:topic.slug+':'+token)}})}
writeFileSync('.vitepress/theme/rebuilt/preparation-map.js','// Editorial prerequisite map for the retained catalogue. No target was opened or solved.\n// Each stable lab ID names the concept skills to review; it does not contain a solution.\nexport const preparationMap='+JSON.stringify(entries,null,2)+'\n')
console.log('Wrote '+Object.keys(entries).length+' explicit lab prerequisite records.')
