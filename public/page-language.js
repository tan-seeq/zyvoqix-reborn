import './navigation.js';
import {setLanguage} from './language.js';
setLanguage(document.documentElement.lang);
for(const a of document.querySelectorAll('[data-site-language]'))a.addEventListener('click',()=>setLanguage(a.dataset.siteLanguage));
