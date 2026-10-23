import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {modules} from '../.vitepress/theme/rebuilt/curriculum.js'
import {topicTeaching,lessonQuestion} from '../.vitepress/theme/rebuilt/teaching.js'
import {experimentFor} from '../.vitepress/theme/rebuilt/experiments/index.js'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4173/websec-decompiled/',out=resolve(process.env.GUIDED_QA_OUTPUT||'artifacts/workshop')
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']})
const errors=[],shots=[],coverage=[]
const cases=['foundations','encoding','access-control','sql-injection','path-traversal','business-logic','ssrf','xss','race-conditions','request-smuggling','cache-poisoning','graphql','jwt']
async function shot(page,name){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+': overflow');await page.screenshot({path:resolve(out,name+'.png'),fullPage:true});shots.push(name+'.png')}
try{
 for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort())
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())})
  for(const dark of [false,true]){
   await page.goto(base);await page.locator('.welcome-copy').waitFor();await page.evaluate(dark=>{const state=JSON.parse(localStorage.getItem('websec-decompiled:rebuild:v1')||'{"version":1,"done":{},"labs":{}}');localStorage.setItem('websec-decompiled:rebuild:v1',JSON.stringify({...state,palette:'ocean',dark}))},dark);await page.reload();await page.locator('.welcome-copy').waitFor();const theme=dark?'dark':'light'
   await shot(page,`${device}-${theme}-home`)
   await page.goto(base+'#/path');assert.equal(await page.locator('.path-stage[open]').count(),1);await page.getByRole('searchbox').fill('blind');await page.waitForFunction(()=>{const stages=[...document.querySelectorAll('.path-stage')];return stages.length>0&&stages.every(s=>s.open)});await shot(page,`${device}-${theme}-path-search`)
   for(const m of modules){
    if(dark&&!cases.includes(m.id))continue
    for(let index=0;index<(dark?1:m.lessons.length);index++){
     const config=experimentFor(m.id,index);assert(topicTeaching[m.id]?.definition&&lessonQuestion(m.id,index),m.id+':'+index+' missing teaching content')
     await page.goto(base+`#/learn/${m.id}/${index}`);await page.locator(`.guided-lesson[data-lesson="${m.id}:${index}"] .journey-begin`).waitFor();assert.equal(await page.locator('.lesson-tools').getAttribute('open'),null);assert.equal(await page.locator('.guided-lesson').getAttribute('data-moment'),'0');assert.equal(await page.locator('.mini-system:visible').count(),0)
     assert((await page.locator('.journey-entry').innerText()).includes(lessonQuestion(m.id,index)))
     if(index===0){const box=await page.locator('.journey-begin').boundingBox();assert(box.y+box.height<=viewport.height,`${device} ${m.id} opening action below viewport (${box.y+box.height})`);await shot(page,`${device}-${theme}-${m.id}-entry`)}
     const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('websec-decompiled:rebuild:v1')||'{}'))
     await page.locator('.journey-begin').click();assert.equal(await page.locator('.guided-lesson').getAttribute('data-moment'),'1');assert.equal(await page.locator('.journey-app .model-scene').count(),1);assert.equal(await page.locator('.journey-comparison-tabs').count(),0);assert.equal(await page.locator('.journey-check').count(),0)
     const baseline=await page.locator('.journey-result>p').innerText();assert(baseline&&!baseline.startsWith('Input rejected'),m.id+' baseline')
     await page.locator('.journey-mutate').click();assert.equal(await page.locator('.guided-lesson').getAttribute('data-moment'),'2');assert.equal(await page.locator('.journey-check').count(),1);const mutation=await page.locator('.journey-result>p').innerText();assert(mutation&&!mutation.startsWith('Input rejected'),m.id+' mutation')
     assert.equal(await page.locator('.input-did-change').count(),config.fields.filter(f=>String(config.control[f.key])!==String(config.probe[f.key])).length)
     await page.getByRole('button',{name:'Before · starting values',exact:true}).click();assert.equal(await page.locator('.journey-result>p').innerText(),baseline);await page.getByRole('button',{name:'After · changed values',exact:true}).click();assert.equal(await page.locator('.journey-result>p').innerText(),mutation)
     const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('websec-decompiled:rebuild:v1')||'{}'));assert(after.explored[m.lessons[index].id]);assert.deepEqual(after.done||{},before.done||{});assert.deepEqual(after.labs||{},before.labs||{})
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${device} ${m.id}:${index} result overflow`)
     coverage.push(`${device}/${theme}/${m.id}/${index}`)
     if(index===0&&cases.includes(m.id)){await shot(page,`${device}-${theme}-${m.id}-change`);await page.locator('.journey-check').click();assert.equal(await page.getByRole('tab',{name:'Check',exact:true}).getAttribute('aria-selected'),'true');await page.getByRole('tab',{name:'Learn',exact:true}).click();assert.equal(await page.locator('.guided-lesson').getAttribute('data-moment'),'2');assert.equal(await page.locator('.journey-result>p').innerText(),mutation)}
    }
   }
  }
  // Inspect must follow the active learning view, not the most recently mounted component.
  await page.goto(base+'#/learn/foundations/0');await page.locator('.journey-begin').click();await page.locator('.journey-mutate').click();await page.locator('.lesson-tools>summary').click();await page.locator('.lesson-experience-switch button').click();await page.getByRole('button',{name:'Ordinary request (load control)',exact:true}).click();await page.getByRole('tab',{name:'Inspect',exact:true}).click();assert((await page.locator('#lesson-panel-trace .route-request').innerText()).includes('/items/7'));await page.getByRole('tab',{name:'Learn',exact:true}).click();await page.locator('.lesson-experience-switch button').click();assert((await page.locator('.journey-result>p').innerText()).includes('Cable tester'));await page.getByRole('tab',{name:'Inspect',exact:true}).click();assert((await page.locator('#lesson-panel-trace .route-request').innerText()).includes('/items/8'));
  await page.goto(base+'#/path')
  // Completion requires two answers, records survive reload, and restarting doesn't erase them.
  const m=modules.find(m=>m.id==='foundations'),l=m.lessons[0]
  await page.goto(base+'#/learn/foundations/0');await page.locator('.journey-begin').click();await page.locator('.journey-mutate').click();await page.locator('.journey-check').click()
  assert(await page.getByRole('button',{name:'Save check & continue',exact:false}).isDisabled());await page.getByRole('button',{name:l.evidence,exact:false}).click();assert(await page.getByRole('button',{name:'Save check & continue',exact:false}).isDisabled());await page.getByRole('button',{name:l.mechanism,exact:false}).click();await page.getByRole('button',{name:'Save check & continue',exact:false}).click();await page.waitForURL('**/#/learn/foundations/1');await page.reload();assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('websec-decompiled:rebuild:v1')).done['foundations:0']))
  await page.goto(base+'#/learn/foundations/0');await page.locator('.journey-begin').click();await page.getByRole('button',{name:'Start this lesson again',exact:false}).click();assert.equal(await page.locator('.guided-lesson').getAttribute('data-moment'),'0');assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('websec-decompiled:rebuild:v1')).done['foundations:0']))
  await context.close()
 }
}finally{await browser.close()}
assert.deepEqual(errors,[])
await writeFile(resolve(out,'guided-status.json'),JSON.stringify({status:'screenshots-awaiting-human-review',url:base,coverage,screenshots:shots,errors},null,2)+'\n')
console.log(`✓ ${coverage.length} guided flows: situated entries, visible first action, model responses, highlighted changes, before/after replay, tab preservation, gated checks, and retained progress. ${shots.length} screenshots require visual review.`)
