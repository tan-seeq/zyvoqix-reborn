"""Package pinned independent additions with same-origin dependencies and matching source."""
from pathlib import Path
import json,tempfile,tarfile,shutil,subprocess,hashlib,re
from PIL import Image
R=Path(__file__).resolve().parents[1];work=Path(tempfile.mkdtemp(prefix='zyvoqix-more-'))
items=json.loads((R/'vendor/more-games.json').read_text())
def run(*args,cwd=None):subprocess.run(args,cwd=cwd,check=True)
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
try:
 for g in items:
  id=g['id'];src=work/id;local=R.parent/'game-sources'/g.get('folder',id)
  if local.exists() and subprocess.check_output(['git','rev-parse','HEAD'],cwd=local,text=True).strip()==g['commit']:
   src.mkdir();run('git','archive','--format=tar','--output',str(work/(id+'.tar')),g['commit'],cwd=local);run('tar','-xf',str(work/(id+'.tar')),'--no-same-owner','-C',str(src))
  else:
   run('git','init',str(src));run('git','remote','add','origin','https://github.com/'+g['repo']+'.git',cwd=src);run('git','fetch','--depth=1','origin',g['commit'],cwd=src);run('git','checkout','--detach','FETCH_HEAD',cwd=src)
  if id=='beachy-ball':
   p=src/'src/index.html';s=p.read_text();s=re.sub(r'<script type="module">[\s\S]*?</script>','<!-- ZYVOQIX: optional Google Analytics removed. -->',s,count=1);s=s.replace('</body>','<script src="./touch-controls.js"></script></body>');p.write_text(s)
   shutil.copy2(R/'vendor/beachy-touch.js',src/'public/touch-controls.js')
   # A visible offer of the complete modified source satisfies the AGPL source-access requirement.
   for p in [src/'src/interface/Interface.jsx',src/'src/interface/MainMenu.jsx']:
    s=p.read_text().replace('https://github.com/michaelkolesidis/beachy-beachy-ball','/sources/beachy-ball.tar.gz');p.write_text(s)
   shutil.copy2(R/'vendor/beachy-lock.json',src/'package-lock.json');run('npm','ci','--ignore-scripts','--no-audit','--no-fund',cwd=src);run('npm','run','build',cwd=src);runtime=src/'dist'
   for p in runtime.rglob('*.map'):p.unlink()
  elif id=='circuit-sprint':
   runtime=src/'public';(runtime/'vendor').mkdir()
   run('npm','pack','three@0.128.0','--silent','--pack-destination',str(work),cwd=work)
   with tarfile.open(work/'three-0.128.0.tgz') as t:
    for name,target in [('package/build/three.min.js','three.min.js'),('package/LICENSE','LICENSE-three.txt')]:
     (runtime/'vendor'/target).write_bytes(t.extractfile(name).read())
   p=runtime/'index.html';p.write_text(p.read_text().replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','./vendor/three.min.js'))
  else:runtime=src
  package=work/('package-'+id);package.mkdir()
  if id=='bowling':
   dest=package/'runtime';dest.mkdir()
   for name in ['index.html','js','res']:shutil.copytree(src/name,dest/name) if (src/name).is_dir() else shutil.copy2(src/name,dest/name)
  elif id=='contra-run':
   dest=package/'runtime';dest.mkdir()
   for name in ['index.html','src','lib','LICENSE','NOTICE','docs/licenses']:
    p=src/name;d=dest/name;d.parent.mkdir(parents=True,exist_ok=True);shutil.copytree(p,d) if p.is_dir() else shutil.copy2(p,d)
  else:shutil.copytree(runtime,package/'runtime')
  shutil.copytree(src,package/'source',ignore=shutil.ignore_patterns('.git','node_modules','dist','*.tgz'))
  if id=='circuit-sprint':
   # Upstream declares MIT in package.json and README; retain both declarations.
   licText=(R/'vendor/circuit-MIT.txt').read_text()
  else:licText=(src/'LICENSE').read_text()
  text=f"{g['name']}\nOriginal project: https://github.com/{g['repo']}\nExact revision: {g['commit']}\nLicense: {g['license']}\nZYVOQIX modifications (2026-10-20): {g['changes']}\nComplete corresponding source is included in this archive.\n\n"+licText
  (package/'NOTICE.txt').write_text(text);(package/'runtime/LICENSE.txt').write_text(text)
  if (src/'NOTICE').exists():shutil.copy2(src/'NOTICE',package/'runtime/UPSTREAM-NOTICE.txt')
  if id=='beachy-ball':
   depdir=package/'runtime/dependency-licenses';depdir.mkdir()
   for p in (src/'node_modules').rglob('*'):
    if p.is_file() and p.name.lower() in ['license','license.txt','license.md','copying']:
     shutil.copy2(p,depdir/str(p.relative_to(src/'node_modules')).replace('/','__'))
  (R/'public/licenses'/(id+'.txt')).write_text(text)
  cover=None
  if g.get('cover'):
   cover='/covers/'+id+'.webp';img=Image.open(src/g['cover']).convert('RGB');img.thumbnail((1000,600));img.save(R/'public'/cover.lstrip('/'),'WEBP',quality=86)
  archive=R/'vendor'/(id+'.tar.gz')
  with tarfile.open(archive,'w:gz') as t:
   for p in sorted(package.iterdir()):t.add(p,arcname=p.name)
  size=sum(p.stat().st_size for p in (package/'runtime').rglob('*') if p.is_file())
  catalogPath=R/'public/library-catalog.json';catalog=json.loads(catalogPath.read_text());base={k:g[k] for k in ['id','name','author','license','categories','description','controls','genre','tag','kind','search']};base.update(desktop=False,webgl2=False,device='كمبيوتر · تحكم لمس',source='https://github.com/'+g['repo'],sourceArchive='/sources/'+id+'.tar.gz',entry='/games/'+id+'/index.html',cover=cover,runtimeMB=round(size/1e6,1),notice=g['changesAr'],i18n={'en':{**g['en'],'device':'Computer · touch controls','notice':g['changes']}});catalog=[x for x in catalog if x['id']!=id]+[base];save(catalogPath,catalog)
  lockPath=R/'library.lock.json';lock=json.loads(lockPath.read_text());lock['version']=11;lock['games']=[x for x in lock['games'] if x['id']!=id]+[dict(id=id,archive='vendor/'+archive.name,sha256=hashlib.sha256(archive.read_bytes()).hexdigest(),upstreamCommit=g['commit'],required=['index.html','LICENSE.txt'],bytes=archive.stat().st_size,sourceArchive=True)];save(lockPath,lock)
  print('Packaged',id,size,flush=True)
finally:shutil.rmtree(work)
