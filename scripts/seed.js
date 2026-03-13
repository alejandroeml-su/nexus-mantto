const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/mantto',
});

async function seed() {
  try {
    console.log('Seeding Simplified 4NF Database...');

    // 1. Independent Catalogs
    const sedeResult = await pool.query("INSERT INTO sedes (nombre, direccion) VALUES ('Sede Central', 'Av. Principal 123') RETURNING id");
    const sedeId = sedeResult.rows[0].id;

    const deptoResult = await pool.query("INSERT INTO departamentos (nombre) VALUES ('Mantenimiento General'), ('IT'), ('Producción') RETURNING id");
    const deptoIds = deptoResult.rows.map(r => r.id);

    // Asset Catalogs
    const tiposActivo = ['HVAC', 'Elevación', 'Generador', 'Mobiliario', 'TI'];
    const tipoActivoIds = {};
    for (const t of tiposActivo) {
        const res = await pool.query("INSERT INTO tipos_activo (nombre) VALUES ($1) RETURNING id", [t]);
        tipoActivoIds[t] = res.rows[0].id;
    }

    const marcas = ['Carrier', 'Otis', 'Caterpillar', 'Dell', 'Herman Miller'];
    const marcaIds = {};
    for (const m of marcas) {
        const res = await pool.query("INSERT INTO marcas (nombre) VALUES ($1) RETURNING id", [m]);
        marcaIds[m] = res.rows[0].id;
    }

    const estadosActivo = ['Operativo', 'En Mantenimiento', 'Fuera de Servicio', 'Baja'];
    const estadoActivoIds = {};
    for (const e of estadosActivo) {
        const res = await pool.query("INSERT INTO estados_activo (nombre) VALUES ($1) RETURNING id", [e]);
        estadoActivoIds[e] = res.rows[0].id;
    }

    // Maintenance Catalogs
    const tiposMaint = ['Preventivo', 'Correctivo', 'Predictivo', 'Inspección'];
    const tipoMaintIds = {};
    for (const t of tiposMaint) {
        const res = await pool.query("INSERT INTO tipos_mantenimiento (nombre) VALUES ($1) RETURNING id", [t]);
        tipoMaintIds[t] = res.rows[0].id;
    }

    const prioridades = [
        { n: 'Baja', l: 1 }, { n: 'Media', l: 2 }, { n: 'Alta', l: 3 }, { n: 'Crítica', l: 4 }
    ];
    const prioIds = {};
    for (const p of prioridades) {
        const res = await pool.query("INSERT INTO prioridades (nombre, nivel) VALUES ($1, $2) RETURNING id", [p.n, p.l]);
        prioIds[p.n] = res.rows[0].id;
    }

    const estadosMaint = ['Programado', 'En Proceso', 'Completado', 'Cancelado', 'Rechazado'];
    const estadoMaintIds = {};
    for (const e of estadosMaint) {
        const res = await pool.query("INSERT INTO estados_mantenimiento (nombre) VALUES ($1) RETURNING id", [e]);
        estadoMaintIds[e] = res.rows[0].id;
    }

    // 2. Hierarchical Catalogs
    const areaResult = await pool.query("INSERT INTO areas (nombre, sede_id) VALUES ('Planta Baja', $1), ('Nivel 1', $1) RETURNING id", [sedeId]);
    const areaIds = areaResult.rows.map(r => r.id);

    const ubiResult = await pool.query("INSERT INTO ubicaciones (nombre, area_id) VALUES ('Cuarto de Máquinas', $1), ('Pasillo Principal', $1), ('Data Center', $2) RETURNING id", [areaIds[0], areaIds[1]]);
    const ubiIds = ubiResult.rows.map(r => r.id);

    const modelos = [
        { n: 'X-500', m: 'Carrier' },
        { n: 'Gen2', m: 'Otis' },
        { n: 'CAT-22', m: 'Caterpillar' },
        { n: 'Optiplex', m: 'Dell' }
    ];
    const modeloIds = {};
    for (const m of modelos) {
        const res = await pool.query("INSERT INTO modelos (nombre, marca_id) VALUES ($1, $2) RETURNING id", [m.n, marcaIds[m.m]]);
        modeloIds[m.n] = res.rows[0].id;
    }

    // 3. Users
    const users = [
        { nombre: 'Carlos Ruiz', email: 'carlos.ruiz@nexus.com', rol: 'Técnico' },
        { nombre: 'Ana López', email: 'ana.lopez@nexus.com', rol: 'Técnico' },
        { nombre: 'Roberto Gómez', email: 'roberto.gomez@nexus.com', rol: 'Técnico' },
        { nombre: 'Ricardo Salinas', email: 'ricardo.salinas@nexus.com', rol: 'Jefe' }
    ];
    const tecnicoIds = [];
    for (const u of users) {
        const res = await pool.query(
            "INSERT INTO usuarios (nombre, email, rol, departamento_id) VALUES ($1, $2, $3, $4) RETURNING id",
            [u.nombre, u.email, u.rol, deptoIds[0]]
        );
        if (u.rol === 'Técnico') tecnicoIds.push(res.rows[0].id);
    }

    // 4. Activos
    const activos = [
        { n: 'Aire Acondicionado Central', t: 'HVAC', m: 'X-500', s: 'CR-99283', c: 'ACT-001', u: ubiIds[0] },
        { n: 'Elevador Principal 1', t: 'Elevación', m: 'Gen2', s: 'OT-11223', c: 'ACT-002', u: ubiIds[1] },
        { n: 'Planta de Emergencia', t: 'Generador', m: 'CAT-22', s: 'SN-77665', c: 'ACT-003', u: ubiIds[0] }
    ];
    const activoIds = [];
    for (const a of activos) {
        const res = await pool.query(
            `INSERT INTO activos (nombre, tipo_id, modelo_id, serie, codigo_activo, qr_code, estado_id, ubicacion_id, departamento_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [a.n, tipoActivoIds[a.t], modeloIds[a.m], a.s, a.c, `QR-${a.c}`, estadoActivoIds['Operativo'], a.u, deptoIds[0]]
        );
        activoIds.push(res.rows[0].id);
    }

    // 5. Mantenimientos
    const chores = [
        { desc: 'Limpieza de filtros y revisión de gas', tipo: 'Preventivo', estado: 'Completado', prio: 'Alta' },
        { desc: 'Engrase de cables y revisión de poleas', tipo: 'Preventivo', estado: 'Completado', prio: 'Media' },
        { desc: 'Ruidos extraños en unidad exterior', tipo: 'Correctivo', estado: 'Programado', prio: 'Crítica' },
        { desc: 'Inspección técnica anual', tipo: 'Inspección', estado: 'En Proceso', prio: 'Baja' }
    ];

    for (let i = 0; i < chores.length; i++) {
        const c = chores[i];
        const date = new Date();
        date.setDate(date.getDate() + (i - 2));

        const resM = await pool.query(
            `INSERT INTO mantenimientos (activo_id, tipo_id, prioridad_id, estado_id, descripcion, fecha_programada, comentarios, creado_por) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [
                activoIds[i % activoIds.length],
                tipoMaintIds[c.tipo],
                prioIds[c.prio],
                estadoMaintIds[c.estado],
                c.desc,
                date,
                c.estado === 'Completado' ? 'Trabajo finalizado con éxito.' : null,
                'Sistema'
            ]
        );

        await pool.query(
            "INSERT INTO mantenimiento_tecnicos (mantenimiento_id, usuario_id) VALUES ($1, $2)",
            [resM.rows[0].id, tecnicoIds[i % tecnicoIds.length]]
        );
    }

    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    pool.end();
  }
}

seed();
