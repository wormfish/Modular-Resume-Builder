import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { sanitizePersonalInfo } from '../api-lib/personalInfo.js';

// Exercise the actual write path against fixture collections. Importing the
// migration must neither connect to MongoDB nor execute it.
const originalArgs = [...process.argv];
process.argv.push('--commit');
const { run } = await import('../server/migrate-flatten.js');

function fixtureDatabase(t, docs) {
  t.mock.method(console, 'log', () => {});
  const fixture = { writes: [], failReplace: false };
  const matches = (doc, query = {}) => Object.entries(query).every(([key, expected]) => {
    if (key === '$or') return expected.some((part) => matches(doc, part));
    if (expected?.$in) return expected.$in.includes(doc[key]);
    if (expected && typeof expected === 'object' && '$exists' in expected) return (doc[key] !== undefined) === expected.$exists;
    return doc[key] === expected;
  });
  const database = { collection: (name) => ({
    find: (query) => ({ toArray: async () => structuredClone(docs[name].filter((doc) => matches(doc, query))) }),
    countDocuments: async (query) => docs[name].filter((doc) => matches(doc, query)).length,
    deleteMany: async (query) => { docs[name] = docs[name].filter((doc) => !matches(doc, query)); },
    updateOne: async (query, update) => {
      fixture.writes.push({ collection: name, update: structuredClone(update) });
      const doc = docs[name].find((doc) => matches(doc, query));
      Object.assign(doc, structuredClone(update.$set));
      for (const key of Object.keys(update.$unset || {})) delete doc[key];
    },
    replaceOne: async (query, replacement) => {
      if (fixture.failReplace) throw new Error('Block write failed');
      fixture.writes.push({ collection: name, replacement: structuredClone(replacement) });
      docs[name][docs[name].findIndex((doc) => matches(doc, query))] = structuredClone(replacement);
    },
  }) };
  const previousDb = mongoose.connection.db;
  mongoose.connection.db = database;
  t.after(() => { mongoose.connection.db = previousDb; });
  t.mock.method(mongoose, 'connect', async () => mongoose);
  t.mock.method(mongoose, 'disconnect', async () => {});
  return fixture;
}

test('committing the migration requires a separate opt-in to purge only explicit test accounts', async (t) => {
  t.after(() => { process.argv = originalArgs; });
  const docs = {
    users: ['test@example.com', 'contest@example.com', 'protester@example.com', 'alice@latest.com'].map((email) => ({
      _id: email, email, tags: {}, tagsInitialized: true,
      defaultPersonalInfo: sanitizePersonalInfo({ fields: [{ label: 'Portfolio', value: 'My work', url: 'https://example.com/work' }] }),
    })),
    blocks: [], resumes: [],
  };
  fixtureDatabase(t, docs);

  await run();
  assert.equal(docs.users.length, 4, 'schema migration alone never deletes accounts');
  process.argv.push('--purge-test-accounts');
  await run();
  assert.deepEqual(docs.users.map((u) => u.email), ['contest@example.com', 'protester@example.com', 'alice@latest.com']);
  assert.equal(docs.users[0].defaultPersonalInfo.fields[0].url, 'https://example.com/work');
});

function legacyDocs() {
  return {
    users: [{ _id: 'jane', email: 'jane@example.com', tags: { known: 'Engineering' }, tagsInitialized: true,
      defaultPersonalInfo: sanitizePersonalInfo({}) }],
    blocks: [
      { _id: 'first', owner: 'jane@example.com', type: 'summary', jobTypes: ['Engineering', ' New tag '], content: { body: 'First' } },
      { _id: 'second', owner: 'jane@example.com', type: 'summary', jobTypes: ['new TAG'], content: { body: 'Second' } },
    ],
    resumes: [],
  };
}

test('migration persists discovered tag names before block ids and remains stable on rerun', async (t) => {
  const docs = legacyDocs();
  const fixture = fixtureDatabase(t, docs);
  await run();
  const tags = docs.users[0].tags;
  const newId = docs.blocks[0].tagIds[1];
  assert.equal(tags[newId], 'New tag');
  assert.equal(docs.blocks[0].tagIds[0], 'known');
  assert.deepEqual(docs.blocks[1].tagIds, [newId]);
  assert.equal(Object.keys(tags).length, 2);
  assert.equal(fixture.writes[0].collection, 'users');
  for (const block of docs.blocks) {
    assert.equal(block.jobTypes, undefined);
    assert.ok(block.tagIds.every((id) => Object.hasOwn(tags, id)));
  }
  const firstRun = structuredClone(docs);
  fixture.writes.length = 0;
  await run();
  assert.deepEqual(docs, firstRun);
  assert.deepEqual(fixture.writes, []);
});

test('failed block migration retains the discovered dictionary for a safe retry', async (t) => {
  const docs = legacyDocs();
  const fixture = fixtureDatabase(t, docs);
  fixture.failReplace = true;
  await assert.rejects(run(), /Block write failed/);
  const newId = Object.keys(docs.users[0].tags).find((id) => id !== 'known');
  assert.equal(docs.users[0].tags[newId], 'New tag');
  assert.deepEqual(docs.blocks[0].jobTypes, ['Engineering', ' New tag ']);
  fixture.failReplace = false;
  await run();
  assert.equal(docs.blocks[0].tagIds[1], newId);
  assert.deepEqual(docs.blocks[1].tagIds, [newId]);
  assert.equal(Object.keys(docs.users[0].tags).length, 2);
});
