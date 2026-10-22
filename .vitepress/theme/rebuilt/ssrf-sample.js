// Fixed fictional endpoints. No URL here is ever fetched or navigated to.
export const PICTURE_URL='https://pictures.example.test/sky.png'
export const PRIVATE_URL='http://status.intra.test/health'
export const HTTPS_PRIVATE_URL='https://status.intra.test/health'
const endpoints={
 [PICTURE_URL]:{node:'picture',kind:'image',body:'Blue Sky',private:false},
 [PRIVATE_URL]:{node:'private',kind:'text',body:'preview_mode: enabled\nbuild: SAMPLE-17',private:true},
 [HTTPS_PRIVATE_URL]:{node:'private',kind:'text',body:'preview_mode: enabled\nbuild: SAMPLE-17',private:true}
}
export function fetchIllustration({target=PICTURE_URL,via='server',restricted=false}={}){
 if(!['server','browser'].includes(via))throw Error('Unknown sender')
 const endpoint=endpoints[target];if(!endpoint)throw Error('Choose one of this model’s fixed addresses')
 const url=new URL(target),denied=via==='server'&&restricted&&url.origin!=='https://pictures.example.test',unreachable=via==='browser'&&endpoint.private
 const contacted=!denied&&!unreachable,kind=contacted?endpoint.kind:'blocked'
 const edges=via==='server'?denied?['submit']:['submit',endpoint.node==='private'?'server-private':'server-picture',endpoint.node==='private'?'private-server':'picture-server','return']:unreachable?['browser-blocked']:['browser-picture']
 return {via,target,restricted,destination:endpoint.node,private:endpoint.private,contacted,kind,edges,body:denied?'Destination rejected before fetching.':unreachable?'No route from your browser to this private service.':endpoint.body,
 title:denied?'The server stops before contacting the private service.':unreachable?'Your browser cannot reach this service.':via==='browser'?'Your browser fetches the picture directly.':endpoint.private?'The Studio server returns private status data.':'The Studio server downloads the public picture.',
 explanation:denied?'The destination rule permits only https://pictures.example.test. The internal service receives no request.':unreachable?'The same address worked through Studio because its server has a different network position. Your browser has no route there in this model.':via==='browser'?'Studio is not fetching this URL. A browser request is different from a server-side request.':endpoint.private?'You controlled the destination; Studio made the request from its own network and relayed the response to you. This is the SSRF in this example.':'Your browser submitted a link to Studio. Studio’s server fetched the image, then sent it back. This is the intended feature.'}
}
export const networkNodes={browser:{title:'Your browser',note:'Your computer, outside Studio’s private network.'},server:{title:'Studio server',note:'Accepts your import request, then makes its own request to the supplied URL.'},picture:{title:'Picture host',note:'A public server with the Blue Sky image. Both your browser and Studio can reach it.'},private:{title:'Private status service',note:'Reachable from Studio’s network in this fixture. It has no extra login check here; real internal services may have their own authorization.'}}
