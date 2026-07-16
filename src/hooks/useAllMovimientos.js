import { useLiveQuery } from 'dexie-react-hooks';
import { db as defaultDb } from '../sync/db.js';

/**
 * Lista reactiva de TODOS los movimientos (deleted_at IS NULL), con los
 * nombres de potrero origen/destino y el arete del animal resueltos.
 *
 * A diferencia de useMovimientos (que filtra por un solo animal), este
 * hook retorna el historial completo — útil para reportes globales.
 *
 * Orden: fecha DESC, created_at DESC como desempate.
 */
export function useAllMovimientos(db = defaultDb) {
  const data = useLiveQuery(async () => {
    const [movimientos, potreros, animales] = await Promise.all([
      db.movimientos.filter((m) => m.deleted_at == null).toArray(),
      db.potreros.filter((p) => p.deleted_at == null).toArray(),
      db.animales.filter((a) => a.deleted_at == null).toArray(),
    ]);

    const nombreByPotreroId = new Map(potreros.map((p) => [p.client_id, p.nombre]));
    const areteByAnimalId = new Map(animales.map((a) => [a.client_id, a.arete_local]));

    return movimientos
      .map((m) => ({
        ...m,
        animal_arete: areteByAnimalId.get(m.animal_id) ?? null,
        potrero_origen_nombre: m.potrero_origen_id
          ? (nombreByPotreroId.get(m.potrero_origen_id) ?? null)
          : null,
        potrero_destino_nombre: nombreByPotreroId.get(m.potrero_destino_id) ?? null,
      }))
      .sort((a, b) => {
        const fechaCmp = (b.fecha ?? '').localeCompare(a.fecha ?? '');
        if (fechaCmp !== 0) return fechaCmp;
        return (b.created_at ?? '').localeCompare(a.created_at ?? '');
      });
  }, [db]);

  return { movimientos: data ?? [], isLoading: data === undefined };
}
