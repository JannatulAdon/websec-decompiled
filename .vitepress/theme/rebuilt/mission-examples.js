// Optional inputs for our own fictional fixtures. No Academy challenge solutions.
export const missionExamples={
 receipts:[{label:'Alice · receipt 41',session:'alice',input:'41'},{label:'Alice · receipt 42',session:'alice',input:'42'},{label:'Bob · receipt 42',session:'bob',input:'42'},{label:'Missing receipt',session:'alice',input:'99'}],
 preview:[{label:'Public image',input:'cat.png'},{label:'Parent directory',input:'../notes.txt'},{label:'Absolute path',input:'/srv/notes.txt'}],
 profile:[{label:'Display name only',input:'{"displayName":"Mira"}'},{label:'Include a staff field',input:'{"displayName":"Mira","isStaff":true}'},{label:'Staff field false',input:'{"displayName":"Mira","isStaff":false}'}],
 'shared-copy':[{label:'Ordinary host',input:'shop.example.test'},{label:'Different host',input:'other.example.test'},{label:'Separate cache key',path:'/help?trial=18',input:'other.example.test'}],
 coupon:[{label:'One after another',input:'A-check,A-use,B-check,B-use'},{label:'Overlapping checks',input:'A-check,B-check,A-use,B-use'}],
 'media-chain':[{label:'Browse a thumbnail',path:'/api/thumbnail',input:'cat.png'},{label:'Try its parent directory',path:'/api/thumbnail',input:'../notes.txt'},{label:'Import a public URL',path:'/api/import',input:'https://supplier.example.test/image'}]
}
