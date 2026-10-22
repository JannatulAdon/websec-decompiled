import assert from 'node:assert/strict'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {wrap,unwrap,filenameJourney,symbolExamples} from '../.vitepress/theme/rebuilt/encoding-sample.js'
for(const x of symbolExamples){assert.equal(wrap(x.plain),x.encoded);assert.equal(unwrap(x.encoded),x.plain)}
assert.equal(unwrap('%252F'),'%2F');assert.equal(unwrap(unwrap('%252F')),'/')
const early=filenameJourney('folder%252Fphoto.png'),late=filenameJourney('folder%252Fphoto.png',true)
assert.equal(early.checked,'folder%2Fphoto.png');assert.equal(early.allowed,true);assert.equal(early.final,'folder/photo.png');assert.equal(late.checked,late.final);assert.equal(late.allowed,false)
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']})
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4173/websec-decompiled/',output=resolve(process.env.SAMPLE_QA_OUTPUT||'artifacts/encoding-sample')
await mkdir(output,{recursive:true})
const errors=[],shots=[]
async function shot(page,name){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+': viewport overflow');await page.screenshot({path:resolve(output,name+'.png'),fullPage:true});shots.push(name+'.png')}
const contrast=(a,b)=>{const lum=s=>{const c=s.match(/[\d.]+/g).slice(0,3).map(v=>{v=Number(v)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
try{
for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
 const context=await browser.newContext({viewport,reducedMotion:'reduce'});await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort())
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())})
 await page.goto(base+'#/learn/encoding/0');await page.getByRole('link',{name:'NEW LEARNING SAMPLE',exact:false}).click();await page.waitForURL('**/#/sample/encoding')
 assert.equal(await page.locator('.topbar:visible').count(),0)
 for(const dark of [false,true]){
  await page.getByRole('button',{name:'Start again',exact:false}).click()
  if(dark)await page.getByRole('button',{name:'Use dark appearance',exact:true}).click()
  const theme=dark?'dark':'light'
  const next=page.locator('.sample-controls .sample-primary')
  assert(await next.isDisabled());await shot(page,`${device}-${theme}-0-start`)
  const primary=page.getByRole('button',{name:'Send this filename',exact:false});const colors=await primary.evaluate(el=>{const s=getComputedStyle(el);return[s.color,s.backgroundColor]});assert(contrast(...colors)>=4.5)
  await primary.click();assert((await page.locator('.sample-photo').innerText()).includes('blue sky.png'));await shot(page,`${device}-${theme}-0-result`)
  await next.click();await page.getByRole('button',{name:'Decode %20',exact:false}).click();assert(await next.isDisabled());await page.getByRole('button',{name:'A slash /',exact:false}).click();await page.getByRole('button',{name:'Decode %2F',exact:false}).click();assert(await next.isEnabled());await shot(page,`${device}-${theme}-1-symbols`)
  await next.click();await page.getByRole('button',{name:'holiday20photo.png',exact:false}).click();assert(await next.isDisabled());await shot(page,`${device}-${theme}-2-retry`);await page.getByRole('button',{name:'holiday photo.png',exact:false}).click();await next.click()
  for(const [i,name] of ['Encode / once','Encode %2F again','Decode %252F once','Decode %2F once'].entries()){await page.getByRole('button',{name,exact:false}).click();if(i===2){assert.equal(await page.locator('.sample-current code').innerText(),'%2F');await shot(page,`${device}-${theme}-3-one-layer`)}}
  assert.equal(await page.locator('.sample-current code').innerText(),'/');await next.click()
  for(const name of ['Run the first reader','Run the filename check','Run the second reader'])await page.getByRole('button',{name,exact:false}).click()
  assert((await page.locator('.sample-pipeline').innerText()).includes('folder/photo.png'));assert(await next.isDisabled());await shot(page,`${device}-${theme}-4-early-check`)
  await page.getByRole('button',{name:'Move the check after the last reader',exact:false}).click();assert((await page.locator('.sample-rule-blocked').innerText()).includes('Slash found → stopped'));await shot(page,`${device}-${theme}-4-final-check`);await next.click()
  await page.getByRole('button',{name:'reports/2026.txt',exact:false}).click();assert(await next.isDisabled());await page.getByRole('button',{name:'reports%2F2026.txt',exact:false}).click();await page.getByRole('button',{name:'Before the second reader',exact:true}).click();assert(await next.isDisabled());await page.getByRole('button',{name:'After the final reader',exact:true}).click();await shot(page,`${device}-${theme}-5-transfer`)
  await page.getByRole('button',{name:'Let’s review',exact:false}).click();await shot(page,`${device}-${theme}-6-finish`)
  await page.getByRole('button',{name:'Step 4: Add another layer',exact:true}).click();assert.equal(await page.locator('.sample-current code').innerText(),'/')
 }
 // Samples don't silently award mastery or lab completion.
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('websec-decompiled:rebuild:v1')||'{}'));assert.deepEqual(saved.done||{},{});assert.deepEqual(saved.labs||{},{})
 await page.getByRole('button',{name:'Start again',exact:false}).click();await page.locator('.skip').focus();await page.keyboard.press('Enter');assert(page.url().endsWith('#/sample/encoding'));assert.equal(await page.evaluate(()=>document.activeElement.id),'workspace')
 await context.close()
}
}finally{await browser.close()}
assert.deepEqual(errors,[])
await writeFile(resolve(output,'status.json'),JSON.stringify({status:'screenshots-awaiting-human-review',url:base,screenshots:shots,errors},null,2)+'\n')
console.log(`✓ Encoding sample: layered decoding, validation order, all seven screens, retry feedback, progression gates, preserved review state, desktop/mobile, light/dark, contrast, and ${shots.length} screenshots.`)
