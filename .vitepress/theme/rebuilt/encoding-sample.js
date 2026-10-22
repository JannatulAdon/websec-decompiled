// The prototype deliberately teaches one small part of the encoding module.
export const sampleSteps=['A filename arrives','Meet the code','Read it yourself','Add another layer','Watch two readers','Try a new example','Keep the idea']
export const symbolExamples=[{label:'A space',plain:' ',encoded:'%20'},{label:'A slash /',plain:'/',encoded:'%2F'},{label:'A percent sign %',plain:'%',encoded:'%25'}]
export const pictureInput='blue%20sky.png'
export const wrap=value=>encodeURIComponent(value)
export const unwrap=value=>decodeURIComponent(value)
export function filenameJourney(raw,checkLast=false){
 const first=unwrap(raw),final=unwrap(first),checked=checkLast?final:first,allowed=!checked.includes('/')
 return {raw,first,final,checked,allowed,checkLast}
}
export const readChoices=[{text:'holiday photo.png',correct:true,feedback:'Yes. The reader replaces %20 with one space. The rest of the filename stays the same.'},{text:'holiday20photo.png',correct:false,feedback:'The 20 is part of the code %20. The reader replaces all three characters with a space; it does not keep the digits.'},{text:'holiday/photo.png',correct:false,feedback:'A slash is written %2F. This filename contains %20, which represents a space.'}]
export const transferChoices=[{text:'reports%2F2026.txt',correct:true,feedback:'Exactly. One pass replaces %25 with %. That leaves %2F in the result. Another pass would be needed to turn that into /.'},{text:'reports/2026.txt',correct:false,feedback:'That is the result after two passes. In the first pass, only %25 becomes %. The remaining 2F is not decoded again during that pass.'},{text:'reports252F2026.txt',correct:false,feedback:'Decoding replaces %25 with a percent sign. It does not just remove the percent sign.'}]
