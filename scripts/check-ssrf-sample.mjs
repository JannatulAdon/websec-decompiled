import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {PICTURE_URL,PRIVATE_URL,HTTPS_PRIVATE_URL,fetchIllustration} from '../.vitepress/theme/rebuilt/ssrf-sample.js'
for(const via of ['server','browser'])for(const restricted of [false,true])for(const target of [PICTURE_URL,PRIVATE_URL,HTTPS_PRIVATE_URL]){
 const result=fetchIllustration({target,via,restricted}),privateTarget=target!==PICTURE_URL
 const expected=!privateTarget||(via==='server'&&!restricted)
 assert.equal(result.contacted,expected);assert.equal(result.body.includes('SAMPLE-17'),privateTarget&&expected)
 if(via==='server'&&!expected)assert.deepEqual(result.edges,['submit'])
 if(via==='browser'&&privateTarget)assert.deepEqual(result.edges,['browser-blocked'])
 if(via==='server'&&expected)assert.deepEqual(result.edges,privateTarget?['submit','server-private','private-server','return']:['submit','server-picture','picture-server','return'])
 if(via==='browser'&&!privateTarget)assert.deepEqual(result.edges,['browser-picture'])
}
assert.throws(()=>fetchIllustration({target:'https://unknown.test/'}),/fixed addresses/)
assert.throws(()=>fetchIllustration({via:'other'}),/Unknown sender/)
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4173/websec-decompiled/',out=resolve(process.env.SSRF_QA_OUTPUT||'artifacts/ssrf-sample')
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']})
const errors=[],shots=[]
async function shot(page,name){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+': overflow');await page.screenshot({path:resolve(out,name+'.png'),fullPage:true});shots.push(name+'.png')}
async function edges(page){return page.locator('.ssrf-live-route>[data-edge]').evaluateAll(nodes=>nodes.map(n=>n.dataset.edge))}
try{
 for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort())
  const page=await context.newPage();page.setDefaultNavigationTimeout(60000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())})
  await page.goto(base+'#/learn/ssrf/0');await page.getByRole('link',{name:'NEW LEARNING SAMPLE',exact:false}).click();await page.waitForURL('**/#/sample/ssrf')
  assert((await page.locator('.ssrf-intro').innerText()).includes('asks Studio’s server to download'))
  for(const dark of [false,true]){
   await page.getByRole('button',{name:'Start again',exact:false}).click();if(dark)await page.getByRole('button',{name:'Use dark appearance',exact:true}).click()
   const theme=dark?'dark':'light';await shot(page,`${device}-${theme}-0-start`)
   await page.getByRole('button',{name:'Import the picture',exact:false}).click();assert.equal(await page.locator('.ssrf-observation').getAttribute('data-kind'),'image');assert.deepEqual(await edges(page),['submit','server-picture','picture-server','return']);await shot(page,`${device}-${theme}-1-public`)
   await page.getByRole('button',{name:'Import the private address',exact:false}).click();assert.equal(await page.locator('#ssrf-link').inputValue(),PRIVATE_URL);assert((await page.locator('.ssrf-observation').innerText()).includes('SAMPLE-17'));assert.deepEqual(await edges(page),['submit','server-private','private-server','return']);await shot(page,`${device}-${theme}-2-private`)
   await page.getByRole('button',{name:'Open it from your browser',exact:false}).click();assert.equal(await page.locator('.ssrf-observation').getAttribute('data-via'),'browser');assert.equal(await page.locator('.ssrf-observation').getAttribute('data-contacted'),'false');assert(!((await page.locator('.ssrf-observation').innerText()).includes('SAMPLE-17')));assert.deepEqual(await edges(page),['browser-blocked']);await shot(page,`${device}-${theme}-3-browser-blocked`)
   await page.getByRole('button',{name:'Apply the rule and retry',exact:false}).click();assert.equal(await page.locator('.ssrf-observation').getAttribute('data-contacted'),'false');assert.equal(await page.locator('.ssrf-observation').getAttribute('data-via'),'server');assert.deepEqual(await edges(page),['submit']);assert(!((await page.locator('.ssrf-observation').innerText()).includes('SAMPLE-17')));await shot(page,`${device}-${theme}-4-server-stops`)
   await page.getByRole('button',{name:'Inspect Studio server',exact:true}).focus();await page.keyboard.press('Enter');assert((await page.locator('.ssrf-inspection').innerText()).includes('makes its own request'));await page.keyboard.press('Space');assert.equal(await page.locator('.ssrf-inspection').count(),0)
   await page.getByRole('button',{name:'Public picture',exact:false}).click();assert.equal(await page.locator('.ssrf-observation').getAttribute('data-kind'),'image');assert(await page.getByRole('checkbox',{name:'Server rule:',exact:false}).isChecked())
   await page.getByRole('button',{name:'Try the quick check',exact:false}).click();assert.deepEqual(await edges(page),['browser-picture']);await page.getByRole('button',{name:'Yes. The user supplied a URL.',exact:false}).click();assert((await page.locator('.ssrf-check .sample-feedback').innerText()).includes('server does not fetch'));await shot(page,`${device}-${theme}-5-check-retry`)
   await page.getByRole('button',{name:'No. The picture request comes from the browser.',exact:false}).click();assert((await page.locator('.ssrf-check .sample-feedback').innerText()).includes('not SSRF'));await shot(page,`${device}-${theme}-6-check-done`)
   await page.getByRole('button',{name:'Back to the importer',exact:false}).click();assert(await page.getByRole('checkbox',{name:'Server rule:',exact:false}).isChecked());assert.equal(await page.locator('.ssrf-observation').getAttribute('data-kind'),'image')
  }
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('websec-decompiled:rebuild:v1')||'{}'));assert.deepEqual(saved.done||{},{});assert.deepEqual(saved.labs||{},{})
  await page.locator('.skip').focus();await page.keyboard.press('Enter');assert(page.url().endsWith('#/sample/ssrf'));assert.equal(await page.evaluate(()=>document.activeElement.id),'workspace')
  await context.close()
 }
 // Motion is a route replay; it never changes fixture results or creates a request.
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'#/sample/ssrf');await page.locator('.ssrf-presets').getByRole('button',{name:'Private status service',exact:false}).click();assert.equal(await page.locator('.ssrf-packet').count(),4);const before=await page.locator('.ssrf-observation').innerText();await page.getByRole('button',{name:'Replay route',exact:false}).click();assert.equal(await page.locator('.ssrf-observation').innerText(),before);await shot(page,'desktop-motion-route');await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>!document.querySelector('.ssrf-packet'));assert.equal(await page.locator('.ssrf-packet').count(),0);await context.close()
}finally{await browser.close()}
assert.deepEqual(errors,[])
await writeFile(resolve(out,'status.json'),JSON.stringify({status:'screenshots-awaiting-human-review',url:base,screenshots:shots,errors},null,2)+'\n')
console.log(`✓ SSRF model and browser flows: sender/network reachability, exact destination policy, public images, private response relay, direct-browser denial, quick check, keyboard inspection, reduced motion/replay, and ${shots.length} screenshots.`)
