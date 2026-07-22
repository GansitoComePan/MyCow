-- 0014 — Añadir columna 'detalle' a movimientos
-- Campo opcional para describir el motivo o explicación del movimiento.
ALTER TABLE movimientos
  ADD COLUMN IF NOT EXISTS detalle TEXT;

COMMENT ON COLUMN movimientos.detalle IS 'Detalle o explicación del motivo del movimiento (opcional).';
