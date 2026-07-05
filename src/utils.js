const LABEL_MAP = { cria: 'Cría' };

export function capitalize(s) {
  if (!s) return s;
  return LABEL_MAP[s] ?? s.charAt(0).toUpperCase() + s.slice(1);
}
