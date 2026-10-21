import test from 'node:test';import assert from 'node:assert/strict';
import {STORE_PROVIDERS,filterStoreGames} from '../public/store-directory.js';
import {EXTERNAL_GAMES,CATEGORIES} from '../public/data.js';
test('all external links have provider metadata and all providers have links',()=>{
 assert.equal(new Set(STORE_PROVIDERS.map(p=>p.name)).size,STORE_PROVIDERS.length);
 for(const p of STORE_PROVIDERS)assert.ok(EXTERNAL_GAMES.some(g=>g.provider===p.name));
 for(const g of EXTERNAL_GAMES)assert.ok(STORE_PROVIDERS.some(p=>p.name===g.provider));
});
test('combined store, category and search filters preserve the original collection',()=>{
 const before=JSON.stringify(EXTERNAL_GAMES);
 assert.deepEqual(filterStoreGames(EXTERNAL_GAMES,{provider:'Poki',category:'racing',query:' MOTO '}).map(g=>g.id),['moto']);
 assert.equal(filterStoreGames(EXTERNAL_GAMES,{provider:'GeoFS',category:'racing'}).length,0);
 assert.equal(filterStoreGames(EXTERNAL_GAMES).length,EXTERNAL_GAMES.length);
 assert.equal(JSON.stringify(EXTERNAL_GAMES),before);
});
test('Arabic category search and empty results work',()=>{
 const name=id=>CATEGORIES.find(c=>c.id===id)?.ar||id;
 assert.ok(filterStoreGames(EXTERNAL_GAMES,{query:name('racing'),categoryName:name}).some(g=>g.category==='racing'));
 assert.equal(filterStoreGames(EXTERNAL_GAMES,{query:'no-such-game-zyvoqix-xyz'}).length,0);
});
