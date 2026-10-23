import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const output=resolve('artifacts/scenes'),base=process.env.QA_BASE_URL||'http://127.0.0.1:4173/websec-decompiled/'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']})
const errors=[],screenshots=[]
const cases=[['foundations',0,'request'],['foundations',1,'session'],['encoding',0,'transform'],['sql-injection',0,'query'],['path-traversal',0,'path'],['access-control',0,'ownership'],['business-logic',0,'money'],['race-conditions',0,'race'],['xss',0,'dom'],['ssrf',2,'network'],['cache-poisoning',0,'cache'],['request-smuggling',0,'framing'],['graphql',0,'facts']]
try{
 for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'})
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort())
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message))
  await page.goto(base);await page.locator('html[data-atmosphere]').waitFor()
  for(const [theme,palette,dark] of [['dark','ocean',true],['light','espresso',false]]){
   await page.evaluate(({palette,dark})=>{const key='websec-decompiled:rebuild:v1';const raw=JSON.parse(localStorage.getItem(key)||'{"version":1,"done":{},"labs":{}}');localStorage.setItem(key,JSON.stringify({...raw,palette,dark}))},{palette,dark})
   await page.reload();await page.waitForFunction(dark=>document.documentElement.classList.contains('dark')===dark,dark)
   for(const [module,index,kind] of cases){
    await page.goto(base+`#/learn/${module}/${index}`);await page.locator('.lesson-tools>summary').click();await page.locator('.lesson-experience-switch button').click()
    await page.getByRole('button',{name:'Ordinary request (load control)',exact:true}).click()
    await page.getByRole('button',{name:'Try a variation (load boundary probe)',exact:true}).click()
    assert.equal(await page.locator('.experiment-panel .model-scene').getAttribute('data-scene'),kind)
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${device}/${theme}/${kind}: overflow`)
    const name=`${device}-${theme}-${kind}.png`;await page.screenshot({path:resolve(output,name),fullPage:true});screenshots.push(name)
   }
  }
  // Equal outputs can hide a different interpretation. Keep both facts visible.
  await page.goto(base+'#/learn/foundations/0');await page.locator('.lesson-tools>summary').click();await page.locator('.lesson-experience-switch button').click()
  await page.getByRole('button',{name:'Ordinary request (load control)',exact:true}).click()
  await page.getByRole('button',{name:'POST',exact:true}).click()
  assert((await page.locator('.experiment-panel .lens-state').innerText()).includes('Interpretation changed · same response'))
  await page.getByRole('button',{name:'③ Compare results',exact:false}).click()
  assert(await page.locator('.experiment-panel .trace-difference').getAttribute('open')!==null)
  const comparison=page.getByRole('combobox',{name:'Compare against',exact:true});await comparison.selectOption('2')
  assert((await comparison.locator('option:checked').innerText()).includes('current'))
  await page.screenshot({path:resolve(output,`${device}-same-response-different-trace.png`),fullPage:true});screenshots.push(`${device}-same-response-different-trace.png`)
  await context.close()
 }
}finally{await browser.close()}
assert.deepEqual(errors,[])
await writeFile(resolve(output,'status.json'),JSON.stringify({status:'screenshots-awaiting-human-review',screenshots,errors},null,2)+'\n')
console.log(`✓ ${screenshots.length} scene screenshots: thirteen scene kinds, desktop/mobile, dark/light, and equal-response interpretation comparisons.`)
