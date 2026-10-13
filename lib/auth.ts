import {cookies,headers} from 'next/headers';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {createHmac,timingSafeEqual,scryptSync} from 'node:crypto';
import {dataDir} from './storage';
export async function adminConfig(){try{return JSON.parse(await fs.readFile(path.join(dataDir,'admin.json'),'utf8')) as {username:string;salt:string;hash:string;secret:string}}catch{return null}}
export async function authenticated(){const c=await adminConfig();const token=(await cookies()).get('portfolio_session')?.value;if(!c||!token)return false;const [expires,signature]=token.split('.');if(!signature||Number(expires)<Date.now())return false;const expected=createHmac('sha256',c.secret).update(expires).digest('hex');return signature.length===expected.length&&timingSafeEqual(Buffer.from(signature),Buffer.from(expected))}
export function checkPassword(password:string,c:{salt:string;hash:string}){const hash=scryptSync(password,c.salt,64).toString('hex');return hash.length===c.hash.length&&timingSafeEqual(Buffer.from(hash),Buffer.from(c.hash))}
export async function sameOrigin(request:Request){const h=await headers();const host=h.get('x-forwarded-host')||h.get('host');try{const origin=new URL(request.headers.get('origin')||'');return process.env.PUBLIC_ORIGIN?origin.origin===new URL(process.env.PUBLIC_ORIGIN).origin:origin.host===host}catch{return false}}
export function sessionToken(secret:string){const expiry=String(Date.now()+12*60*60*1000);return expiry+'.'+createHmac('sha256',secret).update(expiry).digest('hex')}
