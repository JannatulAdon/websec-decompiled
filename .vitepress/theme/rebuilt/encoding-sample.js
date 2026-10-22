// One short introduction; decoding-order material is optional follow-up.
export const sampleSteps=['See it happen','Try one example']
export const wrap=value=>encodeURIComponent(value)
export const unwrap=value=>decodeURIComponent(value)
export const photoNames=['blue sky.png','holiday photo.png']
export function photoRequest(name){
 const encoded=wrap(name),decoded=unwrap(encoded)
 return {name,encoded,decoded,target:'/photo?name='+encoded,found:photoNames.includes(decoded)}
}
export function filenameJourney(raw,checkLast=false){
 const first=unwrap(raw),final=unwrap(first),checked=checkLast?final:first,allowed=!checked.includes('/')
 return {raw,first,final,checked,allowed,checkLast}
}
export const readChoices=[
 {text:'holiday photo.png',correct:true,feedback:'Yes. Mira’s URL reader turns %20 back into a space, so it can look up holiday photo.png.'},
 {text:'holiday20photo.png',correct:false,feedback:'%20 represents one space. The whole group becomes a space; the digits 20 are not kept.'},
 {text:'holiday/photo.png',correct:false,feedback:'A slash would be written %2F. This request contains %20, which represents a space.'}
]
