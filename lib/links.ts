const aliases=new Set(['artm.sh','www.artm.sh','shalamovartem.ru','www.shalamovartem.ru']);
export function internalLink(value:string,origin?:string){
 try{const base=origin||(typeof window!=='undefined'?window.location.origin:'https://artm.sh');const u=new URL(value,base);if(u.origin===new URL(base).origin||aliases.has(u.hostname))return u.pathname+u.search+u.hash}catch{}return null;
}
export function linkProps(value:string){const internal=internalLink(value);return internal!==null?{href:internal}:{href:value,...(/^https?:/i.test(value)?{target:'_blank',rel:'noopener noreferrer'}:{})}}
