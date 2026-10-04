from pathlib import Path
import json,hashlib,zipfile,io
manifest=json.loads(Path('web-bundle.json').read_text())
pieces=[]
for part in manifest['parts']:
 content=Path(part['file']).read_bytes()
 assert hashlib.sha256(content).hexdigest()==part['sha256'],part['file']
 pieces.append(content)
data=b''.join(pieces)
assert hashlib.sha256(data).hexdigest()==manifest['sha256']
out=Path('public');out.mkdir(exist_ok=True)
with zipfile.ZipFile(io.BytesIO(data)) as archive:
 assert archive.testzip() is None
 for name in archive.namelist():
  assert (out/name).resolve().is_relative_to(out.resolve()),name
 archive.extractall(out)
for overlay in manifest.get('overlays',[]):
 source=Path(overlay['file'])
 content=source.read_bytes()
 assert hashlib.sha256(content).hexdigest()==overlay['sha256'],overlay['file']
 assert (out/source).resolve().is_relative_to(out.resolve())
 (out/source).write_bytes(content)
(out/'.nojekyll').write_text('')
print('Verified and extracted NVV web version '+manifest['version'])
