/**
 * Nihongo Path learning state, version 1.
 *
 * All mutators return a new state. reviewCard changes scheduling only;
 * recordLesson also records its real active seconds and answers in daily stats.
 * The review schedule is a small, transparent interval system, not FSRS and not
 * an estimate of JLPT proficiency. A passed micro-lesson is not a level exam.
 */
export const STORAGE_KEY = 'nihongo-path:v1';

const DAY_MS = 86_400_000;
const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60, 90];
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_IMPORT_CHARS = 5_000_000;
const DEFAULT_TIME_ZONE = 'Asia/Singapore';

function asDate(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('日期无效。');
  return date;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function assertObject(value, name, maxKeys = 20_000) {
  assert(isObject(value), `${name}应为对象。`);
  const keys = Object.keys(value);
  assert(keys.length <= maxKeys, `${name}条目过多。`);
  assert(keys.every(key => !FORBIDDEN_KEYS.has(key)), `${name}包含不安全的键名。`);
}

function assertString(value, name, max = 500, allowEmpty = true) {
  assert(typeof value === 'string' && value.length <= max
    && (allowEmpty || value.trim().length > 0), `${name}无效。`);
}

function assertId(value) {
  assertString(value, '记录编号', 160, false);
  assert(!FORBIDDEN_KEYS.has(value) && !/[\u0000-\u001f\u007f]/u.test(value), '记录编号无效。');
}

function assertNumber(value, name, min = 0, max = 1_000_000, integer = false) {
  assert(typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
    && (!integer || Number.isInteger(value)), `${name}应在 ${min}–${max} 范围内。`);
}

function validDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function assertIso(value, name) {
  assert(typeof value === 'string', `${name}无效。`);
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/u.exec(value);
  assert(match !== null, `${name}应为 UTC 时间。`);
  const date = new Date(value);
  assert(Number.isFinite(date.getTime())
    && date.toISOString() === `${match[1]}.${(match[2] || '').padEnd(3, '0')}Z`, `${name}无效。`);
}

function validateJsonValue(value, depth = 0) {
  assert(depth <= 8, '记录嵌套过深。');
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    assert(Number.isFinite(value), '记录包含无效数字。');
    return;
  }
  if (typeof value === 'string') {
    assert(value.length <= 20_000, '记录文本过长。');
    return;
  }
  if (Array.isArray(value)) {
    assert(value.length <= 1_000, '记录数组过长。');
    value.forEach(item => validateJsonValue(item, depth + 1));
    return;
  }
  assertObject(value, '记录', 100);
  Object.values(value).forEach(item => validateJsonValue(item, depth + 1));
}

function validateAssessmentFields(assessment) {
  validateJsonValue(assessment);
  // These are the app's raw percentage fields, never JLPT scaled scores.
  for (const key of ['knowledge', 'reading', 'listening']) {
    if (assessment[key] !== undefined) assertNumber(assessment[key], `测评 ${key}`, 0, 100);
  }
  for (const key of ['correct', 'total']) {
    if (assessment[key] !== undefined) assertNumber(assessment[key], `测评 ${key}`, 0, 1_000_000, true);
  }
  if (assessment.correct !== undefined && assessment.total !== undefined) {
    assert(assessment.correct <= assessment.total, '测评答对数不能大于题目总数。');
  }
  if (assessment.seconds !== undefined) assertNumber(assessment.seconds, '测评秒数', 0, 86_400);
  if (assessment.date !== undefined) assert(validDateKey(assessment.date), '测评日期无效。');
  for (const key of ['timed', 'unseen']) {
    if (assessment[key] !== undefined) assert(typeof assessment[key] === 'boolean', `测评 ${key} 应为是或否。`);
  }
}

function validateState(value) {
  assertObject(value, '学习记录', 30);
  assert(value.schemaVersion === 1, '不支持这个学习记录版本，请导入本应用导出的 v1 文件。');
  assertIso(value.createdAt, '创建时间');
  assertObject(value.profile, '学习设置', 30);
  const profile = value.profile;
  assert(profile.targetDate === '' || validDateKey(profile.targetDate), '目标日期无效。');
  assertNumber(profile.dailyMinutes, '每日学习分钟数', 5, 720, true);
  assertString(profile.city, '旅居城市', 100);
  assert(profile.departureDate === '' || validDateKey(profile.departureDate), '出发日期无效。');
  assert(typeof profile.showRomaji === 'boolean', '罗马音设置无效。');
  assertNumber(profile.speechRate, '朗读速度', 0.4, 1.5);
  assertString(profile.timeZone, '时区', 100, false);
  try { new Intl.DateTimeFormat('en', { timeZone: profile.timeZone }); }
  catch { throw new Error('时区无效。'); }
  // Reject unsafe nested data even in optional application extensions.
  validateJsonValue(profile);

  assertObject(value.cards, '复习卡片');
  for (const [id, card] of Object.entries(value.cards)) {
    assertId(id);
    assertObject(card, '复习卡片', 20);
    assertIso(card.due, '下次复习时间');
    assertIso(card.lastReviewed, '上次复习时间');
    assertNumber(card.intervalDays, '复习间隔', 0, 3650);
    assertNumber(card.reps, '复习次数', 0, 1_000_000, true);
    assertNumber(card.lapses, '遗忘次数', 0, 1_000_000, true);
    validateJsonValue(card);
  }
  assertObject(value.lessons, '课程进度', 10_000);
  for (const [id, lesson] of Object.entries(value.lessons)) {
    assertId(id);
    assertObject(lesson, '课程进度', 20);
    assertNumber(lesson.attempts, '练习次数', 1, 1_000_000, true);
    assertNumber(lesson.bestScore, '最高正确率', 0, 100);
    assertNumber(lesson.lastScore, '最近正确率', 0, 100);
    assert(lesson.bestScore >= lesson.lastScore, '最高正确率不能低于最近正确率。');
    assertIso(lesson.lastAttemptAt, '最近练习时间');
    if (lesson.completedAt !== null) {
      assertIso(lesson.completedAt, '课程完成时间');
      assert(lesson.bestScore >= 80, '完成课程至少需达到 80% 正确率。');
    }
    validateJsonValue(lesson);
  }
  assertObject(value.daily, '每日记录', 10_000);
  for (const [date, activity] of Object.entries(value.daily)) {
    assert(validDateKey(date), '每日记录的日期无效。');
    assertObject(activity, '每日记录', 20);
    assertNumber(activity.seconds, '每日学习秒数', 0, 86_400);
    for (const key of ['answered', 'correct', 'reviewed']) {
      assertNumber(activity[key], `每日 ${key}`, 0, 1_000_000, true);
    }
    assert(activity.correct <= activity.answered, '答对数不能大于答题数。');
    for (const key of ['lessons', 'scenarios']) {
      assert(Array.isArray(activity[key]) && activity[key].length <= 10_000, `每日 ${key} 无效。`);
      activity[key].forEach(assertId);
      assert(new Set(activity[key]).size === activity[key].length, `每日 ${key} 包含重复编号。`);
    }
    validateJsonValue(activity);
  }
  assertObject(value.scenarioCompletions, '情境进度', 10_000);
  for (const [id, at] of Object.entries(value.scenarioCompletions)) {
    assertId(id);
    assertIso(at, '情境完成时间');
  }
  assert(Array.isArray(value.assessments) && value.assessments.length <= 5_000, '测评记录无效。');
  for (const assessment of value.assessments) {
    assertObject(assessment, '测评记录', 100);
    validateAssessmentFields(assessment);
    assertId(assessment.id);
    assertIso(assessment.recordedAt, '测评记录时间');
  }
  // Never propagate unsupported values or unsafe keys through a backup.
  for (const [key, extension] of Object.entries(value)) {
    if (!['schemaVersion', 'createdAt', 'profile', 'cards', 'lessons', 'daily', 'assessments', 'scenarioCompletions'].includes(key)) {
      validateJsonValue(extension);
    }
  }
  return value;
}

export function defaultState(now = new Date()) {
  return {
    schemaVersion: 1,
    createdAt: asDate(now).toISOString(),
    profile: {
      targetDate: '', dailyMinutes: 30, city: '', departureDate: '',
      showRomaji: true, speechRate: 0.85, timeZone: DEFAULT_TIME_ZONE,
    },
    cards: {}, lessons: {}, daily: {}, assessments: [], scenarioCompletions: {},
  };
}

/** Returns a fresh state on a failed read without deleting the saved backup. */
export function loadState(storage) {
  loadState.lastError = null;
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    if (!target || typeof target.getItem !== 'function') throw new Error('浏览器无法读取本地学习记录。');
    const raw = target.getItem(STORAGE_KEY);
    return raw === null ? defaultState() : importState(raw);
  } catch (error) {
    loadState.lastError = error instanceof Error ? error.message : '无法读取学习记录。';
    return defaultState();
  }
}
loadState.lastError = null;

/** Returns false on unavailable/quota-exceeded storage; callers should warn. */
export function saveState(state, storage) {
  saveState.lastError = null;
  try {
    const text = exportState(state);
    const target = storage === undefined ? globalThis.localStorage : storage;
    if (!target || typeof target.setItem !== 'function') throw new Error('浏览器无法保存本地学习记录。');
    target.setItem(STORAGE_KEY, text);
    return true;
  } catch (error) {
    saveState.lastError = error instanceof Error ? error.message : '无法保存学习记录。';
    return false;
  }
}
saveState.lastError = null;

export function localDate(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(asDate(date));
  const byType = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

/** Civil-day difference, including negative values after the target date. */
export function daysUntil(targetDate, now = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  assert(validDateKey(targetDate), '目标日期无效。');
  return Math.round((Date.parse(`${targetDate}T00:00:00.000Z`)
    - Date.parse(`${localDate(now, timeZone)}T00:00:00.000Z`)) / DAY_MS);
}

function shiftDate(date, amount) {
  return new Date(Date.parse(`${date}T00:00:00.000Z`) + amount * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Place a review checkpoint within the learner's chosen calendar window.
 * The interval uses civil dates in their timezone and rounds to the nearest day.
 * A checkpoint is a planning date, never an inference about language ability.
 */
export function getMilestoneDate(state, milestone) {
  const fraction = milestone?.fraction;
  assert(typeof fraction === 'number' && Number.isFinite(fraction)
    && fraction > 0 && fraction <= 1, '复盘阶段比例应大于 0 且不超过 1。');
  const target = state.profile.targetDate;
  if (target === '') return null;
  assert(validDateKey(target), '目标日期无效。');
  const start = localDate(state.createdAt, state.profile.timeZone);
  const days = Math.round((Date.parse(`${target}T00:00:00.000Z`)
    - Date.parse(`${start}T00:00:00.000Z`)) / DAY_MS);
  if (days <= 0 || fraction === 1) return target;
  return shiftDate(start, Math.round(days * fraction));
}

function hasActivity(day) {
  return Boolean(day && (day.seconds > 0 || day.answered > 0 || day.reviewed > 0
    || day.lessons.length > 0 || day.scenarios.length > 0));
}

/** A streak survives until the end of today when the last practice was yesterday. */
export function getStreak(state, now = new Date()) {
  let cursor = localDate(now, state.profile.timeZone);
  if (!hasActivity(state.daily[cursor])) cursor = shiftDate(cursor, -1);
  let streak = 0;
  while (hasActivity(state.daily[cursor])) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

export function dueCards(state, cardCatalog, now = new Date()) {
  const at = asDate(now).getTime();
  assert(Array.isArray(cardCatalog), '卡片目录应为数组。');
  const seen = new Set();
  return cardCatalog.filter(card => {
    if (!card || typeof card.id !== 'string' || seen.has(card.id)) return false;
    seen.add(card.id);
    const srs = state.cards[card.id];
    return Boolean(srs && Date.parse(srs.due) <= at);
  }).map(card => {
    const srs = state.cards[card.id];
    // Imported scheduling metadata cannot replace a trusted catalog id/text.
    return { ...card, due: srs.due, intervalDays: srs.intervalDays, reps: srs.reps,
      lapses: srs.lapses, lastReviewed: srs.lastReviewed, srs: { ...srs } };
  })
    .sort((a, b) => Date.parse(a.due) - Date.parse(b.due) || a.id.localeCompare(b.id));
}

export function reviewCard(state, cardId, grade, now = new Date()) {
  assertId(cardId);
  assert(['again', 'hard', 'good', 'easy'].includes(grade), '复习评价无效。');
  const at = asDate(now);
  const previous = state.cards[cardId] || { reps: 0, lapses: 0, intervalDays: 0 };
  let reps = previous.reps;
  let lapses = previous.lapses;
  let intervalDays;
  if (grade === 'again') {
    intervalDays = 10 / 1440;
    reps = 0;
    lapses += 1;
  } else if (grade === 'hard') {
    intervalDays = 1;
    // Restart at the first day-long rung: an uncertain answer must not jump
    // directly back to a long interval on the very next review.
    reps = 1;
  } else {
    reps = previous.reps + (grade === 'easy' ? 2 : 1);
    intervalDays = REVIEW_INTERVALS[Math.min(reps - 1, REVIEW_INTERVALS.length - 1)];
  }
  return {
    ...state,
    cards: {
      ...state.cards,
      [cardId]: { due: new Date(at.getTime() + intervalDays * DAY_MS).toISOString(),
        intervalDays, reps, lapses, lastReviewed: at.toISOString() },
    },
  };
}

function emptyDay() {
  return { seconds: 0, answered: 0, correct: 0, reviewed: 0, lessons: [], scenarios: [] };
}

export function recordActivity(state, activity = {}, now = new Date()) {
  const { seconds = 0, answered = 0, correct = 0, reviewed = 0, scenarioId, lessonId } = activity;
  assertNumber(seconds, '实际学习秒数', 0, 86_400);
  for (const [label, value] of [['答题数', answered], ['答对数', correct], ['复习数', reviewed]]) {
    assertNumber(value, label, 0, 1_000_000, true);
  }
  assert(correct <= answered, '答对数不能大于答题数。');
  if (scenarioId !== undefined) assertId(scenarioId);
  if (lessonId !== undefined) assertId(lessonId);
  const at = asDate(now);
  const date = localDate(at, state.profile.timeZone);
  const previous = state.daily[date] || emptyDay();
  const day = {
    seconds: Math.min(86_400, previous.seconds + seconds),
    answered: previous.answered + answered,
    correct: previous.correct + correct,
    reviewed: previous.reviewed + reviewed,
    lessons: lessonId ? [...new Set([...previous.lessons, lessonId])] : [...previous.lessons],
    scenarios: scenarioId ? [...new Set([...previous.scenarios, scenarioId])] : [...previous.scenarios],
  };
  return {
    ...state,
    daily: { ...state.daily, [date]: day },
    scenarioCompletions: scenarioId
      ? { ...state.scenarioCompletions, [scenarioId]: at.toISOString() } : state.scenarioCompletions,
  };
}

/** Records the whole attempt once; scores are percentages in [0,100]. */
export function recordLesson(state, { lessonId, correct, total, seconds = 0 }, now = new Date()) {
  assertId(lessonId);
  assertNumber(total, '题目总数', 1, 10_000, true);
  assertNumber(correct, '答对数', 0, total, true);
  const at = asDate(now);
  const score = correct / total * 100;
  const previous = state.lessons[lessonId];
  const completedAt = previous?.completedAt || (score >= 80 ? at.toISOString() : null);
  const next = recordActivity(state, {
    seconds, answered: total, correct,
    ...(score >= 80 ? { lessonId } : {}),
  }, at);
  return {
    ...next,
    lessons: {
      ...state.lessons,
      [lessonId]: {
        attempts: (previous?.attempts || 0) + 1,
        bestScore: Math.max(previous?.bestScore || 0, score),
        lastScore: score,
        completedAt,
        lastAttemptAt: at.toISOString(),
      },
    },
  };
}

export function recordAssessment(state, result, now = new Date()) {
  assertObject(result, '测评记录', 98);
  validateAssessmentFields(result);
  const at = asDate(now);
  const id = result.id || `assessment-${at.getTime()}-${state.assessments.length + 1}`;
  assertId(id);
  const record = JSON.parse(JSON.stringify({ ...result, id, recordedAt: at.toISOString() }));
  return { ...state, assessments: [...state.assessments, record] };
}

function allocateMinutes(total, weights) {
  const weightSum = weights.reduce((sum, n) => sum + n, 0);
  const exact = weights.map(weight => total * weight / weightSum);
  const minutes = exact.map(Math.floor);
  const order = exact.map((value, index) => ({ index, fraction: value - minutes[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  const remainder = total - minutes.reduce((sum, n) => sum + n, 0);
  for (let i = 0; i < remainder; i += 1) minutes[order[i].index] += 1;
  return minutes;
}

/** The next lesson comes from passed work, never from the calendar alone. */
export function getDailyPlan(state, course, now = new Date()) {
  const at = asDate(now);
  const date = localDate(at, state.profile.timeZone);
  const lessons = [...(course?.lessons || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  const newLesson = lessons.find(lesson => !state.lessons[lesson.id]?.completedAt) || null;
  const nextLesson = newLesson ? lessons.find(lesson => lesson !== newLesson
    && (lesson.order || 0) > (newLesson.order || 0) && !state.lessons[lesson.id]?.completedAt) || null : null;
  const phase = newLesson?.level || 'consolidation';
  const dueCount = Object.values(state.cards).filter(card => Date.parse(card.due) <= at.getTime()).length;
  const targetDays = state.profile.targetDate === '' ? null
    : daysUntil(state.profile.targetDate, at, state.profile.timeZone);
  const minutes = allocateMinutes(state.profile.dailyMinutes,
    dueCount > 40 ? [30, 20, 25, 15, 10] : [20, 25, 25, 20, 10]);
  const foundation = phase === 'foundation';
  const blocks = [
    { id: 'review', title: dueCount ? `复习 ${dueCount} 张到期卡片` : '回想昨天学过的内容', kind: 'review',
      detail: dueCount ? '先主动回忆，再看答案；忘记的卡片会在 10 分钟后再次到期。'
        : '还没有到期卡片。先从课程学习，按真实回忆情况把新内容加入复习。' },
    { id: 'lesson', title: newLesson ? newLesson.title : '使用完整教材继续深化', kind: 'lesson',
      detail: newLesson ? (newLesson.canDo || newLesson.subtitle || '理解例句后作答，正确率达到 80% 记录为本课通过。')
        : '应用内微课已练完。继续完成官方资源和完整阅读、听力任务，再记录实际结果。' },
    { id: 'listening', title: foundation ? '听音与跟读' : '听力精听与复述', kind: 'listen',
      detail: foundation ? '先听假名和短句，再看文字；跟读只作自我练习，不自动判定发音。'
        : '选当前阶段的完整听力材料：首遍不看文本，核对后再精听与复述。' },
    { id: 'reading', title: foundation ? '假名与短句识读' : '阅读与词句整理', kind: 'reading',
      detail: foundation ? '优先读平假名和片假名，逐步关闭罗马音。'
        : '读当前阶段的完整短文，标出主旨、指代和转折，再核对证据。' },
    { id: 'speaking', title: '旅居情境开口练习', kind: 'speaking',
      detail: state.profile.city ? `围绕在${state.profile.city}生活的真实需求，完成一个情境，并大声说出自己的回应。`
        : '在点餐、问路、住宿等情境中说出回应；场景成绩与 JLPT 等级分开记录。' },
  ].map((block, index) => ({ ...block, minutes: minutes[index] }));
  let warning = '这是冲刺计划，不是达标保证；微课通过率不能换算为 JLPT 分数。每周用完整材料核验阅读与听力。';
  if (targetDays === null) warning = '可以在学习设置中填写目标日期，系统会据此安排复盘检查点；现在仍可按每日预算练习。';
  else if (targetDays < 0) warning = '目标日期已过。请根据真实测评结果调整目标日期或下一阶段任务。';
  else if (state.profile.dailyMinutes < 120) warning = '当前每日时间较紧。先稳定练习并做周测，再据实调整 N1 目标或投入；系统不会自动判定按期达标。';
  if (!newLesson && lessons.length) {
    warning = '应用内微课已完成，但尚不能据此判定达到 N1；请继续完整教材和独立限时测评。';
    if (targetDays === null) warning += ' 如需安排复盘日期，可在学习设置中填写目标日期。';
  }
  return { date, dueCount, newLesson, nextLesson, blocks, warning, phase, targetDays };
}

export function importState(text) {
  assert(typeof text === 'string' && text.length <= MAX_IMPORT_CHARS, '备份文件过大或不是文本。');
  let parsed;
  try { parsed = JSON.parse(text); }
  catch { throw new Error('备份不是有效的 JSON 文件。'); }
  return validateState(parsed);
}

export function exportState(state) {
  validateState(state);
  return JSON.stringify(state, null, 2);
}

/** Normalize typography only. We never infer meaning or waive missing words. */
export function normalizeAnswer(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('en-US')
    .trim().replace(/[\s\u3000]+/gu, '')
    .replace(/[、。,.!！?？「」『』“”"'‘’・:：;；]/gu, '');
}

export function checkAnswer(question, value) {
  if (!question || typeof question.answer !== 'string') return false;
  if (Array.isArray(question.choices) && question.choices.length > 0) {
    // Choice identifiers are exact, even if their rendered text contains punctuation.
    return typeof value === 'string' && value === question.answer;
  }
  const normalized = normalizeAnswer(value);
  if (!normalized) return false;
  return [question.answer, ...(Array.isArray(question.accepted) ? question.accepted : [])]
    .filter(answer => typeof answer === 'string' && normalizeAnswer(answer))
    .some(answer => normalizeAnswer(answer) === normalized);
}
