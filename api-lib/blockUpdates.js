import { blockData } from '../shared/blocks.js';

const TYPES = new Set(['summary', 'experience', 'projects', 'activities', 'cca', 'education', 'skills']);

function invalid(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export function prepareBlockUpdate(input, owner, existing) {
  if (!input || typeof input.id !== 'string' || !input.id || !TYPES.has(input.type)) invalid('Invalid block data');
  if (existing && existing.owner !== owner) invalid('Not authorized to modify this block', 403);
  const fields = { ...blockData(input), owner, type: input.type, tagIds: input.tagIds || [] };
  if (input.variantIn !== undefined) fields.variantIn = input.variantIn || null;
  if (input.variantOf !== undefined) fields.variantOf = input.variantOf || null;
  if (fields.description !== undefined) {
    const description = Array.isArray(fields.description) ? fields.description : String(fields.description || '').split('\n');
    fields.description = description.filter((s) => typeof s === 'string').map((s) => s.trim()).filter(Boolean);
  }
  const update = { $set: fields };
  if (existing && existing.type !== input.type) {
    const unset = Object.fromEntries(Object.keys(blockData(existing))
      .filter((key) => !Object.hasOwn(fields, key) && !['name', 'type', 'tagIds'].includes(key))
      .map((key) => [key, '']));
    // Remove a legacy wrapper as well, so it cannot resurrect old content.
    if (existing.content) unset.content = '';
    if (Object.keys(unset).length) update.$unset = unset;
  }
  return update;
}

export async function saveBlock(Block, input, owner) {
  if (!input || typeof input.id !== 'string') invalid('Invalid block data');
  const existing = await Block.findById(input.id);
  const update = prepareBlockUpdate(input, owner, existing);
  return Block.findOneAndUpdate({ _id: input.id, owner }, update, {
    upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true,
  });
}

export async function saveBlocks(Block, inputs, owner) {
  if (!Array.isArray(inputs) || inputs.some((b) => !b || typeof b.id !== 'string')) invalid('Expected array of blocks');
  if (!inputs.length) return { matchedCount: 0, upsertedCount: 0 };
  const existing = await Block.find({ _id: { $in: inputs.map((b) => b.id) } });
  const byId = new Map(existing.map((b) => [b._id, b]));
  const operations = inputs.map((input) => ({ updateOne: {
    filter: { _id: input.id, owner },
    update: prepareBlockUpdate(input, owner, byId.get(input.id)),
    upsert: true,
  } }));
  return Block.bulkWrite(operations);
}
