/**
 * Execute the real English app and engine in one VM with small browser mocks.
 * The DOM adapter models only controls used by the handlers; visual/layout QA
 * stays in the browser. Tests assert media and persisted outcomes, not source
 * spelling or snapshots of the implementation.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { tracks, lessons, diagnostic } from '../content/course.js';
import { listening, speaking, resources, benchmarks } from '../content/studio.js';
import { STORAGE_KEY, defaultState, exportState, recordPractice, recordLesson } from '../lib/engine.js';
import { createPronunciationPlayer, normalizePronunciationText } from '../lib/pronunciation.js';

const APP = readFileSync(new URL('../app.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gmu, '');
const ENGINE = readFileSync(new URL('../lib/engine.js', import.meta.url), 'utf8').replace(/^export /gmu, '');
const INDEX = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const NOW = Date.parse('2026-10-24T04:00:00Z');
const plain = value => JSON.parse(JSON.stringify(value));
const decode = value => String(value).replace(/&(amp|lt|gt|quot|#39);/gu,
  (_, entity) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[entity]);

function fixture(id = 'remote-1') {
  return exportState(recordPractice(defaultState(new Date(NOW)), {
    type: 'writing', id, minutes: 1, text: `Saved ${id}`,
  }, new Date(NOW)));
}

function harness({ raw = null, voices: initialVoices = [], confirm = true,
  pronunciation = { schemaVersion: 1, label: '预生成神经合成语音', entries: {} } } = {}) {
  let perf = 0, voices = initialVoices, timerId = 0;
  const elements = new Map(), timeouts = new Map(), intervals = new Map();
  const documentEvents = new Map(), windowEvents = new Map(), voiceEvents = new Map();
  const calls = { requests: [], recorders: [], stops: [], audio: [], blobs: [], revoked: [], spoken: [], cancels: 0,
    writes: [], messages: [], confirmations: [] };
  const storage = new Map(raw === null ? [] : [[STORAGE_KEY, raw]]);
  const faults = { read: false, write: false, confirm };
  const add = (registry, name, fn) => {
    if (!registry.has(name)) registry.set(name, []);
    registry.get(name).push(fn);
  };

  class Element {
    constructor(id = '', tag = 'div') {
      this.id = id; this.tagName = tag.toUpperCase(); this.value = ''; this.hidden = false;
      this.disabled = false; this.open = false; this.isConnected = true; this.dataset = {};
      this.events = new Map(); this.children = new Set(); this.options = []; this._html = '';
    }
    set innerHTML(html) {
      this._html = String(html);
      for (const key of this.children) {
        if (elements.get(`#${key}`)?.owner === this) elements.delete(`#${key}`);
      }
      this.children.clear();
      for (const match of this._html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*\sid="([^"]+)"[^>]*)>/giu)) {
        const [, tag, attrs, id] = match;
        const child = new Element(id, tag); child.owner = this;
        child.hidden = /\shidden(?:\s|$|=)/u.test(attrs);
        child.disabled = /\sdisabled(?:\s|$|=)/u.test(attrs);
        child.value = decode(/\svalue="([^"]*)"/u.exec(attrs)?.[1] || '');
        for (const attr of attrs.matchAll(/\sdata-([\w-]+)="([^"]*)"/gu)) {
          child.dataset[attr[1].replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase())] = decode(attr[2]);
        }
        const tail = this._html.slice(match.index + match[0].length);
        if (tag === 'textarea') child.value = decode(tail.slice(0, tail.indexOf('</textarea>')));
        if (tag === 'select') {
          const body = tail.slice(0, tail.indexOf('</select>'));
          child.options = [...body.matchAll(/<option([^>]*)>([^<]*)<\/option>/gu)].map(option => ({
            value: decode(/value="([^"]*)"/u.exec(option[1])?.[1] ?? option[2]), selected: /\bselected\b/u.test(option[1]),
          }));
          child.value = child.options.find(option => option.selected)?.value || child.options[0]?.value || '';
        }
        elements.set(`#${id}`, child); this.children.add(id);
      }
    }
    get innerHTML() { return this._html; }
    set textContent(value) {
      this._text = String(value);
      if ((this.id === 'toast' || this.id === 'session-message') && value) calls.messages.push(String(value));
    }
    get textContent() { return this._text || ''; }
    addEventListener(name, fn) { add(this.events, name, fn); }
    matches(selector) { return selector === '[data-draft]' && Object.hasOwn(this.dataset, 'draft'); }
    closest(selector) { return selector === '[data-action]' && this.dataset.action ? this : null; }
    getAttribute(name) { return this[name] ?? null; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    focus() { document.activeElement = this; }
    append() {}
    click() {}
    remove() { this.isConnected = false; }
    pause() { this.paused = true; }
    removeAttribute(name) { delete this[name]; }
    load() {}
  }
  const document = {
    hidden: false, baseURI: 'https://example.test/english/',
    querySelector: selector => elements.get(selector) || null,
    querySelectorAll: selector => {
      const key = selector === '[data-rating]' ? 'rating' : selector === '[data-speech-key]' ? 'speechKey' : null;
      return key ? [...elements.values()].filter(element => Object.hasOwn(element.dataset, key)) : [];
    },
    addEventListener: (name, fn) => add(documentEvents, name, fn),
    createElement: tag => new Element('', tag), body: new Element('body'),
  };
  document.body.innerHTML = INDEX;
  document.activeElement = elements.get('#main');

  class FakeRecorder {
    constructor(stream) { this.stream = stream; this.state = 'inactive'; this.mimeType = 'audio/webm'; calls.recorders.push(this); }
    start() { this.state = 'recording'; }
    stop() {
      this.state = 'inactive';
      calls.stops.push(() => {
        this.ondataavailable?.({ data: new Blob(['local recording'], { type: 'audio/webm' }) });
        this.onstop?.();
      });
    }
  }
  class FakeAudio {
    constructor() { this.paused = true; this.preservesPitch = false; calls.audio.push(this); }
    play() { this.paused = false; return new Promise((resolve, reject) => { this.resolvePlay = resolve; this.rejectPlay = reject; }); }
    pause() { this.paused = true; }
    removeAttribute(name) { delete this[name]; }
    load() {}
  }
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [NOW + perf])); }
    static now() { return NOW + perf; }
  }
  class Utterance { constructor(text) { this.text = text; } }
  const synth = {
    getVoices: () => voices,
    addEventListener: (name, fn) => add(voiceEvents, name, fn),
    removeEventListener: (name, fn) => voiceEvents.set(name, (voiceEvents.get(name) || []).filter(value => value !== fn)),
    cancel() { calls.cancels += 1; },
    speak(utterance) { calls.spoken.push(utterance); },
  };
  const window = {
    speechSynthesis: synth, SpeechSynthesisUtterance: Utterance, MediaRecorder: FakeRecorder,
    addEventListener: (name, fn) => add(windowEvents, name, fn),
    confirm(message) { calls.confirmations.push(message); return faults.confirm; }, scrollTo() {},
  };
  const context = {
    document, window, console, Blob, Date: FixedDate, Intl, Audio: FakeAudio,
    createPronunciationPlayer, normalizePronunciationText,
    performance: { now: () => perf },
    navigator: { mediaDevices: { getUserMedia: () => new Promise((resolve, reject) => calls.requests.push({ resolve, reject })) } },
    MediaRecorder: FakeRecorder, SpeechSynthesisUtterance: Utterance,
    location: { hash: '#today', reload() {} },
    localStorage: {
      getItem(key) { if (faults.read) throw new Error('Storage denied'); return storage.get(key) ?? null; },
      setItem(key, value) { if (faults.write) throw new Error('Quota exceeded'); storage.set(key, value); calls.writes.push(value); },
    },
    URL: {
      createObjectURL(blob) { calls.blobs.push(blob); return `blob:english-${calls.blobs.length}`; },
      revokeObjectURL(url) { calls.revoked.push(url); },
    },
    setTimeout(fn, delay = 0) { const id = ++timerId; timeouts.set(id, { fn, at: perf + delay }); return id; },
    clearTimeout(id) { timeouts.delete(id); },
    setInterval(fn, delay) { const id = ++timerId; intervals.set(id, { fn, delay }); return id; },
    clearInterval(id) { intervals.delete(id); },
    __content: JSON.stringify({ tracks, lessons, diagnostic, listening, speaking, resources, benchmarks }),
    __pronunciation: JSON.stringify(pronunciation),
  };
  vm.createContext(context);
  vm.runInContext(`
    ${ENGINE}
    const {tracks,lessons,diagnostic,listening,speaking,resources,benchmarks}=JSON.parse(__content);
    const pronunciation=JSON.parse(__pronunciation);
    ${APP}
    globalThis.subject={startSession,closeSession,finishSession,startRecording,stopRecording,
      speakText,stopSpeech,toggleTimer,remainingSeconds,activeMilliseconds,totalMinutes,persist,
      renderJournal,sessionSummary,pronunciationLabel,
      state:()=>state,session:()=>session,recorder:()=>mediaRecorder,
      recordingUrl:()=>recordingUrl,
      flags:()=>({storageBlocked,storageConflict,storageError,lastSaved}),
      backup:()=>exportState(state)};
  `, context, { filename: 'english-app-under-test.js' });

  async function emit(registry, name, event = {}) {
    for (const listener of registry.get(name) || []) await listener(event);
  }
  return {
    ...context.subject, calls, elements, faults, storage, document,
    async click(action, id = '') {
      const target = new Element(); target.dataset = { action, id: String(id) };
      await emit(documentEvents, 'click', { target });
    },
    async type(value) {
      const target = elements.get('#answer-writing'); assert(target, 'The writing control should be rendered');
      target.value = value; await emit(documentEvents, 'input', { target });
    },
    async importFile(encoded) {
      const target = elements.get('#import-file');
      target.files = [{ size: encoded.length, text: async () => encoded }]; target.value = 'backup.json';
      await emit(target.events, 'change', { target });
    },
    async remote(encoded) {
      if (encoded === null) storage.delete(STORAGE_KEY); else storage.set(STORAGE_KEY, encoded);
      await emit(windowEvents, 'storage', { key: STORAGE_KEY, newValue: encoded });
    },
    async setHidden(hidden) { document.hidden = hidden; await emit(documentEvents, 'visibilitychange'); },
    async pagehide() { await emit(windowEvents, 'pagehide'); },
    async go(route) { context.location.hash = `#${route}`; await emit(windowEvents, 'hashchange'); },
    revealVoices(next) { voices = next; for (const fn of voiceEvents.get('voiceschanged') || []) fn(); },
    advance(ms) {
      perf += ms;
      for (const [id, timer] of [...timeouts]) if (timer.at <= perf) { timeouts.delete(id); timer.fn(); }
      for (const timer of intervals.values()) timer.fn();
    },
    stream(name = 'microphone') {
      const track = { name, stopped: false, stop() { this.stopped = true; } };
      return { track, getTracks: () => [track] };
    },
    flushStops() { while (calls.stops.length) calls.stops.shift()(); },
  };
}

const localUS = { lang: 'en-US', name: 'Installed English', voiceURI: 'local-us', localService: true };
const localGB = { lang: 'en-GB', name: 'Installed British English', voiceURI: 'local-gb', localService: true };

test('speech uses only an explicitly local English voice, including the chosen local preference', async () => {
  const state = defaultState(new Date(NOW)); state.profile.voiceURI = 'local-gb'; state.profile.speechRate = 0.9;
  const app = harness({ raw: exportState(state), voices: [
    { lang: 'en-US', voiceURI: 'remote', localService: false }, { lang: 'en-US', voiceURI: 'unspecified' },
    { lang: 'ja-JP', voiceURI: 'japanese', localService: true }, localUS, localGB,
  ] });
  await app.speakText('A thought in my own words.');
  assert.equal(app.calls.spoken.length, 1);
  assert.equal(app.calls.spoken[0].voice, localGB);
  assert.equal(app.calls.spoken[0].rate, 0.9);
  const unavailable = harness({ voices: [{ lang: 'en-US', localService: false }, { lang: 'en-GB' }, { lang: 'ja-JP', localService: true }] });
  const pending = unavailable.speakText('Never send this to a remote voice.');
  unavailable.advance(700); await pending;
  assert.equal(unavailable.calls.spoken.length, 0);
  assert(unavailable.calls.messages.some(message => /本地英语音色/u.test(message)));
});

test('late voice availability cannot speak after close or supersede a newer request', async () => {
  const app = harness(); app.startSession('speak', speaking[0].id);
  const canceled = app.speakText('Canceled speech'); app.closeSession();
  app.revealVoices([localUS]); app.advance(700); await canceled;
  assert.equal(app.calls.spoken.length, 0);
  const racing = harness();
  const old = racing.speakText('Old request'); const current = racing.speakText('Current request');
  racing.revealVoices([localUS]); racing.advance(700); await Promise.all([old, current]);
  assert.deepEqual(racing.calls.spoken.map(utterance => utterance.text), ['Current request']);
});

test('listening plays the exact full-script asset at original speed and labels the synthetic source', async () => {
  const item = listening[0];
  const app = harness({ pronunciation: { schemaVersion: 1, entries: {
    [normalizePronunciationText(item.script)]: { src: './assets/audio/listening.wav', label: '预生成神经合成 · English voice' },
  } } });
  assert.equal(app.state().profile.speechRate, 1);
  app.startSession('listen', item.id);
  const pending = app.click('play-listening'), audio = app.calls.audio[0];
  assert.equal(audio.src, 'https://example.test/english/assets/audio/listening.wav');
  assert.equal(audio.playbackRate, 1); assert.equal(audio.preservesPitch, true);
  audio.resolvePlay(); await pending;
  assert.equal(app.calls.spoken.length, 0, 'available assets need no installed system voice');
  const status = app.elements.get('#speech-status').textContent;
  assert.match(status, /预生成神经合成/u); assert.match(status, /原速/u);
  await app.click('stop-speech'); assert.equal(audio.paused, true);
  const slower = app.speakText(item.script, 0.75), slowAudio = app.calls.audio[1];
  assert.equal(slowAudio.playbackRate, 0.75); slowAudio.resolvePlay(); await slower; app.stopSpeech();
});

test('failed English audio falls back only to the selected local voice and preserves an older explicit rate', async () => {
  const item = listening[0], state = defaultState(new Date(NOW));
  state.profile.speechRate = 0.9; state.profile.voiceURI = localGB.voiceURI;
  const app = harness({ raw: exportState(state), voices: [
    { lang: 'en-US', name: 'Remote voice', localService: false }, { lang: 'en-US', name: 'Unspecified voice' }, localGB,
  ], pronunciation: { schemaVersion: 1, entries: {
    [normalizePronunciationText(item.script)]: { src: './assets/audio/listening.wav', label: '预生成神经合成' },
  } } });
  app.startSession('listen', item.id);
  const pending = app.click('play-listening'); app.calls.audio[0].rejectPlay(new Error('Missing asset')); await pending;
  assert.equal(app.calls.spoken.length, 1); assert.equal(app.calls.spoken[0].text, item.script);
  assert.equal(app.calls.spoken[0].voice, localGB); assert.equal(app.calls.spoken[0].rate, 0.9);
  assert.equal(app.state().profile.speechRate, 0.9);
  assert.match(app.elements.get('#speech-status').textContent, /系统本地备用/u);
  await app.click('toggle-transcript');
  assert.match(app.elements.get('#dialog-content').innerHTML, /系统本地备用/u,
    'showing a transcript must keep the actual fallback source visible during playback');
  assert.equal(app.calls.audio[0].paused, true); app.stopSpeech();
});

test('review and settings actions match their complete manifest keys and expose the active audio source', async () => {
  const lesson = lessons[0], chunk = lesson.chunks[0];
  const phrase = `${chunk.text}. ${chunk.example}`;
  const sample = 'What I find interesting is the gap between what we expect and what we see.';
  const state = recordLesson(defaultState(new Date(NOW)), {
    id: lesson.id, score: 3, total: 3, assisted: false, minutes: 0, chunkIds: [chunk.id],
  }, new Date(NOW));
  const app = harness({ raw: exportState(state), pronunciation: { schemaVersion: 1, entries: {
    [normalizePronunciationText(phrase)]: { src: './assets/audio/chunk.wav', label: '预生成神经合成 · Chunk' },
    [normalizePronunciationText(sample)]: { src: './assets/audio/sample.wav', label: '预生成神经合成 · Sample' },
  } } });
  await app.go('review'); await app.click('review-reveal');
  const recall = app.click('speak-chunk', chunk.id), chunkAudio = app.calls.audio[0];
  assert.equal(chunkAudio.src, 'https://example.test/english/assets/audio/chunk.wav');
  chunkAudio.resolvePlay(); await recall;
  assert.match(app.elements.get('#review-speech-status').textContent, /Chunk/u);
  await app.go('settings'); assert.equal(chunkAudio.paused, true);
  const preview = app.click('test-voice'), sampleAudio = app.calls.audio[1];
  assert.equal(sampleAudio.src, 'https://example.test/english/assets/audio/sample.wav');
  sampleAudio.resolvePlay(); await preview;
  assert.match(app.elements.get('#settings-speech-status').textContent, /Sample/u);
  assert.equal(app.calls.spoken.length, 0); app.stopSpeech();
});

test('English asset requests cannot speak late after close, a new session, hidden page, pagehide, or recording', async () => {
  const text = listening[0].script;
  for (const boundary of ['close', 'new-session', 'hidden', 'pagehide', 'record']) {
    const app = harness({ voices: [localUS], pronunciation: { schemaVersion: 1, entries: {
      [normalizePronunciationText(text)]: { src: './assets/audio/old.wav', label: '预生成神经合成' },
    } } });
    app.startSession('speak', speaking[0].id);
    const pending = app.speakText(text), audio = app.calls.audio[0]; let permission;
    if (boundary === 'close') app.closeSession();
    if (boundary === 'new-session') app.startSession('lesson', lessons[0].id);
    if (boundary === 'hidden') await app.setHidden(true);
    if (boundary === 'pagehide') await app.pagehide();
    if (boundary === 'record') permission = app.startRecording();
    assert.equal((await pending).status, 'cancelled', boundary);
    audio.rejectPlay(new Error('Late asset error')); await Promise.resolve(); await Promise.resolve();
    assert.equal(audio.paused, true, boundary); assert.equal(app.calls.spoken.length, 0, boundary);
    if (permission) {
      const stream = app.stream(); app.calls.requests[0].resolve(stream); await permission;
      app.stopRecording({ discard: true }); app.flushStops(); assert.equal(stream.track.stopped, true);
    }
  }
});

test('pending microphone permission is single-flight and a late stream after close is stopped', async () => {
  const app = harness(); app.startSession('speak', speaking[0].id);
  const first = app.startRecording(), second = app.startRecording();
  assert.equal(app.calls.requests.length, 1);
  assert.equal(app.elements.get('#record-start').disabled, true);
  app.closeSession(); const late = app.stream('late'); app.calls.requests[0].resolve(late);
  await Promise.all([first, second]);
  assert.equal(late.track.stopped, true);
  assert.equal(app.calls.recorders.length, 0);
  assert.equal(app.calls.blobs.length, 0);
});

test('hiding invalidates pending permission, stops active capture, and returning never restarts it', async () => {
  const app = harness(); app.startSession('speak', speaking[0].id);
  const pending = app.startRecording(); await app.setHidden(true); await app.setHidden(false);
  const late = app.stream('hidden-permission'); app.calls.requests[0].resolve(late); await pending;
  assert.equal(late.track.stopped, true);
  assert.equal(app.calls.recorders.length, 0);
  const next = app.startRecording(), active = app.stream('foreground'); app.calls.requests[1].resolve(active); await next;
  await app.setHidden(true);
  assert.equal(active.track.stopped, true, 'tracks stop before the asynchronous stop event');
  app.flushStops(); assert.equal(app.calls.blobs.length, 1);
  await app.setHidden(false);
  assert.equal(app.calls.requests.length, 2, 'returning is not permission to start another recording');
  assert.equal(app.recorder(), null);
});

test('finishing while recording preserves the completed audio for playback and download in the summary', async () => {
  const app = harness(); app.startSession('speak', speaking[0].id);
  const pending = app.startRecording(), stream = app.stream(); app.calls.requests[0].resolve(stream); await pending;
  app.advance(30_000); app.finishSession();
  assert.equal(stream.track.stopped, true);
  assert.equal(app.session().stage, 'summary');
  app.flushStops();
  assert(app.recordingUrl(), 'the stopped audio should have a local object URL');
  const download = app.elements.get('#recording-download');
  assert(download && !download.hidden, 'the final asynchronous recording needs a visible download control');
  assert.equal(download.href, app.recordingUrl());
  assert.equal(app.elements.get('#record-start').disabled, true, 'a finished sample cannot start a new recording');
  const url = app.recordingUrl(); app.closeSession();
  assert(app.calls.revoked.includes(url));
});

test('background time is excluded, the speaking timer pauses, and a summary cannot add another practice', async () => {
  const app = harness(); app.startSession('speak', speaking[0].id); app.toggleTimer();
  app.advance(20_000); await app.setHidden(true);
  const remaining = app.remainingSeconds();
  app.advance(300_000);
  assert.equal(app.activeMilliseconds(), 20_000);
  assert.equal(app.remainingSeconds(), remaining);
  assert.equal(app.session().timerRunning, false);
  await app.setHidden(false); app.advance(10_000); app.finishSession();
  assert.equal(app.state().practice[0].minutes, 0.5);
  app.advance(300_000); app.finishSession();
  assert.equal(app.state().practice.length, 1);
  assert.equal(app.totalMinutes(), 0.5);
});

test('pagehide flushes the current draft and disposes capture without claiming an unfinished practice', async () => {
  const app = harness(); app.startSession('speak', speaking[0].id); await app.type('An unfinished thought.');
  const pending = app.startRecording(), stream = app.stream(); app.calls.requests[0].resolve(stream); await pending;
  await app.pagehide(); app.flushStops(); await app.pagehide();
  assert.equal(stream.track.stopped, true);
  assert.equal(app.session(), null);
  assert.equal(app.elements.get('#practice-dialog').open, false);
  const saved = JSON.parse(app.storage.get(STORAGE_KEY));
  assert.equal(saved.drafts[`speaking:${speaking[0].id}`].text, 'An unfinished thought.');
  assert.equal(saved.practice.length, 0);
  assert.equal(app.calls.blobs.length, 0);
});

test('only the first answer counts and a completed lesson cannot double-charge elapsed time', async () => {
  const app = harness(), lesson = lessons[0]; app.startSession('lesson', lesson.id); await app.click('quiz-start');
  const first = lesson.questions[0], wrong = (first.answer + 1) % first.options.length;
  await app.click('answer', wrong); await app.click('answer', first.answer);
  assert.equal(app.session().answers[0], wrong);
  await app.click('quiz-next');
  for (const question of lesson.questions.slice(1)) { await app.click('answer', question.answer); await app.click('quiz-next'); }
  await app.type('I can preserve my own meaning while choosing a clearer expression.');
  app.advance(120_000); await app.click('finish'); await app.click('finish');
  const entry = app.state().lessons[lesson.id];
  assert.equal(entry.lastScore, lesson.questions.length - 1); assert.equal(entry.attempts, 1);
  assert.equal(entry.passed, false); assert.equal(Object.keys(app.state().cards).length, 0);
  assert.equal(app.state().practice.length, 1); assert.equal(app.state().practice[0].minutes, 0);
  assert.equal(app.totalMinutes(), 2);
  assert.equal(app.session().stage, 'summary');
});

test('listening retains objective scores and sticky transcript assistance with one elapsed duration', async () => {
  const app = harness(), item = listening[0]; app.startSession('listen', item.id);
  await app.click('toggle-transcript'); await app.click('toggle-transcript'); await app.click('quiz-start');
  for (const question of item.questions) { await app.click('answer', question.answer); await app.click('quiz-next'); }
  app.advance(120_000); await app.click('finish'); await app.click('finish');
  const records = JSON.parse(app.storage.get(STORAGE_KEY)).practice;
  assert.equal(records.length, 1);
  assert.equal(records[0].type, 'listening'); assert.equal(records[0].score, item.questions.length);
  assert.equal(records[0].total, item.questions.length); assert.equal(records[0].assisted, true);
  assert.equal(records[0].minutes, 2); assert.equal(records[0].text, '');
  assert.match(app.sessionSummary(), /文字辅助/u);
  const journal = app.renderJournal();
  assert(journal.includes(`${item.questions.length}/${item.questions.length}`), 'an attempt with no written output still has a visible question result');
  assert.match(journal, /有文字辅助/u);
});

test('a clean idle tab adopts remote progress, but a conflict never discards unsaved local work after close', async () => {
  const app = harness(); await app.remote(fixture('remote-1'));
  assert.equal(app.state().practice[0].id, 'remote-1');
  app.startSession('speak', speaking[0].id); await app.type('My local sample must survive.');
  await app.remote(fixture('remote-2'));
  assert.equal(app.flags().storageConflict, true);
  app.finishSession(); app.closeSession();
  assert(app.state().practice.some(entry => entry.text === 'My local sample must survive.'));
  await app.remote(fixture('remote-3'));
  assert(app.state().practice.some(entry => entry.text === 'My local sample must survive.'), 'another update must preserve conflicted local work until explicit resolution');
  assert.equal(app.persist(), false);
  assert.equal(JSON.parse(app.storage.get(STORAGE_KEY)).practice[0].id, 'remote-3');
});

test('a failed save keeps the completed record exportable and warns without adding duplicate attempts', async () => {
  const app = harness(); app.startSession('speak', speaking[0].id); await app.type('Keep this if storage fills.');
  app.faults.write = true; app.finishSession(); app.finishSession();
  assert.equal(app.state().practice.length, 1);
  assert.equal(JSON.parse(app.backup()).practice[0].text, 'Keep this if storage fills.');
  assert.equal(app.storage.has(STORAGE_KEY), false);
  assert(app.calls.messages.some(message => /保存失败/u.test(message)));
});

test('corrupt stored data is preserved, and invalid or canceled imports cannot replace current work', async () => {
  const raw = '{"schemaVersion":99}'; const app = harness({ raw });
  assert.equal(app.flags().storageBlocked, true);
  assert.equal(app.persist(), false); assert.equal(app.storage.get(STORAGE_KEY), raw);
  const before = app.backup(); await app.importFile('{broken');
  assert.equal(app.backup(), before); assert.equal(app.storage.get(STORAGE_KEY), raw);
  assert.equal(app.calls.confirmations.length, 0);
  app.faults.confirm = false; await app.importFile(fixture('replacement'));
  assert.equal(app.backup(), before); assert.equal(app.storage.get(STORAGE_KEY), raw);
  app.faults.confirm = true; await app.importFile(fixture('replacement'));
  assert.equal(app.state().practice[0].id, 'replacement');
  assert.equal(JSON.parse(app.storage.get(STORAGE_KEY)).practice[0].id, 'replacement');
  assert.equal(app.flags().storageBlocked, false);
  assert.equal(app.elements.get('#import-file').value, '');
});

test('an accepted import that cannot save stays exportable and is not mistaken for persisted data', async () => {
  const previous = fixture('previous'), incoming = fixture('incoming');
  const app = harness({ raw: previous }); app.faults.write = true;
  await app.importFile(incoming);
  assert.equal(app.storage.get(STORAGE_KEY), previous);
  assert.equal(JSON.parse(app.backup()).practice[0].id, 'incoming');
  assert(app.calls.messages.some(message => /保存失败/u.test(message)));
  assert.notEqual(app.flags().lastSaved, incoming);
  await app.remote(fixture('other-tab'));
  assert.equal(JSON.parse(app.backup()).practice[0].id, 'incoming', 'an unpersisted import survives later updates until the user resolves them');
  assert.equal(app.flags().storageConflict, true);
});
