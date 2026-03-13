const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/mantto',
});

async function seed() {
  try {
    console.log('Seeding database...');

    // 1. Ensure a Sede and Depto exist
    const sedeResult = await pool.query("INSERT INTO sedes (nombre, direccion) VALUES ('Sede Central', 'Av. Principal 123') ON CONFLICT DO NOTHING RETURNING id");
    let sedeId = sedeResult.rows[0]?.id;
    if (!sedeId) {
      const existingSede = await pool.query("SELECT id FROM sedes LIMIT 1");
      sedeId = existingSede.rows[0].id;
    }

    const deptoResult = await pool.query("INSERT INTO departamentos (nombre) VALUES ('Mantenimiento General') ON CONFLICT DO NOTHING RETURNING id");
    let deptoId = deptoResult.rows[0]?.id;
    if (!deptoId) {
      const existingDepto = await pool.query("SELECT id FROM departamentos LIMIT 1");
      deptoId = existingDepto.rows[0].id;
    }

    // 2. Insert 5 Técnicos and 1 Jefe
    const roles = [
      { nombre: 'Carlos Ruiz', email: 'carlos.ruiz@nexus.com', rol: 'Técnico' },
      { nombre: 'Ana López', email: 'ana.lopez@nexus.com', rol: 'Técnico' },
      { nombre: 'Roberto Gómez', email: 'roberto.gomez@nexus.com', rol: 'Técnico' },
      { nombre: 'Julia Martínez', email: 'julia.martinez@nexus.com', rol: 'Técnico' },
      { nombre: 'Miguel Ángel', email: 'miguel.angel@nexus.com', rol: 'Técnico' },
      { nombre: 'Ricardo Salinas', email: 'ricardo.salinas@nexus.com', rol: 'Jefe' }
    ];

    const tecnicoIds = [];
    for (const u of roles) {
      const res = await pool.query(
        "INSERT INTO usuarios (nombre, email, rol, departamento_id) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET rol = $3 RETURNING id",
        [u.nombre, u.email, u.rol, deptoId]
      );
      if (u.rol === 'Técnico') tecnicoIds.push(res.rows[0].id);
    }

    // 3. Insert 3 Activos
    const activos = [
      { nombre: 'Aire Acondicionado Central', tipo: 'HVAC', marca: 'Carrier', modelo: 'X-500', serie: 'CR-99283', codigo: 'ACT-001' },
      { nombre: 'Elevador Principal 1', tipo: 'Elevación', marca: 'Otis', modelo: 'Gen2', serie: 'OT-11223', codigo: 'ACT-002' },
      { nombre: 'Planta de Emergencia', tipo: 'Generador', marca: 'Caterpillar', modelo: 'CAT-22', serie: 'SN-77665', codigo: 'ACT-003' }
    ];

    const activoIds = [];
    for (const a of activos) {
      const res = await pool.query(
        "INSERT INTO activos (nombre, tipo, marca, modelo, serie, codigo_activo, sede_id, departamento_id, qr_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING RETURNING id",
        [a.nombre, a.tipo, a.marca, a.modelo, a.serie, a.codigo, sedeId, deptoId, `QR-${a.codigo}`]
      );
      if (res.rows[0]) {
          activoIds.push(res.rows[0].id);
      }
    }
    
    // Fallback if ON CONFLICT DO NOTHING resulted in empty activoIds
    if (activoIds.length === 0) {
        const existingActivos = await pool.query("SELECT id FROM activos LIMIT 3");
        existingActivos.rows.forEach(r => activoIds.push(r.id));
    }

    // 4. Insert 10 Work Orders (3 as 'Completado' for logs)
    const mantenimientos = [
      { desc: 'Limpieza de filtros y revisión de gas', tipo: 'Preventivo', estado: 'Completado', prioridad: 'Alta' },
      { desc: 'Engrase de cables y revisión de poleas', tipo: 'Preventivo', estado: 'Completado', prioridad: 'Media' },
      { desc: 'Prueba de arranque y cambio de aceite', tipo: 'Preventivo', estado: 'Completado', prioridad: 'Baja' },
      { desc: 'Ruidos extraños en unidad exterior', tipo: 'Correctivo', estado: 'Programado', prioridad: 'Alta' },
      { desc: 'Luz de emergencia parpadeante', tipo: 'Correctivo', estado: 'En Proceso', prioridad: 'Baja' },
      { desc: 'Ajuste de sensores de piso', tipo: 'Preventivo', estado: 'Programado', prioridad: 'Media' },
      { desc: 'Revisión trimestral de tableros', tipo: 'Preventivo', estado: 'Programado', prioridad: 'Baja' },
      { desc: 'Falla en el encendido automático', tipo: 'Correctivo', estado: 'En Proceso', prioridad: 'Alta' },
      { desc: 'Calibración de termostatos', tipo: 'Preventivo', estado: 'Programado', prioridad: 'Media' },
      { desc: 'Inspección técnica anual', tipo: 'Preventivo', estado: 'Programado', prioridad: 'Baja' }
    ];

    for (let i = 0; i < mantenimientos.length; i++) {
        const m = mantenimientos[i];
        const date = new Date();
        date.setDate(date.getDate() + (i - 5)); // Some past, some future
        
        await pool.query(
            "INSERT INTO mantenimientos (activo_id, tipo, descripcion, fecha_programada, tecnico_id, prioridad, estado, comentarios) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [
                activoIds[i % activoIds.length],
                m.tipo,
                m.desc,
                date,
                tecnicoIds[i % tecnicoIds.length],
                m.prioridad,
                m.estado,
                m.estado === 'Completado' ? `Trabajo finalizado correctamente el ${date.toLocaleDateString()}` : null
            ]
        );
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    pool.end();
  }
}

seed();
