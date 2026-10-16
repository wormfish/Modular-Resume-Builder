import { useState, useEffect, useCallback } from 'react';
import { draftKey, readAccountDraft, writeAccountDraft } from '../utils/draftStorage.js';

export function useAccountDraft(user, kind, initialValue) {
  const key = draftKey(user, kind);
  const [entry, setEntry] = useState(() => ({ key, value: readAccountDraft(user, kind, initialValue) }));
  // Avoid writing the previous account's state under a new key if a caller
  // switches identity without unmounting this hook.
  if (entry.key !== key) {
    setEntry({ key, value: readAccountDraft(user, kind, initialValue) });
  }
  useEffect(() => {
    if (entry.key === key) writeAccountDraft(user, kind, entry.value);
  }, [entry, key, user, kind]);
  const setValue = useCallback((update) => setEntry((prev) => ({
    ...prev, value: typeof update === 'function' ? update(prev.value) : update,
  })), []);
  return [entry.value, setValue];
}
