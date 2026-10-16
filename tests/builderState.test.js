import test from 'node:test';
import assert from 'node:assert/strict';
import { draftKey, readAccountDraft, writeAccountDraft, clearAccountDrafts } from '../src/utils/draftStorage.js';
import { renameSection } from '../src/utils/sections.js';

function memoryStorage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
}
const jane = { id: 'jane', email: 'jane@example.com' };
const alex = { id: 'alex', email: 'alex@example.com' };

test('drafts stay isolated across accounts and logout removes sensitive data', () => {
  const storage = memoryStorage();
  writeAccountDraft(jane, 'canvas', { owner: jane.email, title: 'Private resume' }, storage);
  writeAccountDraft(jane, 'blocks', [{ body: 'Private content' }], storage);
  assert.equal(readAccountDraft(alex, 'canvas', null, storage), null);
  assert.deepEqual(readAccountDraft(alex, 'blocks', [], storage), []);
  assert.equal(readAccountDraft(jane, 'canvas', null, storage).title, 'Private resume');
  storage.setItem('resume-builder-personal', JSON.stringify({ name: 'Private name' }));
  clearAccountDrafts(jane, storage);
  assert.equal(storage.getItem(draftKey(jane, 'canvas')), null);
  assert.equal(storage.getItem(draftKey(jane, 'blocks')), null);
  assert.equal(storage.getItem('resume-builder-personal'), null);
});

test('legacy drafts migrate only with explicit matching ownership', () => {
  const storage = memoryStorage();
  storage.setItem('resume-builder-canvas', JSON.stringify({ owner: jane.email, title: 'Private resume' }));
  assert.equal(readAccountDraft(alex, 'canvas', null, storage), null);
  assert.equal(storage.getItem('resume-builder-canvas'), null);
  storage.setItem('resume-builder-canvas', JSON.stringify({ owner: jane.email, title: 'My resume' }));
  assert.equal(readAccountDraft(jane, 'canvas', null, storage).title, 'My resume');
  assert.equal(readAccountDraft(jane, 'canvas', null, storage).title, 'My resume');
  storage.setItem(draftKey(jane, 'canvas'), JSON.stringify({ accountId: alex.id, value: { title: 'Wrong account' } }));
  assert.equal(readAccountDraft(jane, 'canvas', null, storage), null);
});

test('section collisions and empty titles preserve every original block reference', () => {
  const resume = { sectionOrder: ['Experience', 'Education'], sections: { Experience: ['work'], Education: ['school'] }, hiddenSections: ['Experience'] };
  for (const title of ['Education', ' ', '__proto__']) assert.equal(renameSection(resume, 'Experience', title), resume);
  const renamed = renameSection(resume, 'Experience', ' Work ');
  assert.deepEqual(renamed.sections, { Work: ['work'], Education: ['school'] });
  assert.deepEqual(renamed.sectionOrder, ['Work', 'Education']);
  assert.deepEqual(renamed.hiddenSections, ['Work']);
});
