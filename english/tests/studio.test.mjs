import test from 'node:test';
import assert from 'node:assert/strict';
import { listening, speaking, resources, benchmarks } from '../content/studio.js';

const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const words = text => text.replace(/^[A-Za-z][A-Za-z ]{0,24}:\s*/gm, '').match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g) || [];
const checkStrings = (values, label, minimum = 1) => {
  assert.ok(Array.isArray(values) && values.length >= minimum, label);
  assert.ok(values.every(nonempty), `${label}: empty text`);
};

test('studio content has stable, globally unique identifiers', () => {
  assert.equal(listening.length, 12);
  assert.equal(speaking.length, 12);
  assert.equal(benchmarks.length, 6);
  assert.ok(resources.length >= 6 && resources.length <= 8);
  const rows = [...listening, ...speaking, ...resources, ...benchmarks, ...listening.flatMap(item => item.questions)];
  assert.ok(rows.every(row => /^[a-z]+-\d{2}(?:-q\d)?$/.test(row.id) || /^resource-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id)));
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
});

test('listening scenes fit the listening window and have three valid answer keys', () => {
  for (const scene of listening) {
    for (const key of ['title', 'scene', 'focus', 'script']) assert.ok(nonempty(scene[key]), `${scene.id}.${key}`);
    const length = words(scene.script).length;
    assert.ok(length >= 100 && length <= 170, `${scene.id}: ${length} spoken words; expected 100–170`);
    assert.ok(Number.isInteger(scene.minutes) && scene.minutes >= 5 && scene.minutes <= 20);
    assert.equal(scene.questions.length, 3);
    for (const question of scene.questions) {
      assert.ok(nonempty(question.prompt));
      assert.ok(nonempty(question.explanation) && /[\u3400-\u9fff]/u.test(question.explanation));
      checkStrings(question.options, question.id, 3);
      assert.equal(new Set(question.options).size, question.options.length, `${question.id}: duplicate choices`);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length,
        `${question.id}: answer must index an existing choice`);
    }
    checkStrings(scene.noticing, `${scene.id}.noticing`, 3);
  }
});

test('speaking tasks provide timed prompts, useful scaffolds, and independent model responses', () => {
  const models = new Set();
  for (const task of speaking) {
    for (const key of ['title', 'context', 'prompt', 'model']) assert.ok(nonempty(task[key]), `${task.id}.${key}`);
    assert.ok(task.seconds >= 60 && task.seconds <= 120 && Number.isInteger(task.seconds));
    assert.ok(words(task.prompt).length >= 20, `${task.id}: prompt must specify a real communication task`);
    assert.ok(words(task.model).length >= 70, `${task.id}: insufficient comparison model`);
    checkStrings(task.scaffold, `${task.id}.scaffold`, 3);
    checkStrings(task.checklist, `${task.id}.checklist`, 4);
    models.add(task.model);
  }
  assert.equal(models.size, speaking.length);
});

test('resources point only to reviewed publisher origins and include practical instructions', () => {
  const publishers = new Set(['rm.coe.int', 'learnenglish.britishcouncil.org', 'www.ted.com']);
  const urls = new Set();
  for (const resource of resources) {
    for (const key of ['title', 'url', 'kind', 'level', 'howToUse']) assert.ok(nonempty(resource[key]), `${resource.id}.${key}`);
    const url = new URL(resource.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(publishers.has(url.hostname), `${resource.id}: publisher needs source review`);
    assert.equal(url.username + url.password + url.search, '', `${resource.id}: no credentials or tracking query`);
    urls.add(url.href);
  }
  assert.equal(urls.size, resources.length);
});

test('benchmarks support recorded self-comparison without score or level certification fields', () => {
  for (const benchmark of benchmarks) {
    assert.ok(nonempty(benchmark.title) && nonempty(benchmark.prompt));
    assert.ok(Number.isInteger(benchmark.seconds) && benchmark.seconds >= 60 && benchmark.seconds <= 120);
    checkStrings(benchmark.checklist, `${benchmark.id}.checklist`, 4);
    assert.ok(!Object.hasOwn(benchmark, 'score') && !Object.hasOwn(benchmark, 'nativeScore') && !Object.hasOwn(benchmark, 'cefrResult'));
  }
  const serialized = JSON.stringify({ listening, speaking, resources, benchmarks });
  assert.doesNotMatch(serialized, /<iframe|<script|https?:\/\/[^"\s]+\.(?:mp3|mp4|wav)\b/i,
    'Publisher media should remain external manual links, not copied/embedded assets');
});
