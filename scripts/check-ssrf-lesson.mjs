import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {modules,academyLabs} from '../.vitepress/theme/rebuilt/curriculum.js'
import {PICTURE_URL,PRIVATE_URL,PRIVATE_CODE,IMPORT_ENDPOINT} from '../.vitepress/theme/rebuilt/ssrf-runtime.js'
import {PREVIEW_URL,REPORT_URL} from '../.vitepress/theme/rebuilt/ssrf-transfer.js'

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4173/websec-decompiled/'
const out=resolve(process.env.SSRF_LESSON_QA_OUTPUT||'artifacts/ssrf-lesson')
const progressKey='websec-decompiled:rebuild:v1'
const seed={version:1,done:{[modules[0].lessons[0].id]:true},explored:{},missions:{},passed:{},labs:{[academyLabs[0].id]:true},saved:{[academyLabs[1].id]:true},notes:{ssrf:'My existing SSRF notes must survive.'},reviews:{},last:'',palette:'ocean',dark:false}
const errors=[],shots=[]
let activePage=null,activeTag=''
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']})

async function shot(page,name){
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+': horizontal overflow')
 await page.screenshot({path:resolve(out,name+'.png'),fullPage:true})
 shots.push(name+'.png')
}

async function visibleInViewport(locator,page,label){
 const box=await locator.boundingBox(),height=await page.evaluate(()=>innerHeight)
 assert(box&&box.y>=0&&box.y+box.height<=height,label+' is visible without scrolling')
}

function contrast(a,b){
 const lum=s=>{const c=s.match(/[\d.]+/g).slice(0,3).map(v=>{v=Number(v)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
 const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)
}

async function readableButton(locator,label){
 const colors=await locator.evaluate(el=>[getComputedStyle(el).color,getComputedStyle(el).backgroundColor])
 assert(contrast(...colors)>=4.5,label+': primary text contrast')
}

async function checkLesson(page,tag){
 const primary=page.locator('.ssrf-lesson .sl-primary')
 const heading=page.locator('.sl-heading')
 const next=label=>page.getByRole('button',{name:label,exact:true})
 async function focused(selector){
  await page.waitForFunction(s=>document.activeElement?.matches(s),selector)
  const box=await page.locator(selector).boundingBox(),height=await page.evaluate(()=>innerHeight)
  assert(box&&box.y>=0&&box.y<height-30,tag+' focused '+selector+': leading content is visible')
 }
 assert.equal(await heading.innerText(),'Import a photo into Studio.')
 assert.equal(await primary.count(),1,'The first lesson task offers one primary action')
 assert.equal(await page.getByRole('tab').count(),0,'Inspector tabs are deferred')
 assert.equal(await page.getByRole('radio').count(),0,'No unexplained choices before the normal example')
 assert.equal(await page.getByRole('button',{name:'Open the request workbench',exact:true}).count(),0)
 assert.equal(await page.getByLabel('Photo URL',{exact:true}).inputValue(),PICTURE_URL)
 assert(await page.getByLabel('Photo URL',{exact:true}).getAttribute('readonly')!==null)
 await visibleInViewport(next('Import photo'),page,tag+' initial Import action')
 await readableButton(next('Import photo'),tag)
 await shot(page,tag+'-00-start')

 await next('Import photo').click()
 await page.waitForFunction(()=>document.querySelector('.sl-photo-result img')?.naturalWidth>0)
 assert.equal(await page.locator('#normal-result .sl-value').innerText(),PICTURE_URL)
 assert((await page.locator('#normal-result .sl-record').nth(0).innerText()).includes(new URL(IMPORT_ENDPOINT).pathname))
 assert((await page.locator('#normal-result .sl-record').nth(1).innerText()).includes('GET '+PICTURE_URL))
 assert.equal(await primary.count(),1,'After import the next action replaces Import')
 await focused('#normal-result')
 await shot(page,tag+'-01-normal-evidence')
 await next('Now try a staff-only address').click()
 await focused('.sl-heading')
 assert.equal(await heading.innerText(),'Use the server’s access.')
 assert.equal(await page.getByLabel('Address',{exact:true}).inputValue(),PRIVATE_URL)
 assert.equal(await primary.count(),1)
 await shot(page,tag+'-02-browser-attempt')

 await next('Open the staff address').click()
 await page.locator('#direct-result').waitFor()
 assert((await page.locator('#direct-result').innerText()).includes('No HTTP response was received'))
 assert.equal(await page.locator('#internal-result').count(),0,'Direct browser test cannot expose server results')
 await focused('#direct-result')
 await shot(page,tag+'-03-browser-blocked')
 await next('Use this address in Studio').click()
 assert.equal(await page.getByLabel('Photo URL · changed',{exact:true}).inputValue(),PRIVATE_URL)
 assert((await page.locator('.sl-before').innerText()).includes(PICTURE_URL))
 assert.equal(await page.locator('#internal-result').count(),0,'Changing a field does not submit it')
 assert.equal(await primary.count(),1)
 await focused('#changed-field')
 await shot(page,tag+'-04-changed-destination')

 await next('Import this URL').click()
 await page.locator('#internal-result').waitFor()
 assert((await page.locator('#internal-result .sl-record').innerText()).includes('GET '+PRIVATE_URL))
 assert.equal(await page.locator('#internal-result pre').innerText(),PRIVATE_CODE)
 assert((await page.locator('.sl-nonimage').innerText()).includes('Cannot display this as an image'))
 assert((await page.locator('.sl-definition').innerText()).includes('server-side request forgery'))
 await focused('#internal-result')
 await shot(page,tag+'-05-internal-data')
 await next('Check why this worked').click()
 await focused('.sl-heading')
 assert(await next('Check explanation').isDisabled(),'A choice is required before checking')

 await page.getByRole('radio',{name:'The photo field gave my browser access to the internal network.',exact:true}).check()
 await next('Check explanation').click()
 assert((await page.locator('#causal-feedback').innerText()).includes('Your browser still could not reach'))
 assert.equal(await next('Try it in a different application').count(),0,'An incorrect explanation does not advance the learner')
 await focused('#causal-feedback')
 await shot(page,tag+'-06-causal-feedback')
 await page.getByRole('radio',{name:'The image error bypassed the staff page’s protection.',exact:true}).check()
 assert.equal(await page.locator('#causal-feedback').count(),0,'Changing an answer clears its old verdict')
 await next('Check explanation').click()
 assert((await page.locator('#causal-feedback').innerText()).includes('response already contained the staff page'))
 assert.equal(await next('Try it in a different application').count(),0)
 // Native radio keyboard interaction must work as well as pointer selection.
 await page.getByRole('radio',{name:'The image error bypassed the staff page’s protection.',exact:true}).focus()
 await page.keyboard.press('ArrowUp')
 assert(await page.getByRole('radio',{name:'Studio’s server made the request from its own network, using the address I supplied.',exact:true}).isChecked())
 await next('Check explanation').click()
 assert((await page.locator('#causal-feedback').innerText()).includes('That explains the difference'))
 await shot(page,tag+'-07-causal-understanding')

 // Reviewing the mechanism preserves the previously observed evidence.
 await next('← Previous section').click()
 assert.equal(await page.locator('#internal-result pre').innerText(),PRIVATE_CODE)
 await next('Check why this worked').click()
 await next('Try it in a different application').click()
 await focused('.sl-heading')
 assert.equal(await heading.innerText(),'Try the same idea in another app.')
 assert(await next('Run preview').isDisabled(),'The transfer task has no preselected correct choice')
 assert.equal(await page.locator('#transfer-result').count(),0)
 await shot(page,tag+'-08-transfer-start')

 await page.getByRole('radio',{name:'Put the report address in the display title.',exact:true}).check()
 assert((await page.locator('.sl-payload').innerText()).includes(REPORT_URL))
 await next('Run preview').click()
 await page.waitForFunction(()=>document.querySelector('#transfer-result')&&document.querySelector('.sl-transfer').getAttribute('aria-busy')==='false')
 assert((await page.locator('#transfer-result .sl-record').innerText()).includes('GET '+PREVIEW_URL))
 assert.equal(await page.locator('#transfer-result pre').innerText(),'Welcome to the public documentation.')
 assert((await page.locator('.sl-transfer-feedback').innerText()).includes('The title changed, but the server still fetched'))
 assert.equal(await page.locator('.sl-evidence-check').count(),0)
 await focused('#transfer-result')
 await shot(page,tag+'-09-transfer-title')
 await page.getByRole('radio',{name:'Change the preview colour to green.',exact:true}).check()
 assert((await page.locator('.sl-payload').innerText()).includes('not sent yet'))
 assert((await page.locator('#transfer-result .sl-record').innerText()).includes(PREVIEW_URL),'Unsent draft retains the previous request evidence')
 await next('Run preview').click()
 await page.waitForFunction(()=>document.querySelector('#transfer-result')&&document.querySelector('.sl-transfer').getAttribute('aria-busy')==='false')
 assert((await page.locator('#transfer-result .sl-record').innerText()).includes('GET '+PREVIEW_URL))
 assert((await page.locator('.sl-transfer-feedback').innerText()).includes('The colour changed'))
 assert.equal(await page.locator('.sl-evidence-check').count(),0)

 await page.getByRole('radio',{name:'Replace the page URL with the report address.',exact:true}).check()
 assert((await page.locator('#transfer-result .sl-record').innerText()).includes(PREVIEW_URL))
 await next('Run preview').click()
 await page.waitForFunction(()=>document.querySelector('#transfer-result')&&document.querySelector('.sl-transfer').getAttribute('aria-busy')==='false')
 assert((await page.locator('#transfer-result .sl-record').innerText()).includes('GET '+REPORT_URL))
 assert.equal(await page.locator('#transfer-result pre').innerText(),'Internal expense summary: DEMO-ONLY')
 assert(await next('Check evidence').isDisabled())
 await shot(page,tag+'-10-transfer-internal')
 await page.getByRole('radio',{name:'The form has a field that accepts a URL.',exact:true}).check()
 await next('Check evidence').click()
 assert((await page.locator('#evidence-feedback').innerText()).includes('An editable URL is a place to investigate, not proof'))
 assert.equal(await next('Finish this lesson').count(),0)
 await focused('#evidence-feedback')
 await shot(page,tag+'-11-transfer-feedback')
 await page.getByRole('radio',{name:'A preview tool can sometimes show an error.',exact:true}).check()
 await next('Check evidence').click()
 assert((await page.locator('#evidence-feedback').innerText()).includes('An error alone does not identify'))
 assert.equal(await next('Finish this lesson').count(),0)
 await page.getByRole('radio',{name:'The server requested the unintended internal address and returned the report.',exact:true}).check()
 await next('Check evidence').click()
 await next('Finish this lesson').click()
 await focused('.sl-heading')
 assert.equal(await heading.innerText(),'You have seen the core of SSRF.')
 assert((await page.locator('.sl-finish').innerText()).includes('SSRF can also exist without returning the fetched content'))
 await shot(page,tag+'-12-finish')

 // Advanced inspection is reachable after the core lesson; returning preserves it.
 await next('Open the request workbench').click()
 await page.locator('.ssrf-workbench').waitFor()
 await next('Back to the lesson').click()
 assert.equal(await heading.innerText(),'You have seen the core of SSRF.')
 assert.equal(await page.locator('.ssrf-lesson').evaluate(el=>el.classList.contains('sl-night')),tag.endsWith('dark'))
 await page.locator('.sl-review summary').click()
 await next('Show explanation').click()
 assert((await page.locator('.sl-review').innerText()).includes('An empty response does not rule it out'))
 await shot(page,tag+'-13-recall')

 await page.locator('.skip').focus()
 await page.keyboard.press('Enter')
 assert(page.url().endsWith('#/sample/ssrf'))
 assert.equal(await page.evaluate(()=>document.activeElement.id),'workspace')
}

try{
 for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
  for(const dark of [false,true]){
   const context=await browser.newContext({viewport,reducedMotion:'reduce'})
   await context.addInitScript(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:progressKey,value:seed})
   await context.route('**/*',route=>{
    const url=new URL(route.request().url())
    if(url.origin===new URL(base).origin)return route.continue()
    errors.push('Unexpected external request: '+url.href)
    return route.abort()
   })
   const page=await context.newPage()
   activePage=page;activeTag=device+'-'+(dark?'dark':'light')
   page.setDefaultTimeout(20000)
   page.on('pageerror',error=>errors.push(error.message))
   page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
   page.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url())})
   if(device==='desktop'&&!dark){
    await page.goto(base)
    await page.getByRole('link',{name:'Learn SSRF, one request at a time',exact:false}).click()
    await page.waitForURL('**/#/sample/ssrf')
   }else await page.goto(base+'#/sample/ssrf')
   if(dark)await page.getByRole('button',{name:'Use dark appearance',exact:true}).click()
   const before=await page.evaluate(key=>localStorage.getItem(key),progressKey)
   await checkLesson(page,device+'-'+(dark?'dark':'light'))
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),progressKey),before,'Lesson interactions preserve all existing learner records')
   await context.close()
   activePage=null
  }
 }
 assert.deepEqual(errors,[])
 await writeFile(resolve(out,'status.json'),JSON.stringify({status:'screenshots-awaiting-human-review',url:base,screenshots:shots,errors},null,2)+'\n')
 console.log(`✓ SSRF guided lesson: desktop/mobile × light/dark, ${shots.length} screenshots; learner records preserved.`)
}catch(error){
 if(activePage&&!activePage.isClosed())await activePage.screenshot({path:resolve(out,activeTag+'-failure.png'),fullPage:true}).catch(()=>{})
 await writeFile(resolve(out,'status.json'),JSON.stringify({status:'failed',url:base,screenshots:shots,errors:[...errors,error.stack]},null,2)+'\n')
 throw error
}finally{await browser.close()}
