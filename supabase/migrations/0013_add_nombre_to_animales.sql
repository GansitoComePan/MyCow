-- 0013 — Agregar columna nombre a animales
-- Nombre cariño/identificador del animal (ej: "Puma", "Canela").
ALTER TABLE animales ADD COLUMN IF NOT EXISTS nombre TEXT;
