from pathlib import Path
import shutil, subprocess, json, tarfile, hashlib, re
from PIL import Image

import os
repo=Path(__file__).resolve().parents[1]
base=repo.parent
stage=base/'pack-staging'
stage.mkdir(exist_ok=True)
items=[
dict(id='space-pirates',name='Space Pirates',categories=['action','flying'],genre='SPACE COMBAT',tag='BABYLON.JS',author='Babylon.js team',license='Apache-2.0',kind='عرض قتالي تفاعلي',device='كمبيوتر · لمس',desktop=False,webgl2=False,description='معارك سفن فضائية، صواريخ ومطاردات وسط الكويكبات. عرض تفاعلي من فريق Babylon.js.',controls='الماوس للتوجيه · الزر الأيسر للإطلاق · راجع Controls داخل اللعبة. يدعم التحكم باللمس.',search='فضاء طيران اكشن صواريخ سفن',source='https://github.com/BabylonJS/SpacePirates',entry='/games/space-pirates/index.html',cover='/covers/space-pirates.webp',notice='عرض Babylon.js 5.0 الأصلي؛ عُدلت مسارات الملفات والخطوط لتعمل من استضافة Zyvoqix.',required=['index.html','bundle.js','assets/missions.json','assets/gltf/valkyrie_mesh.glb']),
dict(id='kart-royale',name='Kart Royale',categories=['racing'],genre='KART RACING',tag='3D RACING',author='Ryan Campbell',license='MIT',kind='سباق كارت',device='كمبيوتر · لمس',desktop=False,webgl2=True,description='سباق كارت ثلاثي الأبعاد مع منافسين آليين، درِفت وتيربو، في مضمار يمر بالقرية والساحل.',controls='الأسهم أو WASD للقيادة · Shift للدرِفت · Space لاستخدام الأدوات.',search='سباق سيارات عربيات كارت درفت',source='https://github.com/ryancampbell/kart-royale',entry='/games/kart-royale/index.html',cover='/covers/kart-royale.webp',notice='الرسوم والأصوات مولدة من كود المشروع. نسخة ثابتة تضم المكتبات محليًا.',required=['index.html']),
dict(id='dust-corridor',folder='tactical-fps',name='Dust Corridor',categories=['action'],genre='TACTICAL FPS',tag='FIRST-PERSON',author='Leonxlnx',license='MIT',kind='تصويب ضد خصوم آليين',device='كيبورد وماوس',desktop=True,webgl2=True,description='قتال من منظور أول في حي سوق مفتوح. استخدم الغطاء والتصويب والقنابل ضد فرقة من الخصوم الآليين.',controls='WASD حركة · الماوس للتوجيه والإطلاق · R تلقيم · Shift جري · B قنبلة · Esc إيقاف.',search='تصويب حرب اكشن سلاح جنود',source='https://github.com/Leonxlnx/claude-of-duty',entry='/games/dust-corridor/index.html',cover=None,notice='خريطة واحدة مع إعادة ظهور الخصوم. لا يحتاج سيرفر لعب أو تحميل موارد من مزود آخر.',required=['index.html','game.js','game.css']),
dict(id='sketchbook',name='Sketchbook',categories=['sandbox','racing','flying'],genre='DRIVE · FLY · EXPLORE',tag='OPEN PLAYGROUND',author='swift502 / Jakub Bláha',license='MIT',kind='عالم حر تجريبي',device='كيبورد وماوس',desktop=True,webgl2=False,description='انزل إلى العالم، اركب سيارة أو طائرة أو هليكوبتر وجرّب القيادة والطيران بحرية. ساحة تجريبية بدون مهام قصصية.',controls='WASD للحركة · Shift جري · Space قفز · F للدخول والخروج من المركبات · الماوس للكاميرا.',search='عالم مفتوح قيادة سيارات طيران هليكوبتر عربيات',source='https://github.com/swift502/Sketchbook',entry='/games/sketchbook/index.html',cover='/covers/sketchbook.webp',notice='ساحة فيزياء وقيادة من المشروع الأصلي، وليست لعبة مهام مكتملة. أُزيل تحميل خطوط Google.',required=['index.html','build/sketchbook.min.js','build/assets/world.glb','build/assets/boxman.glb'])
]
lock=[]
def cp(s,d):
 d.parent.mkdir(parents=True,exist_ok=True)
 if s.is_dir():shutil.copytree(s,d,dirs_exist_ok=True)
 else:shutil.copy2(s,d)
for game in items:
 src=base/'game-sources'/game.get('folder',game['id'])
 work=stage/game['id']
 if work.exists():shutil.rmtree(work)
 runtime=work/'runtime';source=work/'source'
 runtime.mkdir(parents=True);source.mkdir()
 if game['id']=='space-pirates':
  cp(src/'docs',runtime);cp(src/'test_package/public/assets',runtime/'assets')
  for name in ('app_package','test_package'):
   for p in (src/name).rglob('*'):
    rel=p.relative_to(src/name)
    if p.is_file() and not any(x in rel.parts for x in ('node_modules','lib','public')):cp(p,source/name/rel)
  cp(src/'package.json',source/'package.json')
  cp(src/'SpacePirates.jpg',work/'cover.jpg')
 elif game['id'] in ('dust-corridor','kart-royale'):
  cp(src/'dist',runtime)
  for p in src.rglob('*'):
   rel=p.relative_to(src)
   if p.is_file() and not any(x in rel.parts for x in ('.git','node_modules','dist','test-results','docs')):cp(p,source/rel)
  for p in runtime.rglob('*.map'):p.unlink()
  if game['id']=='kart-royale':cp(src/'docs/hero-drift.png',work/'cover.png')
 else:
  cp(src/'build',runtime/'build');cp(src/'index.html',runtime/'index.html')
  for p in src.rglob('*'):
   rel=p.relative_to(src)
   if p.is_file() and not any(x in rel.parts for x in ('.git','build','node_modules')) and p.suffix not in ('.blend','.glb','.fbx','.png','.jpg'):cp(p,source/rel)
  # Keep bundled and preferred source code consistent; remove optional remote fonts.
  for p in [runtime/'build/sketchbook.min.js',source/'src/ts/world/World.ts']:
   s=p.read_text()
   s=re.sub(r'<link href="https://fonts\.googleapis\.com/[^>]+>', '',s)
   p.write_text('// Modified for ZYVOQIX: optional remote Google Fonts removed.\n'+s)
  cp(src/'src/img/thumbnail.png',work/'cover.png')
 license=src/('licence.md' if game['id']=='space-pirates' else 'LICENSE')
 cp(license,runtime/'LICENSE.txt');cp(license,source/'LICENSE.txt');cp(src/'README.md',source/'README.md')
 upstream=subprocess.check_output(['git','-C',str(src),'rev-parse','HEAD'],text=True).strip()
 changes=f"{game['name']}\nUpstream: {game['source']}\nCommit: {upstream}\n\nZYVOQIX modifications (2026-10-20):\n{game['notice']}\nPreferred code source and all runtime assets are in this archive. Original optional Blender/Photoshop authoring documents are not included. Source license and notices are retained.\n"
 (work/'NOTICE.txt').write_text(changes)
 (runtime/'NOTICE.txt').write_text(changes)
 (repo/'public/licenses').mkdir(exist_ok=True)
 (repo/f"public/licenses/{game['id']}.txt").write_text(changes+'\n'+license.read_text())
 cp(repo/f"public/licenses/{game['id']}.txt",repo/f"licenses/{game['id']}.txt")
 # Preserve the license notices for locally bundled runtime libraries.
 deps=['three','postprocessing','n8ao','simplex-noise'] if game['id']=='kart-royale' else ['three'] if game['id']=='dust-corridor' else ['@babylonjs/core','@babylonjs/gui','@babylonjs/loaders','earcut'] if game['id']=='space-pirates' else []
 for dep in deps:
  mod=src/('app_package/node_modules' if game['id']=='space-pirates' else 'node_modules')/dep
  for p in mod.glob('*'):
   if p.is_file() and re.match(r'licen[cs]e',p.name,re.I):cp(p,runtime/'third-party-licenses'/dep.replace('/','_')/p.name)
 if game['cover']:
  cover=next(p for p in work.glob('cover.*'))
  img=Image.open(cover).convert('RGB');img.thumbnail((1000,600));img.save(repo/'public'/game['cover'].lstrip('/'),'WEBP',quality=85)
 size=sum(p.stat().st_size for p in runtime.rglob('*') if p.is_file())
 game['runtimeMB']=round(size/1e6,1)
 archive=repo/f"vendor/{game['id']}.tar.gz"
 with tarfile.open(archive,'w:gz',compresslevel=9) as tar:
  for p in sorted(work.iterdir()):tar.add(p,arcname=p.name,filter=lambda x:x)
 data=archive.read_bytes()
 lock.append(dict(id=game['id'],archive=str(archive.relative_to(repo)),sha256=hashlib.sha256(data).hexdigest(),upstreamCommit=upstream,required=game['required'],bytes=len(data)))
 print(game['id'],f'{size/1e6:.1f}MB runtime',f'{len(data)/1e6:.1f}MB archive',flush=True)
(repo/'library.lock.json').write_text(json.dumps(dict(version=8,archiveCommit=None,games=lock),indent=2)+'\n')
for g in items:g.pop('folder',None);g.pop('required',None)
(repo/'public/library-catalog.json').write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n')
package=json.loads((repo/'package.json').read_text());package['version']='8.0.0';package['scripts']['build']='node scripts/build-library.mjs';(repo/'package.json').write_text(json.dumps(package,indent=2)+'\n')
css=repo/'public/library.css';css.write_text(css.read_text().replace("@import url('/styles.css');",'.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}'))
sw=repo/'public/sw.js';sw.write_text("const CACHE='zyvoqix-v8-library-20261020';const SHELL=['/','/library.js','/library.css','/library-catalog.json','/assets/zyvoqix-logo.webp','/assets/icon.png'];self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('zyvoqix-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin||e.request.method!=='GET'||u.pathname.startsWith('/api/')||u.pathname.startsWith('/games/'))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{})}return r}).catch(()=>caches.match(e.request)))});\n")
