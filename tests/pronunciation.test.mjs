import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePronunciationText, createPronunciationPlayer } from '../lib/pronunciation.js';

const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const tick = async () => { await Promise.resolve(); await Promise.resolve(); };

function harness({ entries = { 'Hello world.': './assets/audio/hello.mp3' }, hidden = false, timeout = 8_000 } = {}) {
  const calls = { audio: [], status: [], fallback: [], stopFallback: 0 };
  const visibility = { hidden };
  const player = createPronunciationPlayer({
    manifest: { schemaVersion: 1, label: '预生成 AI 合成语音', entries },
    baseURL: 'https://example.test/course/index.html', isHidden: () => visibility.hidden,
    playTimeoutMs: timeout,
    onStatus: event => calls.status.push(event), stopFallback: () => { calls.stopFallback += 1; },
    createAudio: () => {
      const pending = deferred();
      const audio = { pending, preservesPitch: false, paused: true, loads: 0,
        play() { this.paused = false; return pending.promise; },
        pause() { this.paused = true; },
        removeAttribute(name) { delete this[name]; }, load() { this.loads += 1; },
      };
      calls.audio.push(audio); return audio;
    },
  });
  const fallback = async value => { calls.fallback.push(value); return true; };
  return { player, calls, fallback, visibility };
}

test('matching folds Unicode width and whitespace while preserving meaningful case and punctuation', () => {
  assert.equal(normalizePronunciationText('  Ｈｅｌｌｏ　world.\n '), 'Hello world.');
  assert.equal(normalizePronunciationText('こんにちは。\n いっしょに。'), 'こんにちは。 いっしょに。');
  assert.notEqual(normalizePronunciationText('US'), normalizePronunciationText('us'));
  assert.notEqual(normalizePronunciationText('Is it?'), normalizePronunciationText('Is it.'));
  assert.throws(() => createPronunciationPlayer({ manifest: { schemaVersion: 1, entries: {
    Hello: 'a.mp3', 'Ｈｅｌｌｏ': 'b.mp3',
  } } }), /Conflicting/u);
});

test('matched public audio plays from the same origin at the selected rate without invoking speech', async () => {
  const { player, calls, fallback } = harness();
  const pending = player.play(' Ｈｅｌｌｏ\nworld. ', { rate: 0.85, fallback });
  const audio = calls.audio[0];
  assert.equal(audio.src, 'https://example.test/course/assets/audio/hello.mp3');
  assert.equal(audio.playbackRate, 0.85); assert.equal(audio.preservesPitch, true);
  audio.pending.resolve();
  assert.deepEqual(await pending, { status: 'playing', source: 'asset' });
  assert.equal(calls.fallback.length, 0);
  player.setRate(1.1); assert.equal(audio.playbackRate, 1.1);
  audio.onended();
  assert.equal(audio.paused, true); assert.equal(audio.src, undefined);
  assert.equal(calls.status.at(-1).state, 'ended');
});

test('missing audio passes text only to the explicitly supplied local fallback and creates no audio request', async () => {
  const { player, calls, fallback } = harness();
  const result = await player.play('A private practice sentence absent from the catalog.', { rate: 0.9, fallback });
  assert.equal(result.status, 'fallback'); assert.equal(result.reason, 'asset-missing');
  assert.equal(calls.audio.length, 0);
  assert.equal(calls.fallback[0].rate, 0.9); assert.equal(calls.fallback[0].isCurrent(), true);
  player.stop(); assert.equal(calls.fallback[0].isCurrent(), false);
});

test('cross-origin, unapproved data URLs and query-bearing sources never reach an audio element', async () => {
  for (const src of [
    'https://other.test/voice.mp3', '//other.test/voice.mp3', 'data:audio/mp3;base64,AAAA',
    './assets/audio/voice.mp3?text=private', './assets/audio/voice.mp3#fragment',
  ]) {
    const { player, calls, fallback } = harness({ entries: { Hello: src } });
    const result = await player.play('Hello', { fallback });
    assert.equal(result.reason, 'asset-url-rejected'); assert.equal(calls.audio.length, 0);
    assert.equal(calls.fallback.length, 1); player.stop();
  }
});

test('standalone manifests can embed bounded audio data while rejecting malformed or oversized data', async () => {
  const embedded = 'data:audio/mpeg;base64,SUQz';
  const app = harness({ entries: { Hello: { src: embedded, label: '预生成 AI 合成语音', source: 'public-course' } } });
  const pending = app.player.play('Hello', { fallback: app.fallback });
  assert.equal(app.calls.audio[0].src, embedded);
  app.calls.audio[0].pending.resolve(); assert.equal((await pending).status, 'playing');
  assert.equal(app.calls.fallback.length, 0); app.player.stop();
  for (const source of [
    'data:text/html;base64,QUFB', 'data:audio/svg+xml;base64,QUFB',
    'data:audio/mpeg;base64,', 'data:audio/mpeg;base64,AAA', 'data:audio/mpeg;base64,AA=A',
    'data:audio/mpeg;base64,' + 'A'.repeat(Math.ceil(10_000_001 / 3) * 4),
  ]) {
    const blocked = harness({ entries: { Hello: source } });
    assert.equal((await blocked.player.play('Hello', { fallback: blocked.fallback })).reason, 'asset-url-rejected');
    assert.equal(blocked.calls.audio.length, 0); blocked.player.stop();
  }
});

test('stop settles a pending play and late resolution or rejection cannot start fallback', async () => {
  for (const settle of ['resolve', 'reject']) {
    const { player, calls, fallback } = harness();
    const pending = player.play('Hello world.', { fallback }); const audio = calls.audio[0];
    player.stop(); assert.deepEqual(await pending, { status: 'cancelled' });
    assert.equal(audio.paused, true); assert.equal(audio.src, undefined);
    if (settle === 'resolve') audio.paused = false; // Model a late browser play transition.
    audio.pending[settle](new Error('Late media outcome')); await tick();
    assert.equal(calls.fallback.length, 0);
    assert.equal(audio.paused, true, 'late play completion must re-pause the exact canceled element');
    assert.equal(audio.onended, null); assert.equal(audio.onerror, null);
  }
});

test('a newer utterance cancels older asset and fallback work without changing the new playback', async () => {
  const { player, calls, fallback } = harness();
  const first = player.play('Hello world.', { fallback }); const oldAudio = calls.audio[0];
  const next = player.play('Hello world.', { rate: 1, fallback }); const newAudio = calls.audio[1];
  assert.equal((await first).status, 'cancelled');
  oldAudio.pending.reject(new Error('Stale request')); newAudio.pending.resolve();
  assert.equal((await next).status, 'playing'); assert.equal(calls.fallback.length, 0);
  assert.equal(oldAudio.paused, true); assert.equal(newAudio.paused, false);
  player.stop();

  const wait = deferred(); let guard;
  const pendingFallback = player.play('Not in the catalog', { fallback: async ({ isCurrent }) => { guard = isCurrent; await wait.promise; return isCurrent(); } });
  player.stop(); assert.equal((await pendingFallback).status, 'cancelled');
  wait.resolve(); await tick(); assert.equal(guard(), false);
});

test('an asset failure invokes fallback once, including a late failure after playback began', async () => {
  const { player, calls, fallback } = harness();
  const pending = player.play('Hello world.', { fallback }); const audio = calls.audio[0];
  audio.pending.resolve(); await pending;
  const fail = audio.onerror;
  fail(); fail(); await tick();
  assert.equal(calls.fallback.length, 1); assert.equal(calls.fallback[0].reason, 'asset-error');
  assert.equal(audio.paused, true); assert.equal(audio.src, undefined);
  assert.equal(calls.status.at(-1).source, 'local'); player.stop();
});

test('an inaccessible asset times out to local fallback and ignores a late successful play', async () => {
  const { player, calls, fallback } = harness({ timeout: 10 });
  const pending = player.play('Hello world.', { fallback }); const audio = calls.audio[0];
  const result = await pending;
  assert.equal(result.status, 'fallback'); assert.equal(result.reason, 'asset-timeout');
  assert.equal(audio.paused, true); assert.equal(calls.fallback.length, 1);
  audio.paused = false;
  audio.pending.resolve(); await tick();
  assert.equal(audio.paused, true);
  assert.equal(calls.status.some(event => event.state === 'playing'), false);
  player.stop();
});

test('hidden pages never start playback and becoming hidden while loading prevents late speech', async () => {
  const blocked = harness({ hidden: true });
  assert.equal((await blocked.player.play('Hello world.', { fallback: blocked.fallback })).status, 'cancelled');
  assert.equal(blocked.calls.audio.length, 0); assert.equal(blocked.calls.fallback.length, 0);
  const app = harness(); const pending = app.player.play('Hello world.', { fallback: app.fallback });
  app.visibility.hidden = true; app.calls.audio[0].pending.reject(new Error('Unavailable'));
  assert.equal((await pending).status, 'cancelled');
  assert.equal(app.calls.fallback.length, 0); assert.equal(app.calls.audio[0].paused, true);
});

test('unavailable fallback returns an honest status and invalid rates fail before resource changes', async () => {
  const { player, calls } = harness();
  assert.equal((await player.play('Missing')).status, 'unavailable');
  assert.equal((await player.play('Missing', { fallback: async () => false })).status, 'unavailable');
  const before = calls.stopFallback;
  for (const rate of [0, -1, NaN, Infinity, 2, '1']) assert.throws(() => player.play('Hello world.', { rate }), /rate/u);
  assert.equal(calls.stopFallback, before); assert.equal(calls.audio.length, 0);
  player.setRate(0.4);
});
