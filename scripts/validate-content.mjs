import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LEVELS = ['foundation', 'N5', 'N4', 'N3', 'N2', 'N1'];
const OFFICIAL_DOMAINS = ['jlpt.jp', 'jees-jlpt.jp', 'jpf.go.jp', 'jpfbj.cn', 'nhk.or.jp', 'nhk.jp', 'minato-jf.jp', 'marugotoweb.jp'];
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const array = value => Array.isArray(value) ? value : [];
const normalized = value => String(value).normalize('NFKC').trim().toLowerCase().replace(/\s+/gu, ' ');


/** Validate the published learning contract and navigable exercises.
 * Warnings are editorial review requests; errors block a build.
 * This checks structure and reachability, not Japanese pedagogical correctness.
 */
export function validateCourse(course) {
  const errors = [];
  const warnings = [];
  const require = (condition, message) => { if (!condition) errors.push(message); };
  const unique = (value, seen, label) => {
    require(nonempty(value), `${label}: missing id`);
    if (!nonempty(value)) return;
    require(!seen.has(value), `${label}: duplicate id ${value}`);
    seen.add(value);
  };
  if (!course || typeof course !== 'object') {
    return { ok: false, errors: ['course must be an object'], warnings, stats: {} };
  }
  const lessons = array(course.lessons);
  const scenarios = array(course.scenarios);
  const resources = array(course.resources);
  const milestones = array(course.milestones);
  require(Array.isArray(course.lessons), 'course.lessons must be an array');
  require(Array.isArray(course.scenarios), 'course.scenarios must be an array');
  require(Array.isArray(course.resources), 'course.resources must be an array');
  require(Array.isArray(course.milestones), 'course.milestones must be an array');
  require(lessons.length >= 24, 'At least 24 original micro-lessons are required');
  require(scenarios.length >= 8, 'At least 8 daily-life scenarios are required');
  require(resources.length > 0, 'At least one primary learning resource is required');
  const lessonIds = new Set();
  const questionIds = new Set();
  const orders = new Set();
  const vocabById = new Map();
  const counts = Object.fromEntries(LEVELS.map(level => [level, 0]));
  let questionCount = 0;
  let listeningCount = 0;
  for (const lesson of lessons) {
    const label = `lesson ${lesson?.id || '(unnamed)'}`;
    if (!lesson || typeof lesson !== 'object') { errors.push(`${label}: invalid object`); continue; }
    unique(lesson.id, lessonIds, label);
    require(LEVELS.includes(lesson.level), `${label}: invalid level`);
    if (LEVELS.includes(lesson.level)) counts[lesson.level] += 1;
    require(Number.isInteger(lesson.order) && lesson.order >= 1, `${label}: order must be a positive integer`);
    require(!orders.has(lesson.order), `${label}: duplicate order ${lesson.order}`);
    orders.add(lesson.order);
    for (const field of ['title', 'subtitle', 'canDo']) require(nonempty(lesson[field]), `${label}: missing ${field}`);
    require(Number.isFinite(lesson.minutes) && lesson.minutes > 0 && lesson.minutes <= 180, `${label}: invalid minutes`);
    require(Array.isArray(lesson.explanation) && lesson.explanation.length > 0
      && lesson.explanation.every(nonempty), `${label}: explanations must be nonempty strings`);
    require(Array.isArray(lesson.examples) && lesson.examples.length > 0, `${label}: at least one example is required`);
    for (const [index, example] of array(lesson.examples).entries()) {
      for (const field of ['jp', 'kana', 'zh']) require(nonempty(example?.[field]), `${label} example ${index + 1}: missing ${field}`);
      if (example?.romaji !== undefined) require(typeof example.romaji === 'string', `${label} example ${index + 1}: romaji must be text`);
    }
    require(Array.isArray(lesson.questions) && lesson.questions.length >= 5, `${label}: at least 5 questions are required`);
    for (const question of array(lesson.questions)) {
      questionCount += 1;
      const qLabel = `${label} question ${question?.id || '(unnamed)'}`;
      if (!question || typeof question !== 'object') { errors.push(`${qLabel}: invalid object`); continue; }
      unique(question.id, questionIds, qLabel);
      require(['choice', 'listen', 'input'].includes(question.type), `${qLabel}: invalid type`);
      for (const field of ['prompt', 'answer', 'explanation']) require(nonempty(question[field]), `${qLabel}: missing ${field}`);
      if (question.type === 'listen') {
        listeningCount += 1;
        require(nonempty(question.audio), `${qLabel}: listening needs nonempty audio text`);
      }
      if (question.choices !== undefined) {
        require(Array.isArray(question.choices) && question.choices.length >= 2, `${qLabel}: choices need at least two options`);
        const ids = new Set();
        const texts = new Set();
        for (const choice of array(question.choices)) {
          unique(choice?.id, ids, `${qLabel} choice`);
          require(nonempty(choice?.text), `${qLabel}: empty choice text`);
          const text = normalized(choice?.text || '');
          require(!texts.has(text), `${qLabel}: duplicate choice text ${text}`);
          texts.add(text);
        }
        require(ids.has(question.answer), `${qLabel}: answer is not one of the choice ids`);
      } else {
        require(question.type === 'input' || question.type === 'listen', `${qLabel}: choice question has no choices`);
      }
      if (question.accepted !== undefined) {
        require(Array.isArray(question.accepted) && question.accepted.every(nonempty), `${qLabel}: accepted answers must be nonempty strings`);
      }
    }
    require(Array.isArray(lesson.vocab) && lesson.vocab.length > 0, `${label}: vocabulary is required`);
    const perLessonVocabIds = new Set();
    for (const vocab of array(lesson.vocab)) {
      const vLabel = `${label} vocabulary ${vocab?.id || '(unnamed)'}`;
      if (!vocab || typeof vocab !== 'object') { errors.push(`${vLabel}: invalid object`); continue; }
      unique(vocab.id, perLessonVocabIds, vLabel);
      for (const field of ['jp', 'kana', 'zh']) require(nonempty(vocab[field]), `${vLabel}: missing ${field}`);
      require(typeof vocab.romaji === 'string', `${vLabel}: romaji must be a string (empty is allowed for advanced content)`);
      const previous = vocabById.get(vocab.id);
      if (previous) {
        require(previous.jp === vocab.jp && previous.kana === vocab.kana,
          `${vLabel}: reused id changes the Japanese word or reading`);
        if (previous.zh !== vocab.zh || previous.romaji !== vocab.romaji) {
          warnings.push(`${vLabel}: reused id has a different gloss or romaji; the last catalog entry is displayed`);
        }
      } else vocabById.set(vocab.id, vocab);
    }
  }
  for (const level of LEVELS) require(counts[level] > 0, `Missing lesson coverage for ${level}`);
  require(listeningCount > 0, 'The course must include listening questions');

  const scenarioIds = new Set();
  let nodeCount = 0;
  for (const scenario of scenarios) {
    const label = `scenario ${scenario?.id || '(unnamed)'}`;
    if (!scenario || typeof scenario !== 'object') { errors.push(`${label}: invalid object`); continue; }
    unique(scenario.id, scenarioIds, label);
    for (const field of ['title', 'place', 'level', 'goal', 'intro']) require(nonempty(scenario[field]), `${label}: missing ${field}`);
    require(Array.isArray(scenario.nodes) && scenario.nodes.length >= 2, `${label}: needs a start and an ending`);
    const nodes = array(scenario.nodes);
    nodeCount += nodes.length;
    const nodeIds = new Set();
    for (const node of nodes) unique(node?.id, nodeIds, `${label} node`);
    const byId = new Map(nodes.filter(node => node && typeof node === 'object').map(node => [node.id, node]));
    require(byId.has('start'), `${label}: missing start node`);
    const endingIds = new Set(nodes.filter(node => node?.end === true).map(node => node.id));
    require(endingIds.size > 0, `${label}: missing terminal end node`);
    for (const node of nodes) {
      const nLabel = `${label} node ${node?.id || '(unnamed)'}`;
      if (!node || typeof node !== 'object') { errors.push(`${nLabel}: invalid object`); continue; }
      for (const field of ['speaker', 'jp', 'kana', 'zh']) require(nonempty(node[field]), `${nLabel}: missing ${field}`);
      if (node.romaji !== undefined) require(typeof node.romaji === 'string', `${nLabel}: romaji must be text`);
      if (node.end === true) {
        require(node.options === undefined || (Array.isArray(node.options) && node.options.length === 0), `${nLabel}: end node cannot have outgoing options`);
      } else {
        require(Array.isArray(node.options) && node.options.length > 0, `${nLabel}: nonterminal node needs options`);
      }
      const optionIds = new Set();
      for (const option of array(node.options)) {
        const oLabel = `${nLabel} option ${option?.id || '(unnamed)'}`;
        if (!option || typeof option !== 'object') { errors.push(`${oLabel}: invalid object`); continue; }
        unique(option.id, optionIds, oLabel);
        for (const field of ['jp', 'kana', 'zh', 'feedback', 'next']) require(nonempty(option[field]), `${oLabel}: missing ${field}`);
        require(['good', 'retry'].includes(option.quality), `${oLabel}: quality must be good or retry`);
        require(byId.has(option.next), `${oLabel}: unknown next node ${option.next}`);
      }
    }
    const reachable = new Set();
    const queue = byId.has('start') ? ['start'] : [];
    while (queue.length) {
      const id = queue.shift();
      if (reachable.has(id) || !byId.has(id)) continue;
      reachable.add(id);
      for (const option of array(byId.get(id).options)) if (byId.has(option?.next)) queue.push(option.next);
    }
    for (const id of byId.keys()) require(reachable.has(id), `${label}: unreachable node ${id}`);
    require([...endingIds].some(id => reachable.has(id)), `${label}: no ending is reachable from start`);
    const canEnd = new Set(endingIds);
    let changed = true;
    while (changed) {
      changed = false;
      for (const node of nodes) {
        if (node && !canEnd.has(node.id) && array(node.options).some(option => canEnd.has(option?.next))) {
          canEnd.add(node.id);
          changed = true;
        }
      }
    }
    for (const id of reachable) require(canEnd.has(id), `${label}: node ${id} has no path to an ending`);
  }

  const resourceIds = new Set();
  for (const resource of resources) {
    const label = `resource ${resource?.id || '(unnamed)'}`;
    if (!resource || typeof resource !== 'object') { errors.push(`${label}: invalid object`); continue; }
    unique(resource.id, resourceIds, label);
    for (const field of ['title', 'description', 'type']) require(nonempty(resource[field]), `${label}: missing ${field}`);
    const resourceLevels = Array.isArray(resource.level) ? resource.level : [resource.level];
    require(resourceLevels.length > 0 && resourceLevels.every(level => level === 'all' || LEVELS.includes(level)), `${label}: invalid level mapping`);
    try {
      const url = new URL(resource.url);
      require(url.protocol === 'https:', `${label}: resource must use HTTPS`);
      require(!url.username && !url.password, `${label}: resource URL must not contain credentials`);
      require(OFFICIAL_DOMAINS.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`)),
        `${label}: primary official provider domain required (${url.hostname})`);
    } catch { errors.push(`${label}: invalid URL`); }
  }

  const milestoneIds = new Set();
  let previousFraction = 0;
  for (const milestone of milestones) {
    const label = `milestone ${milestone?.id || '(unnamed)'}`;
    if (!milestone || typeof milestone !== 'object') { errors.push(`${label}: invalid object`); continue; }
    unique(milestone.id, milestoneIds, label);
    require(LEVELS.includes(milestone.level), `${label}: invalid level`);
    require(Number.isFinite(milestone.fraction) && milestone.fraction > previousFraction && milestone.fraction <= 1, `${label}: invalid or unordered milestone fraction`);
    previousFraction = milestone.fraction;
    require(nonempty(milestone.title) && nonempty(milestone.goal), `${label}: missing title or goal`);
    require(Array.isArray(milestone.checks) && milestone.checks.length > 0 && milestone.checks.every(nonempty), `${label}: substantive checks required`);
    require(Array.isArray(milestone.resourceIds), `${label}: resourceIds must be an array`);
    for (const id of array(milestone.resourceIds)) require(resourceIds.has(id), `${label}: missing resource ${id}`);
  }
  require(milestones.at(-1)?.fraction === 1, 'Final milestone must match the personal target date');
  for (const level of LEVELS) require(milestones.some(m => m?.level === level), `Missing milestone for ${level}`);

  return { ok: errors.length === 0, errors, warnings, stats: {
    lessons: lessons.length, questions: questionCount, listeningQuestions: listeningCount,
    vocabulary: vocabById.size, scenarios: scenarios.length, scenarioNodes: nodeCount,
    resources: resources.length, milestones: milestones.length, levels: counts,
  } };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const { course } = await import('../content/course.js');
    const result = validateCourse(course);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    console.error(`Content validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
