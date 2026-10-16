import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { sanitizePersonalInfo } from '../api-lib/personalInfo.js';

// Exercise the actual write path against fixture collections. Importing the
// migration must neither connect to MongoDB nor execute it.
const originalArgs = [...process.argv];
process.argv.push('--commit');
const { run } = await import('../server/migrate-flatten.js');

test('committing the migration requires a separate opt-in to purge only explicit test accounts', async (t) => {
  t.after(() => { process.argv = originalArgs; });
  t.mock.method(console, 'log', () => {});
  const docs = {
    users: ['test@example.com', 'contest@example.com', 'protester@example.com', 'alice@latest.com'].map((email) => ({
      _id: email, email, tags: {}, tagsInitialized: true,
      defaultPersonalInfo: sanitizePersonalInfo({ fields: [{ label: 'Portfolio', value: 'My work', url: 'https://example.com/work' }] }),
    })),
    blocks: [], resumes: [],
  };
  const matches = (doc, query = {}) => Object.entries(query).every(([key, expected]) => {
    if (key === '$or') return expected.some((part) => matches(doc, part));
    if (expected?.$in) return expected.$in.includes(doc[key]);
    if (expected && typeof expected === 'object' && '$exists' in expected) return (doc[key] !== undefined) === expected.$exists;
    return doc[key] === expected;
  });
  const database = { collection: (name) => ({
    find: (query) => ({ toArray: async () => docs[name].filter((doc) => matches(doc, query)) }),
    countDocuments: async (query) => docs[name].filter((doc) => matches(doc, query)).length,
    deleteMany: async (query) => { docs[name] = docs[name].filter((doc) => !matches(doc, query)); },
    updateOne: async (query, update) => { Object.assign(docs[name].find((doc) => matches(doc, query)), update.$set); },
  }) };
  const previousDb = mongoose.connection.db;
  mongoose.connection.db = database;
  t.after(() => { mongoose.connection.db = previousDb; });
  t.mock.method(mongoose, 'connect', async () => mongoose);
  t.mock.method(mongoose, 'disconnect', async () => {});

  await run();
  assert.equal(docs.users.length, 4, 'schema migration alone never deletes accounts');
  process.argv.push('--purge-test-accounts');
  await run();
  assert.deepEqual(docs.users.map((u) => u.email), ['contest@example.com', 'protester@example.com', 'alice@latest.com']);
  assert.equal(docs.users[0].defaultPersonalInfo.fields[0].url, 'https://example.com/work');
});
