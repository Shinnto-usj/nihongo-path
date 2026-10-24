import { mkdir, cp, rm, readdir, writeFile, lstat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pronunciation as japaneseAudio } from '../content/pronunciation.js';
import { pronunciation as englishAudio } from '../english/content/pronunciation.js';
const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'dist');
const japanese = ['index.html', 'styles.css', 'app.js', 'lib/engine.js', 'lib/kana.js', 'lib/pronunciation.js', 'content/course.js', 'content/pronunciation.js', 'assets/icon.svg', 'assets/journey.svg'];
const english = ['index.html', 'styles.css', 'app.js', 'content/course.js', 'content/studio.js', 'content/pronunciation.js', 'lib/engine.js', 'lib/pronunciation.js', 'assets/icon.svg'];
function audioFiles(manifest) {
  return [...new Set(Object.values(manifest.entries).map(entry => {
    if (!/^\.\/assets\/audio\/[a-z0-9-]+\.mp3$/.test(entry.src)) throw new Error('Invalid public audio path');
    return entry.src.slice(2);
  }))];
}
await mkdir(out, {recursive: true});
for (const entry of await readdir(out)) await rm(resolve(out, entry), {recursive: true, force: true});
// Only named runtime files and manifest-owned audio cross the release boundary.
for (const path of [...japanese, ...audioFiles(japaneseAudio), ...[...english, ...audioFiles(englishAudio)].map(path => `english/${path}`)]) {
  const source = resolve(root, path), target = resolve(out, path);
  if (!(await lstat(source)).isFile()) throw new Error(`Public source is not a regular file: ${path}`);
  await mkdir(dirname(target), {recursive: true});
  await cp(source, target);
}
await writeFile(resolve(out, '.nojekyll'), '');
console.log('Built Japanese and English static applications in dist/');
