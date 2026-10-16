export function sectionTitleError(resume, oldTitle, newTitle) {
  const title = newTitle.trim();
  if (!title) return 'Enter a section title.';
  if (['__proto__', 'constructor', 'prototype'].includes(title)) return 'Choose another section title.';
  if (title !== oldTitle && Object.hasOwn(resume.sections || {}, title)) return 'A section already uses this title.';
  return '';
}

export function renameSection(resume, oldTitle, newTitle) {
  const title = newTitle.trim();
  if (title === oldTitle || sectionTitleError(resume, oldTitle, title)) return resume;
  if (!(resume.sectionOrder || []).includes(oldTitle)) return resume;
  return {
    ...resume,
    sectionOrder: resume.sectionOrder.map((name) => name === oldTitle ? title : name),
    sections: Object.fromEntries(Object.entries(resume.sections || {}).map(([name, ids]) => [name === oldTitle ? title : name, ids])),
    hiddenSections: (resume.hiddenSections || []).map((name) => name === oldTitle ? title : name),
  };
}

export function moveBlockToTypeSection(resume, blockId, targetTitle) {
  if (!Object.values(resume.sections || {}).some((ids) => ids.includes(blockId))) return resume;
  const sections = Object.fromEntries(Object.entries(resume.sections || {})
    .map(([title, ids]) => [title, ids.filter((id) => id !== blockId)]));
  const target = sections[targetTitle] || [];
  const previousIndex = (resume.sections[targetTitle] || []).indexOf(blockId);
  target.splice(previousIndex < 0 ? target.length : previousIndex, 0, blockId);
  sections[targetTitle] = target;
  return {
    ...resume, sections,
    sectionOrder: resume.sectionOrder.includes(targetTitle) ? resume.sectionOrder : [...resume.sectionOrder, targetTitle],
  };
}
