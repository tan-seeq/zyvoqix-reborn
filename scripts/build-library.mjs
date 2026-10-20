import { mkdir, readFile, writeFile, rm, cp, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const config = JSON.parse(await readFile(path.join(root, 'library.lock.json'), 'utf8'));
const sha256 = b => createHash('sha256').update(b).digest('hex');
await mkdir(path.join(root, '.library-build'), {recursive:true});
for (const game of config.games) {
  const archive = path.join(root, game.archive);
  let bytes;
  try { bytes = await readFile(archive); }
  catch (error) {
    if (error.code !== 'ENOENT' || !config.archiveCommit) throw error;
    const url = `https://raw.githubusercontent.com/tan-seeq/zyvoqix-reborn/${config.archiveCommit}/${game.archive}`;
    const res = await fetch(url, {signal: AbortSignal.timeout(120000)});
    if (!res.ok) throw new Error(`${game.id}: archive download ${res.status}`);
    bytes = Buffer.from(await res.arrayBuffer());
    await mkdir(path.dirname(archive), {recursive:true});
    await writeFile(archive, bytes);
  }
  if (sha256(bytes) !== game.sha256) throw new Error(`${game.id}: archive checksum mismatch`);
  const temp = path.join(root, '.library-build', game.id);
  await rm(temp, {recursive:true, force:true});
  await mkdir(temp, {recursive:true});
  const names = execFileSync('tar', ['-tzf',archive], {encoding:'utf8'}).trim().split('\n');
  if (names.some(n => n.startsWith('/') || n.split('/').includes('..'))) throw new Error('Unsafe archive path');
  execFileSync('tar', ['-xzf', archive, '-C', temp]);
  const dest = path.join(root, 'public', 'games', game.id);
  await rm(dest, {recursive:true, force:true});
  await cp(path.join(temp,'runtime'), dest, {recursive:true});
  for (const f of game.required) {
    if (!(await stat(path.join(dest,f))).isFile()) throw new Error(`${game.id}: missing ${f}`);
  }
  console.log(`Prepared ${game.id} from verified local archive`);
}
await writeFile(path.join(root,'public','library-build.json'), JSON.stringify({version:8,games:config.games.map(g=>({id:g.id,upstreamCommit:g.upstreamCommit,sha256:g.sha256})),runtime:'same-origin static files'},null,2));
await rm(path.join(root,'.library-build'), {recursive:true,force:true});
