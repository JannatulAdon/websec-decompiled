import { readFile, mkdir, writeFile, rm } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import assert from 'node:assert/strict'
import { modules, academyLabs } from '../.vitepress/theme/rebuilt/curriculum.js'
import {lessonSystems} from '../.vitepress/theme/rebuilt/experiments/index.js'
import { cases } from '../.vitepress/theme/rebuilt/cases.js'
const output=resolve('artifacts/browser')
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true})
let browser
try{
 const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']})
}catch(error){
 await writeFile(resolve(output,'status.json'),JSON.stringify({status:'blocked',reason:String(error.message),screenshotsTaken:0},null,2))
 console.error('Browser QA could not start. No screenshots or visual verification are claimed. See artifacts/browser/status.json.');process.exit(1)
}
const dist=resolve('.vitepress/dist'),base=process.env.QA_BASE_URL||'https://websec.test/websec-decompiled/'
const failures=[],errors=[]
const contrast=(a,b)=>{const luminance=s=>{const c=s.match(/[\d.]+/g).slice(0,3).map(v=>{v=Number(v)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]};const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'}
async function mount(context){
 if(process.env.QA_BASE_URL){await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());return}
 await context.route('**/*',async route=>{
  const request=new URL(route.request().url())
  if(request.origin!=='https://websec.test')return route.abort()
  const rel=decodeURIComponent(request.pathname.replace(/^\/websec-decompiled\//,''))
  const path=resolve(dist,rel+(rel.endsWith('/')||!rel?'index.html':''))
  if(!path.startsWith(dist+sep)&&path!==dist)return route.fulfill({status:403,body:'Forbidden'})
  try{await route.fulfill({body:await readFile(path),contentType:mime[extname(path)]||'application/octet-stream'})}catch{await route.fulfill({status:404,body:'Not found'})}
 })
}
async function screenshot(page,name){
 await page.screenshot({path:resolve(output,name+'.png'),fullPage:true})
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)
 if(overflow)failures.push(name+': horizontal viewport overflow')
}
try{
 for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});await mount(context)
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())})
  await page.goto(base);await page.getByRole('link',{name:'Start with the fundamentals'}).waitFor()
  for(const palette of ['ocean','sage','indigo','espresso'])for(const dark of [true,false]){
   await page.evaluate(({palette,dark})=>{const raw=JSON.parse(localStorage.getItem('websec-decompiled:rebuild:v1')||'{"version":1,"done":{},"labs":{}}');localStorage.setItem('websec-decompiled:rebuild:v1',JSON.stringify({...raw,palette,dark}))},{palette,dark})
   await page.reload();await page.locator('html[data-atmosphere="'+palette+'"]').waitFor()
   assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('dark')),dark)
   const colors=await page.locator('.hero-actions .primary').evaluate(el=>{const s=getComputedStyle(el);return [s.color,s.backgroundColor]});assert(contrast(...colors)>=4.5,`${palette} ${dark}: primary-button contrast`)
   await page.locator('.hero-actions .primary').hover();const hoverColors=await page.locator('.hero-actions .primary').evaluate(el=>{const s=getComputedStyle(el);return [s.color,s.backgroundColor]});assert(contrast(...hoverColors)>=4.5,`${palette} ${dark}: hovered primary-button contrast`);await page.mouse.move(0,0)
   await screenshot(page,`${device}-${palette}-${dark?'dark':'light'}-home`)
  }
  for(const dark of [true,false]){
   await page.evaluate(dark=>{const raw=JSON.parse(localStorage.getItem('websec-decompiled:rebuild:v1'));localStorage.setItem('websec-decompiled:rebuild:v1',JSON.stringify({...raw,palette:'ocean',dark}))},dark)
   await page.reload();await page.waitForFunction(dark=>document.documentElement.classList.contains('dark')===dark,dark);await page.goto(base+'#/learn/sql-injection/0')
   for(const name of ['Experiment','Follow the trace','Check understanding','Transfer']){
    await page.getByRole('tab',{name,exact:true}).click();await screenshot(page,`${device}-${dark?'dark':'light'}-sql-${name.replaceAll(' ','-')}`)
   }
  }
  await page.getByRole('tab',{name:'Experiment',exact:true}).focus();await page.keyboard.press('ArrowRight');assert.equal(await page.getByRole('tab',{name:'Follow the trace',exact:true}).getAttribute('aria-selected'),'true')
  await page.getByRole('tab',{name:'Experiment',exact:true}).click()
  await page.getByRole('button',{name:'Edit this experiment'}).click()
  await page.getByRole('button',{name:'Load boundary probe'}).click()
  assert(await page.locator('.mini-system pre').last().innerText().then(t=>t.includes('not released')))
  await page.getByRole('checkbox',{name:'Enforce the boundary'}).check()
  assert(await page.locator('.mini-system pre').last().innerText().then(t=>!t.includes('not released')))
  await screenshot(page,`${device}-editable-sql`)
  await page.getByRole('tab',{name:'Follow the trace',exact:true}).click();await page.getByText('Take this mechanism to a CTF',{exact:true}).click();await page.getByRole('button',{name:'Use tools',exact:true}).click();await screenshot(page,`${device}-practical-guide`);await page.getByRole('tab',{name:'Experiment',exact:true}).click()
  // Exercise every lesson's own control/probe configuration in a real browser.
  for(const m of modules)for(const [index,system] of lessonSystems[m.id].entries()){
   await page.goto(base+`#/learn/${m.id}/${index}`)
   await page.getByRole('button',{name:'Load control',exact:true}).click()
   await page.getByRole('button',{name:'Load boundary probe',exact:true}).click()
   const observation=await page.locator('.mini-system pre').last().innerText()
   assert(!observation.startsWith('Input rejected'),m.id+':'+index+' rejected its preset')
   const boundary=page.getByRole('checkbox',{name:'Enforce the boundary',exact:true})
   if(await boundary.count())await boundary.check()
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))failures.push(`${device}-${m.id}-${index}: overflow`)
   if(['xss','request-smuggling','jwt','deserialization','cache-poisoning'].includes(m.id)&&index===m.lessons.length-1)await screenshot(page,`${device}-${m.id}-advanced`)
  }
  // Concept-check progression and persistence.
  const m=modules.find(m=>m.id==='sql-injection'),lesson=m.lessons[0]
  await page.goto(base+'#/learn/sql-injection/0');await page.getByRole('tab',{name:'Check understanding'}).click()
  await page.getByRole('button',{name:lesson.evidence,exact:false}).click()
  await page.getByRole('button',{name:lesson.mechanism,exact:false}).click()
  await page.getByRole('button',{name:'Save check & continue'}).click()
  await page.waitForURL('**/#/learn/sql-injection/1');await page.reload()
  assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('websec-decompiled:rebuild:v1')).done['sql-injection:0']))
  await page.getByRole('tab',{name:'Transfer',exact:true}).click()
  await page.getByRole('button',{name:cases['sql-injection'].correct,exact:false}).click()
  await page.getByRole('button',{name:'Save transfer check'}).click()
  await page.goto(base+'#/labs');const rendered=new Set();for(let count=0;count<23;count++){for(const id of await page.locator('.lab-card').evaluateAll(cards=>cards.map(c=>c.dataset.labId)))rendered.add(id);const next=page.getByRole('button',{name:'Next →',exact:true});if(await next.isDisabled())break;await next.click()}assert.equal(rendered.size,academyLabs.length)
  await page.getByRole('combobox',{name:'Topic',exact:true}).selectOption('sql-injection')
  assert.equal(await page.locator('.lab-card').count(),12);await page.getByRole('button',{name:'Next →',exact:true}).click();assert.equal(await page.locator('.lab-card').count(),6);await page.getByRole('button',{name:'← Previous',exact:true}).click()
  await page.locator('.lab-title-button').first().click()
  await page.getByRole('checkbox',{name:'I solved this lab'}).check()
  await page.getByRole('checkbox',{name:'Hide solved'}).check();assert.equal(await page.locator('.lab-card').count(),12);assert((await page.locator('.lab-pagination').innerText()).includes('of 17'))
  await screenshot(page,`${device}-practice`)
  await page.goto(base+'#/mystery')
  await page.getByRole('button',{name:'Send to local fixture'}).click()
  await page.getByLabel('Input value / body',{exact:true}).fill('42')
  await page.getByRole('button',{name:'Send to local fixture'}).click()
  await page.getByLabel('What boundary are you testing?',{exact:true}).fill('The object owner should match the authenticated session.')
  await page.getByLabel('Your control, evidence, alternative explanation, and proposed fix',{exact:true}).fill('Alice sees her own receipt in the control, but receives Bob’s private marker after only the invoice ID changes. Enforce ownership at the action.')
  await page.getByRole('button',{name:'Save investigation record'}).click()
  assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('websec-decompiled:rebuild:v1')).missions.receipts))
  await screenshot(page,`${device}-investigation`)
  await page.goto(base+'sql-injection/03-blind-sqli.html');await page.waitForURL('**/#/learn/sql-injection/3')
  await page.goto(base+'#/reference');await page.getByRole('tab',{name:'Plain-English terms'}).click()
  await page.getByRole('searchbox',{name:'Search plain-English terms'}).fill('CORS');assert(await page.locator('.glossary dt').count()>0)
  await screenshot(page,`${device}-glossary`)
  await page.goto(base+'#/progress');await screenshot(page,`${device}-progress`)
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup'}).click();const download=await downloadPromise;const path=await download.path();const backup=JSON.parse(await readFile(path,'utf8'));assert(backup.done['sql-injection:0']);assert(backup.passed['sql-injection']);
  await page.locator('input[type=file]').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,done:{'encoding:0':true},labs:{},notes:{foundations:'Imported fixture note'},palette:'ocean',dark:true}))})
  await page.getByRole('status').filter({hasText:'Backup merged'}).waitFor()
  assert(await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('websec-decompiled:rebuild:v1'));return s.done['encoding:0']&&s.done['sql-injection:0']&&s.notes.foundations==='Imported fixture note'}))
  await context.close()
 }
}finally{await browser.close()}
await writeFile(resolve(output,'status.json'),JSON.stringify({status:errors.length||failures.length?'failed':'screenshots-awaiting-human-review',failures,errors,visualInspection:'Required: open and personally inspect the screenshots; automated checks cannot establish visual quality.'},null,2))
assert.deepEqual(errors,[]);assert.deepEqual(failures,[])
console.log('✓ Browser flows passed. Screenshots saved in artifacts/browser. Personal visual inspection remains required.')
