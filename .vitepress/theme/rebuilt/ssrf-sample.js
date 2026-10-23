// Fixed fictional endpoints. No URL here is ever fetched or navigated to.
export const PICTURE_URL='https://pictures.example.test/sky.png'
export const PRIVATE_URL='http://staff.intra.test/preview'
export const HTTPS_PRIVATE_URL='https://staff.intra.test/preview'
export const PRIVATE_CODE='STAFF-DEMO-42'
const endpoints={
 [PICTURE_URL]:{node:'picture',kind:'image',body:'Blue Sky',private:false},
 [PRIVATE_URL]:{node:'private',kind:'text',body:PRIVATE_CODE,private:true},
 [HTTPS_PRIVATE_URL]:{node:'private',kind:'text',body:PRIVATE_CODE,private:true}
}
export function fetchIllustration({target=PICTURE_URL,via='server',restricted=false}={}){
 if(!['server','browser'].includes(via))throw Error('Unknown sender')
 const endpoint=endpoints[target];if(!endpoint)throw Error('Choose one of this model’s fixed addresses')
 const url=new URL(target),denied=via==='server'&&restricted&&url.origin!=='https://pictures.example.test',unreachable=via==='browser'&&endpoint.private
 const contacted=!denied&&!unreachable,kind=contacted?endpoint.kind:'blocked'
 const edges=via==='server'?denied?['submit']:['submit',endpoint.node==='private'?'server-private':'server-picture',endpoint.node==='private'?'private-server':'picture-server','return']:unreachable?['browser-blocked']:['browser-picture']
 return {via,target,restricted,destination:endpoint.node,private:endpoint.private,contacted,kind,edges,body:denied?'Destination rejected before fetching.':unreachable?'No route from your browser to this private service.':endpoint.body,
 title:denied?'The server stops before contacting the private service.':unreachable?'Your browser cannot reach this service.':via==='browser'?'Your browser fetches the picture directly.':endpoint.private?'Studio returned the staff preview code.':'The Studio server downloads the public picture.',
 explanation:denied?'The destination rule permits only https://pictures.example.test. The internal service receives no request.':unreachable?'Studio’s server can reach this internal service from its network. Your browser has no route there in this model.':via==='browser'?'Studio is not fetching this URL. A browser request is different from a server-side request.':endpoint.private?'Studio fetched the staff page from its own network and returned its code to you. Your browser did not contact the staff page directly.':'Your browser submitted a link to Studio. Studio’s server fetched the image, then sent it back. This is the intended feature.'}
}
export const networkNodes={browser:{title:'Your browser',note:'The program on your computer. It can visit Studio’s public website but cannot reach its staff page directly.'},server:{title:'Studio server',note:'The computer running Postcard Studio. It makes a separate request to the address supplied in the import feature.'},picture:{title:'Picture host',note:'A public server with the Blue Sky image. Both your browser and Studio can reach it.'},private:{title:'Staff page',note:'A private preview page inside Studio’s network. In this example it relies on network isolation, without an extra password.'}}
