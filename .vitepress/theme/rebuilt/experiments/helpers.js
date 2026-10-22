export const make=(title,fields,control,probe,run,scope='A local, fictional fixture. No requests are sent to a target.')=>({title,scope,fields:fields.map(([key,label])=>({key,label})),control,probe,run})
export const out=(trace,output,explanation,metadata={})=>({status:'neutral',...metadata,trace:Array.isArray(trace)?trace.join('\n'):trace,output:String(output),explanation})
export const yes=value=>['yes','true','1'].includes(String(value).toLowerCase())
export const number=(value,min=0,max=10000)=>{const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)throw Error(`Enter a number from ${min} to ${max}.`);return n}
export const parse=value=>JSON.parse(value)
export const allow=(value,options)=>{if(!options.includes(value))throw Error('Choose one of: '+options.join(', '));return value}
export const canonical=value=>{const segments=[];for(const segment of value.split('/'))if(segment==='..')segments.pop();else if(segment&&segment!=='.')segments.push(segment);return '/'+segments.join('/')}
export const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')
