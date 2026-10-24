import test from 'node:test';
import assert from 'node:assert/strict';
import { tracks, lessons, diagnostic } from '../content/course.js';

const expectedTracks = ['precision', 'register', 'flow', 'stance', 'interaction', 'story'];
const present = value => typeof value === 'string' && value.trim().length > 0;
const normalized = value => value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
const allQuestions = [...lessons.flatMap(lesson => lesson.questions), ...diagnostic];

test('all six learning tracks exist exactly once and have reader-facing labels', () => {
  assert.deepEqual(tracks.map(track => track.id), expectedTracks);
  for (const track of tracks) {
    assert.ok(present(track.title), track.id);
    assert.ok(present(track.subtitle), track.id);
  }
});

test('the curriculum has four complete lessons per track with no broken track references', () => {
  assert.equal(lessons.length, 24);
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, lessons.length);
  for (const track of expectedTracks) {
    assert.equal(lessons.filter(lesson => lesson.track === track).length, 4, track);
  }
  for (const lesson of lessons) {
    assert.ok(expectedTracks.includes(lesson.track), lesson.id);
    for (const field of ['id', 'title', 'subtitle', 'objective', 'brief']) {
      assert.ok(present(lesson[field]), `${lesson.id}.${field}`);
    }
    assert.ok(Number.isFinite(lesson.minutes) && lesson.minutes > 0, lesson.id);
  }
});

test('the lesson bank contains 72 uniquely identified questions with three per lesson', () => {
  const questions = lessons.flatMap(lesson => lesson.questions);
  assert.equal(questions.length, 72);
  for (const lesson of lessons) assert.equal(lesson.questions.length, 3, lesson.id);
  assert.equal(new Set(allQuestions.map(question => question.id)).size, allQuestions.length);
});

test('every question has four distinct options and a valid zero-based answer', () => {
  for (const question of allQuestions) {
    assert.ok(present(question.prompt), question.id);
    assert.ok(present(question.explanation), question.id);
    assert.equal(question.options.length, 4, question.id);
    assert.ok(question.options.every(present), question.id);
    assert.equal(new Set(question.options.map(normalized)).size, 4, question.id);
    assert.ok(Number.isInteger(question.answer), question.id);
    assert.ok(question.answer >= 0 && question.answer < question.options.length, question.id);
  }
});

test('question prompts can stand alone when mixed into review', () => {
  const dependentReference = /\b(?:the previous question|the preceding passage|the passage above|the above passage|the paragraph above)\b|上文|上一题|上述段落/i;
  for (const question of allQuestions) {
    assert.ok(!dependentReference.test(question.prompt), question.id);
    assert.ok(/[A-Za-z]/.test(question.prompt), question.id);
  }
});

test('each lesson includes a contextual before/after example and an open transfer task', () => {
  for (const lesson of lessons) {
    for (const field of ['before', 'after', 'note']) {
      assert.ok(present(lesson.example?.[field]), `${lesson.id}.example.${field}`);
    }
    assert.notEqual(normalized(lesson.example.before), normalized(lesson.example.after), lesson.id);
    assert.ok(present(lesson.task?.prompt), lesson.id);
    assert.ok(present(lesson.task?.model), lesson.id);
    assert.notEqual(normalized(lesson.task.prompt), normalized(lesson.task.model), lesson.id);
    assert.match(lesson.task.model, /[A-Za-z].*[.!?]/s, `${lesson.id}: model contains an English response`);
    assert.ok(lesson.task.notes.length >= 2 && lesson.task.notes.every(present), lesson.id);
    assert.ok(lesson.task.checklist.length >= 3 && lesson.task.checklist.every(present), lesson.id);
  }
});

test('all 72 chunks have unique IDs and complete retrieval cues and examples', () => {
  const chunks = lessons.flatMap(lesson => lesson.chunks);
  assert.equal(chunks.length, 72);
  assert.equal(new Set(chunks.map(chunk => chunk.id)).size, chunks.length);
  assert.equal(new Set(chunks.map(chunk => normalized(chunk.text))).size, chunks.length);
  for (const lesson of lessons) {
    assert.equal(lesson.chunks.length, 3, lesson.id);
    for (const chunk of lesson.chunks) {
      for (const field of ['id', 'text', 'meaning', 'example', 'prompt']) {
        assert.ok(present(chunk[field]), `${chunk.id}.${field}`);
      }
      assert.notEqual(normalized(chunk.prompt), normalized(chunk.text), chunk.id);
    }
  }
});

test('the eight-question baseline covers every track without broken skill references', () => {
  assert.equal(diagnostic.length, 8);
  assert.deepEqual([...new Set(diagnostic.map(question => question.skill))].sort(), [...expectedTracks].sort());
  for (const question of diagnostic) {
    assert.ok(expectedTracks.includes(question.skill), question.id);
    assert.ok(!lessons.some(lesson => lesson.questions.some(item => item.id === question.id)), question.id);
  }
});

test('published practice has no empty drafting markers or personal-score setup', () => {
  const content = JSON.stringify({ tracks, lessons, diagnostic });
  assert.ok(!/\b(?:TODO|TBD|lorem ipsum)\b/i.test(content));
  assert.ok(!/TOEFL\s*\d{2,3}|\/Users\/|\/workspace\//i.test(content));
});
