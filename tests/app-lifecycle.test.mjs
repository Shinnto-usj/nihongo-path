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
  namedFunction('openModal', 'speechButtons'),
  namedFunction('speechButtons', 'startLesson'),
  namedFunction('renderReview', 'rateCard'),
  namedFunction('humanPracticeCards', 'showLessonIntro'),
  namedFunction('startScenario', 'startFocus'),
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
  const calls = { requests: [], recorders: [], stops: [], persisted: [], messages: [], renders: 0, spoken: [], spokenVoices: [], spokenRates: [], audio: [], blobs: [], revoked: [], events: new Map(), documentEvents: new Map(), intervals: [], timeouts: [] };
  const elements = new Map([
    ['#modal', { open: true, close() { this.open = false; }, showModal() { this.open = true; }, setAttribute() {} }],
    ['#modal-content', { set innerHTML(body) {
      calls.lastModal = { body };
      // Replacing modal markup creates a new, initially empty recording player.
      if(body.includes('id="mic-playback"')){
        elements.set('#mic-playback', { hidden: true, src: '' });
        elements.set('#recording-status', { textContent: '' });
        elements.set('[data-action="record"]', { disabled: false });
        elements.set('[data-action="stop-record"]', { disabled: true });
      }
    } }],
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
      revokeObjectURL(url) { calls.revoked.push(url); },
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
    esc: value => String(value ?? ''), nl: value => String(value ?? ''), safeUrl: String, levelName: String, icon: () => '', button: text => text,
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
      prepareToLeave,renderReview,finishQuestions,getMistakes,startScenario,renderScenario,scenarioAnswer,
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
  assert.equal(app.elements.get('[data-action="record"]').disabled, true, 'a stale stop cannot enable a second recording');
  assert.equal(app.elements.get('[data-action="stop-record"]').disabled, false, 'a stale stop cannot disable stopping the current recording');
  app.stopRecording(true); app.flushStops();
  assert.equal(newStream.track.stopped, true);
});

test('a browser-ended recording restores controls and permits an explicit new recording', async () => {
  const app = harness(), stream = app.stream('browser-ended');
  const pending = app.startRecording(); app.calls.requests[0](stream); await pending;
  const recorder = app.recorder();
  recorder.ondataavailable({ data: new Blob(['completed sample'], { type: 'audio/webm' }) });
  recorder.stop(); // Simulate the browser ending capture without the app's stop handler.
  app.flushStops();
  assert.equal(stream.track.stopped, true);
  assert.equal(app.recorder(), null);
  assert.equal(app.elements.get('[data-action="record"]').disabled, false);
  assert.equal(app.elements.get('[data-action="stop-record"]').disabled, true);
  assert.equal(app.elements.get('#mic-playback').hidden, false);
  assert.equal(app.elements.get('#mic-playback').src, 'blob:mock-1');

  const nextStream = app.stream('explicit-retry');
  const next = app.startRecording(); app.calls.requests[1](nextStream); await next;
  assert.equal(app.recorder().state, 'recording');
  assert.equal(nextStream.track.stopped, false);
  assert.equal(app.calls.revoked.includes('blob:mock-1'), true);
  app.stopRecording(true); app.flushStops();
});

test('a recording with no data restores controls without presenting an empty sample for playback', async () => {
  const app = harness(), firstStream = app.stream('previous-sample');
  const first = app.startRecording(); app.calls.requests[0](firstStream); await first;
  app.recorder().ondataavailable({ data: new Blob(['previous sample']) });
  app.stopRecording(false); app.flushStops();
  assert.equal(app.elements.get('#mic-playback').hidden, false);

  const emptyStream = app.stream('no-data');
  const next = app.startRecording(); app.calls.requests[1](emptyStream); await next;
  app.recorder().ondataavailable({ data: new Blob([]) });
  app.recorder().stop(); app.flushStops();
  assert.equal(emptyStream.track.stopped, true);
  assert.equal(app.calls.blobs.length, 1, 'no new object URL is created for an empty recording');
  assert.equal(app.elements.get('#mic-playback').hidden, true, 'the previous revoked sample is no longer offered');
  assert.match(app.elements.get('#recording-status').textContent, /没有获得可回听的录音/u);
  assert.equal(app.elements.get('[data-action="record"]').disabled, false);
  assert.equal(app.elements.get('[data-action="stop-record"]').disabled, true);
});

test('a completed scenario recording survives translation, answer and dialogue refreshes', async () => {
  const app = harness();
  app.startScenario('cafe');
  const stream = app.stream('scenario-sample');
  const pending = app.startRecording(); app.calls.requests[0](stream); await pending;
  app.recorder().ondataavailable({ data: new Blob(['learner sample']) });
  app.stopRecording(false); app.flushStops();
  const firstPlayer = app.elements.get('#mic-playback'), url = firstPlayer.src;
  assert(url, 'a stopped sample must be available before the display changes');

  app.session().showTranslation = !app.session().showTranslation;
  app.renderScenario();
  assert.notEqual(app.elements.get('#mic-playback'), firstPlayer, 'the modal must replace the old audio element');
  assert.equal(app.elements.get('#mic-playback').src, url);
  assert.equal(app.elements.get('#mic-playback').hidden, false);

  const option = course.scenarios.find(s => s.id === 'cafe').nodes.find(n => n.id === 'start').options.find(o => o.quality === 'good');
  app.scenarioAnswer(option.id);
  assert.equal(app.elements.get('#mic-playback').src, url, 'answer feedback must retain the sample');
  app.session().nodeId = app.session().feedback.next; app.session().feedback = null;
  app.renderScenario();
  assert.equal(app.elements.get('#mic-playback').src, url, 'the next dialogue turn stays in the same session');
  assert.equal(app.calls.revoked.includes(url), false);

  app.closeModal();
  assert.equal(app.calls.revoked.includes(url), true, 'leaving the exercise still discards its sample');
});

test('a scenario refresh stops capture and attaches its asynchronous sample only to the same session', async () => {
  const app = harness();
  app.startScenario('cafe');
  const stream = app.stream('refresh-during-capture');
  const pending = app.startRecording(); app.calls.requests[0](stream); await pending;
  app.recorder().ondataavailable({ data: new Blob(['unfinished learner sample']) });
  const oldPlayer = app.elements.get('#mic-playback');
  app.renderScenario();
  assert.equal(stream.track.stopped, true, 'a UI refresh must not leave capture running');
  assert.equal(app.recorder(), null);
  app.renderScenario(); // A second refresh can happen before the browser's onstop event.
  const currentPlayer = app.elements.get('#mic-playback');
  assert.notEqual(currentPlayer, oldPlayer);
  assert.equal(app.calls.blobs.length, 0);
  app.flushStops();
  assert.equal(currentPlayer.hidden, false);
  assert.equal(currentPlayer.src, 'blob:mock-1');
  assert.equal(oldPlayer.src, '', 'the callback must bind the newly rendered player');

  const nextStream = app.stream('old-session-capture');
  const next = app.startRecording(); app.calls.requests[1](nextStream); await next;
  assert.equal(app.calls.revoked.includes('blob:mock-1'), true, 'a new recording replaces the previous sample');
  app.renderScenario(); // Queues a second asynchronous sample.
  app.startScenario('cafe'); // Restarting even the same scenario creates a new session.
  app.flushStops();
  assert.equal(app.calls.blobs.length, 1, 'an old session must not publish its late sample');
  assert.equal(app.elements.get('#mic-playback').hidden, true);
  assert.equal(app.elements.get('#mic-playback').src, '');
});

test('hiding the page immediately stops microphone capture and returning does not restart it', async () => {
  const app = harness();
  const stream = app.stream('visible-recording');
  const pending = app.startRecording(); app.calls.requests[0](stream); await pending;
  app.recorder().ondataavailable({ data: new Blob(['foreground sample']) });
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

// Exercise the real storage/import handlers without asking a browser to touch a
// learner's records. Media tests above use their separate, unchanged harness.
function storageHarness(raw, { failWrite = false } = {}) {
  const values = new Map([[STORAGE_KEY, raw], ['nihongo-path:active-session:v1', 'retained-session'], ['english-atelier:v1', 'other-app-records']]);
  if(raw===null)values.delete(STORAGE_KEY);
  const calls={messages:[],blobs:[],downloads:[],renders:0,modal:null};
  const elements=new Map([['#save-status',{textContent:''}]]);
  const storage={
    getItem:key=>values.has(key)?values.get(key):null,
    setItem(key,value){if(failWrite)throw new Error('QuotaExceededError');values.set(key,value);},
    removeItem:key=>values.delete(key),
  };
  const context={
    STORAGE_KEY,defaultState,importState,exportState,Blob,structuredClone,
    localStorage:storage,saveState:value=>saveState(value,storage),
    $:selector=>elements.get(selector),
    document:{createElement:()=>({click(){calls.downloads.push({href:this.href,name:this.download});}})},
    URL:{createObjectURL(blob){calls.blobs.push(blob);return `blob:backup-${calls.blobs.length}`;},revokeObjectURL(){}},
    setTimeout(){},todayKey:()=> '2026-11-01',
    toast:message=>calls.messages.push(message),render:()=>{calls.renders++;},
    esc:value=>String(value??''),button:(text,action)=>`<button data-action="${action}">${text}</button>`,
    openModal:(title,body,footer)=>{calls.modal={title,body,footer};},
  };
  const startupStart=APP.indexOf('let originalStoredProgress = null;');
  const startupEnd=APP.indexOf('let route =',startupStart);
  const previewStart=APP.indexOf('async function previewImport(');
  const previewEnd=APP.indexOf('const actions=',previewStart);
  assert(startupStart>=0&&startupEnd>startupStart&&previewStart>=0&&previewEnd>previewStart);
  vm.createContext(context);
  vm.runInContext(`
    ${APP.slice(startupStart,startupEnd)}
    let session=null,pendingImport=null,suspended=null;
    const sessionKey='nihongo-path:active-session:v1';
    function setSession(value){session=value;}
    function closeModal(){session=null;pendingImport=null;}
    ${namedFunction('loadProgress','toast')}
    ${namedFunction('suspendSession','activateCards')}
    ${namedFunction('exportProgress','previewImport')}
    ${APP.slice(previewStart,previewEnd)}
    globalThis.subject={persist,previewImport,applyImport,exportOriginalProgress,exportProgress,
      suspendSession,clearSuspended,closeModal,
      warning:storageWarning,state:()=>state,blocked:()=>storageWriteBlocked,
      original:()=>originalStoredProgress,setSession};
  `,context);
  return {...context.subject,calls,elements,raw:()=>storage.getItem(STORAGE_KEY),
    stored:key=>storage.getItem(key),setWriteFailure:value=>{failWrite=value;}};
}

test('unreadable Japanese progress stays protected through edits and session cleanup, and exports byte-for-byte',async()=>{
  const unsupported=exportState(defaultState(NOW)).replace('"schemaVersion": 1','"schemaVersion": 2');
  for(const raw of ['{not-json',unsupported,'']){
    const app=storageHarness(raw);
    assert.equal(app.blocked(),true);
    assert.equal(app.raw(),raw);
    assert.match(app.warning(),/data-action="export-original"/u);
    app.state().profile.city='Temporary practice';
    assert.equal(app.persist(),false,'ordinary practice cannot overwrite unreadable progress');
    app.setSession({type:'lesson',stage:'questions',lessonId:'f01'});
    app.suspendSession();app.clearSuspended();
    assert.equal(app.stored('nihongo-path:active-session:v1'),'retained-session');
    assert.equal(app.raw(),raw);
    app.exportOriginalProgress();
    assert.equal(await app.calls.blobs.at(-1).text(),raw);
    assert.match(app.calls.downloads.at(-1).name,/^nihongo-original-.*\.json$/u);
    assert.equal(app.stored('english-atelier:v1'),'other-app-records');
  }
});

test('invalid or cancelled imports cannot unlock protected progress; confirmed valid import restores saving',async()=>{
  const raw='{original-progress',app=storageHarness(raw),restored=defaultState(NOW);
  restored.profile.city='Restored city';restored.profile.speechRate=0.85;
  const backup=exportState(restored);
  await app.previewImport(new Blob(['{bad-import']));
  assert.equal(app.blocked(),true);assert.equal(app.raw(),raw);
  await app.previewImport(new Blob([backup]));
  assert.match(app.calls.modal.footer,/data-action="export-original"/u);
  assert.match(app.calls.modal.footer,/data-action="apply-import"/u);
  assert.equal(app.raw(),raw,'preview does not write the candidate');
  app.closeModal();app.applyImport();
  assert.equal(app.blocked(),true);assert.equal(app.raw(),raw,'cancelled confirmation cannot replace progress');
  await app.previewImport(new Blob([backup]));app.applyImport();
  assert.equal(app.blocked(),false);assert.equal(app.warning(),'');
  assert.deepEqual(importState(app.raw()),restored);
  assert.equal(app.stored('nihongo-path:active-session:v1'),null);
  app.state().profile.city='Continued learning';
  assert.equal(app.persist(),true);assert.equal(importState(app.raw()).profile.city,'Continued learning');
  assert.equal(app.stored('english-atelier:v1'),'other-app-records');
});

test('a failed confirmed recovery keeps the original protected and never reports a successful import',async()=>{
  const raw='{retained-on-quota',app=storageHarness(raw,{failWrite:true});
  await app.previewImport(new Blob([exportState(defaultState(NOW))]));app.applyImport();
  assert.equal(app.blocked(),true);assert.equal(app.raw(),raw);
  assert.equal(app.stored('nihongo-path:active-session:v1'),'retained-session');
  assert.doesNotMatch(app.calls.messages.at(-1),/已导入/u);
  app.exportOriginalProgress();assert.equal(await app.calls.blobs.at(-1).text(),raw);
  app.setWriteFailure(false);
  assert.equal(app.persist(),false,'a later ordinary save must still not replace the protected original');
});

test('healthy prior v1 progress keeps its saved settings and achievements without a migration',()=>{
  let previous=recordLesson(defaultState(NOW),{lessonId:'f01',correct:5,total:5,seconds:120},NOW);
  previous.profile.city='Saved city';previous.profile.speechRate=0.85;
  const raw=exportState(previous),app=storageHarness(raw);
  assert.equal(app.blocked(),false);assert.equal(app.warning(),'');
  assert.equal(app.raw(),raw,'initial load must not rewrite a healthy backup');
  assert.deepEqual(app.state(),previous);
  assert.equal(app.persist(),true);assert.deepEqual(importState(app.raw()),previous);
});
