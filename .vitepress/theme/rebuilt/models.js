export function inertHTML(markup){const template=document.createElement('template');template.innerHTML=markup;return {body:template.content,querySelector:selector=>template.content.querySelector(selector)}}
// Restricted local interpreters; deliberately no eval, shell, network, or executable HTML.
const products=[{name:'Field notebook',category:'Books',released:1},{name:'Proxy handbook',category:'Books',released:1},{name:'Unreleased field kit',category:'Tools',released:0},{name:'Cable tester',category:'Tools',released:1}]
function predicate(text){
 const tokens=[];let i=0
 while(i<text.length){
  if(/\s/.test(text[i])){i++;continue}
  if(text.slice(i,i+2)==='--')break
  if(text[i]==="'"){
   let value='';i++;let closed=false
   while(i<text.length){if(text[i]==="'"){if(text[i+1]==="'"){value+="'";i+=2}else{i++;closed=true;break}}else value+=text[i++]}
   if(!closed)throw Error('Unclosed string literal in this model.');tokens.push({kind:'value',value});continue
  }
  const match=text.slice(i).match(/^(AND|OR)\b|^(category|released)\b|^([0-9]+)|^([=()])/i)
  if(!match)throw Error('Unsupported syntax. This model supports strings, integers, =, AND, OR, parentheses, and -- comments only.')
  const raw=match[0];tokens.push(match[1]?{kind:raw.toUpperCase()}:match[2]?{kind:'field',value:raw.toLowerCase()}:match[3]?{kind:'value',value:Number(raw)}:{kind:raw});i+=raw.length
 }
 let pos=0
 const take=(kind)=>{if(tokens[pos]?.kind!==kind)throw Error(`Expected ${kind}; received ${tokens[pos]?.kind||'end of input'}.`);return tokens[pos++]}
 const value=()=>{const token=tokens[pos++];if(!token||!['value','field'].includes(token.kind))throw Error('Expected a literal or known field.');return row=>token.kind==='field'?row[token.value]:token.value}
 const atom=()=>{if(tokens[pos]?.kind==='('){pos++;const fn=or();take(')');return fn}const left=value();take('=');const right=value();return row=>left(row)===right(row)}
 const and=()=>{let fn=atom();while(tokens[pos]?.kind==='AND'){pos++;const a=fn,b=atom();fn=row=>a(row)&&b(row)}return fn}
 const or=()=>{let fn=and();while(tokens[pos]?.kind==='OR'){pos++;const a=fn,b=and();fn=row=>a(row)||b(row)}return fn}
 const fn=or();if(pos!==tokens.length)throw Error('Extra tokens after the modeled expression.');return {fn,tokens}
}
export function sqlModel(input,safe=false){
 const query=safe?'SELECT name FROM products WHERE category = ? AND released = 1':`SELECT name FROM products WHERE category = '${input}' AND released = 1`
 try{const parsed=safe?null:predicate(`category = '${input}' AND released = 1`);const rows=products.filter(safe?r=>r.category===input&&r.released===1:parsed.fn);return {trace:query+(safe?'\nBound value: '+JSON.stringify(input):'\nInterpretation: '+parsed.tokens.map(t=>t.kind==='value'?JSON.stringify(t.value):t.value||t.kind).join(' ')),output:rows.length?rows.map(r=>r.name+(r.released?'':' [not released]')).join('\n'):'No matching products.',explanation:safe?'The category is compared as a literal value. Quotes and operators inside it never enter the expression parser.':'This restricted interpreter evaluates the constructed WHERE expression. It models precedence and comments, not a complete database.'}}catch(e){return {trace:query,output:'Model parse error: '+e.message,explanation:'An error establishes only that this input broke the supported grammar. It is not proof of extraction or safety.'}}
}
export function pathModel(input,safe=false){
 let decoded
 try{decoded=decodeURIComponent(input)}catch{return {trace:'URL decode failed',output:'Invalid percent encoding.',explanation:'The file operation was not reached.'}}
 const full=decoded.startsWith('/')?decoded:'/srv/images/'+decoded
 const segments=[];for(const s of full.split('/')){if(s==='..')segments.pop();else if(s&&s!=='.')segments.push(s)}
 const canonical='/'+segments.join('/')
 const allowed=canonical.startsWith('/srv/images/')
 const files={'/srv/images/cat.png':'[cat image bytes]','/srv/notes.txt':'Private note: development preview is not released.','/srv/images/readme.txt':'Public image directory.'}
 return {trace:`Input: ${input}\nOne URL decode: ${decoded}\nResolved path: ${canonical}\nRoot containment: ${allowed?'inside':'outside'} /srv/images/`,output:safe&&!allowed?'Blocked: resolved path is outside the allowed root.':files[canonical]||'File not found in the teaching filesystem.',explanation:safe?'The policy checks the canonical resolved path before accessing the file.':'The model joins paths but never enforces containment. It has three fixed local sample files and never reads your filesystem.'}
}
export function htmlModel(input,safe=false){
 const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')
 const markup='<p>Search: '+(safe?escape(input):input)+'</p>'
 const doc=inertHTML(markup)
 const elements=[...doc.body.querySelectorAll('*')].map(el=>'<'+el.tagName.toLowerCase()+(el.attributes.length?' '+[...el.attributes].map(a=>`${a.name}=${JSON.stringify(a.value)}`).join(' '):'')+'>')
 return {trace:markup,output:'Parsed elements:\n'+elements.join('\n')+'\n\nVisible text:\n'+doc.body.textContent,explanation:safe?'Context-appropriate HTML text encoding leaves your input as text. No new input-controlled elements are created.':'The browser parser can create new elements from unescaped markup. This detached document never runs scripts or handlers; element creation alone does not prove XSS execution.'}
}
