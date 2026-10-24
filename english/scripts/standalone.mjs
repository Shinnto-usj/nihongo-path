import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const destination=resolve(process.argv[2]||resolve(root,'dist','English-Atelier.html'));
const read=path=>readFile(resolve(root,path),'utf8');
async function inlineModule(path,names){
  const source=(await read(path)).replace(/^export\s+(?=(?:const|let|function|class)\b)/gm,'');
  return `const {${names.join(',')}}=(()=>{\n${source}\nreturn {${names.join(',')}};\n})();`;
}
const modules=await Promise.all([
  inlineModule('content/course.js',['tracks','lessons','diagnostic']),
  inlineModule('content/studio.js',['listening','speaking','resources','benchmarks']),
  inlineModule('lib/engine.js',['STORAGE_KEY','defaultState','loadState','saveState','importState','exportState','localDate','getStreak','dueCards','reviewCard','recordLesson','recordPractice','recordBaseline','saveDraft','getDailyPlan']),
  inlineModule('lib/pronunciation.js',['normalizePronunciationText','createPronunciationPlayer'])
]);
const {pronunciation}=await import('../content/pronunciation.js');
const audioData={};
for(const entry of Object.values(pronunciation.entries)){
  if(!/^\.\/assets\/audio\/[a-z0-9-]+\.mp3$/.test(entry.src))throw new Error('Invalid public audio path');
  if(!audioData[entry.src])audioData[entry.src]=`data:audio/mpeg;base64,${(await readFile(resolve(root,entry.src))).toString('base64')}`;
}
modules.push(`const pronunciation=${JSON.stringify(pronunciation)};\n{const embeddedAudio=${JSON.stringify(audioData)};for(const entry of Object.values(pronunciation.entries))entry.src=embeddedAudio[entry.src];}`);
const application=(await read('app.js')).replace(/^import .*;\s*\n/gm,'');
const script=`(()=>{\n'use strict';\n${modules.join('\n')}\n${application}\n})();`;
new Function(script);
const favicon=`data:image/svg+xml;base64,${Buffer.from(await read('assets/icon.svg')).toString('base64')}`;
let html=await read('index.html');
const css=await read('styles.css');
html=html.replace(/<link[^>]*href="\.\/styles\.css"[^>]*>/,()=>`<style>\n${css}\n</style>`).replaceAll('./assets/icon.svg',favicon);
html=html.replace(/<script[^>]*src="\.\/app\.js"[^>]*><\/script>/,()=>`<script>\n${script.replaceAll('</script','<\\/script')}\n</script>`);
const embedded=html.match(/<script>([\s\S]*?)<\/script>/),embeddedStyle=html.match(/<style>([\s\S]*?)<\/style>/);
if(!embedded||!embeddedStyle)throw new Error('Standalone script/styles missing.');
new Function(embedded[1]);
const hash=value=>createHash('sha256').update(value,'utf8').digest('base64');
html=html.replace("script-src 'self'",()=>`script-src 'sha256-${hash(embedded[1])}'`)
  .replace("style-src 'self'",()=>`style-src 'sha256-${hash(embeddedStyle[1])}'`).replace("img-src 'self'","img-src data:")
  .replace("media-src 'self' blob:","media-src data: blob:");
if(/(?:src|href)="\.\//.test(html))throw new Error('Relative asset remains in standalone.');
await mkdir(dirname(destination),{recursive:true});await writeFile(destination,html);
console.log(JSON.stringify({standalone:destination,bytes:Buffer.byteLength(html),externalRuntimeDependencies:0}));
