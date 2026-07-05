-- Agrega 'horra' al ENUM estado_reprod para que coincida con el vocabulario
-- del formulario (AnimalForm.jsx usa 'horra', 'cargada', 'parida').
-- No se elimina 'vacia' para no romper datos existentes.
ALTER TYPE estado_reprod ADD VALUE IF NOT EXISTS 'horra';
