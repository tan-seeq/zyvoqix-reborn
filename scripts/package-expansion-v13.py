"""Build pinned independent games. Every archive carries runtime, preferred source and notices."""
from pathlib import Path
import json,subprocess,shutil,tempfile,tarfile,hashlib,concurrent.futures,re,os
from PIL import Image
R=Path(__file__).resolve().parents[1];ROOT=R.parent;ITEMS=json.loads((R/'vendor/expansion-v13.json').read_text());OUT=ROOT/'expansion-v13-output';OUT.mkdir(exist_ok=True)
def run(args,cwd,log): subprocess.run(args,cwd=cwd,check=True,stdout=log,stderr=subprocess.STDOUT)
def package(g):
 id=g['id'];logp=OUT/(id+'.log');work=Path(tempfile.mkdtemp(prefix='zyvo-'+id+'-'));src=work/'source';src.mkdir()
 try:
  with logp.open('w') as log:
   local=ROOT/'game-candidates-v13'/g['repo'].replace('/','__')
   if local.exists():
    run(['git','archive','--output',str(work/'source.tar'),g['commit']],local,log);run(['tar','-xf',str(work/'source.tar'),'--no-same-owner','-C',str(src)],work,log)
    if g['mode'] in ['vite','cra','rollup','webpack','nuxt'] and (local/'node_modules').exists(): (src/'node_modules').symlink_to(local/'node_modules',target_is_directory=True)
   else:
    run(['git','init',str(src)],work,log);run(['git','remote','add','origin','https://github.com/'+g['repo']+'.git'],src,log);run(['git','fetch','--depth=1','origin',g['commit']],src,log);run(['git','checkout','--detach','FETCH_HEAD'],src,log)
   if id=='cuberun':
    # Upstream Road Rage is personal-use-only; use system fonts for unrestricted hosting.
    for p in (src/'src/styles').glob('*.css'):
     s=p.read_text();s=re.sub(r'@font-face\s*\{[^}]+\}', '',s);s=s.replace("'Road Rage'",'system-ui').replace("'Commando'",'system-ui');p.write_text(s)
    shutil.rmtree(src/'src/fonts')
   for envfile in src.glob('.env*'):
    if envfile.is_file():envfile.unlink()
   if g['mode']=='cra':
    p=src/'src/index.js';s=p.read_text().replace('serviceWorker.unregister();','// Host service worker is managed by ZYVOQIX.').replace('serviceWorker.register();','// Host service worker is managed by ZYVOQIX.');p.write_text(s)
   if id=='glimmer-box':
    p=src/'package.json';v=json.loads(p.read_text());v.setdefault('devDependencies',{})['vite']='7.3.6';p.write_text(json.dumps(v,indent=2)+'\n')
    p=src/'nuxt.config.ts';s=p.read_text().replace('  ssr: false,','  ssr: false,\n  devtools: { enabled: false },');p.write_text(s)
   if id=='hypeometry':
    shutil.copy2(src/'index.html',src/'original-index.html')
    cards=''.join(f'<a href="./level{i}.html" style="display:block;background:#121c31;color:white;border:1px solid #33435f;border-radius:16px;overflow:hidden;text-decoration:none"><img src="./screenshot/level{i}.png" style="width:100%;height:230px;object-fit:contain;background:#080e1c" alt="Level {i}"><h2 style="padding:0 20px">Level {i} / المرحلة {i}</h2></a>' for i in [1,2,3])
    (src/'index.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hypeometry — Choose a level</title></head><body style="margin:0;background:#080e1c;color:white;font:16px Arial,sans-serif;padding:30px"><h1>Hypeometry</h1><p>Choose a perspective puzzle / اختر مرحلة لغز المنظور</p><main style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:20px">'+cards+'</main></body></html>')
    for i in [1,2,3]:
     p=src/f'level{i}.html';p.write_text(p.read_text().replace('<head>','<head><script src="/game-bridge.js?v=13"></script>',1))
   if id=='crossroad':
    shutil.copy2(R/'vendor/crossroad-local-scores.js',src/'src/js/utils/supabase.js')
    p=src/'src/vue/LeaderboardDialog.vue';s=p.read_text().replace("title: 'Leaderboard'","title: 'Scores on this device'").replace("title: '排行榜'","title: '本机成绩'");p.write_text(s)
   if id=='voxel-island':
    p=src/'scene.js';s=p.read_text();start=s.index('// Try to load GLB model to extract colors/textures');end=s.index('// ============================================',start)
    s=s[:start]+'// Use the original procedural character; no remote colour-reference model is required.\nlet playerSkeleton = buildSkinnedPlayer(null);\n\n'+s[end:]
    start=s.index('const dracoLoader = new DRACOLoader();');end=s.index('// Extract materials/textures',start);s=s[:start]+s[end:];p.write_text(s)
   if g.get('submodules'):run(['git','submodule','update','--init','--recursive'],src,log)
   if g['entry']!='index.html':shutil.copy2(src/g['entry'],src/'index.html')
   lock=R/'vendor/expansion-v13-locks'/(id+'.json')
   if lock.exists():shutil.copy2(lock,src/'package-lock.json')
   mode=g['mode']
   if mode in ['vite','cra','rollup','webpack','nuxt']:
    if not (src/'node_modules').exists():run(['npm','ci','--ignore-scripts','--legacy-peer-deps','--engine-strict=false','--no-audit','--no-fund'],src,log)
    if mode=='vite':
     run(['node',str(src/'node_modules/vite/bin/vite.js'),'build','--base=./','--target=es2022'],src,log);runtime=src/'dist'
    elif mode=='cra':
     run(['node',str(R/'scripts/build-cra-game.mjs'),str(src),id],src,log);runtime=src/'build'
    elif mode=='nuxt':
     run(['env','NUXT_APP_BASE_URL=/games/'+id+'/','npm','run','generate'],src,log);runtime=src/'.output/public'
    else:
     run(['env','NODE_OPTIONS=--openssl-legacy-provider','npm','run',g.get('buildScript','build')],src,log);runtime=src/'dist'
   else:
    if not g.get('skipInstall') and not (src/'node_modules').exists() and (src/'package.json').exists() and json.loads((src/'package.json').read_text()).get('dependencies'):
     run(['npm','install','--omit=dev','--ignore-scripts','--legacy-peer-deps','--engine-strict=false','--no-audit','--no-fund'],src,log)
     (R/'vendor/expansion-v13-locks').mkdir(exist_ok=True);shutil.copy2(src/'package-lock.json',R/'vendor/expansion-v13-locks'/(id+'.json'))
    runtime=src/g.get('runtimeRoot','.')
   stage=work/'package';stage.mkdir();dest=stage/'runtime'
   shutil.copytree(runtime,dest,ignore=shutil.ignore_patterns('.git','.env*','blender','*.mp4','*.webm'))
   run(['node',str(R/'scripts/localize-runtime.mjs'),str(dest),id]+(['--built'] if mode in ['vite','cra','webpack','nuxt'] else []),src,log)
   run(['node',str(R/'scripts/decompress-runtime.mjs'),str(dest)],src,log)
   shutil.rmtree(dest/'node_modules',ignore_errors=True)
   shutil.copytree(src,stage/'source',ignore=shutil.ignore_patterns('.git','node_modules','.env*','dist','*.tgz'))
   licenses=[p for p in src.iterdir() if p.is_file() and re.search('license|copying|credits|notice',p.name,re.I)]
   text=f"{g['name']}\nOriginal project: https://github.com/{g['repo']}\nPinned source: {g['commit']}\nZYVOQIX changes: dependencies retained locally; relative deployment paths; loading/error bridge added by library build.\n\n"
   for p in licenses:
    text+='\n--- '+p.name+' ---\n'+p.read_text(errors='replace');shutil.copy2(p,dest/p.name)
   # Preserve full texts for bundled third-party runtime libraries/fonts.
   dependency_notices=[]
   if (src/'node_modules').exists():
    for p in (src/'node_modules').rglob('*'):
     if p.is_file() and p.name.lower() in ['license','license.txt','license.md','licence','licence.txt','copying','ofl.txt']:
      dependency_notices.append('\n--- '+str(p.relative_to(src/'node_modules'))+' ---\n'+p.read_text(errors='replace'))
   if dependency_notices:(dest/'THIRD-PARTY-NOTICES.txt').write_text('Bundled dependency license texts\n'+''.join(dependency_notices))
   (stage/'NOTICE.txt').write_text(text);(dest/'LICENSE.txt').write_text(text);(R/'public/licenses'/(id+'.txt')).write_text(text)
   cover=None
   candidates=[src/g['cover']] if g.get('cover') else []
   for pattern in ['screenshot.png','render.png','media/*.png','media/*.jpg','docs/hero.jpg','screenshots/*.png','screenshots/*.jpg','docs/images/*.jpg','docs/*basketball*.png','preview*.png']:
    candidates.extend(src.glob(pattern))
   if candidates:
    try:
     img=Image.open(candidates[0]).convert('RGB');img.thumbnail((1000,600));cover='/covers/'+id+'.webp';img.save(R/'public'/cover.lstrip('/'),'WEBP',quality=85)
    except Exception:pass
   # Identical source/runtime assets share an inode, so tar stores one copy plus hard links.
   content={}
   for file in sorted(stage.rglob('*')):
    if not file.is_file() or file.is_symlink():continue
    key=(file.stat().st_size,hashlib.sha256(file.read_bytes()).hexdigest())
    if key in content:file.unlink();os.link(content[key],file)
    else:content[key]=file
   archive=R/'vendor'/(id+'.tar.gz')
   with tarfile.open(archive,'w:gz') as t:
    for p in sorted(stage.iterdir()):t.add(p,arcname=p.name)
   result=dict(**{k:v for k,v in g.items() if k!='cover'},sha256=hashlib.sha256(archive.read_bytes()).hexdigest(),bytes=archive.stat().st_size,runtimeMB=round(sum(p.stat().st_size for p in dest.rglob('*') if p.is_file())/1e6,1),cover=cover)
   (OUT/(id+'.error.json')).unlink(missing_ok=True)
   (OUT/(id+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2));print('PACKAGED',id,result['runtimeMB'],flush=True);return result
 except Exception as e:
  result={'id':id,'error':str(e),'log':str(logp)};(OUT/(id+'.error.json')).write_text(json.dumps(result));print('FAILED',id,flush=True);return result
 finally:shutil.rmtree(work)
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(package,ITEMS))
 (OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print('Complete',sum('error' not in g for g in results),'/',len(results),flush=True)

 if any('error' in g for g in results):
  for g in results:
   if 'error' in g:print(g['id'],Path(g['log']).read_text(errors='replace')[-3000:],flush=True)
  raise SystemExit(1)
