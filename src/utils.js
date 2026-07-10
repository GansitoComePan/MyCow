const LABEL_MAP = { cria: 'Cría' };

export function capitalize(s) {
  if (!s) return s;
  return LABEL_MAP[s] ?? s.charAt(0).toUpperCase() + s.slice(1);
}

export function categoriaLabel(categoria, sexo) {
  if (categoria === 'cria') {
    return sexo === 'hembra' ? 'Becerra' : 'Becerro';
  }
  return capitalize(categoria);
}

export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}
