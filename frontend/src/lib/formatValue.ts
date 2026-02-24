// Formats a survey answer value into a displayable string

export function formatValue(value: string | string[] | null, type: string): string {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) {
    if (type === 'RANKING') return value.join(', ');
    return value.join(', ');
  }
  return String(value);
}
