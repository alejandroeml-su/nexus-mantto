'use server';

import { query } from '@/lib/db';
import { Activo, Mantenimiento } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Helper to get ID from Name in catalogs
async function getCatalogId(table: string, name: string): Promise<string | null> {
  const result = await query(`SELECT id FROM ${table} WHERE nombre = $1`, [name]);
  return result.rows[0]?.id || null;
}

// Assets
export async function getActivos() {
  const result = await query(`
    SELECT a.id, a.nombre, a.serie, a.codigo_activo, a.qr_code, a.fecha_compra, a.vencimiento_garantia, a.ultima_inspeccion, a.created_at,
           ta.nombre as tipo,
           ma.nombre as marca,
           mo.nombre as modelo,
           ea.nombre as estado,
           u.nombre as ubicacion_nombre,
           d.nombre as depto_nombre,
           s.nombre as sede_nombre,
           a.ubicacion_id,
           a.departamento_id
    FROM activos a
    LEFT JOIN tipos_activo ta ON a.tipo_id = ta.id
    LEFT JOIN modelos mo ON a.modelo_id = mo.id
    LEFT JOIN marcas ma ON mo.marca_id = ma.id
    LEFT JOIN estados_activo ea ON a.estado_id = ea.id
    LEFT JOIN ubicaciones u ON a.ubicacion_id = u.id
    LEFT JOIN areas ar ON u.area_id = ar.id
    LEFT JOIN sedes s ON ar.sede_id = s.id
    LEFT JOIN departamentos d ON a.departamento_id = d.id
    ORDER BY a.created_at DESC
  `);
  return result.rows;
}

export async function createActivo(data: Partial<Activo>, userRol?: string) {
  const { nombre, tipo, marca, modelo, serie, codigo_activo, descripcion, ubicacion_id, departamento_id } = data;
  
  const tipo_id = await getCatalogId('tipos_activo', tipo || 'HVAC');
  const marca_row = await query('SELECT id FROM marcas WHERE nombre = $1', [marca]);
  const marca_id = marca_row.rows[0]?.id;
  const modelo_row = await query('SELECT id FROM modelos WHERE nombre = $1 AND marca_id = $2', [modelo, marca_id]);
  const modelo_id = modelo_row.rows[0]?.id;
  
  const estado_id = await getCatalogId('estados_activo', 'Operativo');
  const qr_code = `QR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  await query(
    `INSERT INTO activos (nombre, tipo_id, modelo_id, serie, codigo_activo, qr_code, estado_id, ubicacion_id, departamento_id, creado_por) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [nombre, tipo_id, modelo_id, serie, codigo_activo, qr_code, estado_id, ubicacion_id, departamento_id, userRol || 'Sistema']
  );
  
  revalidatePath('/activos');
  revalidatePath('/configuracion/activos');
}

export async function updateActivo(id: string, data: Partial<Activo>) {
  const { nombre, tipo, modelo, serie, codigo_activo, estado, ubicacion_id, departamento_id } = data;
  
  const tipo_id = tipo ? await getCatalogId('tipos_activo', tipo) : undefined;
  const modelo_id = modelo ? await getCatalogId('modelos', modelo) : undefined;
  const estado_id = estado ? await getCatalogId('estados_activo', estado) : undefined;

  await query(
    `UPDATE activos SET 
      nombre = COALESCE($1, nombre), 
      tipo_id = COALESCE($2, tipo_id), 
      modelo_id = COALESCE($3, modelo_id), 
      serie = COALESCE($4, serie), 
      codigo_activo = COALESCE($5, codigo_activo), 
      estado_id = COALESCE($6, estado_id), 
      ubicacion_id = COALESCE($7, ubicacion_id), 
      departamento_id = COALESCE($8, departamento_id) 
     WHERE id = $9`,
    [nombre, tipo_id, modelo_id, serie, codigo_activo, estado_id, ubicacion_id, departamento_id, id]
  );
  revalidatePath('/activos');
  revalidatePath('/configuracion/activos');
}

export async function deleteActivo(id: string) {
  await query('DELETE FROM activos WHERE id = $1', [id]);
  revalidatePath('/activos');
  revalidatePath('/configuracion/activos');
}

// Maintenance
export async function getMantenimientos() {
  const result = await query(`
    SELECT m.id, m.activo_id, m.descripcion, m.fecha_programada, m.fecha_inicio, m.fecha_fin, m.costo, m.comentarios, m.creado_por, m.created_at,
           a.nombre as activo_nombre,
           tm.nombre as tipo,
           p.nombre as prioridad,
           em.nombre as estado,
           (SELECT u.nombre FROM mantenimiento_tecnicos mt JOIN usuarios u ON mt.usuario_id = u.id WHERE mt.mantenimiento_id = m.id LIMIT 1) as tecnico_nombre,
           (SELECT u.id FROM mantenimiento_tecnicos mt JOIN usuarios u ON mt.usuario_id = u.id WHERE mt.mantenimiento_id = m.id LIMIT 1) as tecnico_id
    FROM mantenimientos m
    JOIN activos a ON m.activo_id = a.id
    LEFT JOIN tipos_mantenimiento tm ON m.tipo_id = tm.id
    LEFT JOIN prioridades p ON m.prioridad_id = p.id
    LEFT JOIN estados_mantenimiento em ON m.estado_id = em.id
    ORDER BY m.fecha_programada ASC
  `);
  return result.rows;
}

export async function scheduleMantenimiento(data: Partial<Mantenimiento>, userRol?: string) {
  const { activo_id, tipo, descripcion, fecha_programada, tecnico_id, prioridad } = data;
  
  const tipo_id = await getCatalogId('tipos_mantenimiento', tipo || 'Preventivo');
  const prio_id = await getCatalogId('prioridades', prioridad || 'Media');
  const estado_id = await getCatalogId('estados_mantenimiento', 'Programado');

  const res = await query(
    `INSERT INTO mantenimientos (activo_id, tipo_id, prioridad_id, estado_id, descripcion, fecha_programada, creado_por) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [activo_id, tipo_id, prio_id, estado_id, descripcion, fecha_programada, userRol || 'Sistema']
  );
  
  if (tecnico_id) {
    await query('INSERT INTO mantenimiento_tecnicos (mantenimiento_id, usuario_id) VALUES ($1, $2)', [res.rows[0].id, tecnico_id]);
  }

  revalidatePath('/mantenimiento');
  revalidatePath('/dashboard');
  revalidatePath('/seguimiento');
}

export async function updateMantenimiento(id: string, data: Partial<Mantenimiento>, userRol?: string) {
  const { estado, fecha_inicio, fecha_fin, tecnico_id, comentarios, costo, descripcion, prioridad, tipo, fecha_programada } = data;
  
  const estado_id = estado ? await getCatalogId('estados_mantenimiento', estado) : undefined;
  const prio_id = prioridad ? await getCatalogId('prioridades', prioridad) : undefined;
  const tipo_id = tipo ? await getCatalogId('tipos_mantenimiento', tipo) : undefined;

  const oldItem = (await query(`
    SELECT m.*, em.nombre as estado, p.nombre as prioridad, tm.nombre as tipo
    FROM mantenimientos m
    LEFT JOIN estados_mantenimiento em ON m.estado_id = em.id
    LEFT JOIN prioridades p ON m.prioridad_id = p.id
    LEFT JOIN tipos_mantenimiento tm ON m.tipo_id = tm.id
    WHERE m.id = $1
  `, [id])).rows[0];

  await query(
    `UPDATE mantenimientos SET 
      estado_id = COALESCE($1, estado_id), 
      fecha_inicio = COALESCE($2, fecha_inicio), 
      fecha_fin = COALESCE($3, fecha_fin), 
      comentarios = COALESCE($4, comentarios), 
      costo = COALESCE($5, costo),
      descripcion = COALESCE($6, descripcion),
      prioridad_id = COALESCE($7, prioridad_id),
      tipo_id = COALESCE($8, tipo_id),
      fecha_programada = COALESCE($9, fecha_programada)
     WHERE id = $10`,
    [estado_id, fecha_inicio, fecha_fin, comentarios, costo, descripcion, prio_id, tipo_id, fecha_programada, id]
  );

  if (tecnico_id) {
    await query('DELETE FROM mantenimiento_tecnicos WHERE mantenimiento_id = $1', [id]);
    await query('INSERT INTO mantenimiento_tecnicos (mantenimiento_id, usuario_id) VALUES ($1, $2)', [id, tecnico_id]);
  }

  if (userRol) {
    const fieldsToAudit = ['estado', 'descripcion', 'prioridad', 'tipo'] as const;
    for (const field of fieldsToAudit) {
      const newValue = (data as any)[field];
      const oldValue = (oldItem as any)[field];
      if (newValue !== undefined && String(newValue) !== String(oldValue)) {
        await query(
          'INSERT INTO historial_cambios (mantenimiento_id, campo, valor_anterior, valor_nuevo, usuario_rol) VALUES ($1, $2, $3, $4, $5)',
          [id, field, String(oldValue), String(newValue), userRol]
        );
      }
    }
  }

  revalidatePath('/mantenimiento');
  revalidatePath('/bitacoras');
  revalidatePath('/seguimiento');
}

export async function getCatalogo(tabla: string) {
  const allowed = ['tipos_activo', 'marcas', 'modelos', 'estados_activo', 'tipos_mantenimiento', 'prioridades', 'estados_mantenimiento'];
  if (!allowed.includes(tabla)) throw new Error('Tabla no permitida');
  const result = await query(`SELECT * FROM ${tabla} ORDER BY nombre ASC`);
  return result.rows;
}

export async function createCatalogoEntry(tabla: string, nombre: string) {
  const allowed = ['tipos_activo', 'marcas', 'modelos', 'estados_activo'];
  if (!allowed.includes(tabla)) throw new Error('Tabla no permitida');
  await query(`INSERT INTO ${tabla} (nombre) VALUES ($1)`, [nombre]);
  revalidatePath('/activos');
}

export async function deleteCatalogoEntry(tabla: string, id: string) {
  const allowed = ['tipos_activo', 'marcas', 'modelos', 'estados_activo'];
  if (!allowed.includes(tabla)) throw new Error('Tabla no permitida');
  await query(`DELETE FROM ${tabla} WHERE id = $1`, [id]);
  revalidatePath('/activos');
}

export async function getHistorialMantenimiento(id: string) {
  return (await query('SELECT * FROM historial_cambios WHERE mantenimiento_id = $1 ORDER BY fecha_cambio DESC', [id])).rows;
}

export async function getSedes() { return (await query('SELECT * FROM sedes ORDER BY nombre ASC')).rows; }

export async function createSede(nombre: string, direccion: string) {
  await query('INSERT INTO sedes (nombre, direccion) VALUES ($1, $2)', [nombre, direccion]);
  revalidatePath('/configuracion/sedes');
}

export async function updateSede(id: string, nombre: string, direccion: string) {
  await query('UPDATE sedes SET nombre = $1, direccion = $2 WHERE id = $3', [nombre, direccion, id]);
  revalidatePath('/configuracion/sedes');
}

export async function deleteSede(id: string) {
  await query('DELETE FROM sedes WHERE id = $1', [id]);
  revalidatePath('/configuracion/sedes');
}

export async function getUsuarios() {
  return (await query(`
    SELECT u.*, d.nombre as depto_nombre 
    FROM usuarios u
    LEFT JOIN departamentos d ON u.departamento_id = d.id
    ORDER BY u.nombre ASC
  `)).rows;
}

export async function createUsuario(data: { nombre: string; email: string; rol: string; departamento_id?: string }) {
  await query(
    'INSERT INTO usuarios (nombre, email, rol, departamento_id) VALUES ($1, $2, $3, $4)',
    [data.nombre, data.email, data.rol, data.departamento_id]
  );
  revalidatePath('/configuracion/usuarios');
}

export async function updateUsuario(id: string, data: { nombre: string; email: string; rol: string; departamento_id?: string }) {
  await query(
    'UPDATE usuarios SET nombre = $1, email = $2, rol = $3, departamento_id = $4 WHERE id = $5',
    [data.nombre, data.email, data.rol, data.departamento_id, id]
  );
  revalidatePath('/configuracion/usuarios');
}

export async function deleteUsuario(id: string) {
  await query('DELETE FROM usuarios WHERE id = $1', [id]);
  revalidatePath('/configuracion/usuarios');
}

export async function getUbicaciones() {
    return (await query(`
        SELECT u.*, ar.nombre as area_nombre, s.nombre as sede_nombre 
        FROM ubicaciones u
        JOIN areas ar ON u.area_id = ar.id
        JOIN sedes s ON ar.sede_id = s.id
    `)).rows;
}

export async function addEvidencia(mantenimiento_id: string, tipo: string, url: string, descripcion: string, nombre?: string) {
  await query('INSERT INTO evidencias (mantenimiento_id, tipo, url, descripcion, nombre) VALUES ($1, $2, $3, $4, $5)', [mantenimiento_id, tipo, url, descripcion, nombre || 'Documento']);
  revalidatePath('/bitacoras');
  revalidatePath('/seguimiento');
}

export async function getEvidencias(mantenimiento_id: string) {
  return (await query('SELECT * FROM evidencias WHERE mantenimiento_id = $1 ORDER BY created_at DESC', [mantenimiento_id])).rows;
}

export async function createBitacora(data: Partial<Mantenimiento>, userRol?: string) {
  const { activo_id, tipo, descripcion, fecha_programada, tecnico_id, comentarios, prioridad } = data;
  const tipo_id = await getCatalogId('tipos_mantenimiento', tipo || 'Preventivo');
  const prio_id = await getCatalogId('prioridades', prioridad || 'Media');
  const estado_id = await getCatalogId('estados_mantenimiento', 'Completado');

  const res = await query(
    `INSERT INTO mantenimientos (activo_id, tipo_id, prioridad_id, estado_id, descripcion, fecha_programada, comentarios, fecha_fin, creado_por) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8) RETURNING id`,
    [activo_id, tipo_id, prio_id, estado_id, descripcion, fecha_programada, comentarios, userRol || 'Sistema']
  );
  
  if (tecnico_id) {
    await query('INSERT INTO mantenimiento_tecnicos (mantenimiento_id, usuario_id) VALUES ($1, $2)', [res.rows[0].id, tecnico_id]);
  }
  revalidatePath('/bitacoras');
}

export async function scheduleBatchMantenimiento(items: Partial<Mantenimiento>[], userRol?: string) {
    for (const item of items) {
        const { activo_id, tipo, descripcion, fecha_programada, prioridad } = item;
        const tipo_id = await getCatalogId('tipos_mantenimiento', tipo || 'Preventivo');
        const prio_id = await getCatalogId('prioridades', prioridad || 'Media');
        const estado_id = await getCatalogId('estados_mantenimiento', 'Programado');

        await query(
            `INSERT INTO mantenimientos (activo_id, tipo_id, prioridad_id, estado_id, descripcion, fecha_programada, creado_por) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [activo_id, tipo_id, prio_id, estado_id, descripcion, fecha_programada, userRol || 'Sistema']
        );
    }
    revalidatePath('/seguimiento');
}

// Activities Management
export async function getActividades(mantenimiento_id: string) {
  return (await query('SELECT * FROM mantenimiento_actividades WHERE mantenimiento_id = $1 ORDER BY fecha_inicio ASC', [mantenimiento_id])).rows;
}

export async function addActividad(data: { mantenimiento_id: string; descripcion: string; fecha_inicio: string; fecha_fin: string }) {
  await query(
    'INSERT INTO mantenimiento_actividades (mantenimiento_id, descripcion, fecha_inicio, fecha_fin) VALUES ($1, $2, $3, $4)',
    [data.mantenimiento_id, data.descripcion, data.fecha_inicio, data.fecha_fin]
  );
  revalidatePath('/seguimiento');
  revalidatePath('/bitacoras');
}

export async function deleteActividad(id: string) {
  await query('DELETE FROM mantenimiento_actividades WHERE id = $1', [id]);
  revalidatePath('/seguimiento');
  revalidatePath('/bitacoras');
}

// Items Management
export async function getItems(mantenimiento_id: string) {
  return (await query('SELECT * FROM mantenimiento_items WHERE mantenimiento_id = $1 ORDER BY created_at ASC', [mantenimiento_id])).rows;
}

export async function addItem(data: { mantenimiento_id: string; descripcion: string; cantidad: number; precio_unitario: number }) {
  await query(
    'INSERT INTO mantenimiento_items (mantenimiento_id, descripcion, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
    [data.mantenimiento_id, data.descripcion, data.cantidad, data.precio_unitario]
  );
  
  // Update total cost in maintenance
  await query(`
    UPDATE mantenimientos SET costo = (SELECT SUM(total) FROM mantenimiento_items WHERE mantenimiento_id = $1)
    WHERE id = $1
  `, [data.mantenimiento_id]);

  revalidatePath('/seguimiento');
  revalidatePath('/bitacoras');
}

export async function deleteItem(id: string, mantenimiento_id: string) {
  await query('DELETE FROM mantenimiento_items WHERE id = $1', [id]);
  
  await query(`
    UPDATE mantenimientos SET costo = COALESCE((SELECT SUM(total) FROM mantenimiento_items WHERE mantenimiento_id = $1), 0)
    WHERE id = $1
  `, [mantenimiento_id]);

  revalidatePath('/seguimiento');
  revalidatePath('/bitacoras');
}
