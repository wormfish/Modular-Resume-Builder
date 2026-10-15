const LEGACY_KEYS = ['resume-builder-blocks', 'resume-builder-canvas', 'resume-builder-personal'];

export function draftKey(user, kind) {
  return user?.id ? `resume-builder:${user.id}:${kind}` : null;
}

export function readAccountDraft(user, kind, fallback, storage = globalThis.localStorage) {
  const key = draftKey(user, kind);
  if (!key) return fallback;
  try {
    const stored = JSON.parse(storage.getItem(key) || 'null');
    const owned = (value) => kind === 'blocks'
      ? Array.isArray(value) && value.every((block) => block && (!block.owner || block.owner === user.email))
      : value && typeof value === 'object' && !Array.isArray(value) && (!value.owner || value.owner === user.email);
    if (stored?.accountId === user.id && owned(stored.value)) return stored.value;

    // Migrate only legacy data with explicit ownership. Unidentified drafts
    // must never be rendered for whichever account happens to sign in next.
    const legacyKey = `resume-builder-${kind}`;
    const legacy = JSON.parse(storage.getItem(legacyKey) || 'null');
    storage.removeItem(legacyKey);
    storage.removeItem('resume-builder-personal');
    const explicitlyOwned = kind === 'blocks'
      ? Array.isArray(legacy) && legacy.every((block) => block?.owner === user.email)
      : legacy?.owner === user.email;
    if (explicitlyOwned && owned(legacy)) {
      writeAccountDraft(user, kind, legacy, storage);
      return legacy;
    }
  } catch {
    // Malformed or unavailable storage must not prevent opening the builder.
  }
  return fallback;
}

export function writeAccountDraft(user, kind, value, storage = globalThis.localStorage) {
  const key = draftKey(user, kind);
  if (!key) return;
  try {
    storage.setItem(key, JSON.stringify({ accountId: user.id, value }));
  } catch {
    // Storage may be unavailable or full; cloud saves still work.
  }
}

export function clearAccountDrafts(user, storage = globalThis.localStorage) {
  try {
    for (const kind of ['blocks', 'canvas']) {
      const key = draftKey(user, kind);
      if (key) storage.removeItem(key);
    }
    for (const key of LEGACY_KEYS) storage.removeItem(key);
  } catch {
    // Session cleanup also needs to work without storage access.
  }
}
