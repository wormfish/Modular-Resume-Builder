import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizePersonalInfo } from '../api-lib/personalInfo.js';
import { mergeImportedPersonalInfo, resolveContactUrl } from '../src/utils/personalInfo.js';

test('account defaults and migration retain explicit and legacy contact links', () => {
  const saved = sanitizePersonalInfo({
    name: '  Jane Doe  ',
    fields: [
      { id: 'portfolio', label: 'Portfolio', value: 'My work', url: ' https://example.com/work ' },
      { id: 'github', label: 'GitHub', value: 'Jane', link: 'https://github.com/jane' },
    ],
  });
  assert.equal(saved.name, 'Jane Doe');
  assert.equal(saved.fields[0].url, 'https://example.com/work');
  assert.equal(saved.fields[1].url, 'https://github.com/jane');
  assert.equal(saved.fields.length, 3);
  assert.deepEqual(sanitizePersonalInfo(saved), saved);
});

test('malformed contacts are ignored and legacy details remain available', () => {
  assert.equal(sanitizePersonalInfo({ fields: [null, false, { value: 123, url: {} }] }).fields.length, 3);
  const info = sanitizePersonalInfo({ name: 'Jane', email: 'jane@example.com', location: 'Singapore' });
  assert.equal(info.fields[0].value, 'jane@example.com');
  assert.equal(info.fields[2].label, 'Location');
  assert.equal(info.fields[2].value, 'Singapore');
});

test('imported flat contacts replace saved values and stale hyperlinks while defaults fill gaps', () => {
  const defaults = { name: 'Saved name', fields: [
    { id: 'portfolio', label: 'Portfolio', value: 'My work', url: 'https://example.com/work' },
    { id: 'email', label: 'Email', value: 'saved@example.com', url: 'mailto:saved@example.com' },
    { id: 'phone', label: 'Phone', value: '+65 1111 1111', url: 'tel:+6511111111' },
  ] };
  const before = structuredClone(defaults);
  const imported = mergeImportedPersonalInfo(defaults, {
    name: 'PDF name', email: 'pdf@example.com', phone: '+65 2222 2222', linkedin: 'pdf-person', location: 'Singapore',
  });
  assert.equal(imported.name, 'PDF name');
  assert.equal(imported.email, 'pdf@example.com');
  assert.equal(imported.phone, '+65 2222 2222');
  assert.equal(imported.fields[0].url, 'https://example.com/work');
  assert.equal(resolveContactUrl(imported.fields.find((f) => f.label === 'Email')), 'mailto:pdf@example.com');
  assert.equal(imported.fields.find((f) => f.label === 'Phone').url, '');
  assert.equal(imported.fields.find((f) => f.label === 'LinkedIn').value, 'pdf-person');
  assert.equal(imported.fields.find((f) => f.label === 'Location').value, 'Singapore');
  assert.deepEqual(defaults, before);
});

test('imported contact lists retain links and repeated labels without erasing missing values', () => {
  const defaults = { name: 'Saved name', fields: [
    { id: 'email', label: 'Email', value: 'saved@example.com' },
    { id: 'phone', label: 'Phone', value: '+65 1111 1111' },
    { id: 'github', label: 'GitHub', value: 'Saved handle', url: 'https://github.com/saved' },
  ] };
  const imported = mergeImportedPersonalInfo(defaults, { name: '', fields: [
    null,
    { label: ' email ', value: 'pdf@example.com' },
    { label: 'Phone', value: '' },
    { label: 'GitHub', value: 'PDF handle', url: 'https://github.com/pdf' },
    { label: 'GitHub', value: 'Second handle', link: 'https://github.com/second' },
  ] });
  assert.equal(imported.name, 'Saved name');
  assert.equal(imported.email, 'pdf@example.com');
  assert.equal(imported.phone, '+65 1111 1111');
  const github = imported.fields.filter((f) => f.label === 'GitHub');
  assert.deepEqual(github.map((f) => f.url), ['https://github.com/pdf', 'https://github.com/second']);
  assert.equal(new Set(imported.fields.map((f) => f.id)).size, imported.fields.length);
  assert.equal(mergeImportedPersonalInfo(null, { email: 'pdf@example.com' }).email, 'pdf@example.com');
});
