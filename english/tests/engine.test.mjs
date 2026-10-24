import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY, defaultState, loadState, saveState, importState, exportState,
  localDate, getStreak, dueCards, reviewCard, recordLesson, recordPractice,
  recordBaseline, saveDraft, getDailyPlan,
} from '../lib/engine.js';

const NOW = new Date('2026-10-24T04:00:00.000Z');
const at = value => new Date(value);
const fresh = () => defaultState(NOW);
const pass = (state, id = 'lesson-1', chunkIds = ['chunk-1'], now = NOW) =>
  recordLesson(state, { id, score: 4, total: 5, assisted: false, minutes: 2, chunkIds }, now);
const memory = raw => {
  const values = new Map(raw === undefined ? [] : [[STORAGE_KEY, raw]]);
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test('English uses a separate storage key and generic independent defaults', () => {
  assert.equal(STORAGE_KEY, 'english-atelier:v1');
  const a = fresh(), b = fresh();
  assert.deepEqual(b.profile, { dailyMinutes: 30, timeZone: 'Asia/Singapore', speechRate: 1, voiceURI: '', focus: 'balanced' });
  a.drafts.example = { text: 'A', updatedAt: NOW.toISOString() };
  assert.deepEqual(b.drafts, {});
  const storage = memory(); storage.values.set('nihongo-path:v1', 'Japanese progress');
  assert.equal(saveState(b, storage), true);
  assert.equal(storage.values.get('nihongo-path:v1'), 'Japanese progress');
  assert.deepEqual(loadState(storage), b);
});

test('an assisted high score is recorded accurately but cannot pass a lesson or activate chunks', () => {
  const state = fresh();
  const returned = recordLesson(state, { id: 'lesson-1', score: 5, total: 5, assisted: true, minutes: 0, chunkIds: ['chunk-1'] }, NOW);
  assert.equal(returned, state, 'mutators return the original state object');
  assert.equal(state.lessons['lesson-1'].lastPercent, 100);
  assert.equal(state.lessons['lesson-1'].bestAssisted, true);
  assert.equal(state.lessons['lesson-1'].passed, false);
  assert.equal(state.lessons['lesson-1'].completedAt, null);
  assert.deepEqual(state.cards, {});
  assert.equal(state.practice.length, 0, 'lesson minutes must not also be inserted into practice');
});

test('independent 80% passes once, repeated attempts keep latest and best with original completion time', () => {
  const state = fresh();
  recordLesson(state, { id: 'lesson-1', score: 3, total: 5, minutes: 1, chunkIds: ['chunk-1'] }, NOW);
  assert.equal(state.lessons['lesson-1'].passed, false);
  const passedAt = at('2026-10-25T04:00:00Z');
  pass(state, 'lesson-1', ['chunk-1', 'chunk-1', 'chunk-2'], passedAt);
  assert.equal(state.lessons['lesson-1'].passed, true);
  assert.deepEqual(Object.keys(state.cards), ['chunk-1', 'chunk-2']);
  const cardDue = state.cards['chunk-1'].due;
  reviewCard(state, 'chunk-1', 'good', passedAt);
  const scheduledDue = state.cards['chunk-1'].due;
  recordLesson(state, { id: 'lesson-1', score: 1, total: 5, assisted: false, minutes: 0.5, chunkIds: ['unearned'] }, at('2026-10-26T04:00:00Z'));
  const progress = state.lessons['lesson-1'];
  assert.equal(progress.attempts, 3);
  assert.equal(progress.lastScore, 1);
  assert.equal(progress.lastTotal, 5);
  assert.equal(progress.lastPercent, 20);
  assert.equal(progress.bestScore, 4);
  assert.equal(progress.bestTotal, 5);
  assert.equal(progress.bestPercent, 80);
  assert.equal(progress.completedAt, passedAt.toISOString());
  assert.equal(progress.totalMinutes, 3.5);
  assert.equal(progress.history.length, 3);
  assert.equal(state.cards.unearned, undefined);
  assert.notEqual(scheduledDue, cardDue);
  assert.equal(state.cards['chunk-1'].due, scheduledDue, 'reattempts must not reset an existing review schedule');
});

test('best accuracy compares ratios and retains whether assistance was used', () => {
  const state = fresh();
  recordLesson(state, { id: 'lesson-1', score: 9, total: 10, assisted: true, minutes: 0 }, NOW);
  recordLesson(state, { id: 'lesson-1', score: 4, total: 5, assisted: false, minutes: 0 }, NOW);
  assert.equal(state.lessons['lesson-1'].bestPercent, 90);
  assert.equal(state.lessons['lesson-1'].bestAssisted, true);
  assert.equal(state.lessons['lesson-1'].passed, true);
  recordLesson(state, { id: 'lesson-1', score: 18, total: 20, assisted: false, minutes: 0 }, NOW);
  assert.equal(state.lessons['lesson-1'].bestScore, 18);
  assert.equal(state.lessons['lesson-1'].bestTotal, 20);
  assert.equal(state.lessons['lesson-1'].bestAssisted, false, 'an equal independent result is preferred over an assisted best');
});

test('invalid lesson attempts fail before changing state', () => {
  const state = fresh(); const before = exportState(state);
  for (const data of [
    { id: 'x', score: 1, total: 0, minutes: 0 },
    { id: 'x', score: 6, total: 5, minutes: 0 },
    { id: 'x', score: 4, total: 5, minutes: 121 },
    { id: 'x', score: 4, total: 5, minutes: -1 },
    { id: 'x', score: 4, total: 5, minutes: 0, assisted: 'false' },
    { id: '__proto__', score: 4, total: 5, minutes: 0 },
    { id: 'x', score: 4, total: 5, minutes: 0, chunkIds: ['constructor'] },
    { id: 'x', score: 4, total: 5, minutes: 0, level: 'native' },
  ]) assert.throws(() => recordLesson(state, data, NOW));
  assert.equal(exportState(state), before);
});

test('due cards are learned cards only, snapshots are detached, and again re-enters after ten minutes', () => {
  const state = fresh();
  assert.deepEqual(dueCards(state, NOW), []);
  pass(state);
  assert.equal(dueCards(state, NOW).length, 1);
  const card = dueCards(state, NOW)[0]; card.reps = 999;
  assert.equal(state.cards['chunk-1'].reps, 0);
  assert.equal(reviewCard(state, 'chunk-1', 'again', NOW), state);
  assert.equal(state.cards['chunk-1'].lapses, 1);
  assert.equal(state.cards['chunk-1'].due, '2026-10-24T04:10:00.000Z');
  assert.equal(dueCards(state, at('2026-10-24T04:09:59Z')).length, 0);
  assert.equal(dueCards(state, at('2026-10-24T04:10:00Z')).length, 1);
  assert.equal(state.reviews[0].at, NOW.toISOString());
});

test('transparent review intervals lengthen, hard resets to one day, and unknown cards cannot be fabricated', () => {
  const state = pass(fresh());
  reviewCard(state, 'chunk-1', 'good', NOW);
  assert.equal(state.cards['chunk-1'].intervalDays, 1);
  reviewCard(state, 'chunk-1', 'good', NOW);
  assert.equal(state.cards['chunk-1'].intervalDays, 3);
  reviewCard(state, 'chunk-1', 'easy', NOW);
  assert.equal(state.cards['chunk-1'].intervalDays, 14);
  reviewCard(state, 'chunk-1', 'hard', NOW);
  assert.equal(state.cards['chunk-1'].intervalDays, 1);
  reviewCard(state, 'chunk-1', 'good', NOW);
  assert.equal(state.cards['chunk-1'].intervalDays, 3);
  const before = exportState(state);
  assert.throws(() => reviewCard(state, 'unknown', 'good', NOW), /not been learned/u);
  assert.throws(() => reviewCard(state, 'chunk-1', 'perfect', NOW), /rating/u);
  assert.throws(() => reviewCard(state, '__proto__', 'good', NOW), /Unsafe/u);
  assert.equal(exportState(state), before);
});

test('local dates and streaks use the profile timezone and allow an ongoing streak from yesterday', () => {
  assert.equal(localDate(at('2026-10-24T15:59:59Z')), '2026-10-24');
  assert.equal(localDate(at('2026-10-24T16:00:00Z')), '2026-10-25');
  const state = fresh();
  recordPractice(state, { type: 'writing', id: 'day-1', minutes: 0, text: 'An actual output.' }, at('2026-10-21T04:00:00Z'));
  recordBaseline(state, { score: 0, total: 8 }, at('2026-10-22T04:00:00Z'));
  pass(state, 'lesson-1', ['chunk-1'], at('2026-10-23T04:00:00Z'));
  assert.equal(getStreak(state, NOW), 3);
  reviewCard(state, 'chunk-1', 'again', NOW);
  assert.equal(getStreak(state, NOW), 4);
  assert.equal(getStreak(state, at('2026-10-26T04:00:00Z')), 0);
  saveDraft(state, 'lesson:1', 'Draft alone', at('2026-10-26T04:00:00Z'));
  assert.equal(getStreak(state, at('2026-10-26T04:00:00Z')), 0, 'saving a draft must not masquerade as a completed practice');
});

test('a practice near midnight belongs to the selected civil day, without counting future dates', () => {
  const state = fresh();
  recordPractice(state, { type: 'speaking', id: 'speech-1', minutes: 0 }, at('2026-10-24T16:00:00Z'));
  assert.equal(getStreak(state, at('2026-10-24T15:59:59Z')), 0);
  assert.equal(getStreak(state, at('2026-10-24T16:00:00Z')), 1);
  state.profile.timeZone = 'America/New_York';
  assert.equal(getStreak(state, at('2026-10-24T16:00:00Z')), 1);
});

test('practice stores an ISO at timestamp, zero minutes and isolated self-ratings', () => {
  const state = fresh(); const selfRatings = { clarity: 4, naturalness: 3, flow: 2, precision: 5 };
  assert.equal(recordPractice(state, { type: 'speaking', id: 'speaking:meeting', minutes: 0, text: 'A useful point.', ratings: selfRatings }, NOW), state);
  selfRatings.clarity = 1;
  assert.equal(state.practice[0].ratings.clarity, 4);
  assert.equal(state.practice[0].at, NOW.toISOString());
  assert.equal(state.practice[0].minutes, 0);
  for (const invalid of [null, [], { clarity: 0 }, { clarity: 6 }, { clarity: 2.5 }, { automated: 5 }]) {
    assert.throws(() => recordPractice(state, { type: 'speaking', id: 'x', minutes: 0, ratings: invalid }, NOW));
  }
  assert.equal(state.practice.length, 1);
});

test('practice logs are bounded while retaining the most recent record', () => {
  const state = fresh();
  state.practice = Array.from({ length: 2_000 }, (_, index) => ({ type: 'writing', id: `entry-${index}`, minutes: 0, at: NOW.toISOString() }));
  recordPractice(state, { type: 'writing', id: 'latest', minutes: 1 }, NOW);
  assert.equal(state.practice.length, 2_000);
  assert.equal(state.practice[0].id, 'entry-1');
  assert.equal(state.practice.at(-1).id, 'latest');
});

test('listening scores and transcript assistance roundtrip as a complete optional trio', () => {
  const state = fresh();
  recordPractice(state, { type: 'listening', id: 'listening:meeting', minutes: 2.5,
    text: 'The speaker qualifies the estimate.', score: 2, total: 3, assisted: true }, NOW);
  const restored = importState(exportState(state));
  assert.deepEqual(restored.practice[0], {
    type: 'listening', id: 'listening:meeting', minutes: 2.5,
    text: 'The speaker qualifies the estimate.', score: 2, total: 3, assisted: true, at: NOW.toISOString(),
  });
  assert.equal(restored.practice.length, 1, 'answers and output are one practice with one elapsed duration');
  const before = exportState(state);
  for (const fields of [
    { score: 2, total: 3 }, { assisted: false },
    { score: 4, total: 3, assisted: false }, { score: -1, total: 3, assisted: false },
    { score: 0, total: 0, assisted: false }, { score: 1, total: 101, assisted: false },
    { score: 1, total: 2.5, assisted: false }, { score: 2, total: 3, assisted: 'true' },
  ]) {
    assert.throws(() => recordPractice(state, { type: 'listening', id: 'x', minutes: 0, ...fields }, NOW));
    const corrupted = JSON.parse(before);
    corrupted.practice[0] = { type: 'listening', id: 'x', minutes: 0, at: NOW.toISOString(), ...fields };
    assert.throws(() => importState(JSON.stringify(corrupted)));
  }
  assert.equal(exportState(state), before);
  recordPractice(state, { type: 'writing', id: 'writing:note', minutes: 0, text: 'Unscored output.' }, NOW);
  assert.deepEqual(importState(exportState(state)).practice[1], state.practice[1]);
});

test('baseline keeps objective scores and optional blank writing without inventing a level', () => {
  const state = fresh(); const answers = ['0', '1', '2', '0', '2', '1', '1', '0'];
  assert.equal(recordBaseline(state, { score: 6, total: 8, answers, writing: '', note: '' }, NOW), state);
  answers[0] = 'changed';
  assert.equal(state.baseline[0].answers[0], '0');
  assert.equal(state.baseline[0].score, 6);
  assert.equal(state.baseline[0].total, 8);
  assert.equal(state.baseline[0].at, NOW.toISOString());
  assert.equal(state.baseline[0].writing, '');
  assert.equal(state.baseline[0].level, undefined);
  assert.equal(state.practice.length, 0);
  assert.throws(() => recordBaseline(state, { score: 9, total: 8 }, NOW));
  assert.throws(() => recordBaseline(state, { score: 6, total: 8, answers: { q1: '0' } }, NOW));
  assert.throws(() => recordBaseline(state, { score: 6, total: 8, answers: [{ answer: '0' }] }, NOW));
  assert.throws(() => recordBaseline(state, { score: 6, total: 8, native: true }, NOW));
  assert.equal(state.baseline.length, 1);
});

test('draft ids support colon prefixes, overwrite predictably and keep text as plain data', () => {
  const state = fresh();
  assert.equal(saveDraft(state, 'lesson:stance-1', '<b>This is a draft, not HTML to execute.</b>', NOW), state);
  assert.equal(state.drafts['lesson:stance-1'].text, '<b>This is a draft, not HTML to execute.</b>');
  saveDraft(state, 'lesson:stance-1', '', at('2026-10-25T04:00:00Z'));
  assert.equal(state.drafts['lesson:stance-1'].text, '');
  assert.equal(state.drafts['lesson:stance-1'].updatedAt, '2026-10-25T04:00:00.000Z');
  assert.throws(() => saveDraft(state, 'constructor', 'text', NOW));
  assert.throws(() => saveDraft(state, 'lesson:x', { text: 'nested' }, NOW));
  assert.equal(state.practice.length, 0);
});

test('the entire valid state roundtrips with stable export formatting', () => {
  const state = pass(fresh());
  reviewCard(state, 'chunk-1', 'good', NOW);
  recordPractice(state, { type: 'writing', id: 'writing:1', minutes: 2.5, ratings: { precision: 4 }, text: 'A short note.' }, NOW);
  recordBaseline(state, { score: 5, total: 8, answers: ['1'], writing: '', note: '' }, NOW);
  saveDraft(state, 'benchmark:1', 'Draft', NOW);
  const encoded = exportState(state);
  assert.deepEqual(importState(encoded), state);
  assert.equal(exportState(importState(encoded)), encoded);
});

test('imports reject corrupt, oversized, incomplete and unknown-schema input', () => {
  for (const raw of ['{', 'null', '[]', '{}', ' '.repeat(5_000_001)]) assert.throws(() => importState(raw));
  for (const mutate of [
    state => { state.schemaVersion = 2; },
    state => { state.extra = {}; },
    state => { state.profile.extra = true; },
    state => { delete state.profile.voiceURI; },
    state => { state.profile.dailyMinutes = 14; },
    state => { state.profile.dailyMinutes = 121; },
    state => { state.profile.dailyMinutes = '30'; },
    state => { state.profile.focus = 'unrecognized'; },
    state => { state.profile.voiceURI = {}; },
    state => { state.profile.timeZone = 'Never/Exists'; },
    state => { state.updatedAt = '2026-02-30T00:00:00.000Z'; },
  ]) {
    const state = fresh(); mutate(state);
    assert.throws(() => importState(JSON.stringify(state)));
  }
});

test('imports reject unsafe keys and malformed nested objects rather than silently dropping them', () => {
  const encoded = exportState(fresh());
  assert.throws(() => importState(encoded.replace('"cards": {}', '"cards": {"__proto__": {"polluted": true}}')), /unsafe/u);
  assert.equal({}.polluted, undefined);
  const badDraft = fresh(); badDraft.drafts.x = { text: 'valid', updatedAt: NOW.toISOString(), html: '<script>' };
  assert.throws(() => importState(JSON.stringify(badDraft)), /unknown|unsafe/u);
  const badText = fresh(); badText.practice.push({ type: 'writing', id: 'x', minutes: 0, at: NOW.toISOString(), text: { toString: null } });
  assert.throws(() => importState(JSON.stringify(badText)), /text/u);
  const badRatings = fresh(); badRatings.practice.push({ type: 'writing', id: 'x', minutes: 0, at: NOW.toISOString(), ratings: JSON.parse('{"constructor":{}}') });
  assert.throws(() => importState(JSON.stringify(badRatings)), /unsafe/u);
  const badCard = pass(fresh()); badCard.cards['chunk-1'].due = '2026-02-30T00:00:00.000Z';
  assert.throws(() => importState(JSON.stringify(badCard)), /invalid/u);
  const dishonestAttempt = pass(fresh()); dishonestAttempt.lessons['lesson-1'].history[0].assisted = true;
  assert.throws(() => importState(JSON.stringify(dishonestAttempt)), /inconsistent/u);
});

test('storage failures are visible and a corrupt stored backup is never silently replaced', () => {
  const broken = memory('{broken');
  assert.throws(() => loadState(broken, NOW), /original data was preserved/u);
  assert.equal(broken.values.get(STORAGE_KEY), '{broken');
  assert.match(loadState.lastError, /could not be read/u);
  const inaccessible = { getItem() { throw new Error('Storage blocked'); } };
  assert.deepEqual(loadState(inaccessible, NOW), fresh());
  assert.equal(loadState.lastError, 'Storage blocked');
  assert.equal(saveState(fresh(), { setItem() { throw new Error('Quota exceeded'); } }), false);
  assert.equal(saveState.lastError, 'Quota exceeded');
  assert.equal(saveState(fresh(), null), false);
  const healthy = memory();
  assert.equal(saveState(fresh(), healthy), true);
  assert.equal(saveState.lastError, null);
  assert.deepEqual(loadState(healthy, NOW), fresh());
  assert.equal(loadState.lastError, null);
});

const CATALOG = [
  { id: 'register-1', track: 'register' }, { id: 'flow-1', track: 'flow' },
  { id: 'stance-1', track: 'stance' }, { id: 'precision-1', track: 'precision' },
  { id: 'stance-2', track: 'stance' }, { id: 'interaction-1', track: 'interaction' },
  { id: 'story-1', track: 'story' }, { id: 'interaction-2', track: 'interaction' },
];

test('daily budgets sum exactly, with no empty-course or all-passed recommendation', () => {
  for (const budget of [15, 30, 45, 60, 90, 120]) {
    const state = fresh(); state.profile.dailyMinutes = budget;
    for (const learned of [false, true]) {
      if (learned) pass(state);
      const plan = getDailyPlan(state, CATALOG, NOW);
      assert.equal(plan.budget, budget);
      assert.equal(plan.reviewMinutes + plan.lessonMinutes + plan.outputMinutes, budget);
      assert([plan.reviewMinutes, plan.lessonMinutes, plan.outputMinutes].every(value => Number.isInteger(value) && value >= 0));
      assert.equal(plan.due.length, learned ? 1 : 0);
    }
  }
  const state = fresh();
  for (const lesson of CATALOG) pass(state, lesson.id, []);
  const plan = getDailyPlan(state, CATALOG, at('2040-01-01T00:00:00Z'));
  assert.equal(plan.nextLesson, null);
  assert.equal(plan.lessonMinutes, 0);
  assert.equal(plan.outputMinutes, 30);
  assert.equal(getDailyPlan(fresh(), [], NOW).nextLesson, null);
  assert.equal(getDailyPlan(fresh(), CATALOG, at('2040-01-01T00:00:00Z')).nextLesson.id, 'register-1', 'calendar age does not pass any lesson');
});

test('focus recommendations prioritize their tracks, preserve within-track order, and never skip the rest', () => {
  const expected = {
    balanced: ['register-1', 'flow-1', 'stance-1', 'precision-1', 'stance-2', 'interaction-1', 'story-1', 'interaction-2'],
    research: ['stance-1', 'stance-2', 'precision-1', 'flow-1', 'register-1', 'interaction-1', 'story-1', 'interaction-2'],
    conversation: ['interaction-1', 'interaction-2', 'story-1', 'register-1', 'flow-1', 'stance-1', 'precision-1', 'stance-2'],
    writing: ['precision-1', 'flow-1', 'register-1', 'stance-1', 'stance-2', 'interaction-1', 'story-1', 'interaction-2'],
  };
  for (const [focus, ids] of Object.entries(expected)) {
    const state = fresh(); state.profile.focus = focus;
    const actual = [];
    while (getDailyPlan(state, CATALOG, NOW).nextLesson) {
      const next = getDailyPlan(state, CATALOG, NOW).nextLesson;
      actual.push(next.id); pass(state, next.id, []);
    }
    assert.deepEqual(actual, ids, focus);
  }
  const state = fresh(); state.profile.focus = 'research';
  recordLesson(state, { id: 'stance-1', score: 5, total: 5, assisted: true, minutes: 0 }, NOW);
  assert.equal(getDailyPlan(state, CATALOG, NOW).nextLesson.id, 'stance-1', 'assisted practice cannot unlock the next recommendation');
});
