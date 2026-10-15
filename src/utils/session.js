import { clearAccountDrafts } from './draftStorage.js';
import { invalidatePrefetch } from './prefetch.js';

export function readAuthUser() {
  try { return JSON.parse(localStorage.getItem('auth-user') || 'null'); }
  catch { return null; }
}

export function clearAuthentication() {
  clearAccountDrafts(readAuthUser());
  localStorage.removeItem('auth-token');
  localStorage.removeItem('auth-user');
  invalidatePrefetch();
}
