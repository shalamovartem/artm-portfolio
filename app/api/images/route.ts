import {promises as fs} from 'node:fs';
import path from 'node:path';
import {dataDir} from '../../../lib/storage';
import {authenticated,sameOrigin} from '../../../lib/auth';
export async function POST(request:Request){
 if(!(await authenticated()))return Response.json({error:'Требуется вход'},{status:401});
 if(!(await sameOrigin(request)))return Response.json({error:'Недопустимый источник'},{status:403});
 if(Number(request.headers.get('content-length'))>5000000)return Response.json({error:'Максимальный размер — 5 МБ'},{status:413});
 const data=await request.arrayBuffer();if(data.byteLength>5000000)return Response.json({error:'Максимальный размер — 5 МБ'},{status:413});
 const b=new Uint8Array(data);const str=(a:number,z:number)=>String.fromCharCode(...b.slice(a,z));
 const type=b[0]===255&&b[1]===216&&b[2]===255?'image/jpeg':b[0]===137&&str(1,4)==='PNG'?'image/png':str(0,3)==='GIF'?'image/gif':str(0,4)==='RIFF'&&str(8,12)==='WEBP'?'image/webp':null;
 if(!type)return Response.json({error:'Поддерживаются JPG, PNG, WebP и GIF'},{status:400});
 const key=crypto.randomUUID();await fs.mkdir(path.join(dataDir,'uploads'),{recursive:true});await fs.writeFile(path.join(dataDir,'uploads',key),Buffer.from(data));await fs.writeFile(path.join(dataDir,'uploads',key+'.json'),JSON.stringify({type}));
 return Response.json({url:'/api/images/'+key});
}
