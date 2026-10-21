import test from 'node:test';import assert from 'node:assert/strict';
import {siteLinks,renderSiteHeader,resolveArcadeRoute} from '../public/site-navigation.js';
test('Home and Games consistently use the full library in both languages',()=>{
 for(const lang of ['en','ar']){const links=siteLinks(lang),root=lang==='ar'?'/ar/':'/';assert.equal(links.home,root);assert.equal(links.games,root+'#library');assert.equal(links.profile,'/arcade/index.html#profile');assert.equal(links.stores,'/arcade/index.html#discover');}
});
test('old arcade Home and Play bookmarks reach the 71-game library',()=>{
 assert.deepEqual(resolveArcadeRoute('#home','en'),{url:'/'});
 assert.deepEqual(resolveArcadeRoute('#play','en'),{url:'/#library'});
 assert.deepEqual(resolveArcadeRoute('#home','ar'),{url:'/ar/'});
 assert.deepEqual(resolveArcadeRoute('#play','ar'),{url:'/ar/#library'});
});
test('profile and discovery routes preserve hub views; empty links open the profile',()=>{
 for(const value of ['profile','discover','favorites','opensource'])assert.deepEqual(resolveArcadeRoute('#'+value),{view:value});
 assert.deepEqual(resolveArcadeRoute(''),{view:'profile'});
 assert.deepEqual(resolveArcadeRoute('#unknown'),{view:'profile'});
});
test('classic games remain reachable with their original saved game identifiers',()=>{
 assert.deepEqual(resolveArcadeRoute('#classic'),{view:'play'});
 assert.deepEqual(resolveArcadeRoute('#game-neon-survivor'),{view:'play',game:'neon-survivor'});
});
test('the shared header contains the same destinations on hub and game pages',()=>{
 for(const lang of ['en','ar']){
  const hub=renderSiteHeader(lang),game=renderSiteHeader(lang,{languageLinks:{en:'/play/glimmer-box/',ar:'/ar/play/glimmer-box/'}});
  for(const [key,url] of Object.entries(siteLinks(lang))){assert.ok(hub.includes(`href="${url}" data-site-link="${key}"`));assert.ok(game.includes(`href="${url}" data-site-link="${key}"`));}
  for(const html of [hub,game]){assert.ok(!html.includes('super-admin'));assert.ok(!html.includes('data-view="home"'));assert.ok(html.includes('id="siteMenu"'));}
 }
});
