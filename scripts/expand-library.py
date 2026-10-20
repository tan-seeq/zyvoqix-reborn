"""Build four pinned, licensed additions without rebuilding the existing library."""
from pathlib import Path
import json, shutil, subprocess, tarfile, hashlib, tempfile, os
R=Path(__file__).resolve().parents[1]
meta=json.loads((R/'vendor/additional-games.json').read_text())
work=Path(tempfile.mkdtemp(prefix='zyvoqix-additions-'))
def run(*args,cwd=None): subprocess.run(args,cwd=cwd,check=True)
def save(p,x): p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
try:
 for g in meta:
  id=g['id']; src=work/id
  # Existing local clones are used only when their exact upstream revision matches.
  local=R.parent/'game-sources'/id
  if local.exists() and subprocess.check_output(['git','rev-parse','HEAD'],cwd=local,text=True).strip()==g['commit']:
   src.mkdir();run('git','archive','--format=tar','--output',str(work/(id+'.tar')),g['commit'],cwd=local)
   run('tar','-xf',str(work/(id+'.tar')),'--no-same-owner','-C',str(src))
  else:
   run('git','init',str(src));run('git','remote','add','origin','https://github.com/'+g['repo']+'.git',cwd=src)
   run('git','fetch','--depth=1','origin',g['commit'],cwd=src);run('git','checkout','--detach','FETCH_HEAD',cwd=src)
  if id=='island-survival':
   p=src/'src/core/assets.ts'; s=p.read_text();s=s.replace("import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';\n",'').replace("    const draco = new DRACOLoader(this.manager);\n    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');\n",'').replace('    this.gltfLoader.setDRACOLoader(draco);\n','');p.write_text(s)
   p=src/'src/core/audio.ts';s=p.read_text().replace("const AUDIO_BASE = '/assets/audio';","const AUDIO_BASE = './assets/audio';\n// This release ships procedural audio only; no optional recording requests.\nconst SHIPPED_RECORDINGS: string[] = [];").replace('for (const name of [id, `${id}_1`, `${id}_2`, `${id}_3`])','for (const name of SHIPPED_RECORDINGS.filter(name => name === id || name.startsWith(`${id}_`)))');p.write_text(s)
  if id!='flight-sim':
   shutil.copy2(R/'vendor/additional-locks'/(id+'.json'),src/'package-lock.json')
   run('npm','ci','--ignore-scripts','--no-audit','--no-fund',cwd=src)
   run('npm','run','build','--','--base=./',cwd=src)
   runtime=src/'dist'
  else:
   runtime=work/'flight-runtime';runtime.mkdir();shutil.copy2(src/'index.html',runtime/'index.html')
   run('npm','pack','three@0.160.0','--silent','--pack-destination',str(work),cwd=work)
   (runtime/'vendor').mkdir()
   with tarfile.open(work/'three-0.160.0.tgz') as t:
    for name,dest in [('package/build/three.module.js','three.module.js'),('package/LICENSE','LICENSE-three.txt')]:
     (runtime/'vendor'/dest).write_bytes(t.extractfile(name).read())
   p=runtime/'index.html';p.write_text(p.read_text().replace('https://unpkg.com/three@0.160.0/build/three.module.js','./vendor/three.module.js'))
  package=work/('package-'+id);package.mkdir();shutil.copytree(runtime,package/'runtime')
  shutil.copytree(src,package/'source',ignore=shutil.ignore_patterns('.git','node_modules','dist','*.tgz'))
  lic=next(p for p in [src/'LICENSE',src/'LICENSE.md',src/'LICENSE.txt'] if p.exists())
  notice=f"{g['name']}\nSource: https://github.com/{g['repo']}\nUpstream revision: {g['commit']}\nLicense: MIT\nBundled for same-origin hosting on Zyvoqix. Source and dependency notices included.\n"
  if id=='island-survival':notice+='Zyvoqix modifications: unused remote Draco loader removed; procedural audio uses no optional recording requests.\n'
  if id=='flight-sim':notice+='Zyvoqix modification: Three.js 0.160.0 vendored locally, with its MIT license.\n'
  text=notice+'\n'+lic.read_text()
  (package/'NOTICE.txt').write_text(text);(package/'runtime/LICENSE.txt').write_text(text)
  depdir=package/'runtime/dependency-licenses';depdir.mkdir()
  for p in (src/'node_modules').rglob('*') if (src/'node_modules').exists() else []:
   if p.is_file() and p.name.lower() in ('license','license.md','license.txt','copying'):
    rel=str(p.relative_to(src/'node_modules')).replace('/','__');shutil.copy2(p,depdir/rel)
  archive=R/'vendor'/(id+'.tar.gz')
  with tarfile.open(archive,'w:gz') as t:
   for p in sorted(package.iterdir()):t.add(p,arcname=p.name)
  size=sum(p.stat().st_size for p in (package/'runtime').rglob('*') if p.is_file())
  (R/'public/licenses'/(id+'.txt')).write_text(text)
  cover=None
  if g['coverSource']:
   cover='/covers/'+id+Path(g['coverSource']).suffix;shutil.copy2(src/g['coverSource'],R/'public'/cover.lstrip('/'))
  base={k:g[k] for k in ['id','name','categories','genre','tag','kind','description','controls','search','author']}
  base.update(license='MIT',desktop=id!='flight-sim',webgl2=id!='flight-sim',device='كمبيوتر · لمس' if id=='flight-sim' else 'كيبورد وماوس',source='https://github.com/'+g['repo'],entry='/games/'+id+'/index.html',cover=cover,notice='ملفات التشغيل والمصدر محفوظة محليًا مع ترخيص المشروع. القوائم الداخلية بلغة المطور الأصلية.',runtimeMB=round(size/1e6,1),i18n={'en':{**g['en'],'device':'Computer · touch' if id=='flight-sim' else 'Keyboard & mouse','notice':'Runtime and source bundled locally with the original license. Internal menus use the developer’s language.'}})
  catalogPath=R/'public/library-catalog.json';catalog=json.loads(catalogPath.read_text());catalog=[x for x in catalog if x['id']!=id]+[base];save(catalogPath,catalog)
  lockPath=R/'library.lock.json';lock=json.loads(lockPath.read_text());lock['version']=9;lock['games']=[x for x in lock['games'] if x['id']!=id]+[dict(id=id,archive='vendor/'+archive.name,sha256=hashlib.sha256(archive.read_bytes()).hexdigest(),upstreamCommit=g['commit'],required=['index.html','LICENSE.txt'],bytes=archive.stat().st_size)];save(lockPath,lock)
  print('Packaged',id,size,flush=True)
finally:shutil.rmtree(work)
