import {copy} from './language.js';
export function siteLinks(lang='en'){
 const root=lang==='ar'?'/ar/':'/';
 return {home:root,games:root+'#library',profile:'/arcade/index.html#profile',rankings:'/rankings.html',tiers:'/tiers.html',community:'/community.html',missions:'/missions.html',stores:'/arcade/index.html#discover',creators:root+'#credits'};
}
export function renderSiteHeader(lang='en',{languageLinks}={}){
 const c=copy[lang==='ar'?'ar':'en'],links=siteLinks(lang);
 const picker=languageLinks?['en','ar'].map(l=>`<a href="${languageLinks[l]}" data-site-language="${l}" lang="${l}" ${lang===l?'aria-current="page"':''}>${l==='en'?'English':'العربية'}</a>`).join(''):['en','ar'].map(l=>`<button type="button" data-language="${l}" lang="${l}" aria-pressed="${lang===l}">${l==='en'?'English':'العربية'}</button>`).join('');
 return `<header class="top"><div class="wrap"><a class="brand" href="${links.home}" data-site-link="home" aria-label="${c.home}" data-t-label="home">ZYVOQI<i>X</i></a><button type="button" class="menu-toggle" id="siteMenu" aria-controls="siteNav" aria-expanded="false" data-t="menu">${c.menu}</button><nav id="siteNav" aria-label="${c.navigation}" data-t-label="navigation">${Object.entries(links).map(([key,url])=>`<a href="${url}" data-site-link="${key}" data-t="${key}">${c[key]}</a>`).join('')}</nav><div class="language-picker" role="group" aria-label="${c.language}" data-t-label="language">${picker}</div></div></header>`;
}
export function updateSiteLinks(lang){
 const links=siteLinks(lang);document.querySelectorAll('[data-site-link]').forEach(a=>{a.href=links[a.dataset.siteLink];a.removeAttribute('aria-current')});
 const path=location.pathname.replace(/^\/ar(?=\/)/,''),hash=location.hash;
 const section=path.startsWith('/arcade/')?({'#profile':'profile','#discover':'stores'}[hash]):path.startsWith('/play/')||path.startsWith('/category/')?'games':({'/rankings.html':'rankings','/tiers.html':'tiers','/community.html':'community','/missions.html':'missions'}[path]||(path==='/'||path==='/index.html'?hash==='#library'?'games':hash==='#credits'?'creators':'home':null));
 if(section)document.querySelector(`#siteNav [data-site-link="${section}"]`)?.setAttribute('aria-current','page');
 document.querySelectorAll('[data-site-library]').forEach(a=>a.href=links.games);
 document.querySelectorAll('[data-site-home]').forEach(a=>a.href=links.home);
}
// Old public Home / Play hashes lead to the main library. Classic games retain a distinct route.
export function resolveArcadeRoute(hash,lang='en'){
 const value=hash.replace(/^#/,'');
 if(value==='home')return {url:siteLinks(lang).home};
 if(value==='play')return {url:siteLinks(lang).games};
 if(value.startsWith('game-'))return {view:'play',game:value.slice(5)};
 if(value==='classic')return {view:'play'};
 return {view:['discover','opensource','favorites','profile','about'].includes(value)?value:'profile'};
}
