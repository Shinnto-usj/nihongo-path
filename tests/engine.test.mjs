import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY, defaultState, loadState, saveState, localDate, daysUntil,
  getStreak, dueCards, reviewCard, recordActivity, recordLesson, recordAssessment,
  getDailyPlan, getMilestoneDate, importState, exportState, normalizeAnswer, checkAnswer,
} from '../lib/engine.js';
import { kana, kanaNotes } from '../lib/kana.js';

const NOW = new Date('2026-10-24T04:00:00.000Z');
const at = text => new Date(text);
const fresh = () => defaultState(NOW);
const mockStorage = initial => {
  let value = initial ?? null;
  return {
    getItem(key) { assert.equal(key, STORAGE_KEY); return value; },
    setItem(key, next) { assert.equal(key, STORAGE_KEY); value = next; },
    raw() { return value; },
  };
};

test('new learners start at zero and state containers are independent', () => {
  const a = fresh();
  const b = fresh();
  a.profile.city = '京都';
  a.cards.one = {};
  assert.equal(b.profile.city, '');
  assert.deepEqual(b.cards, {});
  assert.equal(b.profile.targetDate, '');
  assert.equal(b.profile.dailyMinutes, 30);
  assert.equal(b.profile.timeZone, 'Asia/Singapore');
});

test('civil dates use the learner timezone across midnight', () => {
  assert.equal(localDate(at('2026-10-24T15:59:59Z')), '2026-10-24');
  assert.equal(localDate(at('2026-10-24T16:00:00Z')), '2026-10-25');
  assert.equal(localDate(at('2026-10-24T16:00:00Z'), 'America/New_York'), '2026-10-24');
  assert.throws(() => localDate('not a date'), /日期/u);
});

test('daysUntil counts civil days, not 24-hour DST intervals, and can be overdue', () => {
  assert.equal(daysUntil('2027-03-15', at('2027-03-13T17:00:00Z'), 'America/New_York'), 2);
  assert.equal(daysUntil('2026-10-24', at('2026-10-24T16:00:00Z')), -1);
  assert.throws(() => daysUntil('2027-02-30', NOW), /日期/u);
});

test('review milestone dates move with the chosen target and the last fraction reaches it exactly', () => {
  const state = fresh();
  assert.equal(getMilestoneDate(state, { fraction: 0.5 }), null);
  state.profile.targetDate = '2026-11-13';
  assert.equal(getMilestoneDate(state, { fraction: 0.5 }), '2026-11-03');
  assert.equal(getMilestoneDate(state, { fraction: 1 }), '2026-11-13');
  state.profile.targetDate = '2026-12-03';
  assert.equal(getMilestoneDate(state, { fraction: 0.5 }), '2026-11-13');
  assert.equal(getMilestoneDate(state, { fraction: 1 }), '2026-12-03');
  assert.deepEqual(state.lessons, {}, 'calendar dates must not grant any learning achievement');
});

test('milestone interpolation starts on the createdAt civil date in the selected timezone', () => {
  const state = defaultState(at('2026-10-24T16:30:00Z'));
  state.profile.targetDate = '2026-11-03';
  assert.equal(getMilestoneDate(state, { fraction: 0.5 }), '2026-10-30');
  state.profile.timeZone = 'Etc/UTC';
  assert.equal(getMilestoneDate(state, { fraction: 0.5 }), '2026-10-29');
  state.createdAt = '2027-03-13T17:00:00.000Z';
  state.profile.timeZone = 'America/New_York';
  state.profile.targetDate = '2027-03-15';
  assert.equal(getMilestoneDate(state, { fraction: 0.5 }), '2027-03-14', 'DST must not shift a calendar checkpoint');
});

test('milestones handle past targets and reject invalid fractions without coercion', () => {
  const state = fresh();
  for (const fraction of [0, -0.1, 1.01, Infinity, NaN, '0.5', null, undefined]) {
    assert.throws(() => getMilestoneDate(state, { fraction }), /比例/u);
  }
  state.profile.targetDate = '2026-10-20';
  assert.equal(getMilestoneDate(state, { fraction: 0.5 }), '2026-10-20');
  assert.equal(getMilestoneDate(state, { fraction: 1 }), '2026-10-20');
  state.profile.targetDate = '2026-10-24';
  assert.equal(getMilestoneDate(state, { fraction: 0.5 }), '2026-10-24');
});

test('streak remains live before today is practiced, but cannot bridge a missed day', () => {
  let state = fresh();
  state = recordActivity(state, { seconds: 60 }, at('2026-10-22T04:00:00Z'));
  state = recordActivity(state, { answered: 1, correct: 1 }, at('2026-10-23T04:00:00Z'));
  assert.equal(getStreak(state, NOW), 2);
  state = recordActivity(state, { reviewed: 1 }, NOW);
  assert.equal(getStreak(state, NOW), 3);
  assert.equal(getStreak(state, at('2026-10-26T04:00:00Z')), 0);
});

test('streak ignores empty rows and future activity', () => {
  let state = recordActivity(fresh(), {}, NOW);
  assert.equal(getStreak(state, NOW), 0);
  state = recordActivity(state, { seconds: 20 }, at('2026-10-27T04:00:00Z'));
  assert.equal(getStreak(state, NOW), 0);
});

test('due queue contains only seen catalog cards and deduplicates by id', () => {
  let state = reviewCard(fresh(), 'a', 'again', NOW);
  state = reviewCard(state, 'b', 'good', NOW);
  const catalog = [{ id: 'new', jp: '新' }, { id: 'a', jp: 'あ' }, { id: 'b', jp: 'い' }, { id: 'a', jp: 'duplicate' }];
  assert.equal(dueCards(state, catalog, at('2026-10-24T04:09:59Z')).length, 0);
  const due = dueCards(state, catalog, at('2026-10-24T04:10:00Z'));
  assert.equal(due.length, 1);
  assert.equal(due[0].id, 'a');
  assert.equal(due[0].jp, 'あ');
  assert.equal(due[0].srs.lapses, 1);
  due[0].srs.lapses = 99;
  assert.equal(state.cards.a.lapses, 1);
  state.cards.a.id = 'substituted';
  state.cards.a.jp = 'untrusted';
  const trusted = dueCards(state, catalog, at('2026-10-24T04:10:00Z'))[0];
  assert.equal(trusted.id, 'a');
  assert.equal(trusted.jp, 'あ');
});

test('review failure re-enters after ten minutes and resets a long interval', () => {
  let state = fresh();
  for (let i = 0; i < 6; i += 1) state = reviewCard(state, 'a', 'good', NOW);
  assert.equal(state.cards.a.intervalDays, 60);
  const prior = JSON.stringify(state);
  const forgotten = reviewCard(state, 'a', 'again', NOW);
  assert.equal(forgotten.cards.a.due, '2026-10-24T04:10:00.000Z');
  assert.equal(forgotten.cards.a.reps, 0);
  assert.equal(forgotten.cards.a.lapses, 1);
  const learned = reviewCard(forgotten, 'a', 'good', at('2026-10-24T04:10:00Z'));
  assert.equal(learned.cards.a.intervalDays, 1);
  assert.equal(JSON.stringify(state), prior);
  assert.deepEqual(state.daily, {}, 'scheduling does not inflate practice statistics');
});

test('hard review shortens an uncertain card and the next good answer stays short', () => {
  let state = fresh();
  for (let i = 0; i < 6; i += 1) state = reviewCard(state, 'a', 'good', NOW);
  state = reviewCard(state, 'a', 'hard', NOW);
  assert.equal(state.cards.a.intervalDays, 1);
  state = reviewCard(state, 'a', 'good', NOW);
  assert.equal(state.cards.a.intervalDays, 3);
  assert.throws(() => reviewCard(state, 'a', 'perfect', NOW), /评价/u);
  assert.throws(() => reviewCard(state, '__proto__', 'good', NOW), /编号/u);
});

test('new cards can be scheduled, with easy using a longer transparent interval', () => {
  const good = reviewCard(fresh(), 'good', 'good', NOW);
  const easy = reviewCard(fresh(), 'easy', 'easy', NOW);
  assert.equal(good.cards.good.intervalDays, 1);
  assert.equal(easy.cards.easy.intervalDays, 3);
});

test('activity uses timezone dates, counts actual seconds, and deduplicates achievements', () => {
  const original = fresh();
  const night = at('2026-10-24T16:00:00Z');
  let next = recordActivity(original, { seconds: 70, answered: 2, correct: 1, scenarioId: 'cafe' }, night);
  next = recordActivity(next, { seconds: 15, scenarioId: 'cafe' }, night);
  const day = next.daily['2026-10-25'];
  assert.equal(day.seconds, 85);
  assert.equal(day.answered, 2);
  assert.equal(day.correct, 1);
  assert.deepEqual(day.scenarios, ['cafe']);
  assert.equal(next.scenarioCompletions.cafe, night.toISOString());
  assert.deepEqual(original.daily, {});
  assert.throws(() => recordActivity(next, { answered: 1, correct: 2 }, NOW), /答对/u);
  assert.throws(() => recordActivity(next, { seconds: -1 }, NOW), /秒数/u);
});

test('failed lesson is not complete; the 80% boundary completes it and records its attempt once', () => {
  const failed = recordLesson(fresh(), { lessonId: 'intro', correct: 3, total: 5, seconds: 40 }, NOW);
  assert.equal(failed.lessons.intro.completedAt, null);
  assert.equal(failed.lessons.intro.lastScore, 60);
  assert.deepEqual(failed.daily['2026-10-24'].lessons, []);
  const passed = recordLesson(failed, { lessonId: 'intro', correct: 4, total: 5, seconds: 50 }, NOW);
  assert.equal(passed.lessons.intro.completedAt, NOW.toISOString());
  assert.equal(passed.lessons.intro.attempts, 2);
  assert.equal(passed.daily['2026-10-24'].seconds, 90);
  assert.equal(passed.daily['2026-10-24'].answered, 10);
  assert.equal(passed.daily['2026-10-24'].correct, 7);
  assert.deepEqual(passed.daily['2026-10-24'].lessons, ['intro']);
});

test('repeat attempts preserve the best result and first completion without duplicate achievements', () => {
  const first = recordLesson(fresh(), { lessonId: 'intro', correct: 5, total: 5, seconds: 10 }, NOW);
  const later = at('2026-10-24T05:00:00Z');
  const second = recordLesson(first, { lessonId: 'intro', correct: 4, total: 5, seconds: 15 }, later);
  const third = recordLesson(second, { lessonId: 'intro', correct: 1, total: 5, seconds: 20 }, later);
  assert.equal(third.lessons.intro.bestScore, 100);
  assert.equal(third.lessons.intro.lastScore, 20);
  assert.equal(third.lessons.intro.completedAt, NOW.toISOString());
  assert.equal(third.lessons.intro.attempts, 3);
  assert.deepEqual(third.daily['2026-10-24'].lessons, ['intro']);
  assert.equal(third.daily['2026-10-24'].seconds, 45);
  assert.throws(() => recordLesson(first, { lessonId: 'intro', correct: 0, total: 0 }, NOW), /总数/u);
});

test('backup roundtrip preserves learned state and actual activity', () => {
  let state = reviewCard(fresh(), 'a', 'good', NOW);
  state = recordLesson(state, { lessonId: 'l1', correct: 4, total: 5, seconds: 13 }, NOW);
  state = recordActivity(state, { scenarioId: 'cafe', reviewed: 1, seconds: 8 }, NOW);
  state = recordAssessment(state, { level: 'N5', source: 'self-check', correct: 8, total: 10 }, NOW);
  assert.deepEqual(importState(exportState(state)), state);
});

test('imports reject malformed files, unsupported versions, invalid dates and impossible counts', () => {
  assert.throws(() => importState('{'), /JSON/u);
  assert.throws(() => importState('null'), /对象/u);
  for (const mutate of [
    state => { state.schemaVersion = 2; },
    state => { state.profile.targetDate = '2027-02-30'; },
    state => { state.profile.dailyMinutes = 0; },
    state => { state.profile.dailyMinutes = '180'; },
    state => { state.profile.dailyMinutes = 1440; },
    state => { state.profile.timeZone = 'Made/Up'; },
    state => { state.profile.speechRate = 50; },
    state => { state.profile.showRomaji = 'yes'; },
    state => { state.daily['2026-10-24'] = { seconds: 2, answered: 1, correct: 2, reviewed: 0, lessons: [], scenarios: [] }; },
    state => { state.createdAt = '2026-02-30T00:00:00.000Z'; },
  ]) {
    const state = fresh();
    mutate(state);
    assert.throws(() => importState(JSON.stringify(state)));
  }
});

test('imports reject unsafe keys at root and inside data without polluting prototypes', () => {
  const base = exportState(fresh());
  assert.throws(() => importState(base.replace('"cards": {}', '"cards": {"__proto__": {"polluted": true}}')), /不安全/u);
  assert.throws(() => importState(base.replace('"city": ""', '"city": "", "other": {"constructor": {"prototype": {"polluted": true}}}')), /不安全/u);
  assert.equal({}.polluted, undefined);
});

test('imports reject fabricated completion and bad review timestamps', () => {
  const state = recordLesson(fresh(), { lessonId: 'x', correct: 1, total: 5 }, NOW);
  state.lessons.x.completedAt = NOW.toISOString();
  assert.throws(() => importState(JSON.stringify(state)), /80%/u);
  const scheduled = reviewCard(fresh(), 'x', 'good', NOW);
  scheduled.cards.x.due = '2027-02-30T00:00:00.000Z';
  assert.throws(() => importState(JSON.stringify(scheduled)), /时间/u);
});

test('corrupt stored text is retained and saving failures are detectable', () => {
  const storage = mockStorage('{not-json');
  const recovered = loadState(storage);
  assert.equal(recovered.schemaVersion, 1);
  assert.match(loadState.lastError, /JSON/u);
  assert.equal(storage.raw(), '{not-json');
  const broken = { setItem() { throw new Error('QuotaExceededError'); } };
  assert.equal(saveState(fresh(), broken), false);
  assert.match(saveState.lastError, /Quota/u);
  const healthy = mockStorage();
  assert.equal(saveState(fresh(), healthy), true);
  assert.equal(saveState.lastError, null);
  assert.deepEqual(loadState(healthy), fresh());
  assert.equal(loadState.lastError, null);
});

test('assessment snapshots are independent and do not claim scaled scores', () => {
  const result = { level: 'N1', source: 'sample-questions', sections: { reading: { correct: 2, total: 4 } } };
  const state = recordAssessment(fresh(), result, NOW);
  result.sections.reading.correct = 4;
  assert.equal(state.assessments[0].sections.reading.correct, 2);
  assert.equal(state.assessments[0].recordedAt, NOW.toISOString());
  assert.equal(state.assessments[0].score, undefined);
  assert.deepEqual(state.daily, {});
  assert.throws(() => recordAssessment(fresh(), { kind: 'external', knowledge: '<img src=x>' }, NOW), /knowledge/u);
  assert.throws(() => recordAssessment(fresh(), { correct: 4, total: 3 }, NOW), /答对数/u);
  const injected = recordAssessment(fresh(), { kind: 'external', knowledge: 70, reading: 65, listening: 60 }, NOW);
  injected.assessments[0].knowledge = '<img src=x>';
  assert.throws(() => importState(JSON.stringify(injected)), /knowledge/u);
});

test('answer checking normalizes typography, accepts only declared alternatives, and keeps choice ids exact', () => {
  assert.equal(normalizeAnswer('  ＫＯＮＮＩＣＨＩＷＡ！  '), 'konnichiwa');
  assert.equal(checkAnswer({ type: 'input', answer: 'こんにちは', accepted: ['konnichiwa'] }, ' こんにちは。'), true);
  assert.equal(checkAnswer({ type: 'input', answer: 'こんにちは', accepted: ['konnichiwa'] }, '今日は'), false);
  assert.equal(checkAnswer({ type: 'input', answer: 'こんにちは' }, ''), false);
  assert.equal(checkAnswer({ answer: 'a', choices: [{ id: 'a', text: 'x' }] }, 'A'), false);
  assert.equal(checkAnswer({ answer: 'a', choices: [{ id: 'a', text: 'x' }] }, 'a'), true);
  assert.equal(checkAnswer({ answer: 'きって' }, 'きて'), false, 'small-tsu errors are not normalized away');
  assert.equal(checkAnswer({ answer: 'コーヒー' }, 'コヒ'), false, 'long vowels matter');
});

const COURSE = { lessons: [
  { id: 'first', order: 1, level: 'foundation', title: '第一课', canDo: '读五个元音' },
  { id: 'second', order: 2, level: 'N5', title: '第二课', canDo: '介绍自己' },
] };

test('a learner without a target can roundtrip their backup and receive a normal daily plan', () => {
  const state = importState(exportState(fresh()));
  assert.equal(state.profile.targetDate, '');
  const plan = getDailyPlan(state, COURSE, at('2030-01-01T04:00:00Z'));
  assert.equal(plan.targetDays, null);
  assert.equal(plan.newLesson.id, 'first');
  assert.equal(plan.blocks.reduce((sum, block) => sum + block.minutes, 0), 30);
  assert.match(plan.warning, /学习设置.*目标日期/u);
  assert.doesNotMatch(plan.warning, /已过|逾期|每日时间较紧/u);
});

test('existing v1 backups keep their explicit target and daily budget', () => {
  const legacy = fresh();
  legacy.profile.targetDate = '2030-12-31';
  legacy.profile.dailyMinutes = 180;
  const restored = importState(exportState(legacy));
  assert.equal(restored.schemaVersion, 1);
  assert.equal(restored.profile.targetDate, '2030-12-31');
  assert.equal(restored.profile.dailyMinutes, 180);
  assert.equal(restored.profile.timeZone, 'Asia/Singapore');
  assert.equal(typeof getDailyPlan(restored, COURSE, NOW).targetDays, 'number');
});

test('daily budgets add up exactly at small and large settings', () => {
  for (const total of [5, 15, 30, 60, 90, 120, 180, 240, 720]) {
    const state = fresh();
    state.profile.dailyMinutes = total;
    const plan = getDailyPlan(state, COURSE, NOW);
    assert.equal(plan.blocks.reduce((sum, block) => sum + block.minutes, 0), total);
    assert(plan.blocks.every(block => Number.isInteger(block.minutes) && block.minutes >= 0));
  }
});

test('daily curriculum follows completed skills instead of automatically advancing with the date', () => {
  const first = getDailyPlan(fresh(), COURSE, at('2027-05-30T04:00:00Z'));
  assert.equal(first.newLesson.id, 'first');
  assert.equal(first.phase, 'foundation');
  assert.equal(first.nextLesson.id, 'second');
  const failed = recordLesson(fresh(), { lessonId: 'first', correct: 3, total: 5 }, NOW);
  assert.equal(getDailyPlan(failed, COURSE, NOW).newLesson.id, 'first');
  const passed = recordLesson(failed, { lessonId: 'first', correct: 4, total: 5 }, NOW);
  assert.equal(getDailyPlan(passed, COURSE, NOW).newLesson.id, 'second');
});

test('all sample lessons completed transitions to honest consolidation, not an N1 certificate', () => {
  let state = fresh();
  state.profile.dailyMinutes = 180;
  for (const lesson of COURSE.lessons) state = recordLesson(state, { lessonId: lesson.id, correct: 5, total: 5 }, NOW);
  const plan = getDailyPlan(state, COURSE, NOW);
  assert.equal(plan.newLesson, null);
  assert.equal(plan.nextLesson, null);
  assert.equal(plan.phase, 'consolidation');
  assert.match(plan.warning, /不能据此判定达到 N1/u);
  assert.equal(plan.targetDays, null);
  assert.match(plan.warning, /学习设置.*目标日期/u);
  assert.equal(plan.blocks.reduce((sum, block) => sum + block.minutes, 0), 180);
  assert.doesNotThrow(() => getDailyPlan(fresh(), { lessons: [] }, NOW));
});

test('kana catalog covers 46 basic kana, 25 voiced variants, and 33 common yoon combinations', () => {
  assert.equal(kana.filter(item => item.basic).length, 46);
  assert.equal(kana.length, 104);
  assert.equal(kana.filter(item => item.kind === 'contracted').length, 33);
  assert.equal(new Set(kana.map(item => item.id)).size, kana.length);
  assert(kana.every(item => item.hiragana && item.katakana && item.romaji && item.row));
  for (const char of ['し', 'ち', 'つ', 'ふ', 'を']) {
    assert(kana.find(item => item.hiragana === char)?.note.length > 0);
  }
  assert.equal(kana.find(item => item.hiragana === 'を').romaji, 'o');
  assert(kana.find(item => item.hiragana === 'を').variants.includes('wo'));
  assert(kanaNotes.some(note => note.title.includes('小っ')));
});
