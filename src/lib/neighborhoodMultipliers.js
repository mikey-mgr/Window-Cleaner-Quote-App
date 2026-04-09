const KEY = 'windowcleaner:neighborhood-multipliers';

export function getNeighborhoodMultiplier(neighborhood) {
  if (!neighborhood) return 1;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return 1;
    const map = JSON.parse(raw);
    const value = Number(map?.[neighborhood]);
    return value > 0 ? value : 1;
  } catch {
    return 1;
  }
}

export function setNeighborhoodMultiplier(neighborhood, value) {
  if (!neighborhood) return;
  const num = Number(value);
  const safe = num > 0 ? num : 1;
  try {
    const raw = localStorage.getItem(KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[neighborhood] = safe;
    localStorage.setItem(KEY, JSON.stringify(map));
    try {
      window.dispatchEvent(new CustomEvent('neighborhood-multiplier-change', { detail: { neighborhood, value: safe } }));
    } catch {
      // ignore
    }
  } catch {
    // ignore storage errors
  }
}
