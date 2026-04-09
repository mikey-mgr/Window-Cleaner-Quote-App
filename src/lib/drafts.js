const DRAFT_PREFIX = 'draft:';

export function saveDraft(key, data) {
  try {
    const payload = { data, ts: Date.now() };
    localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify(payload));
  } catch {
    // Ignore storage errors (private mode / quota)
  }
}

export function loadDraft(key) {
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data ?? null;
  } catch {
    return null;
  }
}

export function clearDraft(key) {
  try {
    localStorage.removeItem(DRAFT_PREFIX + key);
  } catch {
    // ignore
  }
}
