/** English Atelier: local, bounded learning records and a transparent review queue.
 * Mutators change the supplied state and return that same object. Question
 * accuracy, self-ratings and calendar activity never imply a CEFR/native level.
 */
export const STORAGE_KEY = 'english-atelier:v1';

const DAY_MS = 86_400_000;
const MAX_TEXT = 20_000;
const MAX_JSON = 5_000_000;
const LIMITS = { lessons: 500, cards: 10_000, drafts: 200, practice: 2_000, baseline: 200, reviews: 10_000, history: 1_000 };
const INTERVALS = [1, 3, 7, 14, 30, 60, 90];
const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const FOCUS = ['balanced', 'research', 'conversation', 'writing'];
const RATINGS = ['clarity', 'naturalness', 'flow', 'precision'];
const ROOT_KEYS = ['schemaVersion', 'createdAt', 'profile', 'lessons', 'cards', 'drafts', 'practice', 'baseline', 'reviews', 'updatedAt'];
const PROFILE_KEYS = ['dailyMinutes', 'timeZone', 'speechRate', 'voiceURI', 'focus'];
const LESSON_KEYS = ['id', 'attempts', 'lastScore', 'lastTotal', 'lastPercent', 'bestScore', 'bestTotal', 'bestPercent', 'bestAssisted', 'lastAssisted', 'passed', 'completedAt', 'lastAt', 'totalMinutes', 'history'];
const CARD_KEYS = ['id', 'due', 'intervalDays', 'reps', 'lapses', 'lastReviewed', 'addedAt'];

function check(condition, message) { if (!condition) throw new Error(message); }
function date(value) {
  const result = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  check(Number.isFinite(result.getTime()), 'Invalid date.');
  return result;
}
function number(value, name, min = 0, max = 1_000_000, integer = false) {
  check(typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
    && (!integer || Number.isInteger(value)), `${name} must be ${integer ? 'an integer ' : ''}between ${min} and ${max}.`);
}
function text(value, name, max = MAX_TEXT, empty = true) {
  check(typeof value === 'string' && value.length <= max && (empty || value.trim().length > 0), `${name} is invalid.`);
}
function id(value) {
  text(value, 'Record id', 160, false);
  check(!UNSAFE_KEYS.has(value) && !/[\u0000-\u001f\u007f]/u.test(value), 'Unsafe record id.');
}
function object(value, name, maxKeys = 100) {
  check(value !== null && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null), `${name} must be an object.`);
  const keys = Object.keys(value);
  check(keys.length <= maxKeys && keys.every(key => !UNSAFE_KEYS.has(key)), `${name} has too many or unsafe keys.`);
  return keys;
}
function shape(value, allowed, required, name) {
  const keys = object(value, name, allowed.length);
  check(keys.every(key => allowed.includes(key)), `${name} contains an unknown field.`);
  check(required.every(key => Object.hasOwn(value, key)), `${name} is missing a required field.`);
}
function list(value, name, max) { check(Array.isArray(value) && value.length <= max, `${name} must be an array with at most ${max} entries.`); }
function bool(value, name) { check(typeof value === 'boolean', `${name} must be true or false.`); }
function iso(value, name) {
  text(value, name, 30, false);
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/u.exec(value);
  check(match !== null, `${name} must be a UTC timestamp.`);
  const parsed = date(value);
  check(parsed.toISOString() === `${match[1]}.${(match[2] || '').padEnd(3, '0')}Z`, `${name} is invalid.`);
}
function scorePair(score, total, name) {
  number(total, `${name} total`, 1, 1_000, true);
  number(score, `${name} score`, 0, total);
}
function minutes(value) { number(value, 'Minutes', 0, 120); }
function ratings(value) {
  shape(value, RATINGS, [], 'Self-ratings');
  Object.entries(value).forEach(([key, rating]) => number(rating, key, 1, 5, true));
}
function answerCollection(value) {
  list(value, 'Baseline answers', 100);
  value.forEach(answer => text(answer, 'Selected answer', 500));
}
function lessonRecord(value, key) {
  shape(value, LESSON_KEYS, LESSON_KEYS, 'Lesson record');
  id(value.id); check(value.id === key, 'Lesson id does not match its key.');
  number(value.attempts, 'Lesson attempts', 1, 1_000_000, true);
  scorePair(value.lastScore, value.lastTotal, 'Last lesson');
  scorePair(value.bestScore, value.bestTotal, 'Best lesson');
  for (const [label, score, total, percent] of [
    ['Last', value.lastScore, value.lastTotal, value.lastPercent],
    ['Best', value.bestScore, value.bestTotal, value.bestPercent],
  ]) {
    number(percent, `${label} accuracy`, 0, 100);
    check(Math.abs(percent - score / total * 100) < 1e-8, `${label} accuracy does not match the score.`);
  }
  check(value.bestPercent + 1e-8 >= value.lastPercent, 'Best accuracy is lower than latest accuracy.');
  bool(value.lastAssisted, 'Latest assisted flag'); bool(value.bestAssisted, 'Best assisted flag'); bool(value.passed, 'Lesson passed flag');
  iso(value.lastAt, 'Latest lesson timestamp');
  if (value.passed) { iso(value.completedAt, 'First independent pass timestamp'); check(value.bestPercent >= 80, 'Passed lesson has no qualifying accuracy.'); }
  else check(value.completedAt === null, 'An unpassed lesson cannot have a completion timestamp.');
  number(value.totalMinutes, 'Cumulative lesson minutes', 0, value.attempts * 120);
  list(value.history, 'Lesson history', LIMITS.history);
  check(value.history.length > 0 && value.history.length <= value.attempts, 'Lesson history does not match attempts.');
  for (const attempt of value.history) {
    shape(attempt, ['at', 'score', 'total', 'assisted', 'minutes', 'passed'], ['at', 'score', 'total', 'assisted', 'minutes', 'passed'], 'Lesson attempt');
    iso(attempt.at, 'Lesson attempt timestamp'); scorePair(attempt.score, attempt.total, 'Lesson attempt');
    bool(attempt.assisted, 'Assisted flag'); minutes(attempt.minutes); bool(attempt.passed, 'Attempt passed flag');
    check(attempt.passed === (!attempt.assisted && attempt.score / attempt.total >= 0.8), 'Attempt pass flag is inconsistent.');
  }
  const last = value.history.at(-1);
  check(last.at === value.lastAt && last.score === value.lastScore && last.total === value.lastTotal
    && last.assisted === value.lastAssisted, 'Latest lesson fields do not match its history.');
  check(value.passed || !value.history.some(attempt => attempt.passed), 'Lesson pass flag contradicts its history.');
}
function cardRecord(card, key) {
  shape(card, CARD_KEYS, CARD_KEYS, 'Review card');
  id(card.id); check(card.id === key, 'Card id does not match its key.');
  iso(card.due, 'Review due timestamp'); iso(card.addedAt, 'Card creation timestamp');
  if (card.lastReviewed !== null) iso(card.lastReviewed, 'Last review timestamp');
  number(card.intervalDays, 'Review interval', 0, 90);
  number(card.reps, 'Review step', 0, 1_000_000, true); number(card.lapses, 'Lapses', 0, 1_000_000, true);
}
function practiceRecord(entry) {
  shape(entry, ['type', 'id', 'minutes', 'text', 'ratings', 'score', 'total', 'assisted', 'at'], ['type', 'id', 'minutes', 'at'], 'Practice record');
  id(entry.type); id(entry.id); minutes(entry.minutes); iso(entry.at, 'Practice timestamp');
  if (Object.hasOwn(entry, 'text')) text(entry.text, 'Practice text');
  if (Object.hasOwn(entry, 'ratings')) ratings(entry.ratings);
  // Objective listening answers retain their raw accuracy and transcript use.
  // An unscored practice omits all three fields; none imply a language level.
  const scoreKeys = ['score', 'total', 'assisted'];
  if (scoreKeys.some(key => Object.hasOwn(entry, key))) {
    check(scoreKeys.every(key => Object.hasOwn(entry, key)), 'Practice score, total and assisted must appear together.');
    number(entry.total, 'Practice total', 1, 100, true);
    number(entry.score, 'Practice score', 0, entry.total);
    bool(entry.assisted, 'Practice assisted flag');
  }
}
function baselineRecord(entry) {
  shape(entry, ['score', 'total', 'answers', 'writing', 'note', 'at'], ['score', 'total', 'at'], 'Baseline record');
  scorePair(entry.score, entry.total, 'Baseline'); iso(entry.at, 'Baseline timestamp');
  if (Object.hasOwn(entry, 'answers')) answerCollection(entry.answers);
  if (Object.hasOwn(entry, 'writing')) text(entry.writing, 'Baseline writing');
  if (Object.hasOwn(entry, 'note')) text(entry.note, 'Baseline note', 5_000);
}
function validate(state) {
  shape(state, ROOT_KEYS, ROOT_KEYS, 'Learning state');
  check(state.schemaVersion === 1, 'Unsupported backup version.');
  iso(state.createdAt, 'Created timestamp'); iso(state.updatedAt, 'Updated timestamp');
  shape(state.profile, PROFILE_KEYS, PROFILE_KEYS, 'Profile');
  number(state.profile.dailyMinutes, 'Daily budget', 15, 120, true);
  text(state.profile.timeZone, 'Time zone', 100, false);
  try { new Intl.DateTimeFormat('en', { timeZone: state.profile.timeZone }); } catch { throw new Error('Invalid time zone.'); }
  number(state.profile.speechRate, 'Speech rate', 0.4, 1.5);
  text(state.profile.voiceURI, 'Voice URI', 500);
  check(FOCUS.includes(state.profile.focus), 'Unknown learning focus.');
  object(state.lessons, 'Lessons', LIMITS.lessons);
  for (const [key, value] of Object.entries(state.lessons)) { id(key); lessonRecord(value, key); }
  object(state.cards, 'Cards', LIMITS.cards);
  for (const [key, value] of Object.entries(state.cards)) { id(key); cardRecord(value, key); }
  object(state.drafts, 'Drafts', LIMITS.drafts);
  for (const [key, value] of Object.entries(state.drafts)) {
    id(key); shape(value, ['text', 'updatedAt'], ['text', 'updatedAt'], 'Draft');
    text(value.text, 'Draft text'); iso(value.updatedAt, 'Draft timestamp');
  }
  list(state.practice, 'Practice log', LIMITS.practice); state.practice.forEach(practiceRecord);
  list(state.baseline, 'Baseline log', LIMITS.baseline); state.baseline.forEach(baselineRecord);
  list(state.reviews, 'Review log', LIMITS.reviews);
  for (const entry of state.reviews) {
    shape(entry, ['id', 'rating', 'at', 'intervalDays', 'due'], ['id', 'rating', 'at', 'intervalDays', 'due'], 'Review event');
    id(entry.id); check(['again', 'hard', 'good', 'easy'].includes(entry.rating), 'Invalid review rating.');
    check(Object.hasOwn(state.cards, entry.id), 'Review event refers to an unknown card.');
    iso(entry.at, 'Review timestamp'); iso(entry.due, 'Review due timestamp'); number(entry.intervalDays, 'Review interval', 0, 90);
  }
  return state;
}

export function defaultState(now = new Date()) {
  const at = date(now).toISOString();
  return { schemaVersion: 1, createdAt: at,
    profile: { dailyMinutes: 30, timeZone: 'Asia/Singapore', speechRate: 1, voiceURI: '', focus: 'balanced' },
    lessons: {}, cards: {}, drafts: {}, practice: [], baseline: [], reviews: [], updatedAt: at };
}

/** Missing storage is a memory-only session; present corrupt data throws intact. */
export function loadState(storage, now = new Date()) {
  loadState.lastError = null;
  let raw;
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    check(target && typeof target.getItem === 'function', 'Local storage is unavailable.');
    raw = target.getItem(STORAGE_KEY);
  } catch (error) {
    loadState.lastError = error instanceof Error ? error.message : 'Unable to read local storage.';
    return defaultState(now);
  }
  if (raw === null) return defaultState(now);
  try { return importState(raw); }
  catch (error) {
    loadState.lastError = `Saved progress could not be read; the original data was preserved. ${error.message}`;
    throw new Error(loadState.lastError);
  }
}
loadState.lastError = null;

export function saveState(state, storage) {
  saveState.lastError = null;
  try {
    const encoded = exportState(state);
    const target = storage === undefined ? globalThis.localStorage : storage;
    check(target && typeof target.setItem === 'function', 'Local storage is unavailable.');
    target.setItem(STORAGE_KEY, encoded);
    return true;
  } catch (error) {
    saveState.lastError = error instanceof Error ? error.message : 'Unable to save progress.';
    return false;
  }
}
saveState.lastError = null;

export function importState(encoded) {
  check(typeof encoded === 'string' && encoded.length <= MAX_JSON, 'Backup is not text or exceeds 5 MB of JSON characters.');
  let parsed;
  try { parsed = JSON.parse(encoded); } catch { throw new Error('Backup is not valid JSON.'); }
  return validate(parsed);
}
export function exportState(state) {
  validate(state);
  const encoded = JSON.stringify(state, null, 2);
  check(encoded.length <= MAX_JSON, 'Progress exceeds the backup size limit.');
  return encoded;
}
export function localDate(now = new Date(), timeZone = 'Asia/Singapore') {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date(now));
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function shiftDay(day, amount) { return new Date(Date.parse(`${day}T00:00:00Z`) + amount * DAY_MS).toISOString().slice(0, 10); }
export function getStreak(state, now = new Date()) {
  const dates = new Set();
  const add = at => { if (at) dates.add(localDate(at, state.profile.timeZone)); };
  Object.values(state.lessons).forEach(lesson => { lesson.history.forEach(entry => add(entry.at)); add(lesson.lastAt); add(lesson.completedAt); });
  [...state.practice, ...state.baseline, ...state.reviews].forEach(entry => add(entry.at));
  let cursor = localDate(now, state.profile.timeZone);
  if (!dates.has(cursor)) cursor = shiftDay(cursor, -1);
  let streak = 0;
  while (dates.has(cursor)) { streak += 1; cursor = shiftDay(cursor, -1); }
  return streak;
}
export function dueCards(state, now = new Date()) {
  const at = date(now).getTime();
  return Object.values(state.cards).filter(card => Date.parse(card.due) <= at)
    .map(card => ({ ...card })).sort((a, b) => Date.parse(a.due) - Date.parse(b.due) || a.id.localeCompare(b.id));
}
function append(list, entry, limit) { return [...list, entry].slice(-limit); }

export function recordLesson(state, input, now = new Date()) {
  shape(input, ['id', 'score', 'total', 'assisted', 'minutes', 'chunkIds'], ['id', 'score', 'total', 'minutes'], 'Lesson attempt input');
  id(input.id); scorePair(input.score, input.total, 'Lesson'); minutes(input.minutes);
  const assisted = input.assisted ?? false; bool(assisted, 'Assisted flag');
  const chunkIds = input.chunkIds ?? []; list(chunkIds, 'Chunk ids', 1_000); chunkIds.forEach(id);
  const at = date(now).toISOString();
  const percent = input.score / input.total * 100;
  const passed = !assisted && input.score / input.total >= 0.8;
  const old = Object.hasOwn(state.lessons, input.id) ? state.lessons[input.id] : undefined;
  const isBest = !old || percent > old.bestPercent
    || (percent === old.bestPercent && old.bestAssisted && !assisted)
    || (percent === old.bestPercent && old.bestAssisted === assisted && input.total > old.bestTotal);
  const next = {
    id: input.id, attempts: (old?.attempts || 0) + 1,
    lastScore: input.score, lastTotal: input.total, lastPercent: percent,
    bestScore: isBest ? input.score : old.bestScore,
    bestTotal: isBest ? input.total : old.bestTotal,
    bestPercent: isBest ? percent : old.bestPercent,
    bestAssisted: isBest ? assisted : old.bestAssisted,
    lastAssisted: assisted, passed: Boolean(old?.passed || passed),
    completedAt: old?.completedAt || (passed ? at : null), lastAt: at,
    totalMinutes: (old?.totalMinutes || 0) + input.minutes,
    history: append(old?.history || [], { at, score: input.score, total: input.total, assisted, minutes: input.minutes, passed }, LIMITS.history),
  };
  lessonRecord(next, input.id);
  check(old || Object.keys(state.lessons).length < LIMITS.lessons, 'Lesson limit reached.');
  const newIds = passed ? [...new Set(chunkIds)].filter(key => !Object.hasOwn(state.cards, key)) : [];
  check(Object.keys(state.cards).length + newIds.length <= LIMITS.cards, 'Card limit reached.');
  state.lessons[input.id] = next;
  for (const key of newIds) state.cards[key] = { id: key, due: at, intervalDays: 0, reps: 0, lapses: 0, lastReviewed: null, addedAt: at };
  state.updatedAt = at;
  return state;
}

export function reviewCard(state, cardId, rating, now = new Date()) {
  id(cardId); check(Object.hasOwn(state.cards, cardId), 'Review card has not been learned.');
  check(['again', 'hard', 'good', 'easy'].includes(rating), 'Invalid review rating.');
  const at = date(now); const previous = state.cards[cardId];
  let reps = previous.reps, lapses = previous.lapses, intervalDays;
  if (rating === 'again') { reps = 0; lapses += 1; intervalDays = 10 / 1440; }
  else if (rating === 'hard') { reps = 1; intervalDays = 1; }
  else { reps += rating === 'easy' ? 2 : 1; intervalDays = INTERVALS[Math.min(reps - 1, INTERVALS.length - 1)]; }
  const next = { ...previous, reps, lapses, intervalDays, due: new Date(at.getTime() + intervalDays * DAY_MS).toISOString(), lastReviewed: at.toISOString() };
  cardRecord(next, cardId);
  state.cards[cardId] = next;
  state.reviews = append(state.reviews, { id: cardId, rating, at: at.toISOString(), intervalDays, due: next.due }, LIMITS.reviews);
  state.updatedAt = at.toISOString();
  return state;
}

export function recordPractice(state, input, now = new Date()) {
  shape(input, ['type', 'id', 'minutes', 'text', 'ratings', 'score', 'total', 'assisted'], ['type', 'id', 'minutes'], 'Practice input');
  if (Object.hasOwn(input, 'ratings')) ratings(input.ratings);
  const entry = { ...input, ...(input.ratings !== undefined ? { ratings: { ...input.ratings } } : {}), at: date(now).toISOString() };
  practiceRecord(entry);
  state.practice = append(state.practice, entry, LIMITS.practice); state.updatedAt = entry.at;
  return state;
}
export function recordBaseline(state, input, now = new Date()) {
  shape(input, ['score', 'total', 'answers', 'writing', 'note'], ['score', 'total'], 'Baseline input');
  const entry = { ...input, at: date(now).toISOString() };
  baselineRecord(entry);
  if (input.answers !== undefined) entry.answers = [...input.answers];
  state.baseline = append(state.baseline, entry, LIMITS.baseline); state.updatedAt = entry.at;
  return state;
}
export function saveDraft(state, draftId, value, now = new Date()) {
  id(draftId); text(value, 'Draft text');
  check(Object.hasOwn(state.drafts, draftId) || Object.keys(state.drafts).length < LIMITS.drafts, 'Draft limit reached.');
  const at = date(now).toISOString();
  state.drafts[draftId] = { text: value, updatedAt: at }; state.updatedAt = at;
  return state;
}

export function getDailyPlan(state, lessons, now = new Date()) {
  list(lessons, 'Lesson catalog', LIMITS.lessons);
  const budget = state.profile.dailyMinutes; number(budget, 'Daily budget', 15, 120, true);
  const due = dueCards(state, now);
  // Focus changes recommendation order only. Lessons keep their order within
  // each preferred track, and all remaining tracks remain available afterward.
  const priorities = {
    research: ['stance', 'precision', 'flow'],
    conversation: ['interaction', 'story', 'register'],
    writing: ['precision', 'flow', 'register'],
    balanced: [],
  }[state.profile.focus];
  check(priorities !== undefined, 'Unknown learning focus.');
  const rank = lesson => { const index = priorities.indexOf(lesson.track); return index < 0 ? priorities.length : index; };
  const ordered = priorities.length ? lessons.map((lesson, index) => ({ lesson, index }))
    .sort((a, b) => rank(a.lesson) - rank(b.lesson) || a.index - b.index).map(entry => entry.lesson) : lessons;
  const nextLesson = ordered.find(lesson => !Object.hasOwn(state.lessons, lesson.id) || !state.lessons[lesson.id].passed) || null;
  const reviewMinutes = due.length ? Math.round(budget * 0.3) : 0;
  const lessonMinutes = nextLesson ? Math.round((budget - reviewMinutes) * 0.6) : 0;
  return { budget, reviewMinutes, lessonMinutes, outputMinutes: budget - reviewMinutes - lessonMinutes, due, nextLesson };
}
