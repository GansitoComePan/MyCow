function uuid() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const RAZAS = ['Brangus', 'Charolais', 'Brahman', 'Suizo', 'Hereford', 'Angus', 'Simmental'];
const COLORES = ['Colorado', 'Negro', 'Blanco', 'Overo', 'Bragado', 'Jersey', 'Café'];

const POTREROS = [
  { nombre: 'Potrero Norte', activo: true },
  { nombre: 'Potrero Sur', activo: true },
  { nombre: 'Potrero Este', activo: true },
];

const VACAS = [
  { arete: 1,  raza: 'Brangus',   color: 'Colorado',  estado_reprod: 'horra' },
  { arete: 2,  raza: 'Charolais', color: 'Blanco',    estado_reprod: 'cargada' },
  { arete: 3,  raza: 'Brahman',   color: 'Café',      estado_reprod: 'parida' },
  { arete: 4,  raza: 'Suizo',     color: 'Jersey',    estado_reprod: 'horra' },
  { arete: 5,  raza: 'Brangus',   color: 'Negro',     estado_reprod: 'cargada' },
  { arete: 6,  raza: 'Hereford',  color: 'Colorado',  estado_reprod: 'parida' },
  { arete: 7,  raza: 'Angus',     color: 'Negro',     estado_reprod: 'horra' },
  { arete: 8,  raza: 'Simmental', color: 'Overo',     estado_reprod: 'horra' },
  { arete: 9,  raza: 'Charolais', color: 'Blanco',    estado_reprod: 'cargada' },
  { arete: 10, raza: 'Brahman',   color: 'Colorado',  estado_reprod: 'horra' },
  { arete: 11, raza: 'Suizo',     color: 'Café',      estado_reprod: 'parida' },
  { arete: 12, raza: 'Brangus',   color: 'Overo',     estado_reprod: 'horra' },
  { arete: 13, raza: 'Hereford',  color: 'Colorado',  estado_reprod: 'cargada' },
  { arete: 14, raza: 'Angus',     color: 'Negro',     estado_reprod: 'horra' },
  { arete: 15, raza: 'Simmental', color: 'Blanco',    estado_reprod: 'horra' },
  { arete: 16, raza: 'Charolais', color: 'Overo',     estado_reprod: 'cargada' },
  { arete: 17, raza: 'Brahman',   color: 'Jersey',    estado_reprod: 'horra' },
  { arete: 18, raza: 'Brangus',   color: 'Colorado',  estado_reprod: 'parida' },
  { arete: 19, raza: 'Hereford',  color: 'Café',      estado_reprod: 'horra' },
  { arete: 20, raza: 'Angus',     color: 'Negro',     estado_reprod: 'cargada' },
];

const TOROS = [
  { arete: 21, raza: 'Brangus',   color: 'Colorado' },
  { arete: 22, raza: 'Charolais', color: 'Blanco' },
];

const BECERROS = [
  { arete: 23, sexo: 'macho',   raza: 'Brangus',   color: 'Colorado', madre: 1 },
  { arete: 24, sexo: 'hembra',  raza: 'Charolais', color: 'Blanco',   madre: 2 },
  { arete: 25, sexo: 'macho',   raza: 'Brahman',   color: 'Café',     madre: 3 },
  { arete: 26, sexo: 'hembra',  raza: 'Brangus',   color: 'Negro',    madre: 5 },
  { arete: 27, sexo: 'macho',   raza: 'Hereford',  color: 'Colorado', madre: 6 },
  { arete: 28, sexo: 'hembra',  raza: 'Charolais', color: 'Blanco',   madre: 9 },
  { arete: 29, sexo: 'macho',   raza: 'Brangus',   color: 'Overo',    madre: 13 },
  { arete: 30, sexo: 'hembra',  raza: 'Charolais', color: 'Overo',    madre: 16 },
  { arete: 31, sexo: 'macho',   raza: 'Brangus',   color: 'Colorado', madre: 18 },
  { arete: 32, sexo: 'hembra',  raza: 'Angus',     color: 'Negro',    madre: 20 },
];

export async function seedDemoData(db) {
  const ts = now();

  const potreroIds = {};
  for (const p of POTREROS) {
    const clientId = uuid();
    potreroIds[p.nombre] = clientId;
    await db.potreros.put({ client_id: clientId, nombre: p.nombre, activo: p.activo, created_at: ts, updated_at: ts, deleted_at: null });
  }

  const vacaIds = {};
  for (const v of VACAS) {
    const clientId = uuid();
    vacaIds[v.arete] = clientId;
    const potreros = Object.values(potreroIds);
    await db.animales.put({
      client_id: clientId, arete_local: String(v.arete), arete_siniiga: null,
      categoria: 'vaca', sexo: 'hembra', raza: v.raza, color: v.color,
      fecha_nacimiento: daysAgo(800 + Math.floor(Math.random() * 400)),
      estado_reproductivo: v.estado_reprod, madre_id: null, padre_id: null,
      potrero_actual_id: potreros[Math.floor(Math.random() * potreros.length)],
      observaciones: null, created_at: ts, updated_at: ts, deleted_at: null,
    });
  }

  for (const t of TOROS) {
    const potreros = Object.values(potreroIds);
    await db.animales.put({
      client_id: uuid(), arete_local: String(t.arete), arete_siniiga: null,
      categoria: 'semental', sexo: 'macho', raza: t.raza, color: t.color,
      fecha_nacimiento: daysAgo(700 + Math.floor(Math.random() * 500)),
      estado_reproductivo: null, madre_id: null, padre_id: null,
      potrero_actual_id: potreros[Math.floor(Math.random() * potreros.length)],
      observaciones: null, created_at: ts, updated_at: ts, deleted_at: null,
    });
  }

  for (const b of BECERROS) {
    const potreros = Object.values(potreroIds);
    await db.animales.put({
      client_id: uuid(), arete_local: String(b.arete), arete_siniiga: null,
      categoria: 'cria', sexo: b.sexo, raza: b.raza, color: b.color,
      fecha_nacimiento: daysAgo(30 + Math.floor(Math.random() * 100)),
      estado_reproductivo: 'na', madre_id: vacaIds[b.madre], padre_id: null,
      potrero_actual_id: potreros[Math.floor(Math.random() * potreros.length)],
      observaciones: null, created_at: ts, updated_at: ts, deleted_at: null,
    });
  }

  return { potreros: POTREROS.length, vacas: VACAS.length, toros: TOROS.length, becerros: BECERROS.length };
}

export async function clearAll(db) {
  await db.outbox.clear();
  await db.sync_meta.clear();
  for (const store of ['potreros', 'animales', 'movimientos', 'historial_categoria', 'defunciones', 'eventos_reproductivos', 'ventas', 'fotos']) {
    await db[store].clear();
  }
}
