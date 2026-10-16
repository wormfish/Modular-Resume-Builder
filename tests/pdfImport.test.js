import test from 'node:test';
import assert from 'node:assert/strict';
import { parseResumeLines } from '../src/utils/pdfImport.js';
import { BLOCK_SCHEMA } from '../src/utils/constants.js';
import { prepareBlockUpdate } from '../api-lib/blockUpdates.js';

const line = (text, size = 10, x0 = 40) => ({ text, size, x0, page: 1, y: 700 });
const header = [line('Jane Doe', 18), line('jane@example.com')];

test('styled job titles remain in their section and retain all bullets', () => {
  const parsed = parseResumeLines([...header, line('Experience', 14),
    line('Software Engineer', 12), line('Acme | Jan 2020 – Present'),
    line('• Built reliable systems'), line('• Reduced latency'), line('• Mentored engineers'),
    line('Engineering Manager', 12), line('Northwind | Jan 2018 – Dec 2019'), line('• Led a team'), line('• Shipped a platform')]);
  assert.equal(parsed.personalInfo.name, 'Jane Doe');
  assert.equal(parsed.blocks.length, 2);
  assert.equal(parsed.blocks[0].fields.role, 'Software Engineer');
  assert.equal(parsed.blocks[0].fields.company, 'Acme');
  assert.equal(parsed.blocks[0].fields.description.split('\n').length, 3);
  assert.equal(parsed.blocks[0].headerless, undefined);
  assert.equal(parsed.blocks[1].fields.role, 'Engineering Manager');
});

test('education dates on the institution line survive an export/import round trip', () => {
  const parsed = parseResumeLines([...header, line('Education', 11.5),
    line('State University | Aug 2016 – May 2020', 12),
    line('Bachelor of Science, Computer Science', 11.5), line('GPA: 3.8 / 4.0', 11.5)]);
  const education = parsed.blocks[0].fields;
  assert.equal(education.institution, 'State University');
  assert.equal(education.startDate, 'Aug 2016');
  assert.equal(education.endDate, 'May 2020');
  assert.equal(education.degree, 'Bachelor of Science');
  assert.equal(education.field, 'Computer Science');
});

test('headerless styled entries retain their title and remain headerless', () => {
  const parsed = parseResumeLines([...header, line('Software Engineer', 12),
    line('Acme | Jan 2020 – Present'), line('• Built reliable systems'), line('• Reduced latency'), line('• Mentored engineers')]);
  assert.equal(parsed.blocks[0].fields.role, 'Software Engineer');
  assert.equal(parsed.blocks[0].headerless, true);
});

test('unsupported sections are reported without turning certifications or awards into jobs', () => {
  const parsed = parseResumeLines([...header, line('Experience', 14),
    line('Software Engineer', 12), line('Acme | Jan 2020 – Present'), line('• Built reliable systems'),
    line('Certifications', 14), line('AWS Certified Developer', 12), line('Amazon | 2024'),
    line('Awards & Honors', 14), line('Employee of the year', 12),
    line('Education', 14), line('State University', 12), line('Bachelor of Science, Computer Science')]);
  assert.deepEqual(parsed.skippedSections, ['Certifications', 'Awards & Honors']);
  assert.deepEqual(parsed.blocks.map((b) => b.type), ['experience', 'education']);
  assert.equal(parsed.blocks[0].fields.company, 'Acme');
  assert.equal(parsed.blocks[0].fields.description, 'Built reliable systems');
  assert.equal(parsed.blocks[1].fields.institution, 'State University');
  const unsupportedOnly = parseResumeLines([line('Certifications', 14), line('AWS Certified Developer')]);
  assert.deepEqual(unsupportedOnly.blocks, []);
  assert.deepEqual(unsupportedOnly.skippedSections, ['Certifications']);
  assert.equal(unsupportedOnly.personalInfo.name, '');
});

test('education achievements survive parsing, saving, rendering, and reimporting', () => {
  const parsed = parseResumeLines([...header, line('Education', 14), line('State University', 12),
    line('Bachelor of Science, Computer Science'), line('GPA: 3.8 / 4.0'),
    line('• Awarded a full scholarship'), line('• Graduated with distinction')]);
  const education = parsed.blocks[0];
  assert.equal(education.fields.gpa, 'GPA: 3.8 / 4.0');
  assert.equal(education.fields.description, 'Awarded a full scholarship\nGraduated with distinction');
  const saved = prepareBlockUpdate({ id: 'education', type: education.type, ...education.fields }, 'jane@example.com').$set;
  assert.deepEqual(saved.description, ['Awarded a full scholarship', 'Graduated with distinction']);
  const rendered = BLOCK_SCHEMA.education.render(saved);
  assert.equal(rendered.body, 'GPA: 3.8 / 4.0\n• Awarded a full scholarship\n• Graduated with distinction');
  const reimported = parseResumeLines([...header, line('Education', 14), line(rendered.title, 12),
    line(rendered.subtitle), ...rendered.body.split('\n').map((text) => line(text))]);
  assert.equal(reimported.blocks[0].fields.description, education.fields.description);
  assert.equal(reimported.blocks[0].fields.gpa, education.fields.gpa);
  assert.ok(BLOCK_SCHEMA.education.fields.some((f) => f.name === 'description'), 'imported achievements remain editable');
});
