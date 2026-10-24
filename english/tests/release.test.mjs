/**
 * Exercise the real release builders in a disposable checkout. Nothing here
 * rebuilds the working preview or launches a subprocess. These checks cover
 * packaging and explicit policy; browser audio/CSP behaviour needs browser QA.
 * Optional ENGLISH_RELEASE_PRIVATE_TERMS is a releaser-supplied JSON string
 * array. Private names, scores, and other values never belong in this source.
 */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Script } from 'node:vm';
import { pronunciation } from '../content/pronunciation.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME_FILES = [
  '.nojekyll', 'app.js', 'assets/icon.svg', 'content/course.js',
  'content/studio.js', 'content/pronunciation.js', 'index.html',
  'lib/engine.js', 'lib/pronunciation.js', 'styles.css',
].sort();
const AUDIO_FILES = [...new Set(Object.values(pronunciation.entries).map(entry => {
  assert.match(entry.src, /^\.\/assets\/audio\/[a-z0-9-]+\.mp3$/);
  return entry.src.slice(2);
}))].sort();
const PUBLIC_FILES = [...RUNTIME_FILES, ...AUDIO_FILES].sort();
const CANARY = 'PRIVATE_ENGLISH_RELEASE_FIXTURE_DO_NOT_PUBLISH';
let scratch, checkout, output, standalone, built = false;

function writeFixture(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

before(async () => {
  scratch = mkdtempSync(join(tmpdir(), 'english-release-'));
  checkout = join(scratch, 'checkout');
  output = join(checkout, 'dist');
  standalone = join(scratch, 'artifacts', 'English-Atelier.html');
  mkdirSync(checkout);
  for (const path of ['index.html', 'styles.css', 'app.js', 'content', 'lib', 'assets', 'scripts', 'package.json']) {
    cpSync(join(ROOT, path), join(checkout, path), { recursive: true });
  }
  // In particular, copying entire runtime directories must not quietly expose
  // a backup dropped alongside a course file or a stale previous deployment.
  for (const path of [
    '.git/config', '.openai/hosting.json', '.env', 'backups/local-progress.json',
    'content/private-notes.json', 'lib/debug-private.json', 'assets/private-sample.txt',
    'assets/audio/private-microphone-recording.mp3',
    'dist/.env', 'dist/.openai/hosting.json', 'dist/stale-progress.json',
  ]) writeFixture(join(checkout, path), CANARY);
  const pkg = JSON.parse(readFileSync(join(checkout, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.build, 'node scripts/build.mjs');
  assert.equal(pkg.scripts.standalone, 'node scripts/standalone.mjs');
  await import(pathToFileURL(join(checkout, 'scripts/build.mjs')).href);
  const previousArgv = process.argv;
  try {
    process.argv = [process.execPath, join(checkout, 'scripts/standalone.mjs'), standalone];
    await import(pathToFileURL(join(checkout, 'scripts/standalone.mjs')).href);
  } finally {
    process.argv = previousArgv;
  }
  built = true;
});

after(() => { if (scratch) rmSync(scratch, { recursive: true, force: true }); });

function filesBelow(path, prefix = '') {
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    assert.ok(!entry.isSymbolicLink(), `Published artifact must not contain a symlink: ${relative}`);
    return entry.isDirectory() ? filesBelow(join(path, entry.name), relative) : [relative];
  }).sort();
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'))?.[2];
}

function blocks(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}\\s*>`, 'gi'))]
    .map(match => ({ attributes: match[1], text: match[2] }));
}

function policyIn(html) {
  const matches = [...html.matchAll(/<meta\b[^>]*>/gi)].filter(match =>
    attribute(match[0], 'http-equiv')?.toLowerCase() === 'content-security-policy');
  assert.equal(matches.length, 1, 'Exactly one enforcing CSP must be in the document');
  const match = matches[0];
  const content = attribute(match[0], 'content');
  assert.ok(content, 'CSP content must not be empty');
  const policy = new Map();
  for (const directive of content.split(';').map(value => value.trim()).filter(Boolean)) {
    const [name, ...values] = directive.split(/\s+/);
    assert.ok(!policy.has(name), `Duplicate CSP directive: ${name}`);
    policy.set(name, values);
  }
  assert.ok(match.index > html.search(/<head\b/i) && match.index < html.search(/<\/head\s*>/i), 'CSP must be in head');
  const firstResource = html.search(/<(?:link|style|script)\b/i);
  assert.ok(firstResource < 0 || match.index < firstResource, 'CSP must precede every resource tag');
  assert.doesNotMatch(html, /http-equiv\s*=\s*["']Content-Security-Policy-Report-Only["']/i);
  for (const unsupported of ['frame-ancestors', 'sandbox', 'report-uri']) {
    assert.ok(!policy.has(unsupported), `${unsupported} is not an effective meta-delivered restriction`);
  }
  return policy;
}

function commonPolicy(policy, mediaSources) {
  for (const directive of [
    'default-src', 'connect-src', 'script-src-attr', 'style-src-attr', 'font-src',
    'object-src', 'frame-src', 'worker-src', 'base-uri', 'form-action',
  ]) assert.deepEqual(policy.get(directive), ["'none'"], `${directive} must remain closed`);
  assert.deepEqual([...(policy.get('media-src') || [])].sort(), [...mediaSources].sort(),
    'Only the declared course-audio source and local recording blobs may play');
  for (const directive of ['script-src', 'script-src-elem', 'script-src-attr']) {
    const values = policy.get(directive) || [];
    for (const forbidden of ["'unsafe-inline'", "'unsafe-eval'", '*', 'data:', 'blob:', 'https:', 'http:']) {
      assert.ok(!values.includes(forbidden), `${directive} grants unintended script execution`);
    }
  }
}

const hashSource = text => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

function initializedStandaloneManifest(script) {
  // Observe the real bundle's manifest after its embedding prelude, then stop
  // at the first UI query. Do not reconstruct the builder's substitution logic.
  let found = false;
  const instrumented = script.replace(/\bconst pronunciation\s*=/, match => {
    found = true;
    return `${match}globalThis.__releasePronunciation=`;
  });
  assert.ok(found, 'The standalone must initialize its pronunciation manifest');
  const uiBoundary = new Error('Release inspection reached the application UI');
  const context = {
    document: { baseURI: 'file:///English-Atelier.html', hidden: false, querySelector() { throw uiBoundary; } },
    localStorage: { getItem() { return null; } },
  };
  assert.throws(() => new Script(instrumented).runInNewContext(context, { timeout: 5000 }),
    error => error === uiBoundary);
  assert.ok(context.__releasePronunciation);
  return JSON.parse(JSON.stringify(context.__releasePronunciation));
}

test('real builders produce a parseable standalone and only nine runtime files, nojekyll, and referenced audio', () => {
  assert.ok(built);
  assert.equal(RUNTIME_FILES.length, 10);
  assert.equal(AUDIO_FILES.length, 85);
  assert.deepEqual(filesBelow(output), PUBLIC_FILES);
  for (const path of AUDIO_FILES) assert.deepEqual(readFileSync(join(output, path)), readFileSync(join(ROOT, path)),
    `Build changed the reviewed audio asset: ${path}`);
  const scripts = blocks(readFileSync(standalone, 'utf8'), 'script');
  assert.equal(scripts.length, 1);
  assert.ok(scripts[0].text.length > 1000);
  assert.doesNotThrow(() => new Script(scripts[0].text, { filename: 'english-standalone.js' }));
});

test('public artifacts exclude stale files, private fixtures, credentials, and local hosting metadata', () => {
  const denied = JSON.parse(process.env.ENGLISH_RELEASE_PRIVATE_TERMS || '[]');
  assert.ok(Array.isArray(denied) && denied.every(term => typeof term === 'string' && term.length > 0));
  const privateTerms = denied.map(term => term.normalize('NFKC').toLowerCase());
  for (const path of PUBLIC_FILES) assert.ok(!readFileSync(join(output, path)).includes(Buffer.from(CANARY)),
    `${path} contains a private fixture`);
  for (const [path, text] of [
    ...RUNTIME_FILES.map(path => [path, readFileSync(join(output, path), 'utf8')]),
    ['standalone HTML', readFileSync(standalone, 'utf8')],
  ]) {
    assert.ok(!text.includes(CANARY), `${path} contains a private fixture`);
    assert.doesNotMatch(text, /appgprj_[a-z0-9]+|\/workspace\/scratch\/|\/Users\/[A-Za-z0-9_-]+\//i,
      `${path} contains internal hosting or local workspace metadata`);
    assert.doesNotMatch(text, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}/,
      `${path} contains a credential-shaped value`);
    assert.doesNotMatch(text, /sourceMappingURL\s*=/, `${path} unexpectedly publishes a source map reference`);
    const normalized = text.normalize('NFKC').toLowerCase();
    for (const term of privateTerms) assert.ok(!normalized.includes(term), `${path} contains a privately supplied disallowed value`);
  }
});

test('hosted CSP precedes resources and permits only the packaged modules and styles', () => {
  const html = readFileSync(join(output, 'index.html'), 'utf8');
  const policy = policyIn(html);
  commonPolicy(policy, ["'self'", 'blob:']);
  assert.deepEqual(policy.get('script-src'), ["'self'"]);
  assert.deepEqual(policy.get('style-src'), ["'self'"]);
  assert.deepEqual(policy.get('img-src'), ["'self'"]);
  const scripts = blocks(html, 'script');
  assert.equal(scripts.length, 1);
  assert.equal(attribute(scripts[0].attributes, 'type'), 'module');
  assert.equal(attribute(scripts[0].attributes, 'src'), './app.js');
  assert.equal(scripts[0].text.trim(), '');
  assert.doesNotMatch(html, /\son[a-z]+\s*=|\sstyle\s*=/i, 'Markup must not need inline handlers or styles');
  for (const match of html.matchAll(/<(?:link|script|img|audio|video|source|iframe)\b[^>]*>/gi)) {
    const url = attribute(match[0], 'src') || attribute(match[0], 'href');
    if (url) assert.ok(url.startsWith('./') && PUBLIC_FILES.includes(url.slice(2)), `Unreviewed automatic resource: ${url}`);
  }
});

test('standalone CSP hashes match the exact final embedded bytes and need no runtime asset requests', () => {
  const html = readFileSync(standalone, 'utf8');
  const policy = policyIn(html);
  commonPolicy(policy, ['data:', 'blob:']);
  const scripts = blocks(html, 'script'), styles = blocks(html, 'style');
  assert.equal(scripts.length, 1);
  assert.equal(styles.length, 1);
  assert.equal(attribute(scripts[0].attributes, 'src'), undefined);
  assert.deepEqual(policy.get('script-src'), [hashSource(scripts[0].text)]);
  assert.deepEqual(policy.get('style-src'), [hashSource(styles[0].text)]);
  assert.deepEqual(policy.get('img-src'), ['data:']);
  const embeddedAudio = [...scripts[0].text.matchAll(/data:audio\/mpeg;base64,([A-Za-z0-9+/]+={0,2})/g)];
  assert.equal(embeddedAudio.length, AUDIO_FILES.length, 'Standalone must embed every fixed course clip');
  const digest = bytes => createHash('sha256').update(bytes).digest('hex');
  assert.deepEqual(embeddedAudio.map(match => digest(Buffer.from(match[1], 'base64'))).sort(),
    AUDIO_FILES.map(path => digest(readFileSync(join(ROOT, path)))).sort(),
    'Standalone audio bytes must match the hosted assets');
  const initialized = initializedStandaloneManifest(scripts[0].text);
  assert.deepEqual(Object.keys(initialized.entries).sort(), Object.keys(pronunciation.entries).sort());
  for (const [text, entry] of Object.entries(pronunciation.entries)) {
    const expected = `data:audio/mpeg;base64,${readFileSync(join(ROOT, entry.src)).toString('base64')}`;
    assert.equal(initialized.entries[text].src, expected, 'Effective standalone manifest must use the exact embedded clip');
  }
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '');
  // External <a> links are deliberate navigation, not automatic dependencies.
  for (const match of markup.matchAll(/<(?:link|img|audio|video|source|iframe)\b[^>]*>/gi)) {
    const url = attribute(match[0], 'src') || attribute(match[0], 'href');
    if (url) assert.ok(url.startsWith('data:'), `Standalone requires an external asset: ${url}`);
  }
});

test('runtime has no upload, remote speech, or dynamic execution dependencies', () => {
  for (const path of RUNTIME_FILES.filter(path => path.endsWith('.js'))) {
    const text = readFileSync(join(output, path), 'utf8');
    assert.doesNotMatch(text, /\bfetch\s*\(|\bnew\s+(?:XMLHttpRequest|WebSocket|EventSource|Worker|SharedWorker)\s*\(|\bsendBeacon\s*\(|\bimportScripts\s*\(|\bserviceWorker\s*\./,
      `${path} introduces a network or worker API requiring review`);
    assert.doesNotMatch(text, /\beval\s*\(|\bnew\s+Function\s*\(|\bimport\s*\(/, `${path} introduces dynamic execution`);
    assert.doesNotMatch(text, /\b(?:webkit)?SpeechRecognition\b/, `${path} introduces speech recognition`);
    assert.doesNotMatch(text, /\b(?:import|export)\s[^;\n]*\bfrom\s*["'](?:https?:|\/\/)/, `${path} imports remote code`);
    assert.doesNotMatch(text, /\bstyle\s*=\s*["']|\son(?:click|load|error)\s*=/i, `${path} renders disallowed inline attributes`);
  }
  const css = readFileSync(join(output, 'styles.css'), 'utf8');
  assert.doesNotMatch(css, /@import\b|url\(\s*["']?(?:https?:|\/\/)/i, 'CSS adds an external resource');
  const svg = readFileSync(join(output, 'assets/icon.svg'), 'utf8');
  assert.doesNotMatch(svg, /<script\b|\son[a-z]+\s*=|(?:xlink:href|href)\s*=\s*["'](?:https?:|\/\/)/i);
  const app = readFileSync(join(output, 'app.js'), 'utf8');
  assert.match(app, /localService\s*===\s*true/, 'Speech selection must explicitly require a local voice');
  assert.match(app, /URL\.createObjectURL\(new Blob\(/, 'Recording playback must use a local blob');
  assert.match(app, /player\.src\s*=\s*recordingUrl/);
  assert.match(app, /URL\.revokeObjectURL\(recordingUrl\)/, 'Recording data must have an explicit release path');
});

test('built modules export complete curriculum and start with empty learner records', async () => {
  const course = await import(pathToFileURL(join(output, 'content/course.js')).href);
  const studio = await import(pathToFileURL(join(output, 'content/studio.js')).href);
  for (const key of ['tracks', 'lessons', 'diagnostic']) assert.ok(Array.isArray(course[key]) && course[key].length > 0, key);
  for (const key of ['listening', 'speaking', 'resources', 'benchmarks']) assert.ok(Array.isArray(studio[key]) && studio[key].length > 0, key);
  const engine = await import(pathToFileURL(join(output, 'lib/engine.js')).href);
  const state = engine.defaultState(new Date('2030-01-01T00:00:00.000Z'));
  assert.equal(engine.STORAGE_KEY, 'english-atelier:v1');
  assert.deepEqual(Object.keys(state.profile).sort(), ['dailyMinutes', 'focus', 'speechRate', 'timeZone', 'voiceURI']);
  for (const key of ['lessons', 'cards', 'drafts']) assert.deepEqual(state[key], {}, key);
  for (const key of ['practice', 'baseline', 'reviews']) assert.deepEqual(state[key], [], key);
  assert.equal(state.profile.voiceURI, '');
  assert.equal(state.createdAt, '2030-01-01T00:00:00.000Z');
  assert.doesNotThrow(() => engine.importState(engine.exportState(state)));
});
