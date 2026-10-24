/**
 * Release checks run the real builders in a disposable checkout. They never
 * rebuild the developer's dist/ or copy local progress into the published app.
 * Optional NIHONGO_RELEASE_PRIVATE_TERMS is a JSON string array supplied only
 * by the releaser; private values do not belong in this public test source.
 * These are artifact/policy checks, not substitutes for browser CSP/audio QA.
 */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Script } from 'node:vm';
import {pronunciation as jaAudio} from '../content/pronunciation.js';
import {pronunciation as enAudio} from '../english/content/pronunciation.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_FILES = [
  '.nojekyll', 'app.js', 'assets/icon.svg', 'assets/journey.svg',
  'content/course.js', 'content/pronunciation.js', 'index.html', 'lib/engine.js', 'lib/kana.js', 'lib/pronunciation.js', 'styles.css',
  'english/index.html', 'english/styles.css', 'english/app.js',
  'english/content/course.js', 'english/content/studio.js',
  'english/lib/engine.js', 'english/lib/pronunciation.js', 'english/content/pronunciation.js', 'english/assets/icon.svg',
  ...new Set(Object.values(jaAudio.entries).map(entry => entry.src.slice(2))),
  ...new Set(Object.values(enAudio.entries).map(entry => `english/${entry.src.slice(2)}`)),
].sort();
const CANARY = 'PRIVATE_RELEASE_FIXTURE_DO_NOT_PUBLISH';
let scratch, checkout, output, standalone, buildersCompleted = false;

function writeFixture(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
}

before(async () => {
  scratch = mkdtempSync(join(tmpdir(), 'nihongo-release-'));
  checkout = join(scratch, 'checkout');
  output = join(checkout, 'dist');
  standalone = join(scratch, 'artifacts', 'Nihongo-Path.html');
  mkdirSync(checkout);
  for (const path of ['index.html', 'styles.css', 'app.js', 'lib', 'content', 'assets', 'scripts', 'package.json', 'english']) {
    cpSync(join(ROOT, path), join(checkout, path), { recursive: true });
  }
  // Root-local material and stale build artifacts must not survive the build.
  for (const path of [
    '.git/config', '.openai/hosting.json', '.env',
    'backups/nihongo-progress-local.json', 'private-personal-plan.json',
    'content/private-notes.json', 'lib/private-debug.json', 'assets/private-sample.txt',
    'assets/audio/private-sample.mp3', 'english/assets/audio/private-sample.mp3',
    'dist/.openai/hosting.json', 'dist/.env', 'dist/nihongo-progress-stale.json',
  ]) writeFixture(join(checkout, path), CANARY);
  const packageData = JSON.parse(readFileSync(join(checkout, 'package.json'), 'utf8'));
  assert.equal(packageData.scripts.build, 'node scripts/build.mjs');
  assert.equal(packageData.scripts.standalone, 'node scripts/standalone.mjs');
  // Execute the actual npm entrypoints in this test process. Their import.meta
  // paths resolve to the temporary copy, so neither a subprocess nor a write to
  // the working preview is needed. The standalone CLI accepts its output path.
  await import(pathToFileURL(join(checkout, 'scripts', 'build.mjs')).href);
  const previousArgv = process.argv;
  try {
    process.argv = [process.execPath, join(checkout, 'scripts', 'standalone.mjs'), standalone];
    await import(pathToFileURL(join(checkout, 'scripts', 'standalone.mjs')).href);
  } finally {
    process.argv = previousArgv;
  }
  buildersCompleted = true;
});

after(() => {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
});

function filesBelow(path, prefix = '') {
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    assert.ok(!entry.isSymbolicLink(), `Published artifact must not contain a symlink: ${relative}`);
    return entry.isDirectory()
      ? filesBelow(join(path, entry.name), relative)
      : [relative];
  }).sort();
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  return match?.[2];
}

function policyIn(html) {
  const matches = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .filter(match => attribute(match[0], 'http-equiv')?.toLowerCase() === 'content-security-policy');
  assert.equal(matches.length, 1, 'Each document must deliver one explicit CSP meta policy');
  const match = matches[0];
  const content = attribute(match[0], 'content');
  assert.ok(content, 'CSP content must not be empty');
  const policy = new Map();
  for (const directive of content.split(';').map(value => value.trim()).filter(Boolean)) {
    const [name, ...values] = directive.split(/\s+/);
    assert.ok(!policy.has(name), `Duplicate CSP directive: ${name}`);
    policy.set(name, values);
  }
  const firstResource = html.search(/<(?:link|style|script)\b/i);
  assert.ok(match.index > html.search(/<head\b/i), 'CSP must be inside the document head');
  assert.ok(match.index < html.search(/<\/head\s*>/i), 'CSP must precede the end of head');
  assert.ok(firstResource < 0 || match.index < firstResource, 'CSP must precede styles, scripts, and linked resources');
  assert.doesNotMatch(html, /http-equiv\s*=\s*["']Content-Security-Policy-Report-Only["']/i);
  for (const unsupported of ['frame-ancestors', 'sandbox', 'report-uri']) {
    assert.ok(!policy.has(unsupported), `${unsupported} must not be represented as an effective meta policy`);
  }
  return policy;
}

function assertCommonPolicy(policy) {
  for (const directive of [
    'default-src', 'connect-src', 'script-src-attr', 'font-src', 'object-src',
    'frame-src', 'worker-src', 'base-uri', 'form-action',
  ]) assert.deepEqual(policy.get(directive), ["'none'"], `${directive} must remain closed`);
  assert.ok(policy.has('media-src'), 'Audio must have an explicit policy');
  for (const directive of ['script-src', 'script-src-elem', 'script-src-attr']) {
    const values = policy.get(directive) || [];
    for (const forbidden of ["'unsafe-inline'", "'unsafe-eval'", '*', 'data:', 'blob:', 'https:', 'http:']) {
      assert.ok(!values.includes(forbidden), `${directive} grants an unintended execution source`);
    }
  }
  const app = readFileSync(join(output, 'app.js'), 'utf8');
  if (/\bstyle\s*=\s*["']/.test(app)) {
    assert.deepEqual(policy.get('style-src-attr'), ["'unsafe-inline'"], 'Generated progress widths need an explicit style-attribute policy');
  } else {
    assert.ok(["'none'", "'unsafe-inline'"].includes(policy.get('style-src-attr')?.[0]));
  }
}

function inlineBlocks(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}\\s*>`, 'gi'))]
    .map(match => ({ attributes: match[1], text: match[2] }));
}

function hashSource(text) {
  return `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;
}

function privateTerms() {
  const value = JSON.parse(process.env.NIHONGO_RELEASE_PRIVATE_TERMS || '[]');
  assert.ok(Array.isArray(value) && value.every(term => typeof term === 'string' && term.length > 0),
    'The optional private denylist must be a JSON array of nonempty strings');
  return value.map(term => term.normalize('NFKC').toLowerCase());
}

test('the documented build and standalone entrypoints produce usable artifacts in an isolated checkout', () => {
  assert.ok(buildersCompleted);
  assert.match(readFileSync(join(output, 'index.html'), 'utf8'), /<script\b[^>]*src="\.\/app\.js"/);
  const html = readFileSync(standalone, 'utf8');
  const scripts = inlineBlocks(html, 'script');
  assert.equal(scripts.length, 1);
  assert.ok(scripts[0].text.length > 1000, 'Standalone artifact must contain the application');
  assert.doesNotThrow(() => new Script(scripts[0].text, { filename: 'standalone-artifact.js' }));
});

test('the static artifact contains only reviewed application files and excludes private/stale material', () => {
  assert.deepEqual(filesBelow(output), PUBLIC_FILES);
  const deniedTerms = privateTerms();
  for (const [path, text] of [
    ...filesBelow(output).map(path => [path, readFileSync(join(output, path), 'utf8')]),
    ['standalone HTML', readFileSync(standalone, 'utf8')],
  ]) {
    assert.ok(!text.includes(CANARY), `${path} contains a private fixture`);
    assert.doesNotMatch(text, /appgprj_[a-z0-9]+|\/workspace\/scratch\/|\/Users\/[A-Za-z0-9_-]+\//i,
      `${path} contains an internal hosting identity or local workspace path`);
    assert.doesNotMatch(text, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}/,
      `${path} contains a credential-shaped value`);
    const normalized = text.normalize('NFKC').toLowerCase();
    for (const term of deniedTerms) assert.ok(!normalized.includes(term), `${path} contains a privately supplied disallowed value`);
  }
});

test('the hosted HTML has a preceding CSP that permits same-origin modules without inline script or eval', () => {
  const html = readFileSync(join(output, 'index.html'), 'utf8');
  const policy = policyIn(html);
  assertCommonPolicy(policy);
  assert.deepEqual(policy.get('script-src'), ["'self'"]);
  assert.deepEqual(policy.get('style-src'), ["'self'"]);
  assert.deepEqual(policy.get('img-src'), ["'self'"]);
  assert.deepEqual(policy.get('media-src'), ["'self'", 'blob:'], 'Only first-party course audio and local recordings are allowed');
  const scripts = inlineBlocks(html, 'script');
  assert.equal(scripts.length, 1);
  assert.equal(attribute(scripts[0].attributes, 'type'), 'module');
  assert.equal(attribute(scripts[0].attributes, 'src'), './app.js');
  assert.equal(scripts[0].text.trim(), '');
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i, 'HTML must not require inline event-handler execution');
});

test('standalone CSP hashes match the exact final embedded script and stylesheet bytes', () => {
  const html = readFileSync(standalone, 'utf8');
  const policy = policyIn(html);
  assertCommonPolicy(policy);
  const scripts = inlineBlocks(html, 'script');
  const styles = inlineBlocks(html, 'style');
  assert.equal(scripts.length, 1);
  assert.equal(styles.length, 1);
  assert.equal(attribute(scripts[0].attributes, 'src'), undefined);
  assert.deepEqual(policy.get('script-src'), [hashSource(scripts[0].text)]);
  assert.deepEqual(policy.get('style-src'), [hashSource(styles[0].text)]);
  assert.deepEqual(policy.get('img-src'), ['data:']);
  assert.deepEqual(policy.get('media-src'), ['data:', 'blob:'], 'Standalone course audio is embedded');
  assert.match(scripts[0].text, /data:audio\/mpeg;base64,/);
  // Inspect document markup, not HTML templates inside the embedded application.
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '');
  for (const element of markup.matchAll(/<(?:script|link|img|audio|video|source)\b[^>]*>/gi)) {
    for (const match of element[0].matchAll(/\b(?:src|href)\s*=\s*(["'])(.*?)\1/gi)) {
      assert.ok(match[2].startsWith('#') || match[2].startsWith('data:'), 'Standalone markup must not fetch an external asset');
    }
  }
});

test('published runtime modules contain no outgoing network/eval API calls while recording stays blob-backed', () => {
  const runtimeFiles = filesBelow(output).filter(path => path.endsWith('.js'));
  for (const path of runtimeFiles) {
    const text = readFileSync(join(output, path), 'utf8');
    assert.doesNotMatch(text, /\bfetch\s*\(|\bnew\s+(?:XMLHttpRequest|WebSocket|EventSource)\s*\(|\bsendBeacon\s*\(|\bimportScripts\s*\(/,
      `${path} adds an outgoing network API that requires a new release review`);
    assert.doesNotMatch(text, /\beval\s*\(|\bnew\s+Function\s*\(/,
      `${path} requires dynamic string execution`);
  }
  const app = readFileSync(join(output, 'app.js'), 'utf8');
  assert.match(app, /recordingUrl\s*=\s*URL\.createObjectURL\(new Blob\(/);
  assert.match(app, /player\.src\s*=\s*recordingUrl/);
  assert.match(app, /URL\.revokeObjectURL\(recordingUrl\)/);
});

test('public initial state and stage dates do not embed a learner identity or a fixed personal goal', async () => {
  const { defaultState } = await import(pathToFileURL(join(output, 'lib/engine.js')).href);
  const { course } = await import(pathToFileURL(join(output, 'content/course.js')).href);
  const state = defaultState(new Date('2030-01-01T00:00:00.000Z'));
  for (const field of ['targetDate', 'city', 'departureDate']) assert.equal(state.profile[field], '');
  for (const field of ['name', 'displayName', 'email']) assert.ok(!state.profile[field]);
  for (const field of ['cards', 'lessons', 'daily', 'scenarioCompletions']) assert.deepEqual(state[field], {});
  assert.deepEqual(state.assessments, []);
  for (const milestone of course.milestones) {
    assert.ok(!Object.hasOwn(milestone, 'date'), 'Public milestones must derive dates from a learner setting');
    assert.ok(Number.isFinite(milestone.fraction) && milestone.fraction >= 0 && milestone.fraction <= 1);
  }
  const html = readFileSync(join(output, 'index.html'), 'utf8');
  const targetLabel = html.match(/id="sidebar-target-date"[^>]*>([^<]*)</)?.[1];
  assert.ok(targetLabel);
  assert.doesNotMatch(targetLabel, /\d{4}[.-]\d{2}[.-]\d{2}/);
  // The teaching persona is explicit fiction, not the current learner's profile.
  const serialized = JSON.stringify(course);
  const personaMatches = [...serialized.matchAll(/(?:私は|わたしは|予約した|はい、)([ァ-ヶー]+)です/g)];
  assert.ok(personaMatches.length > 0, 'Keep an explicit fictional self-introduction example');
  for (const match of personaMatches) assert.equal(match[1], 'リナ');
  assert.match(serialized, /虚构.{0,12}(?:名字|姓名)|(?:名字|姓名).{0,12}虚构|通用示例姓名/);
});
