"""Build pinned independent games. Every archive carries runtime, preferred source and notices."""
from pathlib import Path
import json,subprocess,shutil,tempfile,tarfile,hashlib,concurrent.futures,re,os
from PIL import Image
R=Path(__file__).resolve().parents[1];ROOT=R.parent;ITEMS=json.loads((R/'vendor/bulk-games.json').read_text());OUT=ROOT/'bulk-output';OUT.mkdir(exist_ok=True)
def run(args,cwd,log): subprocess.run(args,cwd=cwd,check=True,stdout=log,stderr=subprocess.STDOUT)
def package(g):
 id=g['id'];logp=OUT/(id+'.log');work=Path(tempfile.mkdtemp(prefix='zyvo-'+id+'-'));src=work/'source';src.mkdir()
 try:
  with logp.open('w') as log:
   local=ROOT/'game-candidates'/g['repo'].replace('/','__')
   if local.exists():
    run(['git','archive','--output',str(work/'source.tar'),g['commit']],local,log);run(['tar','-xf',str(work/'source.tar'),'--no-same-owner','-C',str(src)],work,log)
    if g['mode']=='vite' and (local/'node_modules').exists(): (src/'node_modules').symlink_to(local/'node_modules',target_is_directory=True)
   else:
    run(['git','init',str(src)],work,log);run(['git','remote','add','origin','https://github.com/'+g['repo']+'.git'],src,log);run(['git','fetch','--depth=1','origin',g['commit']],src,log);run(['git','checkout','--detach','FETCH_HEAD'],src,log)
   if id=='voxel-island':
    p=src/'scene.js';s=p.read_text();start=s.index('// Try to load GLB model to extract colors/textures');end=s.index('// ============================================',start)
    s=s[:start]+'// Use the original procedural character; no remote colour-reference model is required.\nlet playerSkeleton = buildSkinnedPlayer(null);\n\n'+s[end:]
    start=s.index('const dracoLoader = new DRACOLoader();');end=s.index('// Extract materials/textures',start);s=s[:start]+s[end:];p.write_text(s)
   if g['entry']!='index.html':shutil.copy2(src/g['entry'],src/'index.html')
   lock=R/'vendor/bulk-locks'/(id+'.json')
   if lock.exists():shutil.copy2(lock,src/'package-lock.json')
   if g['mode']=='vite':
    if not (src/'node_modules').exists():run(['npm','ci','--ignore-scripts','--engine-strict=false','--no-audit','--no-fund'],src,log)
    run(['node',str(src/'node_modules/vite/bin/vite.js'),'build','--base=./','--target=es2022'],src,log)
    runtime=src/'dist'
   else:
    if not (src/'node_modules').exists() and (src/'package.json').exists() and json.loads((src/'package.json').read_text()).get('dependencies'):
     run(['npm','install','--omit=dev','--ignore-scripts','--engine-strict=false','--no-audit','--no-fund'],src,log)
     (R/'vendor/bulk-locks').mkdir(exist_ok=True);shutil.copy2(src/'package-lock.json',R/'vendor/bulk-locks'/(id+'.json'))
    runtime=src
   stage=work/'package';stage.mkdir();dest=stage/'runtime'
   shutil.copytree(runtime,dest,ignore=shutil.ignore_patterns('.git','.env*','dist','blender','*.mp4','*.webm'))
   run(['node',str(R/'scripts/localize-runtime.mjs'),str(dest),id]+(['--built'] if g['mode']=='vite' else []),src,log)
   run(['node',str(R/'scripts/decompress-runtime.mjs'),str(dest)],src,log)
   shutil.rmtree(dest/'node_modules',ignore_errors=True)
   shutil.copytree(src,stage/'source',ignore=shutil.ignore_patterns('.git','node_modules','.env*','dist','*.tgz'))
   licenses=[p for p in src.iterdir() if p.is_file() and re.search('license|copying|credits|notice',p.name,re.I)]
   text=f"{g['name']}\nOriginal project: https://github.com/{g['repo']}\nPinned source: {g['commit']}\nZYVOQIX changes: dependencies retained locally; relative deployment paths; loading/error bridge added by library build.\n\n"
   for p in licenses:
    text+='\n--- '+p.name+' ---\n'+p.read_text(errors='replace');shutil.copy2(p,dest/p.name)
   # Preserve full texts for bundled third-party runtime libraries/fonts.
   depdir=dest/'dependency-licenses'
   if (src/'node_modules').exists():
    for p in (src/'node_modules').rglob('*'):
     if p.is_file() and p.name.lower() in ['license','license.txt','license.md','copying','ofl.txt']:
      depdir.mkdir(exist_ok=True);shutil.copy2(p,depdir/str(p.relative_to(src/'node_modules')).replace('/','__'))
   (stage/'NOTICE.txt').write_text(text);(dest/'LICENSE.txt').write_text(text);(R/'public/licenses'/(id+'.txt')).write_text(text)
   cover=None
   candidates=[]
   for pattern in ['screenshot.png','render.png','screenshots/*.png','screenshots/*.jpg','docs/images/*.jpg','docs/*basketball*.png','preview*.png']:
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
   result=dict(**g,sha256=hashlib.sha256(archive.read_bytes()).hexdigest(),bytes=archive.stat().st_size,runtimeMB=round(sum(p.stat().st_size for p in dest.rglob('*') if p.is_file())/1e6,1),cover=cover)
   (OUT/(id+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2));print('PACKAGED',id,result['runtimeMB'],flush=True);return result
 except Exception as e:
  result={'id':id,'error':str(e),'log':str(logp)};(OUT/(id+'.error.json')).write_text(json.dumps(result));print('FAILED',id,flush=True);return result
 finally:shutil.rmtree(work)
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(package,ITEMS))
 (OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print('Complete',sum('error' not in g for g in results),'/',len(results),flush=True)
