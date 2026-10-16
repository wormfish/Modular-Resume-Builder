import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizePersonalInfo } from '../api-lib/personalInfo.js';

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
