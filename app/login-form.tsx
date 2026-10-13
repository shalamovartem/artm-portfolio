'use client';
import {useDialogFocus} from './use-dialog-focus';
import {useState} from 'react';
export default function LoginForm({onSuccess}:{onSuccess:()=>void|Promise<void>}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 return <form className="login-form fields" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');const f=new FormData(e.currentTarget);try{const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:f.get('username'),password:f.get('password')})});const d=await r.json();if(!r.ok)throw Error(d.error||'Не удалось войти');await onSuccess()}catch(e){setError(e instanceof Error?e.message:'Ошибка входа')}finally{setBusy(false)}}}>
 <span className="eyebrow">ЛИЧНОЕ ПРОСТРАНСТВО</span><h2>Вход в редактор</h2><p>Введите логин и пароль вашего сайта.</p>
 <label>Логин<input name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Ваш логин" required autoFocus/></label>
 <label>Пароль<input name="password" type="password" autoComplete="current-password" placeholder="Ваш пароль" required/></label>
 {error&&<p className="login-error" role="alert">{error}</p>}<button className="primary" disabled={busy}>{busy?'Входим…':'Войти в редактор'}</button></form>
}
export function LoginDialog({onSuccess,onClose}:{onSuccess:()=>void|Promise<void>;onClose:()=>void}){useDialogFocus(true,'.login-dialog');return <div className="modal-backdrop login-backdrop" onClick={onClose} onKeyDown={e=>{if(e.key==='Escape')onClose()}}><section className="dialog login-dialog" role="dialog" aria-modal="true" aria-label="Вход в редактор" onClick={e=>e.stopPropagation()}><button className="close" aria-label="Закрыть вход" onClick={onClose}>×</button><LoginForm onSuccess={onSuccess}/></section></div>}
