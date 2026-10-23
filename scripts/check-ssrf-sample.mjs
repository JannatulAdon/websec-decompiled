import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {PICTURE_URL,PRIVATE_URL,HTTPS_PRIVATE_URL,PRIVATE_CODE,fetchIllustration} from '../.vitepress/theme/rebuilt/ssrf-sample.js'
for(const via of ['server','browser'])for(const restricted of [false,true])for(const target of [PICTURE_URL,PRIVATE_URL,HTTPS_PRIVATE_URL]){
 const result=fetchIllustration({target,via,restricted}),privateTarget=target!==PICTURE_URL,expected=!privateTarget||(via==='server'&&!restricted)
 assert.equal(result.contacted,expected);assert.equal(result.body.includes(PRIVATE_CODE),privateTarget&&expected)
 if(via==='server'&&!expected)assert.deepEqual(result.edges,['submit'])
 if(via==='browser'&&privateTarget)assert.deepEqual(result.edges,['browser-blocked'])
 if(via==='server'&&expected)assert.deepEqual(result.edges,privateTarget?['submit','server-private','private-server','return']:['submit','server-picture','picture-server','return'])
 if(via==='browser'&&!privateTarget)assert.deepEqual(result.edges,['browser-picture'])
}
assert.throws(()=>fetchIllustration({target:'https://unknown.test/'}),/fixed addresses/)
assert.throws(()=>fetchIllustration({via:'other'}),/Unknown sender/)
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4173/websec-decompiled/',out=resolve(process.env.SSRF_QA_OUTPUT||'artifacts/ssrf-guided')
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']})
const errors=[],shots=[]
async function shot(page,name){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+': overflow');await page.screenshot({path:resolve(out,name+'.png'),fullPage:true});shots.push(name+'.png')}
async function edges(page){return page.locator('.ssrf-live-route>[data-edge]').evaluateAll(nodes=>nodes.map(n=>n.dataset.edge))}
async function mount(context){await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort())}
try{
 for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});await mount(context)
  const page=await context.newPage();page.setDefaultNavigationTimeout(60000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())})
  await page.goto(base+'#/learn/ssrf/0');await page.locator('.lesson-tools>summary').click();await page.getByRole('link',{name:'NEW LEARNING SAMPLE',exact:false}).click();await page.waitForURL('**/#/sample/ssrf')
  for(const dark of [false,true]){
   await page.getByRole('button',{name:'Start again',exact:false}).click();if(dark)await page.getByRole('button',{name:'Use dark appearance',exact:true}).click()
   const theme=dark?'dark':'light',intro=await page.locator('.ssrf-welcome').innerText()
   assert(intro.includes('security flaw')&&intro.includes('network access')&&intro.includes('YOUR GOAL')&&intro.includes('staff preview code'))
   assert.equal(await page.locator('.ssrf-tutor .sample-primary:visible').count(),1,'Landing has one primary learning action')
   assert.equal(await page.getByRole('checkbox').count(),0);assert.equal(await page.locator('.ssrf-target-choices').count(),0);assert.equal(await page.locator('.ssrf-network').count(),0)
   const start=page.getByRole('button',{name:'Start: import a normal picture',exact:false});const box=await start.boundingBox();assert(box.y+box.height<=viewport.height,`${device}: first learning action should fit in the opening viewport`)
   await shot(page,`${device}-${theme}-0-purpose`)
   await start.click();assert.equal(await page.locator('.ssrf-tutor-current').getAttribute('data-lesson-step'),'1');assert.equal(await page.locator('.ssrf-observation').getAttribute('data-kind'),'image');assert.equal(await page.getByRole('group',{name:'Staff page',exact:true}).count(),0);assert.deepEqual(await edges(page),['submit','server-picture','picture-server','return']);assert((await page.locator('.ssrf-coach-card').innerText()).includes('feature working as intended'));await shot(page,`${device}-${theme}-1-normal`)
   await page.getByRole('button',{name:'Try opening the staff page directly',exact:false}).click();assert.equal(await page.locator('.ssrf-observation').getAttribute('data-via'),'browser');assert.equal(await page.locator('.ssrf-observation').getAttribute('data-contacted'),'false');assert.deepEqual(await edges(page),['browser-blocked']);assert(!((await page.locator('.ssrf-observation').innerText()).includes(PRIVATE_CODE)));assert.equal(await page.locator('.ssrf-target-choices button').count(),2);await shot(page,`${device}-${theme}-2-obstacle`)
   await page.getByRole('button',{name:'Ask Studio for the picture',exact:false}).click();assert.equal(await page.locator('.ssrf-tutor-current').getAttribute('data-lesson-step'),'2');assert((await page.locator('.sample-feedback').innerText()).includes('still asks for the public picture'));assert.equal(await page.locator('.ssrf-observation').getAttribute('data-kind'),'image');await shot(page,`${device}-${theme}-2-retry`)
   await page.getByRole('button',{name:'Ask Studio for the staff page',exact:false}).click();assert.equal(await page.locator('.ssrf-observation').getAttribute('data-via'),'server');assert.equal(await page.locator('.ssrf-observation').getAttribute('data-contacted'),'true');assert.deepEqual(await edges(page),['submit','server-private','private-server','return']);assert.equal(await page.locator('.ssrf-code-result strong').innerText(),PRIVATE_CODE);assert((await page.locator('.ssrf-route-comparison').innerText()).includes('Could not reach it'));await shot(page,`${device}-${theme}-3-ssrf`)
   await page.getByRole('button',{name:'Check why it worked',exact:false}).click();assert.equal(await page.locator('.ssrf-fix').count(),0)
   await page.getByRole('button',{name:'My browser got permission',exact:false}).click();assert((await page.locator('.sample-feedback').innerText()).includes('access did not change'));assert.equal(await page.locator('.ssrf-fix').count(),0);await shot(page,`${device}-${theme}-4-retry`)
   await page.getByRole('button',{name:'I changed the URL; Studio’s server',exact:false}).click();assert((await page.locator('.ssrf-core-summary').innerText()).includes('server made the request'));assert.equal(await page.locator('.ssrf-fix').getAttribute('open'),null);await shot(page,`${device}-${theme}-4-understood`)
   await page.locator('.ssrf-fix>summary').click();await page.getByRole('button',{name:'Try the staff address with the rule',exact:true}).click();assert.equal(await page.locator('.ssrf-fixed-result').getAttribute('data-kind'),'blocked');assert(!((await page.locator('.ssrf-fixed-result').innerText()).includes(PRIVATE_CODE)));await page.getByRole('button',{name:'Try the picture address with the rule',exact:true}).click();assert.equal(await page.locator('.ssrf-fixed-result').getAttribute('data-kind'),'image');await shot(page,`${device}-${theme}-5-optional-fix`)
   await page.getByRole('button',{name:'Revisit the previous moment',exact:false}).click();assert.equal(await page.locator('.ssrf-tutor-current').getAttribute('data-lesson-step'),'3');assert.equal(await page.locator('.ssrf-code-result strong').innerText(),PRIVATE_CODE)
  }
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('websec-decompiled:rebuild:v1')||'{}'));assert.deepEqual(saved.done||{},{});assert.deepEqual(saved.labs||{},{})
  await page.locator('.skip').focus();await page.keyboard.press('Enter');assert(page.url().endsWith('#/sample/ssrf'));assert.equal(await page.evaluate(()=>document.activeElement.id),'workspace')
  await context.close()
 }
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});await mount(context);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'#/sample/ssrf');await page.getByRole('button',{name:'Start: import a normal picture',exact:false}).click();assert.equal(await page.locator('.ssrf-packet').count(),4);const before=await page.locator('.ssrf-observation').innerText();await page.getByRole('button',{name:'Replay route',exact:false}).click();assert.equal(await page.locator('.ssrf-observation').innerText(),before);await shot(page,'desktop-motion-route');await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>!document.querySelector('.ssrf-packet'));await context.close()
}finally{await browser.close()}
assert.deepEqual(errors,[])
await writeFile(resolve(out,'status.json'),JSON.stringify({status:'screenshots-awaiting-human-review',url:base,screenshots:shots,errors},null,2)+'\n')
console.log(`✓ Guided SSRF: definition/purpose on arrival, one visible first action, staged controls, normal/direct/server comparisons, meaningful private result, wrong-turn feedback, causal explanation check, optional fix, reduced motion, and ${shots.length} screenshots.`)
