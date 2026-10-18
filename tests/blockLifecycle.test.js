import test from 'node:test';
import assert from 'node:assert/strict';
import { copyBlock, isBlockEligibleForResume } from '../shared/blocks.js';
import { prepareBlockUpdate, saveBlock, saveBlocks } from '../api-lib/blockUpdates.js';
import { copyResumeForUser } from '../api-lib/resumeCopy.js';
import { moveBlockToTypeSection } from '../src/utils/sections.js';

const owner = 'jane@example.com';
const source = { _id: 'original', owner, name: 'Engineer', type: 'experience', role: 'Engineer', company: 'Acme',
  description: ['Built the platform'], startDate: 'Jan 2020', tagIds: ['engineering'], variantIn: null, variantOf: null };

test('duplicated flat and legacy blocks retain content with fresh identities', () => {
  for (const block of [source, { ...source, company: undefined, content: { institution: 'School' } }]) {
    const copy = copyBlock(block, 'new-id', owner);
    assert.equal(copy.id, 'new-id');
    assert.equal(copy._id, undefined);
    assert.deepEqual(copy.description, ['Built the platform']);
    assert.equal(copy.role, 'Engineer');
    assert.deepEqual(copy.tagIds, ['engineering']);
  }
});

test('single and bulk edits flatten legacy content without losing omitted fields or restoring old text', async () => {
  for (const bulk of [false, true]) {
    let stored = { _id: 'legacy', owner, type: 'summary', name: 'Original name',
      content: { headline: 'Engineer', body: 'Old text', link: 'https://example.com' } };
    const apply = (update) => {
      Object.assign(stored, update.$set);
      for (const key of Object.keys(update.$unset || {})) delete stored[key];
    };
    const Block = {
      findById: async () => structuredClone(stored),
      find: async () => [structuredClone(stored)],
      findOneAndUpdate: async (_query, update) => { apply(update); return stored; },
      bulkWrite: async (ops) => { for (const op of ops) apply(op.updateOne.update); },
    };
    const input = { id: 'legacy', type: 'summary', body: 'Edited text' };
    if (bulk) await saveBlocks(Block, [input], owner);
    else await saveBlock(Block, input, owner);
    assert.equal(stored.content, undefined);
    assert.equal(stored.headline, 'Engineer');
    assert.equal(stored.body, 'Edited text');
    assert.equal(stored.link, 'https://example.com');
    assert.equal(stored.name, 'Original name');
    // The builder and dashboard still support responses from old records.
    const { content, ...flat } = stored;
    assert.equal({ ...flat, ...content }.body, 'Edited text');
    if (bulk) await saveBlocks(Block, [{ ...input, body: 'Second edit' }], owner);
    else await saveBlock(Block, { ...input, body: 'Second edit' }, owner);
    assert.equal(stored.headline, 'Engineer');
    assert.equal(stored.body, 'Second edit');
  }
});

test('single and bulk type changes remove stale content but preserve name and scope', async () => {
  const existing = { ...source, variantIn: 'resume', variantOf: 'parent' };
  const update = prepareBlockUpdate({ id: source._id, type: 'projects', tagIds: [] }, owner, existing);
  assert.ok(Object.hasOwn(update.$unset, 'company'));
  assert.ok(Object.hasOwn(update.$unset, 'role'));
  assert.ok(Object.hasOwn(update.$unset, 'description'));
  assert.equal(update.$unset.name, undefined);
  assert.equal(update.$unset.variantIn, undefined);
  const kept = prepareBlockUpdate({ id: source._id, type: 'projects', company: 'New project' }, owner, existing);
  assert.equal(kept.$set.company, 'New project');
  assert.equal(kept.$unset.company, undefined);
  let operations;
  await saveBlocks({ find: async () => [existing], bulkWrite: async (ops) => { operations = ops; } },
    [{ id: source._id, type: 'projects', tagIds: [] }], owner);
  assert.deepEqual(operations[0].updateOne.update, update);
  assert.throws(() => prepareBlockUpdate({ id: source._id, type: 'projects' }, 'other@example.com', source), { status: 403 });
});

test('copied resumes own their variants and survive deletion of the source', async () => {
  const variants = [{ ...source, _id: 'tailored', variantIn: 'resume', variantOf: 'original' }];
  const original = { _id: 'resume', owner, title: 'Original', sections: { Experience: ['original', 'tailored', 'tailored'] } };
  const records = [original];
  const Resume = {
    findOne: async (query) => query.owner === owner && query._id === 'resume' ? original : null,
    create: async (doc) => { records.push(doc); return doc; },
  };
  const Block = {
    find: async () => variants.filter((b) => b.variantIn),
    insertMany: async (docs) => variants.push(...docs),
    deleteMany: async (query) => { for (let i = variants.length - 1; i >= 0; i--) if (variants[i].variantIn === query.variantIn) variants.splice(i, 1); },
  };
  const copy = await copyResumeForUser(Resume, Block, 'resume', owner);
  const copiedId = copy.sections.Experience[1];
  assert.notEqual(copiedId, 'tailored');
  assert.equal(copy.sections.Experience[0], 'original');
  assert.equal(copy.sections.Experience[2], copiedId);
  assert.equal(variants.find((b) => b._id === copiedId).variantIn, copy._id);
  await Block.deleteMany({ variantIn: 'resume' });
  assert.ok(variants.find((b) => b._id === copiedId));
  assert.deepEqual(original.sections.Experience, ['original', 'tailored', 'tailored']);
  await assert.rejects(copyResumeForUser(Resume, Block, 'resume', 'other@example.com'), { status: 404 });
});

test('failed resume creation removes only the newly copied variants', async () => {
  let cleaned;
  const Resume = { findOne: async () => ({ _id: 'resume', owner, sections: { Experience: ['tailored'] } }),
    create: async () => { throw new Error('write failed'); } };
  const Block = { find: async () => [{ ...source, _id: 'tailored', variantIn: 'resume' }],
    insertMany: async () => {}, deleteMany: async (query) => { cleaned = query; } };
  await assert.rejects(copyResumeForUser(Resume, Block, 'resume', owner), /write failed/);
  assert.equal(cleaned.owner, owner);
  assert.notEqual(cleaned.variantIn, 'resume');
});

test('auto-fill excludes variants scoped to a different resume', () => {
  const blocks = [source, { ...source, variantIn: 'current' }, { ...source, variantIn: 'another' }];
  assert.equal(blocks.filter((b) => isBlockEligibleForResume(b, 'current')).length, 2);
  assert.equal(blocks.filter((b) => isBlockEligibleForResume(b)).length, 1);
});

test('type changes keep blocks already in their target section without placing unused library blocks', () => {
  const resume = { sectionOrder: ['Experience', 'Projects'], sections: { Experience: ['first', 'block', 'last'], Projects: ['block'] } };
  const moved = moveBlockToTypeSection(resume, 'block', 'Experience');
  assert.deepEqual(moved.sections.Experience, ['first', 'block', 'last']);
  assert.deepEqual(moved.sections.Projects, []);
  assert.equal(moveBlockToTypeSection(resume, 'unused', 'Education'), resume);
});
