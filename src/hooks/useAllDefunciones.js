import { useLiveQuery } from 'dexie-react-hooks';
import { db as defaultDb } from '../sync/db.js';

/**
 * Lista reactiva de TODAS las defunciones (deleted_at IS NULL), con el
 * arete del animal y la categoría resueltos.
 *
 * A diferencia de useEventos (que filtra por un solo animal), este
 * hook retorna el historial completo — útil para reportes globales.
 *
 * Orden: fecha_muerte DESC, created_at DESC como desempate.
 */
export function useAllDefunciones(db = defaultDb) {
  const data = useLiveQuery(async () => {
    const [defunciones, animales] = await Promise.all([
      db.defunciones.filter((d) => d.deleted_at == null).toArray(),
      db.animales.filter((a) => a.deleted_at == null).toArray(),
    ]);

    const animalMap = new Map(animales.map((a) => [a.client_id, a]));

    return defunciones
      .map((d) => {
        const animal = animalMap.get(d.animal_id);
        return {
          ...d,
          animal_arete: animal?.arete_local ?? null,
          animal_categoria: animal?.categoria ?? null,
          animal_sexo: animal?.sexo ?? null,
        };
      })
      .sort((a, b) => {
        const fechaCmp = (b.fecha_muerte ?? '').localeCompare(a.fecha_muerte ?? '');
        if (fechaCmp !== 0) return fechaCmp;
        return (b.created_at ?? '').localeCompare(a.created_at ?? '');
      });
  }, [db]);

  return { defunciones: data ?? [], isLoading: data === undefined };
}
