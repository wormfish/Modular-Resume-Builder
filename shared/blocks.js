const META = new Set(['id', '_id', 'owner', '__v', 'createdAt', 'updatedAt', 'content', 'variantIn', 'variantOf']);

export function blockData(block) {
  const source = typeof block.toObject === 'function' ? block.toObject() : block;
  return Object.fromEntries(Object.entries({ ...(source.content || {}), ...source })
    .filter(([key]) => !META.has(key) && !key.startsWith('$') && !key.includes('.')));
}

export function copyBlock(block, id, owner, { variantIn = null, variantOf = null } = {}) {
  return { ...blockData(block), id, owner, variantIn, variantOf };
}

export function isBlockEligibleForResume(block, resumeId) {
  return !block.variantIn || (!!resumeId && block.variantIn === resumeId);
}
