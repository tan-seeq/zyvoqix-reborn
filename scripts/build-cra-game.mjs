// Preserve the game's React source while replacing its obsolete webpack build tool.
import fs from'node:fs/promises';import path from'node:path';import{createRequire}from'node:module';
const require=createRequire('/tmp/zyvoqix-build-tools/package.json');const{build}=require('esbuild');
const root=path.resolve(process.argv[2]),id=process.argv[3],out=path.join(root,'build');
await fs.rm(out,{recursive:true,force:true});await fs.cp(path.join(root,'public'),out,{recursive:true});
await fs.mkdir(path.join(out,'assets'),{recursive:true});
await build({absWorkingDir:root,entryPoints:['src/index.js'],outfile:path.join(out,'assets/main.js'),bundle:true,minify:true,format:'iife',target:'es2022',loader:{'.js':'jsx','.jsx':'jsx','.png':'file','.jpg':'file','.jpeg':'file','.svg':'file','.woff':'file','.woff2':'file','.ttf':'file','.otf':'file','.glb':'file','.gltf':'file','.mp3':'file','.wav':'file','.glsl':'text','.vert':'text','.frag':'text'},define:{'process.env.NODE_ENV':'"production"','process.env.PUBLIC_URL':JSON.stringify('/games/'+id)},logLevel:'warning',legalComments:'inline'});
let html=(await fs.readFile(path.join(out,'index.html'),'utf8')).replaceAll('%PUBLIC_URL%','/games/'+id);
html=html.replace('</body>','<script src="./assets/main.js"></script></body>');try{await fs.stat(path.join(out,'assets/main.css'));html=html.replace('</head>','<link rel="stylesheet" href="./assets/main.css"></head>');}catch{}
await fs.writeFile(path.join(out,'index.html'),html);
