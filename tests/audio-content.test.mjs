import test from 'node:test';
import assert from 'node:assert/strict';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { course } from '../content/course.js';
import { kana } from '../lib/kana.js';
import { pronunciation } from '../content/pronunciation.js';
import { nativePronunciation } from '../content/native-pronunciation.js';
import { normalizePronunciationText } from '../lib/pronunciation.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO = join(ROOT, 'assets/audio');
const PREVIEW = 'こんにちは。いっしょに日本語を勉強しましょう。';
const SOURCE_NAME = 'Hakatanoshio117117';

function publicSpokenTexts(value, found = []) {
  if (Array.isArray(value)) value.forEach(item => publicSpokenTexts(item, found));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (['jp', 'audio'].includes(key) && typeof item === 'string' && item.trim()) found.push(item);
      publicSpokenTexts(item, found);
    }
  }
  return found;
}

const expectedTexts = [...new Set([
  ...publicSpokenTexts(course),
  ...kana.flatMap(item => [item.hiragana, item.katakana]),
  PREVIEW,
].map(normalizePronunciationText))].sort();

// Check successive MPEG Layer III frames after an optional ID3v2 tag. This
// rejects a renamed HTML response, a metadata-only file, and a truncated frame
// without requiring child processes in the test runner.
function mpegFrame(bytes, offset) {
  if (offset + 4 > bytes.length || bytes[offset] !== 0xff || (bytes[offset + 1] & 0xe0) !== 0xe0) return null;
  const version = (bytes[offset + 1] >> 3) & 3;
  const layer = (bytes[offset + 1] >> 1) & 3;
  const bitrateIndex = bytes[offset + 2] >> 4;
  const sampleIndex = (bytes[offset + 2] >> 2) & 3;
  if (version === 1 || layer !== 1 || !bitrateIndex || bitrateIndex === 15 || sampleIndex === 3) return null;
  const bitrates = version === 3
    ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
    : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
  const divisor = version === 3 ? 1 : version === 2 ? 2 : 4;
  const sampleRate = [44100, 48000, 32000][sampleIndex] / divisor;
  const padding = (bytes[offset + 2] >> 1) & 1;
  const length = Math.floor((version === 3 ? 144000 : 72000) * bitrates[bitrateIndex] / sampleRate) + padding;
  if (length < 4 || offset + length > bytes.length) return null;
  return { length, sampleRate, version };
}

function hasConsecutiveMp3Frames(bytes) {
  let start = 0;
  if (bytes.subarray(0, 3).toString('ascii') === 'ID3') {
    if (bytes.length < 10 || bytes.subarray(6, 10).some(byte => byte & 0x80)) return false;
    const tagSize = (bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9];
    start = 10 + tagSize + (bytes[3] === 4 && (bytes[5] & 0x10) ? 10 : 0);
  }
  for (let offset = start; offset < Math.min(start + 1024, bytes.length - 12); offset++) {
    const first = mpegFrame(bytes, offset);
    if (!first) continue;
    const second = mpegFrame(bytes, offset + first.length);
    const third = second && mpegFrame(bytes, offset + first.length + second.length);
    if (third && first.sampleRate === second.sampleRate && second.sampleRate === third.sampleRate
      && first.version === second.version && second.version === third.version) return true;
  }
  return false;
}

test('the Japanese catalog covers every course spoken field, both kana scripts and the settings preview', () => {
  assert.equal(pronunciation.schemaVersion, 1);
  assert.ok(publicSpokenTexts(course).length > 200, 'Course traversal unexpectedly omitted spoken fields');
  assert.deepEqual(Object.keys(pronunciation.entries).sort(), expectedTexts,
    'Every public jp/audio field and kana button needs a clip; the fixed catalog must not contain extra learner text');
  assert.ok(readFileSync(join(ROOT, 'app.js'), 'utf8').includes(PREVIEW),
    'Settings preview changed without updating the audio catalog contract');
});

test('every available modern kana recording keeps both script aliases and takes priority in the combined catalog', () => {
  const modern = kana.filter(item => item.kind !== 'contracted');
  const available = modern.filter(item => nativePronunciation.entries[item.hiragana] || nativePronunciation.entries[item.katakana]);
  assert.equal(nativePronunciation.schemaVersion, 1);
  assert.ok(available.length > 0, 'No human recordings are referenced');
  assert.deepEqual(Object.keys(nativePronunciation.entries).sort(),
    available.flatMap(item => [item.hiragana, item.katakana]).sort(),
    'Only supported modern kana may appear; every available recording needs both script aliases');
  const files = new Set();
  for (const item of available) {
    const a = nativePronunciation.entries[item.hiragana];
    assert.deepEqual(a, nativePronunciation.entries[item.katakana], `${item.hiragana}: script aliases diverged`);
    assert.match(a.src, /^\.\/assets\/audio\/native-[a-z]+\.mp3$/);
    assert.match(a.source, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.equal(a.license, 'PD-self');
    assert.equal(a.licenseUrl, 'https://commons.wikimedia.org/wiki/Template:PD-self');
    assert.ok(a.label.includes(SOURCE_NAME) && a.label.includes('真人'));
    for (const text of [item.hiragana, item.katakana]) {
      const combined = pronunciation.entries[normalizePronunciationText(text)];
      assert.equal(combined?.src, a.src, `${text}: a synthetic clip replaced the available human recording`);
      assert.equal(combined.label, a.label, `${text}: real recording attribution was lost`);
    }
    files.add(a.src);
  }
  assert.equal(files.size, available.length, 'Distinct source recordings must not collapse onto a reused file');
  assert.ok(!nativePronunciation.entries['ゐ'] && !nativePronunciation.entries['ゑ']);
});

test('every Japanese clip is a bounded local MP3 with actual MPEG frames and no unreferenced assets', () => {
  const referenced = new Set();
  for (const [text, entry] of Object.entries(pronunciation.entries)) {
    assert.equal(text, normalizePronunciationText(text));
    assert.ok(entry && typeof entry === 'object' && !Array.isArray(entry), `${text}: missing source label`);
    assert.match(entry.src, /^\.\/assets\/audio\/[a-z0-9]+(?:-[a-z0-9]+)*\.mp3$/);
    const file = resolve(ROOT, entry.src);
    assert.equal(dirname(file), AUDIO, 'Audio paths must stay inside the published audio directory');
    const stat = lstatSync(file);
    assert.ok(stat.isFile() && !stat.isSymbolicLink());
    assert.ok(stat.size > 1024 && stat.size < 10_000_000, `${entry.src}: empty or oversized clip`);
    if (!referenced.has(entry.src)) {
      assert.ok(hasConsecutiveMp3Frames(readFileSync(file)), `${entry.src}: no complete MP3 frame sequence`);
    }
    if (!entry.src.includes('/native-')) assert.match(entry.label, /合成/, `${text}: generated speech needs its own label`);
    referenced.add(entry.src);
  }
  const actual = readdirSync(AUDIO, { withFileTypes: true });
  assert.ok(actual.every(item => item.isFile() && !item.isSymbolicLink()), 'Unexpected directory or link in audio assets');
  assert.deepEqual(actual.map(item => `./assets/audio/${item.name}`).sort(), [...referenced].sort(),
    'Only referenced finished MP3 assets should be published');
});

test('the byte check rejects empty, metadata-only and truncated fake audio', () => {
  assert.equal(hasConsecutiveMp3Frames(Buffer.alloc(0)), false);
  assert.equal(hasConsecutiveMp3Frames(Buffer.from('<html>429 Too Many Requests</html>')), false);
  assert.equal(hasConsecutiveMp3Frames(Buffer.from([0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 0, 0])), false);
  assert.equal(hasConsecutiveMp3Frames(Buffer.from([0xff, 0xfb, 0x90, 0x00])), false);
});
