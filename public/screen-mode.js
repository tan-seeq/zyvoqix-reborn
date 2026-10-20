import {copy,getLanguage} from './language.js';
export function screenMode(element,button){
 let oldOverflow=null,sequence=0;const expanded=()=>document.fullscreenElement===element||element.classList.contains('is-expanded');
 function refresh(){const active=expanded();button.textContent=copy[getLanguage()][active?'exitScreen':'fullscreen'];button.setAttribute('aria-pressed',String(active));}
 function fallback(){if(oldOverflow===null)oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';element.classList.add('is-expanded');refresh();}
 function exit(){sequence++;if(element.classList.contains('is-expanded')){element.classList.remove('is-expanded');if(oldOverflow!==null)document.body.style.overflow=oldOverflow;oldOverflow=null;}if(document.fullscreenElement===element)document.exitFullscreen?.().catch(()=>{});refresh();}
 function toggle(){if(expanded()){exit();return;}const ticket=++sequence;if(element.requestFullscreen){try{Promise.resolve(element.requestFullscreen()).then(()=>{if(ticket!==sequence&&document.fullscreenElement===element)document.exitFullscreen?.().catch(()=>{});}).catch(()=>{if(ticket===sequence&&!element.hidden)fallback();});}catch{if(ticket===sequence&&!element.hidden)fallback();}}else fallback();}
 document.addEventListener('fullscreenchange',refresh);window.addEventListener('keydown',e=>{if(e.key==='Escape'&&element.classList.contains('is-expanded')){e.preventDefault();e.stopImmediatePropagation();exit();button.focus();}},true);button.addEventListener('click',toggle);refresh();return {exit,refresh};
}
