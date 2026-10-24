import {mkdir, readdir, rm, cp, writeFile, lstat} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {pronunciation} from '../content/pronunciation.js';
const root=resolve(import.meta.dirname,'..');
const out=resolve(root,'dist');
export const publicFiles=['index.html','styles.css','app.js','content/course.js','content/studio.js','content/pronunciation.js','lib/engine.js','lib/pronunciation.js','assets/icon.svg'];
for(const entry of Object.values(pronunciation.entries)){
  if(!/^\.\/assets\/audio\/[a-z0-9-]+\.mp3$/.test(entry.src))throw new Error('Invalid public audio path');
  if(!publicFiles.includes(entry.src.slice(2)))publicFiles.push(entry.src.slice(2));
}
await mkdir(out,{recursive:true});
for(const entry of await readdir(out))await rm(resolve(out,entry),{recursive:true,force:true});
for(const file of publicFiles){
  if(!(await lstat(resolve(root,file))).isFile())throw new Error(`Public source is not a regular file: ${file}`);
  await mkdir(dirname(resolve(out,file)),{recursive:true});await cp(resolve(root,file),resolve(out,file));
}
await writeFile(resolve(out,'.nojekyll'),'');
console.log('Built English Atelier static files and course audio.');
