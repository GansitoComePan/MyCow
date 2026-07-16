-- ═══════════════════════════════════════════════════════════════════
-- 0012 — Eliminar valores de ENUM sin uso
--
-- Limpieza de valores que existían en el ENUM pero que la app no
-- utiliza. Si hay datos existentes con estos valores, esta migración
-- fallará; en ese caso, migrar los datos primero.
--
-- Valores eliminados:
--   categoria_animal: novillo, novillona
--   estado_vida: vendido
--   estado_reprod: vacia, empadrada
-- ═══════════════════════════════════════════════════════════════════

-- ── Drop vistas y constraints que dependen de los ENUMs ──────────
DROP VIEW IF EXISTS v_integridad_padres;
DROP VIEW IF EXISTS v_integridad_padres_eventos;
ALTER TABLE animales DROP CONSTRAINT IF EXISTS chk_semental_es_macho;
ALTER TABLE animales DROP CONSTRAINT IF EXISTS chk_vaca_es_hembra;

-- ── categoria_animal: eliminar novillo, novillona ──────────────────
UPDATE animales SET categoria = 'vaca' WHERE categoria::text IN ('novillona');
UPDATE animales SET categoria = 'semental' WHERE categoria::text IN ('novillo');
CREATE TYPE categoria_animal_new AS ENUM ('vaca', 'semental', 'cria');
ALTER TABLE animales
  ALTER COLUMN categoria TYPE categoria_animal_new
  USING categoria::text::categoria_animal_new;
ALTER TABLE historial_categoria
  ALTER COLUMN categoria_nueva TYPE categoria_animal_new
  USING categoria_nueva::text::categoria_animal_new;
ALTER TABLE historial_categoria
  ALTER COLUMN categoria_anterior TYPE categoria_animal_new
  USING categoria_anterior::text::categoria_animal_new;
DROP TYPE categoria_animal;
ALTER TYPE categoria_animal_new RENAME TO categoria_animal;

-- ── estado_vida: eliminar vendido ─────────────────────────────────
UPDATE animales SET estado_vida = 'activo' WHERE estado_vida::text = 'vendido';
ALTER TABLE animales ALTER COLUMN estado_vida DROP DEFAULT;
CREATE TYPE estado_vida_new AS ENUM ('activo', 'muerto');
ALTER TABLE animales
  ALTER COLUMN estado_vida TYPE estado_vida_new
  USING estado_vida::text::estado_vida_new;
ALTER TABLE animales ALTER COLUMN estado_vida SET DEFAULT 'activo';
DROP TYPE estado_vida;
ALTER TYPE estado_vida_new RENAME TO estado_vida;

-- ── estado_reprod: eliminar vacia, empadrada ─────────────────────
UPDATE animales SET estado_reproductivo = 'horra' WHERE estado_reproductivo::text IN ('vacia', 'empadrada');
ALTER TABLE animales ALTER COLUMN estado_reproductivo DROP DEFAULT;
CREATE TYPE estado_reprod_new AS ENUM ('cargada', 'parida', 'na', 'horra');
ALTER TABLE animales
  ALTER COLUMN estado_reproductivo TYPE estado_reprod_new
  USING estado_reproductivo::text::estado_reprod_new;
ALTER TABLE animales ALTER COLUMN estado_reproductivo SET DEFAULT 'na';
DROP TYPE estado_reprod;
ALTER TYPE estado_reprod_new RENAME TO estado_reprod;

-- ── Recrear CHECK constraints con el nuevo ENUM ──────────────────
ALTER TABLE animales ADD CONSTRAINT chk_semental_es_macho
  CHECK (categoria <> 'semental' OR sexo = 'macho');
ALTER TABLE animales ADD CONSTRAINT chk_vaca_es_hembra
  CHECK (categoria <> 'vaca' OR sexo = 'hembra');

-- ── Recrear vistas que dependen de los ENUMs ─────────────────────
CREATE OR REPLACE VIEW v_integridad_padres AS
SELECT
  a.id            AS animal_id,
  a.arete_local,
  a.padre_id,
  p.categoria     AS categoria_del_padre
FROM animales a
JOIN animales p ON p.id = a.padre_id
WHERE a.deleted_at IS NULL
  AND a.padre_id IS NOT NULL
  AND (p.categoria <> 'semental' OR p.deleted_at IS NOT NULL);

COMMENT ON VIEW v_integridad_padres IS 'Auditoría no bloqueante: animales cuyo padre_id no apunta a un semental activo; es una vista de revisión, no un constraint.';

CREATE OR REPLACE VIEW v_integridad_padres_eventos AS
SELECT
  e.id            AS evento_id,
  e.madre_id,
  e.padre_id,
  p.categoria     AS categoria_del_padre
FROM eventos_reproductivos e
JOIN animales p ON p.id = e.padre_id
WHERE e.deleted_at IS NULL
  AND e.padre_id IS NOT NULL
  AND (p.categoria <> 'semental' OR p.deleted_at IS NOT NULL);

COMMENT ON VIEW v_integridad_padres_eventos IS 'Auditoría no bloqueante: eventos reproductivos cuyo padre_id no apunta a un semental activo; vista de revisión, no un constraint.';

-- ── Trigger/function de ventas: ya no aplica ─────────────────────
-- fn_venta_marca_vendido y trg_venta_marca_vendido nunca se ejecutan
-- porque no hay código que inserte en ventas.
DROP TRIGGER IF EXISTS trg_venta_marca_vendido ON ventas;
DROP FUNCTION IF EXISTS fn_venta_marca_vendido();
