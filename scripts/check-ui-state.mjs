// Vue rendering/state smoke tests without claiming browser or layout verification.
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {resolve,dirname,basename} from 'node:path'
import {pathToFileURL} from 'node:url'
import assert from 'node:assert/strict'
import {parse,compileScript} from '@vue/compiler-sfc'
const root=resolve('.vitepress/theme/rebuilt'),out=resolve('.vitepress/cache/ui-state')
await mkdir(out,{recursive:true})
for(const name of ['LearningApp','MiniSystem','Sandbox','PlainText','InvestigationDesk','PracticeGuide','AppResponse','HomeDemo']){
 const filename=resolve(root,name+'.vue'),source=await readFile(filename,'utf8')
 const {descriptor}=parse(source,{filename});const compiled=compileScript(descriptor,{id:name,inlineTemplate:true,templateOptions:{compilerOptions:{hoistStatic:false,cacheHandlers:false}}})
 const code=compiled.content.replace(/from\s+(['"])(\.[^'"]+)\1/g,(_,quote,spec)=>'from '+JSON.stringify(spec.endsWith('.vue')?'./'+basename(spec,'.vue')+'.mjs':pathToFileURL(resolve(dirname(filename),spec)).href))
 await writeFile(resolve(out,name+'.mjs'),code)
}
function element(type){const n={type,props:{},style:{},children:[],parent:null,value:'',checked:false,selected:false,addEventListener(){},removeEventListener(){},setAttribute(k,v){this.props[k]=v},removeAttribute(k){delete this.props[k]},focus(){},getRootNode(){return globalThis.document},get tagName(){return this.type.toUpperCase()},get options(){return this.children.filter(c=>c.type==='option')},get multiple(){return Boolean(this.props.multiple)}};return n}
const storage=new Map([['websec-decompiled:progress:v1',JSON.stringify({labs:{'lab-retrieve-hidden-data':{done:true}},notes:{labs:{'lab-retrieve-hidden-data':'old evidence kept'}},ui:{themePalette:'indigo'}})]])
globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}
const listeners={};let hash=''
globalThis.window={location:{pathname:'/websec-decompiled/',get hash(){return hash},set hash(value){hash=value;listeners.hashchange?.()}},history:{replaceState(a,b,url){hash=url}},addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener:name=>delete listeners[name],scrollTo(){}}
globalThis.Document=class Document{};globalThis.ShadowRoot=class ShadowRoot{}
globalThis.document={createElement:element,activeElement:null,querySelector:()=>null,documentElement:{dataset:{},classList:{toggle(){}},style:{}}}
const {createRenderer,nextTick}=await import('vue')
const renderer=createRenderer({
 createElement:element,createText:text=>({...element('#text'),text}),createComment:text=>({...element('#comment'),text}),
 setText:(node,text)=>node.text=text,setElementText:(node,text)=>{node.text=text;node.children=[]},
 insert(node,parent,anchor){if(node.parent){const at=node.parent.children.indexOf(node);if(at>=0)node.parent.children.splice(at,1)}node.parent=parent;const i=anchor?parent.children.indexOf(anchor):-1;if(i>=0)parent.children.splice(i,0,node);else parent.children.push(node)},
 remove(node){if(node.parent){const i=node.parent.children.indexOf(node);if(i>=0)node.parent.children.splice(i,1);node.parent=null}},parentNode:n=>n.parent,nextSibling:n=>n.parent?.children[n.parent.children.indexOf(n)+1],patchProp:(el,key,prev,next)=>{el.props[key]=next;if(['value','checked','selected'].includes(key))el[key]=next}
})
const {default:App}=await import(pathToFileURL(resolve(out,'LearningApp.mjs')))
const {state,KEY}=await import('../.vitepress/theme/rebuilt/store.js')
const {modules,cases:unused}=await import('../.vitepress/theme/rebuilt/curriculum.js')
const {cases}=await import('../.vitepress/theme/rebuilt/cases.js')
const host=element('root');const app=renderer.createApp(App);const warnings=[];app.config.warnHandler=msg=>warnings.push(msg)
app.mount(host)
const tick=async()=>{await nextTick();await nextTick()}
const all=(node=host)=>[node,...node.children.flatMap(c=>all(c))]
const text=node=>(node.text||'')+node.children.map(text).join('')
const find=(type,label)=>all().find(n=>n.type===type&&text(n).includes(label))
const click=async node=>{assert(node,'Control not found');const handler=node.props.onClick;assert(handler,'No click handler');if(Array.isArray(handler))for(const fn of handler)fn({target:node});else handler({target:node});await tick()}
const route=async value=>{window.location.hash='#'+value;await tick()}
try{
 await tick();assert(state.labs['lab-retrieve-hidden-data']);assert.equal(state.notes['lab-retrieve-hidden-data'],'old evidence kept');assert.equal(state.palette,'indigo')
 await route('/path');assert.equal(all().filter(n=>n.props.class==='module-row').length,35)
 await route('/learn/sql-injection/0');assert(find('h1','SQL injection'))
 await click(all().find(n=>n.props['aria-label']==='Ordinary request (load control)'));await click(all().find(n=>n.props['aria-label']==='Try a variation (load boundary probe)'));assert(all().some(n=>n.props['data-observation']?.includes('not released')))
 const boundary=all().find(n=>n.type==='input'&&n.props.type==='checkbox'&&n.props['onUpdate:modelValue']);boundary.props['onUpdate:modelValue'](true);boundary.props.onChange?.();await tick();assert(!all().some(n=>n.props['data-observation']?.includes('not released')))
 await click(find('button','Check understanding'))
 const l=modules.find(m=>m.id==='sql-injection').lessons[0]
 await click(find('button',l.evidence));await click(find('button',l.mechanism));await click(find('button','Save check & continue'))
 assert.equal(window.location.hash,'#/learn/sql-injection/1');assert(state.done['sql-injection:0'])
 await click(find('button','Transfer'));await click(find('button',cases['sql-injection'].correct));await click(find('button','Save transfer check'));assert(state.passed['sql-injection']);assert(state.reviews['sql-injection'])
 await route('/labs');assert.equal(all().filter(n=>String(n.props.class).split(' ').includes('lab-card')).length,12);assert(find('span','272 challenges'))
 const topic=all().find(n=>n.type==='select'&&n.children.some(c=>c.type==='option'&&c.props.value==='sql-injection'));topic.props['onUpdate:modelValue']('sql-injection');await tick();assert.equal(all().filter(n=>String(n.props.class).split(' ').includes('lab-card')).length,12);assert(find('span','18 challenges'))
 const labTitle=all().find(n=>n.type==='button'&&n.props.class==='lab-title-button');await click(labTitle)
 assert(find('h3','Review the underlying skills'));assert(find('textarea',''))
 await route('/reference');await click(find('button','Plain-English terms'));assert(find('dt','CORS'))
 await route('/progress');assert(find('h1','Understanding, over points.'));assert(JSON.parse(storage.get(KEY)).done['sql-injection:0'])
 assert.deepEqual(warnings,[])
 console.log('✓ Vue route rendering, editable SQL controls, gated lesson progression, transfer records, practice filters, legacy data migration, and persistence passed.')
 console.log('  This is a component/state test. It does not replace required Chromium screenshots.')
}finally{app.unmount()}
