import { randomUUID } from 'node:crypto';
import { copyBlock } from '../shared/blocks.js';

export async function copyResumeForUser(Resume, Block, sourceId, owner) {
  const source = await Resume.findOne({ _id: sourceId, owner });
  if (!source) {
    const error = new Error('Resume not found');
    error.status = 404;
    throw error;
  }
  const original = typeof source.toObject === 'function' ? source.toObject() : source;
  const resumeId = randomUUID();
  const referenced = [...new Set(Object.values(original.sections || {}).flat())];
  const scoped = await Block.find({ owner, _id: { $in: referenced }, variantIn: { $ne: null } });
  const replacements = new Map(scoped.map((block) => [block._id, randomUUID()]));
  const copies = scoped.map((block) => {
    const { id, ...fields } = copyBlock(block, replacements.get(block._id), owner, {
      variantIn: resumeId, variantOf: block.variantOf || block._id,
    });
    return { _id: id, ...fields };
  });
  const { _id, id, __v, createdAt, updatedAt, ...fields } = original;
  try {
    if (copies.length) await Block.insertMany(copies);
    return await Resume.create({
      ...fields, _id: resumeId, owner, title: `${original.title || 'My Resume'} (Copy)`,
      sections: Object.fromEntries(Object.entries(original.sections || {}).map(([title, ids]) =>
        [title, ids.map((blockId) => replacements.get(blockId) || blockId)])),
    });
  } catch (error) {
    // Standalone local MongoDB does not support transactions. Compensate for
    // partial block inserts if either write fails, without touching the source.
    await Block.deleteMany({ owner, variantIn: resumeId });
    throw error;
  }
}
