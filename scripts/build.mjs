import { mkdir, cp, rm, access, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'dist');
await mkdir(out, {recursive: true});
for (const entry of await readdir(out)) await rm(resolve(out, entry), {recursive: true, force: true});
for (const path of ['index.html', 'styles.css', 'app.js', 'lib', 'content', 'assets']) {
  await access(resolve(root, path));
  await cp(resolve(root, path), resolve(out, path), {recursive: true});
}
await writeFile(resolve(out, '.nojekyll'), '');
console.log('Built static application in dist/');
