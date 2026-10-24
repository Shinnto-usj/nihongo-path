/**
 * Regression checks for the actual named browser handlers, evaluated with small
 * platform mocks. No DOM/browser package is needed; browser visual QA is separate.
 * These tests verify observed races and persistence outcomes, not HTML snapshots.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { course } from '../content/course.js';
import { createPronunciationPlayer, normalizePronunciationText } from '../lib/pronunciation.js';
import {
  STORAGE_KEY, defaultState, recordActivity, recordAssessment, recordLesson,
  exportState, importState, saveState,
} from '../lib/engine.js';

const APP = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const NOW = new Date('2026-10-24T04:00:00.000Z');
const plain = value => JSON.parse(JSON.stringify(value));

function namedFunction(name, nextName) {
  const pattern = new RegExp(`^(?:async )?function ${name}\\(`, 'm');
  const start = APP.search(pattern);
  assert(start >= 0, `Missing app handler ${name}`);
  let end;
  if (nextName) {
    const tail = APP.slice(start + 1);
    const next = tail.search(new RegExp(`^(?:async )?function ${nextName}\\(`, 'm'));
    assert(next >= 0, `Cannot find end marker ${nextName} after ${name}`);
    end = start + 1 + next;
  } else {
    end = APP.indexOf("window.addEventListener('beforeunload'", start);
    assert(end > start, `Cannot find lifecycle boundary after ${name}`);
  }
  return APP.slice(start, end);
}

const HANDLERS = [
  namedFunction('openModal', 'setSession'),
  namedFunction('speechButtons', 'startLesson'),
  namedFunction('renderReview', 'rateCard'),
  namedFunction('saveFocus', 'assessmentForm'),
  namedFunction('pronunciationLabel', 'startRecording'),
  namedFunction('startRecording', 'stopRecording'),
  namedFunction('stopRecording', 'exportProgress'),
  namedFunction('finishQuestions', 'redoMistakes'),
  namedFunction('getMistakes', 'startMistakes'),
  namedFunction('prepareToLeave'),
].join('\n');
const lifecycleStart = APP.indexOf("window.addEventListener('beforeunload',prepareToLeave)");
const lifecycleEnd = APP.indexOf("document.addEventListener('visibilitychange'", lifecycleStart);
assert(lifecycleStart >= 0 && lifecycleEnd > lifecycleStart, 'Missing page lifecycle event registrations');
const LIFECYCLE_EVENTS = APP.slice(lifecycleStart, lifecycleEnd);
const timerStart = APP.lastIndexOf('setInterval(()=>{');
const timerEnd = APP.indexOf('},1000);', timerStart);
assert(timerStart >= 0 && timerEnd > timerStart, 'Missing active-time clock');
const VISIBILITY_EVENTS = APP.slice(lifecycleEnd, timerStart);
const CLOCK = APP.slice(timerStart, timerEnd + '},1000);'.length);

function harness({ initialSession = { type: 'info', nonce: 'session-a', seconds: 0 }, initialState = defaultState(NOW),
  pronunciation = { schemaVersion: 1, label: '预生成神经合成语音', entries: {} } } = {}) {
  const calls = { requests: [], recorders: [], stops: [], persisted: [], messages: [], renders: 0, spoken: [], spokenVoices: [], spokenRates: [], audio: [], blobs: [], events: new Map(), documentEvents: new Map(), intervals: [], timeouts: [] };
  const elements = new Map([
    ['#modal', { open: true, close() { this.open = false; }, showModal() { this.open = true; }, setAttribute() {} }],
    ['#modal-content', { set innerHTML(body) { calls.lastModal = { body }; } }],
    ['#modal-title', { focus() {} }],
    ['#recording-status', { textContent: '' }],
    ['[data-action="record"]', { disabled: false }],
    ['[data-action="stop-record"]', { disabled: true }],
    ['#mic-playback', { hidden: true, src: '' }],
    ['#focus-source', { value: 'IRODORI 入门第 1 课' }],
    ['#focus-note', { value: '听清了问候里的长音。' }],
    ['#timer-display', { textContent: '' }],
  ]);
  let perf = 0;
  let voices = [];
  const voiceListeners = new Set();
  const synth = {
    getVoices: () => voices,
    addEventListener: (_name, fn) => voiceListeners.add(fn),
    removeEventListener: (_name, fn) => voiceListeners.delete(fn),
    cancel() {},
    speak(utterance) { calls.spoken.push(utterance.text); calls.spokenVoices.push(utterance.voice); calls.spokenRates.push(utterance.rate); },
  };
  class FakeRecorder {
    constructor(stream) { this.stream = stream; this.state = 'inactive'; this.mimeType = 'audio/webm'; calls.recorders.push(this); }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; calls.stops.push(() => this.onstop?.()); }
  }
  class FakeAudio {
    constructor() { this.paused = true; this.preservesPitch = false; calls.audio.push(this); }
    play() { this.paused = false; return new Promise((resolve, reject) => { this.resolvePlay = resolve; this.rejectPlay = reject; }); }
    pause() { this.paused = true; }
    removeAttribute(name) { delete this[name]; }
    load() {}
  }
  const context = {
    initialSession, initialState, course, pronunciation, createPronunciationPlayer, normalizePronunciationText,
    STORAGE_KEY, Blob, Date, structuredClone, Audio: FakeAudio,
    console, document: { hidden: false, baseURI: 'https://example.test/nihongo-path/', addEventListener: (name, fn) => calls.documentEvents.set(name, fn) },
    performance: { now: () => perf },
    $: selector => elements.get(selector),
    $$: selector => selector === '[data-speech-key]' ? [...elements.values()].filter(el => el.dataset?.speechKey) : [],
    window: { speechSynthesis: synth, addEventListener: (name, fn) => calls.events.set(name, fn) },
    navigator: { mediaDevices: { getUserMedia: () => new Promise(resolve => calls.requests.push(resolve)) } },
    MediaRecorder: FakeRecorder,
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    URL: {
      createObjectURL(blob) { calls.blobs.push(blob); return `blob:mock-${calls.blobs.length}`; },
      revokeObjectURL() {},
    },
    setTimeout: fn => { calls.timeouts.push(fn); return calls.timeouts.length; },
    clearTimeout() {},
    setInterval: fn => { calls.intervals.push(fn); return calls.intervals.length; },
    recordActivity: (state, data) => recordActivity(state, plain(data), NOW),
    recordAssessment: (state, data) => recordAssessment(state, plain(data), NOW),
    recordLesson: (state, data) => recordLesson(state, plain(data), NOW),
    importState,
    persistSnapshot: state => calls.persisted.push(exportState(state)),
    toast: message => calls.messages.push(message),
    render: () => { calls.renders += 1; },
    suspendSession() {}, clearSuspended() {}, activateCards() {},
    esc: value => String(value ?? ''), icon: () => '', button: text => text,
    percent: (a, b) => b ? Math.round(a / b * 100) : 0,
    formatTime: seconds => String(Math.floor(seconds)),
  };
  vm.createContext(context);
  vm.runInContext(`
    let session=initialSession,state=initialState,recorder=null,audioStream=null,
      recordingUrl=null,recordingPending=false,recordingGeneration=0,speechRequest=0,
      activeSpeechKey='',speechUtterance=null,
      pendingImport=null,lastTick=0,lastInteraction=Date.now();
    function persist(){persistSnapshot(state);}
    ${HANDLERS}
    const pronunciationPlayer=createSpeechPlayer();
    ${LIFECYCLE_EVENTS}
    ${VISIBILITY_EVENTS}
    ${CLOCK}
    globalThis.subject={startRecording,stopRecording,openModal,closeModal,speak,stopSpeech,saveFocus,pronunciationLabel,speechButtons,
      prepareToLeave,renderReview,finishQuestions,getMistakes,
      state:()=>state,session:()=>session,recorder:()=>recorder};
  `, context);
  return {
    ...context.subject, calls, elements,
    speechLabel(text) {
      const label = { dataset: { speechKey: normalizePronunciationText(text) }, textContent: '' };
      elements.set(`status-${elements.size}`, label); return label;
    },
    stream(name) {
      const track = { name, stopped: false, stop() { this.stopped = true; } };
      return { track, getTracks: () => [track] };
    },
    flushStops() { while (calls.stops.length) calls.stops.shift()(); },
    revealVoices(next = [{ lang: 'ja-JP', name: 'Test Japanese voice', localService: true }]) { voices = next; for (const fn of [...voiceListeners]) fn(); },
    setHidden(hidden) { context.document.hidden = hidden; calls.documentEvents.get('visibilitychange')?.(); },
    tick(ms = 1000) { perf += ms; for (const fn of calls.intervals) fn(); },
  };
}

test('two recording clicks while permission is pending create only one request and leave no live track', async () => {
  const app = harness();
  const first = app.startRecording();
  const second = app.startRecording();
  assert.equal(app.calls.requests.length, 1);
  assert.equal(app.elements.get('[data-action="record"]').disabled, true);
  const stream = app.stream('first');
  app.calls.requests[0](stream);
  await Promise.all([first, second]);
  assert.equal(app.calls.recorders.length, 1);
  app.stopRecording(true);
  app.flushStops();
  assert.equal(stream.track.stopped, true);
  assert.equal(app.recorder(), null);
});

test('closing while microphone permission is pending disposes the late stream', async () => {
  const app = harness();
  const pending = app.startRecording();
  app.closeModal();
  const late = app.stream('late');
  app.calls.requests[0](late);
  await pending;
  assert.equal(late.track.stopped, true);
  assert.equal(app.calls.recorders.length, 0);
  assert.equal(app.calls.blobs.length, 0);
});

test('an old recording stop callback cannot stop or replace the next recording', async () => {
  const app = harness();
  const oldStream = app.stream('old');
  const first = app.startRecording(); app.calls.requests[0](oldStream); await first;
  app.stopRecording(false); // onstop deliberately has not fired yet.
  const newStream = app.stream('new');
  const second = app.startRecording(); app.calls.requests[1](newStream); await second;
  const newRecorder = app.recorder();
  app.flushStops();
  assert.equal(oldStream.track.stopped, true);
  assert.equal(newStream.track.stopped, false);
  assert.equal(app.recorder(), newRecorder);
  assert.equal(app.calls.blobs.length, 0, 'stale recording must not replace the new playback');
  app.stopRecording(true); app.flushStops();
  assert.equal(newStream.track.stopped, true);
});

test('hiding the page immediately stops microphone capture and returning does not restart it', async () => {
  const app = harness();
  const stream = app.stream('visible-recording');
  const pending = app.startRecording(); app.calls.requests[0](stream); await pending;
  app.setHidden(true);
  assert.equal(stream.track.stopped, true, 'capture must stop before asynchronous onstop finishes');
  assert.equal(app.recorder(), null);
  app.flushStops();
  assert.equal(app.calls.blobs.length, 1, 'the foreground recording remains available for local replay');
  app.setHidden(false);
  assert.equal(app.calls.requests.length, 1, 'returning to the page must not restart the microphone');
  assert.equal(app.recorder(), null);
});

test('hiding during a permission request invalidates it even when permission arrives after returning', async () => {
  const app = harness();
  const pending = app.startRecording();
  app.setHidden(true);
  app.setHidden(false);
  const late = app.stream('late-permission');
  app.calls.requests[0](late); await pending;
  assert.equal(late.track.stopped, true);
  assert.equal(app.calls.recorders.length, 0);
  assert.equal(app.calls.blobs.length, 0);
  assert.equal(app.elements.get('[data-action="record"]').disabled, false);
  const newStream = app.stream('fresh-foreground-request');
  const retry = app.startRecording(); app.calls.requests[1](newStream); await retry;
  assert.equal(app.calls.recorders.length, 1, 'a new explicit foreground click can record normally');
  app.stopRecording(true); app.flushStops();
  assert.equal(newStream.track.stopped, true);
});

test('a hidden page cannot initiate a microphone permission request', async () => {
  const app = harness();
  app.setHidden(true);
  await app.startRecording();
  assert.equal(app.calls.requests.length, 0);
});

test('a voice-loading request cancelled by modal close never speaks afterward', async () => {
  const app = harness();
  const pending = app.speak('古い音声');
  app.closeModal();
  app.revealVoices();
  await pending;
  assert.deepEqual(app.calls.spoken, []);
});

test('a newer speech request supersedes an older pending request', async () => {
  const app = harness();
  const old = app.speak('古い音声');
  const current = app.speak('新しい音声');
  app.revealVoices();
  await Promise.all([old, current]);
  assert.deepEqual(app.calls.spoken, ['新しい音声']);
});

test('Japanese speech chooses an explicitly local voice even when remote and unspecified voices come first', async () => {
  const app = harness();
  const local = { lang: 'ja-JP', name: 'Installed Japanese', localService: true };
  app.revealVoices([
    { lang: 'ja-JP', name: 'Remote Japanese', localService: false },
    { lang: 'ja-JP', name: 'Unspecified Japanese' },
    { lang: 'en-US', name: 'Installed English', localService: true },
    local,
  ]);
  await app.speak('こんにちは。');
  assert.deepEqual(app.calls.spoken, ['こんにちは。']);
  assert.equal(app.calls.spokenVoices[0], local);
});

test('remote or unspecified Japanese voices never become an automatic fallback', async () => {
  for (const candidate of [
    { lang: 'ja-JP', name: 'Remote Japanese', localService: false },
    { lang: 'ja-JP', name: 'Unspecified Japanese' },
  ]) {
    const app = harness();
    app.revealVoices([candidate, { lang: 'en-US', name: 'Installed English', localService: true }]);
    await app.speak('こんにちは。');
    assert.deepEqual(app.calls.spoken, []);
    assert(app.calls.messages.some(message => /本地日语声线/u.test(message) && /下载|安装/u.test(message)));
  }
});

test('Japanese course audio is preferred at original speed, labels its source, and retains the slow control', async () => {
  const text = 'こんにちは。';
  const app = harness({ pronunciation: { schemaVersion: 1, entries: {
    [text]: { src: './assets/audio/greeting.wav', label: '预生成神经合成语音' },
  } } });
  app.revealVoices(); const label = app.speechLabel(text);
  const original = app.speak(text); const audio = app.calls.audio[0];
  assert.equal(audio.src, 'https://example.test/nihongo-path/assets/audio/greeting.wav');
  assert.equal(audio.playbackRate, 1); assert.equal(audio.preservesPitch, true);
  audio.resolvePlay(); await original;
  assert.deepEqual(app.calls.spoken, []);
  assert.match(label.textContent, /预生成神经合成语音/u); assert.match(label.textContent, /原速/u);
  const slower = app.speak(text, '0.65'); const slowAudio = app.calls.audio[1];
  assert.equal(audio.paused, true); assert.equal(slowAudio.playbackRate, 0.65);
  slowAudio.resolvePlay(); await slower; app.stopSpeech();
  assert.equal(slowAudio.paused, true); assert.match(label.textContent, /已停止/u);
});

test('a failed human pronunciation asset uses only local Japanese fallback and updates the source label', async () => {
  const text = 'あ';
  const app = harness({ pronunciation: { schemaVersion: 1, entries: {
    [text]: { src: './assets/audio/kana-a.mp3', label: '真人假名发音' },
  } } });
  const local = { lang: 'ja-JP', name: 'Installed Japanese', localService: true };
  app.revealVoices([{ lang: 'ja-JP', name: 'Remote Japanese', localService: false }, local]);
  const label = app.speechLabel(text);
  assert.equal(app.pronunciationLabel(text), '真人假名发音');
  const pending = app.speak(text); app.calls.audio[0].rejectPlay(new Error('Asset unavailable')); await pending;
  assert.deepEqual(app.calls.spoken, [text]); assert.equal(app.calls.spokenVoices[0], local);
  assert.match(label.textContent, /系统本地备用/u); assert.doesNotMatch(label.textContent, /真人/u);
  assert.equal(app.calls.audio[0].paused, true); app.stopSpeech();
});

test('closing, changing exercise, hiding, leaving, and recording cancel late asset failure without speech', async () => {
  for (const boundary of ['close', 'next-exercise', 'hidden', 'pagehide', 'record']) {
    const app = harness({ pronunciation: { schemaVersion: 1, entries: {
      '古い音声': { src: './assets/audio/old.wav', label: '预生成神经合成语音' },
    } } });
    app.revealVoices();
    const pending = app.speak('古い音声'), audio = app.calls.audio[0]; let permission;
    if (boundary === 'close') app.closeModal();
    if (boundary === 'next-exercise') app.openModal('下一题', '<p>下一个练习</p>');
    if (boundary === 'hidden') app.setHidden(true);
    if (boundary === 'pagehide') app.calls.events.get('pagehide')();
    if (boundary === 'record') permission = app.startRecording();
    assert.equal((await pending).status, 'cancelled', boundary);
    audio.rejectPlay(new Error('Late loading failure')); await Promise.resolve(); await Promise.resolve();
    assert.equal(audio.paused, true, boundary); assert.deepEqual(app.calls.spoken, [], boundary);
    if (permission) {
      const stream = app.stream(); app.calls.requests[0](stream); await permission;
      app.stopRecording(true); app.flushStops(); assert.equal(stream.track.stopped, true);
    }
  }
});

test('new profiles use original speed while explicitly saved older speeds remain intact', async () => {
  assert.equal(defaultState(NOW).profile.speechRate, 1);
  const old = defaultState(NOW); old.profile.speechRate = 0.85;
  const restored = importState(exportState(old)); assert.equal(restored.profile.speechRate, 0.85);
  const app = harness({ initialState: restored }); app.revealVoices();
  await app.speak('以前の設定を保ちます。');
  assert.deepEqual(app.calls.spokenRates, [0.85]);
  await app.speak('ゆっくり。', '0.65');
  assert.deepEqual(app.calls.spokenRates, [0.85, 0.65]); app.stopSpeech();
});

test('beforeunload followed by pagehide saves focus time and notes exactly once', () => {
  const app = harness({ initialSession: { type: 'focus', nonce: 'focus-a', title: '完整课程学习', seconds: 1500.8, running: true, saved: false } });
  app.calls.events.get('beforeunload')();
  app.calls.events.get('pagehide')();
  assert.equal(app.state().daily['2026-10-24'].seconds, 1500);
  assert.equal(app.state().assessments.length, 1);
  assert.equal(app.state().assessments[0].source, 'IRODORI 入门第 1 课');
  assert.equal(app.state().assessments[0].note, '听清了问候里的长音。');
  assert.equal(app.calls.persisted.length, 1);
  assert.equal(app.session().saved, true);
  app.tick(10_000);
  assert.equal(app.session().seconds, 1500.8);
});

test('BFCache restoration closes an already-saved focus segment without charging it again', () => {
  const app = harness({ initialSession: { type: 'focus', nonce: 'focus-restored', title: '完整课程学习', seconds: 90.5, running: true, saved: false } });
  app.calls.events.get('pagehide')();
  const onPageShow = app.calls.events.get('pageshow');
  assert.equal(typeof onPageShow, 'function', 'BFCache restoration needs a pageshow handler');
  onPageShow({ persisted: true });
  assert.equal(app.elements.get('#modal').open, false);
  assert.equal(app.session(), null);
  assert.equal(app.state().daily['2026-10-24'].seconds, 90);
  assert.equal(app.state().assessments.length, 1);
  assert.equal(app.calls.persisted.length, 1);
  assert(app.calls.messages.some(message => /新|下一/u.test(message)), 'The restored page should explain how to start another segment');
});

test('repeated unload events cannot duplicate uncommitted review seconds', () => {
  const app = harness({ initialSession: { type: 'review', nonce: 'review-a', stage: 'practice', seconds: 7.8 } });
  app.calls.events.get('beforeunload')();
  app.calls.events.get('pagehide')();
  assert.equal(app.state().daily['2026-10-24'].seconds, 7);
  assert.equal(app.calls.persisted.length, 1);
  assert.equal(app.session().seconds, 0);
});

test('review completion stops the clock and does not charge time spent on the result screen', () => {
  const app = harness({ initialSession: { type: 'review', nonce: 'review-a', queue: [{}], index: 1, reviewed: 1, seconds: 0 } });
  app.renderReview();
  for (let i = 0; i < 20; i += 1) app.tick();
  assert.equal(app.session().stage, 'summary');
  assert.equal(app.session().seconds, 0);
  app.closeModal();
  assert.deepEqual(app.state().daily, {});
});

test('other-tab updates preserve completed work before a local settings write, without replacing active exercise', () => {
  const active = { type: 'lesson', lessonId: 'f02', nonce: 'active', seconds: 20, stage: 'questions' };
  const app = harness({ initialSession: active });
  const incoming = recordLesson(defaultState(NOW), { lessonId: 'f01', correct: 5, total: 5, seconds: 120 }, NOW);
  app.calls.events.get('storage')({ key: STORAGE_KEY, newValue: exportState(incoming) });
  assert(app.state().lessons.f01.completedAt);
  assert.equal(app.session(), active);
  assert.equal(app.calls.renders, 0, 'do not replace an active modal');
  const edited = { ...app.state(), profile: { ...app.state().profile, dailyMinutes: 120 } };
  let saved;
  assert.equal(saveState(edited, { setItem(_key, text) { saved = text; } }), true);
  assert(importState(saved).lessons.f01.completedAt);
  const before = app.state();
  app.calls.events.get('storage')({ key: STORAGE_KEY, newValue: '{bad-json' });
  assert.equal(app.state(), before);
  app.calls.events.get('storage')({ key: 'unrelated', newValue: exportState(defaultState(NOW)) });
  assert.equal(app.state(), before);
});

test('a failed reattempt keeps the earlier pass and describes it truthfully, with no duplicate summary write', () => {
  const lesson = course.lessons[0];
  const passed = recordLesson(defaultState(NOW), { lessonId: lesson.id, correct: 5, total: 5, seconds: 60 }, NOW);
  const results = lesson.questions.map((q, index) => ({ questionId: q.id, index, correct: index === 0, rawCorrect: index === 0, answer: q.answer, assisted: false }));
  const app = harness({ initialState: passed, initialSession: {
    type: 'lesson', mode: 'full', lessonId: lesson.id, level: lesson.level,
    title: lesson.title, stage: 'questions', questions: lesson.questions,
    index: lesson.questions.length, results, correct: 1, seconds: 30,
  } });
  app.finishQuestions();
  app.finishQuestions();
  assert.match(app.calls.lastModal.body, /保留此前的通过记录/u);
  assert.equal(app.state().lessons[lesson.id].attempts, 2);
  assert.equal(app.state().daily['2026-10-24'].seconds, 90);
  assert.equal(app.state().assessments.filter(item => item.kind === 'drill').length, 1);
});

test('stored wrong-question history survives export and removes a question after a later independent correct answer', () => {
  const question = course.lessons[0].questions[0];
  let state = recordAssessment(defaultState(NOW), { kind: 'drill', title: 'Test drill', results: [{ questionId: question.id, correct: false }] }, NOW);
  state = importState(exportState(state));
  const before = harness({ initialState: state });
  assert.equal(before.getMistakes().some(item => item.id === question.id), true);
  state = recordAssessment(state, { kind: 'drill', title: 'Retry', results: [{ questionId: question.id, correct: true }] }, NOW);
  const after = harness({ initialState: importState(exportState(state)) });
  assert.equal(after.getMistakes().some(item => item.id === question.id), false);
});
