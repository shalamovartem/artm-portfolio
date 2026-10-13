import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomBytes,scryptSync} from 'node:crypto';
import readline from 'node:readline/promises';
try{process.loadEnvFile('.env.local')}catch(e){if(e.code!=='ENOENT')throw e}
const rl=readline.createInterface({input:process.stdin,output:process.stdout});
const username=(await rl.question('Логин администратора: ')).trim();
rl.close();
async function secret(prompt){if(!process.stdin.isTTY)throw Error('Запустите команду в интерактивном SSH-терминале.');process.stdout.write(prompt);process.stdin.setRawMode(true);process.stdin.resume();return new Promise((resolve,reject)=>{let value='';const handler=chunk=>{for(const ch of chunk.toString()){if(ch==='\u0003'){cleanup();reject(Error('Отменено'));return}if(ch==='\r'||ch==='\n'){cleanup();resolve(value);return}if(ch==='\u007f'){value=value.slice(0,-1)}else value+=ch}};function cleanup(){process.stdin.off('data',handler);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n')}process.stdin.on('data',handler)})}
const password=await secret('Пароль (не отображается, минимум 12 символов): ');const confirm=await secret('Повторите пароль: ');
if(!username||password.length<12||password!==confirm)throw Error('Проверьте логин, длину пароля и совпадение.');
const salt=randomBytes(32).toString('hex');const dir=path.resolve(process.env.DATA_DIR||'data');await mkdir(dir,{recursive:true});await writeFile(path.join(dir,'admin.json'),JSON.stringify({username,salt,hash:scryptSync(password,salt,64).toString('hex'),secret:randomBytes(48).toString('hex')}),{mode:0o600});console.log('Администратор сохранён. Старые сеансы входа завершены.');
