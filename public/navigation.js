import {updateSiteLinks} from './site-navigation.js';
updateSiteLinks(document.documentElement.lang);
window.addEventListener('hashchange',()=>updateSiteLinks(document.documentElement.lang));
const menu=document.getElementById('siteMenu'),nav=document.getElementById('siteNav');
if(menu&&nav){document.documentElement.classList.add('nav-ready');function set(open){menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);}menu.addEventListener('click',()=>set(menu.getAttribute('aria-expanded')!=='true'));nav.addEventListener('click',e=>{if(e.target.closest('a'))set(false);});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){set(false);menu.focus();}});}
