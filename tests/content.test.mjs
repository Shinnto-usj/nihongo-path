import test from 'node:test';
import assert from 'node:assert/strict';
import { course } from '../content/course.js';
import { validateCourse } from '../scripts/validate-content.mjs';
import { checkAnswer, defaultState, recordLesson, reviewCard, exportState, importState } from '../lib/engine.js';

const NOW = new Date('2026-10-24T04:00:00.000Z');

function expectRejected(mutator, expectedError) {
  const candidate = structuredClone(course);
  mutator(candidate);
  const report = validateCourse(candidate);
  assert.equal(report.ok, false, 'A broken course must not pass publication checks');
  assert(report.errors.some(error => expectedError.test(error)), JSON.stringify(report.errors));
}

test('shipped content meets coverage and navigation contracts', () => {
  const report = validateCourse(course);
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.warnings.length, 0, report.warnings.join('\n'));
  assert(report.stats.lessons >= 24);
  assert(report.stats.questions >= 120);
  assert(report.stats.scenarios >= 8);
  for (const level of ['foundation', 'N5', 'N4', 'N3', 'N2', 'N1']) assert(report.stats.levels[level] > 0);
});

test('every shipped question can be answered correctly and cannot pass on an unrelated answer', () => {
  for (const lesson of course.lessons) {
    for (const question of lesson.questions) {
      assert.equal(checkAnswer(question, question.answer), true, question.id);
      assert.equal(checkAnswer(question, 'THIS_IS_NOT_AN_ANSWER_73913'), false, question.id);
      if (question.accepted) {
        for (const answer of question.accepted) assert.equal(checkAnswer(question, answer), true, `${question.id}: ${answer}`);
      }
      if (question.choices) {
        for (const wrong of question.choices.filter(choice => choice.id !== question.answer)) {
          assert.equal(checkAnswer(question, wrong.id), false, `${question.id}: wrong choice ${wrong.id}`);
        }
        const reordered = { ...question, choices: [...question.choices].reverse() };
        assert.equal(checkAnswer(reordered, question.answer), true, 'Shuffling displayed choices cannot change grading');
      }
    }
  }
});

test('first-day lesson produces real state, passes only on success, and survives a backup roundtrip', () => {
  const lesson = [...course.lessons].sort((a, b) => a.order - b.order)[0];
  assert.equal(lesson.level, 'foundation');
  let state = recordLesson(defaultState(NOW), {
    lessonId: lesson.id, correct: 0, total: lesson.questions.length, seconds: 40,
  }, NOW);
  assert.equal(state.lessons[lesson.id].completedAt, null);
  const correct = lesson.questions.filter(question => checkAnswer(question, question.answer)).length;
  state = recordLesson(state, { lessonId: lesson.id, correct, total: lesson.questions.length, seconds: 75 }, NOW);
  for (const vocab of lesson.vocab) state = reviewCard(state, vocab.id, 'good', NOW);
  const restored = importState(exportState(state));
  assert.equal(restored.lessons[lesson.id].bestScore, 100);
  assert.equal(restored.lessons[lesson.id].attempts, 2);
  assert.equal(restored.daily['2026-10-24'].seconds, 115);
  assert.deepEqual(restored.daily['2026-10-24'].lessons, [lesson.id]);
  assert.equal(Object.keys(restored.cards).length, lesson.vocab.length);
});

test('listening questions keep their transcript out of the always-visible Japanese field', () => {
  const listening = course.lessons.flatMap(lesson => lesson.questions).filter(question => question.type === 'listen');
  assert(listening.length > 0);
  for (const question of listening) {
    assert(question.audio.trim().length > 0, question.id);
    assert(!question.jp, `${question.id}: audio transcript would be exposed before the answer`);
    assert(!question.prompt.includes(question.audio), `${question.id}: prompt reveals the transcript`);
  }
});

test('every daily-life scenario has a successful route using good responses', () => {
  for (const scenario of course.scenarios) {
    const byId = new Map(scenario.nodes.map(node => [node.id, node]));
    const visited = new Set();
    const queue = ['start'];
    let finished = false;
    while (queue.length) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      const node = byId.get(id);
      assert(node, `${scenario.id}: invalid node ${id}`);
      if (node.end) { finished = true; break; }
      for (const option of node.options.filter(item => item.quality === 'good')) queue.push(option.next);
    }
    assert(finished, `${scenario.id}: a learner cannot finish using appropriate responses`);
    assert(scenario.nodes.some(node => node.options?.some(option => option.quality === 'retry')),
      `${scenario.id}: needs feedback on an unsuitable response`);
  }
});

test('validator blocks unanswerable choices, duplicate choices, and duplicate question ids', () => {
  expectRejected(candidate => { candidate.lessons[0].questions[0].answer = 'missing-choice'; }, /answer is not/u);
  expectRejected(candidate => {
    const q = candidate.lessons[0].questions[0];
    q.choices[1].id = q.choices[0].id;
  }, /duplicate id/u);
  expectRejected(candidate => {
    const q = candidate.lessons[0].questions[0];
    q.choices[1].text = q.choices[0].text;
  }, /duplicate choice text/u);
  expectRejected(candidate => { candidate.lessons[1].questions[0].id = candidate.lessons[0].questions[0].id; }, /duplicate id/u);
});

test('validator blocks blank listening audio and unusable input alternatives', () => {
  expectRejected(candidate => {
    candidate.lessons.flatMap(lesson => lesson.questions).find(question => question.type === 'listen').audio = '';
  }, /listening needs/u);
  expectRejected(candidate => {
    candidate.lessons.flatMap(lesson => lesson.questions).find(question => question.type === 'input').accepted = [null];
  }, /accepted answers/u);
});

test('validator catches broken scenario branches, trapped loops, and invalid qualities', () => {
  expectRejected(candidate => { candidate.scenarios[0].nodes[0].options[0].next = 'nonexistent'; }, /unknown next node/u);
  expectRejected(candidate => { candidate.scenarios[0].nodes[0].options[0].quality = 'maybe'; }, /quality must/u);
  expectRejected(candidate => {
    for (const node of candidate.scenarios[0].nodes) {
      for (const option of node.options || []) option.next = 'start';
    }
  }, /no ending is reachable|has no path/u);
  expectRejected(candidate => { candidate.scenarios[0].nodes[0].id = 'renamed-start'; }, /missing start node/u);
});

test('validator rejects resource schemes, domain lookalikes, and display labels used as machine levels', () => {
  expectRejected(candidate => { candidate.resources[0].url = 'http://www.jlpt.jp/e/'; }, /HTTPS/u);
  expectRejected(candidate => { candidate.resources[0].url = 'https://jlpt.jp.evil.invalid/'; }, /official provider domain/u);
  expectRejected(candidate => { candidate.resources[0].url = 'javascript:alert(1)'; }, /HTTPS/u);
  expectRejected(candidate => { candidate.resources[0].level = 'N5—N1'; }, /level mapping/u);
});

test('vocabulary ids may be reused for the same item, but cannot silently change their Japanese reading', () => {
  const candidate = structuredClone(course);
  candidate.lessons[1].vocab[0] = { ...candidate.lessons[0].vocab[0] };
  assert.equal(validateCourse(candidate).ok, true);
  candidate.lessons[1].vocab[0].kana = 'まったくべつ';
  assert(validateCourse(candidate).errors.some(error => /reused id changes/u.test(error)));
});

test('validator refuses reduced coverage and milestones that point at missing resources', () => {
  expectRejected(candidate => { candidate.lessons = candidate.lessons.filter(lesson => lesson.level !== 'N1'); }, /Missing lesson coverage for N1/u);
  expectRejected(candidate => { candidate.milestones[0].resourceIds.push('missing-official-resource'); }, /missing resource/u);
  expectRejected(candidate => { candidate.milestones[0].fraction = 2; }, /invalid or unordered milestone fraction/u);
});
