-- 0015 — Añadir columna 'revertido_en' a movimientos
-- Marca cuándo un movimiento fue revertido (nullable = no revertido).
-- Revertir = crear un movimiento inverso nuevo + marcar este como revertido.
ALTER TABLE movimientos
  ADD COLUMN IF NOT EXISTS revertido_en TIMESTAMPTZ;

COMMENT ON COLUMN movimientos.revertido_en IS 'Timestamp de quando el movimiento fue revertido; NULL = activo.';
