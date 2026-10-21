// Display metadata for the providers already listed in data.js.
export const STORE_PROVIDERS = [
 {name:'Poki',mark:'P',tone:'blue',en:'Quick picks & big adventures',ar:'اختيارات سريعة ومغامرات كبيرة'},
 {name:'CrazyGames',mark:'C',tone:'violet',en:'Racing, action & more',ar:'سباقات وأكشن والمزيد'},
 {name:'Slow Roads',mark:'SR',tone:'mint',en:'Take the scenic route',ar:'قيادة هادئة وسط الطبيعة'},
 {name:'GeoFS',mark:'G',tone:'sky',en:'Explore the skies',ar:'اكتشف عالم الطيران'},
 {name:'Bloxd.io',mark:'B',tone:'gold',en:'Build your next world',ar:'ابنِ عالمك القادم'},
 {name:'Skribbl.io',mark:'S',tone:'pink',en:'Draw, guess & laugh',ar:'ارسم وخمّن مع أصحابك'},
 {name:'Gartic Phone',mark:'GP',tone:'violet',en:'A creative party with friends',ar:'أفكار ورسومات مع الأصدقاء'},
 {name:'Bonk.io',mark:'B',tone:'mint',en:'Multiplayer physics fun',ar:'تحديات فيزيائية متعددة اللاعبين'}
];
export function filterStoreGames(games,{provider='all',category='all',query='',categoryName=id=>id}={}) {
 const term=query.trim().toLocaleLowerCase();
 return games.filter(g=>(provider==='all'||g.provider===provider)&&(category==='all'||g.category===category)&&
  `${g.name} ${g.provider} ${g.note||''} ${g.category} ${categoryName(g.category)}`.toLocaleLowerCase().includes(term));
}
