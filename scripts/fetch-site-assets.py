from pathlib import Path
import urllib.request, hashlib, json
root=Path(__file__).resolve().parents[1]
for item in json.loads((root/'vendor/site-assets.json').read_text()):
    data=urllib.request.urlopen(item['url'],timeout=90).read()
    assert hashlib.sha256(data).hexdigest()==item['sha256'],f"Site asset hash mismatch: {item['path']}"
    p=root/item['path'];p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
print('Verified and restored original V7 site assets.')
