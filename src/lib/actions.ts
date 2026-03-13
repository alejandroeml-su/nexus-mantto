'use server';

import { query } from '@/lib/db';
import { Activo, Mantenimiento } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Assets
export async function getActivos() {
  const result = await query(`
    SELECT a.*, s.nombre as sede_nombre, d.nombre as depto_nombre 
    FROM activos a
    LEFT JOIN sedes s ON a.sede_id = s.id
    LEFT JOIN departamentos d ON a.departamento_id = d.id
    ORDER BY a.created_at DESC
  `);
  return result.rows;
}

export async function createActivo(data: Partial<Activo>, userRol?: string) {
  const { nombre, tipo, marca, modelo, serie, anio, codigo_activo, descripcion, sede_id, departamento_id } = data;
  const qr_code = `QR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  await query(
    'INSERT INTO activos (nombre, tipo, marca, modelo, serie, anio, codigo_activo, descripcion, sede_id, departamento_id, qr_code, creado_por) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
    [nombre, tipo, marca, modelo, serie, anio, codigo_activo, descripcion, sede_id, departamento_id, qr_code, userRol || 'Sistema']
  );
  
  revalidatePath('/activos');
  revalidatePath('/configuracion/activos');
}

export async function updateActivo(id: string, data: Partial<Activo>) {
  const { nombre, tipo, marca, modelo, serie, anio, codigo_activo, descripcion, estado, sede_id, departamento_id } = data;
  await query(
    `UPDATE activos SET 
      nombre = $1, tipo = $2, marca = $3, modelo = $4, serie = $5, 
      anio = $6, codigo_activo = $7, descripcion = $8, estado = $9, 
      sede_id = $10, departamento_id = $11 
     WHERE id = $12`,
    [nombre, tipo, marca, modelo, serie, anio, codigo_activo, descripcion, estado, sede_id, departamento_id, id]
  );
  revalidatePath('/activos');
  revalidatePath('/configuracion/activos');
}

export async function deleteActivo(id: string) {
  await query('DELETE FROM activos WHERE id = $1', [id]);
  revalidatePath('/activos');
  revalidatePath('/configuracion/activos');
}

// Maintenance / Work Orders
export async function getMantenimientos() {
  const result = await query(`
    SELECT m.*, a.nombre as activo_nombre, u.nombre as tecnico_nombre
    FROM mantenimientos m
    JOIN activos a ON m.activo_id = a.id
    LEFT JOIN usuarios u ON m.tecnico_id = u.id
    ORDER BY m.fecha_programada ASC
  `);
  return result.rows;
}

export async function scheduleMantenimiento(data: Partial<Mantenimiento>, userRol?: string) {
  const { activo_id, tipo, descripcion, fecha_programada, tecnico_id, prioridad } = data;
  
  await query(
    'INSERT INTO mantenimientos (activo_id, tipo, descripcion, fecha_programada, tecnico_id, prioridad, creado_por) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [
      activo_id, 
      tipo, 
      descripcion, 
      fecha_programada, 
      tecnico_id || null, 
      prioridad || 'Media',
      userRol || 'Sistema'
    ]
  );
  
  revalidatePath('/mantenimiento');
  revalidatePath('/dashboard');
  revalidatePath('/seguimiento');
}

export async function scheduleBatchMantenimiento(items: Partial<Mantenimiento>[], userRol?: string) {
  for (const item of items) {
    const { activo_id, tipo, descripcion, fecha_programada, tecnico_id, prioridad, estado } = item;
    await query(
      'INSERT INTO mantenimientos (activo_id, tipo, descripcion, fecha_programada, tecnico_id, prioridad, estado, creado_por) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        activo_id, 
        tipo, 
        descripcion, 
        fecha_programada, 
        tecnico_id || null, 
        prioridad || 'Media',
        estado || 'Programado',
        userRol || 'Sistema'
      ]
    );
  }
  
  revalidatePath('/mantenimiento');
  revalidatePath('/dashboard');
  revalidatePath('/seguimiento');
  revalidatePath('/activos');
}

// Catalogs Management
export async function getCatalogo(tabla: string) {
  const allowed = ['tipos_activo', 'marcas', 'modelos', 'estados_activo'];
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

export async function updateMantenimiento(id: string, data: Partial<Mantenimiento>, userRol?: string) {
  const { estado, fecha_inicio, fecha_fin, tecnico_id, comentarios, costo, descripcion, prioridad, tipo, fecha_programada } = data;
  
  // Get old data for audit
  const oldDataRes = await query('SELECT * FROM mantenimientos WHERE id = $1', [id]);
  const oldItem = oldDataRes.rows[0];

  await query(
    `UPDATE mantenimientos SET 
      estado = COALESCE($1, estado), 
      fecha_inicio = COALESCE($2, fecha_inicio), 
      fecha_fin = COALESCE($3, fecha_fin), 
      tecnico_id = COALESCE($4, tecnico_id), 
      comentarios = COALESCE($5, comentarios), 
      costo = COALESCE($6, costo),
      descripcion = COALESCE($7, descripcion),
      prioridad = COALESCE($8, prioridad),
      tipo = COALESCE($9, tipo),
      fecha_programada = COALESCE($10, fecha_programada)
     WHERE id = $11`,
    [estado, fecha_inicio, fecha_fin, tecnico_id, comentarios, costo, descripcion, prioridad, tipo, fecha_programada, id]
  );

  // Audit Logs
  if (userRol) {
    const fieldsToAudit = ['estado', 'tecnico_id', 'descripcion', 'prioridad', 'tipo', 'fecha_programada'] as const;
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
  revalidatePath('/dashboard');
}

export async function getHistorialMantenimiento(id: string) {
  const result = await query(
    'SELECT * FROM historial_cambios WHERE mantenimiento_id = $1 ORDER BY fecha_cambio DESC',
    [id]
  );
  return result.rows;
}

// Sites (Sedes)
export async function getSedes() {
  const result = await query('SELECT * FROM sedes ORDER BY nombre ASC');
  return result.rows;
}

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

// Users (Usuarios)
export async function getUsuarios() {
  const result = await query(`
    SELECT u.*, d.nombre as depto_nombre 
    FROM usuarios u
    LEFT JOIN departamentos d ON u.departamento_id = d.id
    ORDER BY u.nombre ASC
  `);
  return result.rows;
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

export async function addEvidencia(mantenimiento_id: string, tipo: string, url: string, descripcion: string, nombre?: string) {
  await query(
    'INSERT INTO evidencias (mantenimiento_id, tipo, url, descripcion, nombre) VALUES ($1, $2, $3, $4, $5)',
    [mantenimiento_id, tipo, url, descripcion, nombre || 'Documento']
  );
  revalidatePath('/bitacoras');
  revalidatePath('/seguimiento');
  revalidatePath('/mantenimiento');
}

export async function getEvidencias(mantenimiento_id: string) {
  const result = await query(
    'SELECT * FROM evidencias WHERE mantenimiento_id = $1 ORDER BY created_at DESC',
    [mantenimiento_id]
  );
  return result.rows;
}

export async function createBitacora(data: Partial<Mantenimiento>, userRol?: string) {
  const { activo_id, tipo, descripcion, fecha_programada, tecnico_id, comentarios, prioridad } = data;
  
  await query(
    `INSERT INTO mantenimientos (activo_id, tipo, descripcion, fecha_programada, tecnico_id, comentarios, estado, fecha_fin, prioridad, creado_por) 
     VALUES ($1, $2, $3, $4, $5, $6, 'Completado', NOW(), $7, $8)`,
    [
      activo_id, 
      tipo, 
      descripcion, 
      fecha_programada, 
      tecnico_id || null, 
      comentarios, 
      prioridad || 'Media',
      userRol || 'Sistema'
    ]
  );
  
  revalidatePath('/bitacoras');
  revalidatePath('/dashboard');
}
