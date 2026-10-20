from pathlib import Path
import subprocess, json, shutil
root=Path(__file__).resolve().parents[1]
sources=root.parent/'game-sources'
sources.mkdir(exist_ok=True)
for game in json.loads((root/'vendor/UPSTREAMS.json').read_text()):
    dest=sources/game['id']
    dest.mkdir(exist_ok=True)
    subprocess.run(['git','init',str(dest)],check=True)
    subprocess.run(['git','-C',str(dest),'fetch','--depth','1',game['url'],game['commit']],check=True)
    subprocess.run(['git','-C',str(dest),'checkout','--detach','FETCH_HEAD'],check=True)
    if game['id']=='space-pirates':
        for name in ['app_package','test_package']:
            shutil.copy2(root/'vendor/space-locks'/name/'package-lock.json',dest/name/'package-lock.json')
