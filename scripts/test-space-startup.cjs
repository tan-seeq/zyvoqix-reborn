// Regression: browser startup must not read an undeclared native global or use index.html as an asset directory.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
async function check(provided,expected){
 const options=provided?{assetsHostUrl:provided}:{};
 class Engine{constructor(){throw new Error('GPU_BOUNDARY');}}
 const style={};const canvas={style};const document={documentElement:{style:{}},body:{style,appendChild(){}},createElement:()=>({style:{},appendChild(){}})};
 const exports={};
 const context={exports,require(name){if(name==='@babylonjs/core')return {Engine,MorphTargetManager:{}};if(name.includes('Parameters'))return {Parameters:{initialize(){}}};return {};},URL,URLSearchParams,document,console,window:{innerWidth:390,innerHeight:800,location:{href:'https://gamezone-play-rank-rise.vercel.app/games/space-pirates/index.html?test=1',search:'?test=1'}},navigator:{userAgent:'iPhone'}};
 vm.runInNewContext(fs.readFileSync(process.argv[2],'utf8'),context);
 await assert.rejects(exports.initializeBabylonApp(options),/GPU_BOUNDARY/);
 assert.equal(options.assetsHostUrl,expected);
}
(async()=>{await check('/games/space-pirates','/games/space-pirates');await check(undefined,'https://gamezone-play-rank-rise.vercel.app/games/space-pirates');console.log('PASS: absent native global, explicit asset root and index.html fallback regression');})().catch(e=>{console.error(e);process.exitCode=1;});
