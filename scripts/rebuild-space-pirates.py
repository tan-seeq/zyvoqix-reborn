"""Repair browser startup using the exact source bundled with the licensed archive."""
from pathlib import Path
import tempfile,tarfile,subprocess,shutil,json,hashlib
R=Path(__file__).resolve().parents[1]
work=Path(tempfile.mkdtemp(prefix='zyvoqix-space-fix-'))
def run(*args,cwd=None):subprocess.run(args,cwd=cwd,check=True)
try:
 archive=R/'vendor/space-pirates.tar.gz'
 run('tar','-xzf',str(archive),'--no-same-owner','-C',str(work))
 src=work/'source';p=src/'app_package/src/playgroundRunner.ts';s=p.read_text()
 s=s.replace('useNative = !!_native;', 'useNative = typeof _native !== "undefined" && !!_native;')
 s=s.replace("options.assetsHostUrl = window.location.href.split('?')[0];", "// ZYVOQIX: keep the caller's asset directory; never append assets to index.html.\n        options.assetsHostUrl = options.assetsHostUrl || new URL('.', window.location.href).href.replace(/\\/$/, '');")
 s=s.replace('        document.body.style.width = "100%";', '        document.documentElement.style.height = "100%";\n        document.body.style.width = "100%";')
 p.write_text(s)
 p=src/'app_package/src/Playground/playground.ts';s=p.read_text().replace('            State.setCurrent(States.main);','''            State.setCurrent(States.main);
            // ZYVOQIX: confirm the real menu scene has rendered, not just iframe load.
            scene.onAfterRenderObservable.addOnce(() => {
                window.dispatchEvent(new CustomEvent('zyvoqix-game-ready'));
            });''');p.write_text(s)
 p=src/'test_package/src/index.js';p.write_text('''// ZYVOQIX: explicit same-origin asset directory and visible asynchronous startup errors.
import { initializeBabylonApp } from "app_package";
initializeBabylonApp({ assetsHostUrl: "/games/space-pirates" }).catch(error => {
  window.dispatchEvent(new CustomEvent('zyvoqix-game-error', { detail: String(error?.message || error) }));
  console.error('Space Pirates startup:', error);
});
''')
 for part in ['app_package','test_package']:
  run('npm','ci','--ignore-scripts','--no-audit','--no-fund',cwd=src/part)
  run('npm','run','build',cwd=src/part)
 run('node',str(R/'scripts/test-space-startup.cjs'),str(src/'app_package/lib/playgroundRunner.js'))
 shutil.copy2(work/'source/docs/bundle.js' if (work/'source/docs/bundle.js').exists() else src/'docs/bundle.js',work/'runtime/bundle.js')
 shutil.copy2(work/'runtime/bundle.js',work/'runtime/bundle-v11.js')
 p=work/'runtime/index.html';p.write_text(p.read_text().replace('bundle.js','bundle-v11.js'))
 # Preserve all original runtime assets and notices, update only the rebuilt bundle/source.
 note='\nZYVOQIX browser startup repair (2026-10-20): guard absent native host; preserve asset base URL; signal menu readiness and asynchronous startup errors.\n'
 for f in [work/'NOTICE.txt',work/'runtime/NOTICE.txt']:
  f.write_text(f.read_text()+note)
 for p in list(src.rglob('node_modules')):
  if p.is_dir():shutil.rmtree(p)
 for p in [src/'app_package/lib',src/'docs']:
  if p.exists():shutil.rmtree(p)
 with tarfile.open(archive,'w:gz') as t:
  for p in sorted(work.iterdir()):t.add(p,arcname=p.name)
 lockPath=R/'library.lock.json';lock=json.loads(lockPath.read_text());g=next(x for x in lock['games'] if x['id']=='space-pirates');g['required']=['index.html','bundle-v11.js','assets/missions.json','assets/gltf/valkyrie_mesh.glb'];g.update(sha256=hashlib.sha256(archive.read_bytes()).hexdigest(),bytes=archive.stat().st_size);lock['version']=11;lockPath.write_text(json.dumps(lock,indent=2)+'\n')
 p=R/'public/licenses/space-pirates.txt';p.write_text(p.read_text()+note)
 print('Rebuilt Space Pirates browser startup',g['sha256'],flush=True)
finally:shutil.rmtree(work)
