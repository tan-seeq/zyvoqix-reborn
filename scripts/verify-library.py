from pathlib import Path
from html.parser import HTMLParser
import json, struct, re
root=Path(__file__).resolve().parents[1]/'public'
games=json.loads((root/'library-catalog.json').read_text())
assert 'zyvoqix_v6_profiles' in (root/'app.js').read_text(), 'Old profile storage contract changed'
assert (root/'arcade/index.html').is_file()
assert 'localStorage.clear' not in (root/'library.js').read_text()
count=0
class Assets(HTMLParser):
    def __init__(self, folder):super().__init__();self.folder=folder
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        url=d.get('src') or (d.get('href') if tag=='link' else None)
        if not url or url.startswith(('data:','#')):return
        assert not url.startswith(('http:','https:','//')),f'External runtime asset: {url}'
        f=(root/url.lstrip('/')) if url.startswith('/') else self.folder/url.split('?')[0]
        assert f.is_file(),f'Missing HTML dependency: {f}'
for game in games:
    folder=root/'games'/game['id']
    Assets(folder).feed((folder/'index.html').read_text())
    for f in folder.rglob('*'):
        if f.is_file():count+=1
        if f.suffix=='.glb':
            b=f.read_bytes();n,kind=struct.unpack('<II',b[12:20]);doc=json.loads(b[20:20+n])
            assert 'KHR_draco_mesh_compression' not in doc.get('extensionsRequired',[]),f'Needs decoder: {f}'
            for obj in doc.get('images',[])+doc.get('buffers',[]):
                uri=obj.get('uri')
                if uri and not uri.startswith('data:'):
                    assert not uri.startswith(('http','//')),f'External GLB dependency: {f}'
                    assert (f.parent/uri).is_file(),f'Missing GLB dependency: {f.parent/uri}'
    assert (root/'licenses'/f"{game['id']}.txt").is_file()
print(f'Verified {len(games)} game entries, {count} runtime files, HTML and GLB dependencies.')
