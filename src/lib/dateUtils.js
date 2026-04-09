export function formatDateTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch {
    try {
      return new Date(value).toISOString().replace('T', ' ').slice(0, 16);
    } catch {
      return '';
    }
  }
}
