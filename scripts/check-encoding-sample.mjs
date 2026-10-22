import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {photoRequest,wrap,unwrap,filenameJourney,sampleSteps} from '../.vitepress/theme/rebuilt/encoding-sample.js'
assert.equal(sampleSteps.length,2)
for(const name of ['blue sky.png','holiday photo.png']){const request=photoRequest(name);assert.equal(request.decoded,name);assert.equal(request.encoded,wrap(name));assert.equal(request.found,true)}
assert.equal(photoRequest('blue sky.png').target,'/photo?name=blue%20sky.png')
assert.equal(unwrap('%252F'),'%2F');assert.equal(unwrap(unwrap('%252F')),'/')
const early=filenameJourney('folder%252Fphoto.png'),late=filenameJourney('folder%252Fphoto.png',true)
assert.equal(early.checked,'folder%2Fphoto.png');assert.equal(early.allowed,true);assert.equal(late.checked,late.final);assert.equal(late.allowed,false)
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']})
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4173/websec-decompiled/',output=resolve(process.env.SAMPLE_QA_OUTPUT||'artifacts/encoding-sample-v2')
await mkdir(output,{recursive:true})
const errors=[],shots=[]
async function shot(page,name){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+': viewport overflow');await page.screenshot({path:resolve(output,name+'.png'),fullPage:true});shots.push(name+'.png')}
const contrast=(a,b)=>{const lum=s=>{const c=s.match(/[\d.]+/g).slice(0,3).map(v=>{v=Number(v)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
try{
for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
 const context=await browser.newContext({viewport,reducedMotion:'reduce'});await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort())
 const page=await context.newPage();page.setDefaultNavigationTimeout(60000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())})
 await page.goto(base+'#/learn/encoding/0');await page.getByRole('link',{name:'NEW LEARNING SAMPLE',exact:false}).click();await page.waitForURL('**/#/sample/encoding')
 assert.equal(await page.locator('.topbar:visible').count(),0)
 for(const dark of [false,true]){
  await page.getByRole('button',{name:'Start again',exact:false}).click()
  if(dark)await page.getByRole('button',{name:'Use dark appearance',exact:true}).click()
  const theme=dark?'dark':'light',copy=await page.locator('.sample-copy').innerText()
  assert(copy.includes('Mira Photos')&&copy.includes('browser ask Mira’s server'),'Introduce website, user action, and destination before interaction')
  assert.equal(await page.locator('.sample-progress li').count(),2)
  await shot(page,`${device}-${theme}-0-start`)
  const primary=page.getByRole('button',{name:'Open Blue Sky',exact:false});const colors=await primary.evaluate(el=>{const s=getComputedStyle(el);return[s.color,s.backgroundColor]});assert(contrast(...colors)>=4.5)
  await primary.click();const flow=await page.locator('.sample-request-flow').innerText();assert(flow.includes('GET '+photoRequest('blue sky.png').target));assert(flow.includes('Browser encodes')&&flow.includes('server decodes'))
  await shot(page,`${device}-${theme}-0-journey`)
  await page.locator('.sample-controls .sample-primary').click()
  assert.equal(await page.locator('.sample-followup').getAttribute('open'),null)
  assert((await page.locator('.sample-field').innerText()).includes('GET '+photoRequest('holiday photo.png').target))
  await page.getByRole('button',{name:'holiday20photo.png',exact:false}).click();assert((await page.locator('.sample-feedback').innerText()).includes('digits 20 are not kept'));await shot(page,`${device}-${theme}-1-retry`)
  await page.getByRole('button',{name:'holiday photo.png',exact:false}).click();assert((await page.locator('.sample-feedback').innerText()).includes('finished this introduction'));assert.equal(await page.locator('.sample-followup').getAttribute('open'),null);await shot(page,`${device}-${theme}-1-done`)
  await page.locator('.sample-followup>summary').click()
  await page.getByRole('button',{name:'Decode once',exact:false}).click();assert.equal(await page.locator('.sample-decode-strip>code').innerText(),'%2F');await shot(page,`${device}-${theme}-optional-one-pass`)
  await page.getByRole('button',{name:'Decode once',exact:false}).click();assert.equal(await page.locator('.sample-decode-strip>code').innerText(),'/');await page.locator('.sample-detail>summary').click();assert((await page.locator('.sample-order-example>strong').innerText()).includes('allowed'));await shot(page,`${device}-${theme}-optional-early-check`)
  await page.getByRole('button',{name:'Move the check after the final reader',exact:false}).click();assert((await page.locator('.sample-order-example>strong').innerText()).includes('stopped'));await shot(page,`${device}-${theme}-optional-final-check`)
 }
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('websec-decompiled:rebuild:v1')||'{}'));assert.deepEqual(saved.done||{},{});assert.deepEqual(saved.labs||{},{})
 await page.getByRole('button',{name:'Start again',exact:false}).click();await page.getByRole('button',{name:'Already know this?',exact:false}).click();assert.equal(await page.locator('.sample-lesson').getAttribute('data-sample-step'),'1')
 await page.getByRole('button',{name:'Part 1: See it happen',exact:true}).click();await page.locator('.skip').focus();await page.keyboard.press('Enter');assert(page.url().endsWith('#/sample/encoding'));assert.equal(await page.evaluate(()=>document.activeElement.id),'workspace')
 await context.close()
}
}finally{await browser.close()}
assert.deepEqual(errors,[])
await writeFile(resolve(output,'status.json'),JSON.stringify({status:'screenshots-awaiting-human-review',url:base,screenshots:shots,errors},null,2)+'\n')
console.log(`✓ Two-part encoding sample: concrete browser/server context, matching filename requests, one check with retry feedback, optional follow-up, skip/revisit navigation, desktop/mobile light/dark, contrast, and ${shots.length} screenshots.`)
