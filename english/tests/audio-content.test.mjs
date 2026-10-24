import test from 'node:test';
import assert from 'node:assert/strict';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessons } from '../content/course.js';
import { listening } from '../content/studio.js';
import { pronunciation } from '../content/pronunciation.js';
import { normalizePronunciationText } from '../lib/pronunciation.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PREVIEW = 'What I find interesting is the gap between what we expect and what we see.';

test('the fixed audio catalog covers all 85 public spoken texts without learner-specific extras', () => {
  const chunkTexts = lessons.flatMap(lesson => lesson.chunks.map(chunk => `${chunk.text}. ${chunk.example}`));
  assert.equal(listening.length, 12);
  assert.equal(chunkTexts.length, 72);
  const expected = [...listening.map(item => item.script), ...chunkTexts, PREVIEW]
    .map(normalizePronunciationText);
  assert.equal(expected.length, 85);
  assert.equal(new Set(expected).size, 85);
  assert.equal(pronunciation.schemaVersion, 1);
  assert.match(pronunciation.label, /合成/);
  assert.deepEqual(Object.keys(pronunciation.entries).sort(), expected.sort());
  assert.ok(readFileSync(join(ROOT, 'app.js'), 'utf8').includes(PREVIEW), 'Voice-preview text changed without an audio-catalog update');
});

test('each fixed source names a present, bounded MP3 and all audio files are referenced', () => {
  const files = [];
  for (const [text, entry] of Object.entries(pronunciation.entries)) {
    assert.equal(text, normalizePronunciationText(text));
    assert.match(entry.label, /合成/);
    assert.match(entry.src, /^\.\/assets\/audio\/kokoro-[a-f0-9]{24}\.mp3$/);
    const path = join(ROOT, entry.src);
    const stat = lstatSync(path);
    assert.ok(stat.isFile() && !stat.isSymbolicLink());
    assert.ok(stat.size > 1024 && stat.size < 10_000_000, `${entry.src}: clip is empty or exceeds the player's limit`);
    const bytes = readFileSync(path);
    assert.ok(bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0, `${entry.src}: missing MPEG audio frame header`);
    assert.notEqual(bytes.subarray(0, 3).toString('ascii'), 'ID3', 'Public clips do not carry an ID3 metadata tag');
    assert.notEqual(bytes.subarray(-128, -125).toString('ascii'), 'TAG', 'Public clips do not carry an ID3v1 tag');
    files.push(entry.src.split('/').at(-1));
  }
  assert.equal(new Set(files).size, 85);
  assert.deepEqual(readdirSync(join(ROOT, 'assets/audio')).sort(), files.sort());
});

test('English uses the exact shared pronunciation helper that receives lifecycle coverage', () => {
  assert.deepEqual(readFileSync(join(ROOT, 'lib/pronunciation.js')),
    readFileSync(resolve(ROOT, '../lib/pronunciation.js')));
});
