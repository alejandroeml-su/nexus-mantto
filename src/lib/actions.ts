'use server';

import { query } from '@/lib/db';
import { Activo, Mantenimiento } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';


// Helper to get ID from Name in catalogs
async function getCatalogId(table: string, name: string): Promise<string> {
  const result = await query(`SELECT id FROM ${table} WHERE nombre = $1`, [name]);
  if (result.rows.length === 0) {
    console.error(`Catalog entry not found: table=${table}, name=${name}`);
    throw new Error(`Configuración faltante: el valor '${name}' no existe en el catálogo '${table}'. Por favor contacte al administrador.`);
  }
  return result.rows[0].id;
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
           ar.nombre as area_nombre,
           d.nombre as depto_nombre,
           s.nombre as sede_nombre,
           a.ubicacion_id,
           a.area_id,
           a.departamento_id,
           a.sede_id
    FROM activos a
    LEFT JOIN tipos_activo ta ON a.tipo_id = ta.id
    LEFT JOIN modelos mo ON a.modelo_id = mo.id
    LEFT JOIN marcas ma ON mo.marca_id = ma.id
    LEFT JOIN estados_activo ea ON a.estado_id = ea.id
    LEFT JOIN ubicaciones u ON a.ubicacion_id = u.id
    LEFT JOIN areas ar ON a.area_id = ar.id
    LEFT JOIN sedes s ON a.sede_id = s.id
    LEFT JOIN departamentos d ON a.departamento_id = d.id
    ORDER BY a.created_at DESC
  `);
  return result.rows;
}

export async function createActivo(data: Partial<Activo>, userRol?: string) {
  const { nombre, tipo, marca, modelo, serie, codigo_activo, descripcion, ubicacion_id, area_id, departamento_id, sede_id } = data;
  
  const tipo_id = await getCatalogId('tipos_activo', tipo || 'HVAC');
  const marca_row = await query('SELECT id FROM marcas WHERE nombre = $1', [marca]);
  const marca_id = marca_row.rows[0]?.id;
  const modelo_row = await query('SELECT id FROM modelos WHERE nombre = $1 AND marca_id = $2', [modelo, marca_id]);
  const modelo_id = modelo_row.rows[0]?.id;
  
  const estado_id = await getCatalogId('estados_activo', 'Operativo');
  const qr_code = `QR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  await query(
    `INSERT INTO activos (nombre, tipo_id, modelo_id, serie, codigo_activo, qr_code, estado_id, ubicacion_id, area_id, departamento_id, creado_por, sede_id) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [nombre, tipo_id, modelo_id, serie, codigo_activo, qr_code, estado_id, ubicacion_id || null, area_id || null, departamento_id || null, userRol || 'Sistema', sede_id || null]
  );
  
  revalidatePath('/activos');
  revalidatePath('/configuracion/activos');
}

export async function updateActivo(id: string, data: Partial<Activo>) {
  const { nombre, tipo, marca, modelo, serie, codigo_activo, estado, ubicacion_id, area_id, departamento_id, sede_id } = data;
  
  const tipo_id = tipo ? await getCatalogId('tipos_activo', tipo) : undefined;
  const marca_row = marca ? await query('SELECT id FROM marcas WHERE nombre = $1', [marca]) : undefined;
  const marca_id = marca_row?.rows[0]?.id;
  const modelo_id = modelo && marca_id ? await getCatalogId('modelos', modelo) : undefined;
  const estado_id = estado ? await getCatalogId('estados_activo', estado) : undefined;
  const depto_id = departamento_id ? departamento_id : undefined;

  await query(
    `UPDATE activos SET 
      nombre = COALESCE($1, nombre), 
      tipo_id = COALESCE($2, tipo_id), 
      modelo_id = COALESCE($3, modelo_id), 
      serie = COALESCE($4, serie), 
      codigo_activo = COALESCE($5, codigo_activo), 
      estado_id = COALESCE($6, estado_id), 
      ubicacion_id = COALESCE($7, ubicacion_id), 
      area_id = COALESCE($8, area_id),
      departamento_id = COALESCE($9, departamento_id),
      sede_id = COALESCE($10, sede_id)
     WHERE id = $11`,
    [nombre, tipo_id, modelo_id, serie, codigo_activo, estado_id, ubicacion_id, area_id, depto_id, sede_id, id]
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
  
  try {
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
  } catch (error) {
    console.error("Error in scheduleMantenimiento:", error);
    throw error;
  }
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

export async function getSedes() { 
  return (await query(`
    SELECT s.*, p.nombre as pais_nombre 
    FROM sedes s 
    LEFT JOIN paises p ON s.pais_id = p.id 
    ORDER BY s.nombre ASC
  `)).rows; 
}

export async function createSede(nombre: string, direccion: string, pais_id?: string) {
  console.log('Action: createSede', { nombre, direccion, pais_id });
  await query('INSERT INTO sedes (nombre, direccion, pais_id) VALUES ($1, $2, $3)', [nombre, direccion, pais_id || null]);
  revalidatePath('/configuracion/ubicaciones');
  return { success: true };
}

export async function updateSede(id: string, nombre: string, direccion: string, pais_id?: string) {
  await query('UPDATE sedes SET nombre = $1, direccion = $2, pais_id = $3 WHERE id = $4', [nombre, direccion, pais_id || null, id]);
  revalidatePath('/configuracion/ubicaciones');
}

export async function deleteSede(id: string) {
  await query('DELETE FROM sedes WHERE id = $1', [id]);
  revalidatePath('/configuracion/ubicaciones');
}

export async function getPaises() {
  return (await query('SELECT * FROM paises ORDER BY nombre ASC')).rows;
}

export async function createPais(nombre: string, codigo: string) {
  console.log('Action: createPais', { nombre, codigo });
  await query('INSERT INTO paises (nombre, codigo) VALUES ($1, $2)', [nombre, codigo]);
  revalidatePath('/configuracion/ubicaciones');
  return { success: true };
}

export async function updatePais(id: string, nombre: string, codigo: string) {
  await query('UPDATE paises SET nombre = $1, codigo = $2 WHERE id = $3', [nombre, codigo, id]);
  revalidatePath('/configuracion/ubicaciones');
}

export async function deletePais(id: string) {
  const check = await query('SELECT COUNT(*) FROM sedes WHERE pais_id = $1', [id]);
  if (parseInt(check.rows[0].count) > 0) {
    throw new Error('No se puede eliminar el país porque tiene sedes asignadas.');
  }
  await query('DELETE FROM paises WHERE id = $1', [id]);
  revalidatePath('/configuracion/ubicaciones');
}

export async function getUsuarios() {
  return (await query(`
    SELECT u.*, d.nombre as depto_nombre 
    FROM usuarios u
    LEFT JOIN departamentos d ON u.departamento_id = d.id
    ORDER BY u.nombre ASC
  `)).rows;
}

export async function createUsuario(data: { nombre: string; email: string; rol: string; departamento_id?: string; password?: string }) {
  const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;
  const deptoId = data.departamento_id || null;
  await query(
    'INSERT INTO usuarios (nombre, email, rol, departamento_id, password) VALUES ($1, $2, $3, $4, $5)',
    [data.nombre, data.email, data.rol, deptoId, hashedPassword]
  );
  revalidatePath('/configuracion/usuarios');
}

export async function updateUsuario(id: string, data: { nombre: string; email: string; rol: string; departamento_id?: string }) {
  const deptoId = data.departamento_id || null;
  await query(
    'UPDATE usuarios SET nombre = $1, email = $2, rol = $3, departamento_id = $4 WHERE id = $5',
    [data.nombre, data.email, data.rol, deptoId, id]
  );
  revalidatePath('/configuracion/usuarios');
}

export async function adminResetPassword(userId: string, newPassword: string) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await query('UPDATE usuarios SET password = $1 WHERE id = $2', [hashedPassword, userId]);
  revalidatePath('/configuracion/usuarios');
}

export async function deleteUsuario(id: string) {
  await query('DELETE FROM usuarios WHERE id = $1', [id]);
  revalidatePath('/configuracion/usuarios');
}

// Authentication Actions

export async function login(email: string, password_input: string) {
  const res = await query('SELECT * FROM usuarios WHERE email = $1', [email]);
  const user = res.rows[0];

  if (!user || !user.password) {
    throw new Error('Credenciales inválidas');
  }

  const isValid = await bcrypt.compare(password_input, user.password);
  if (!isValid) {
    throw new Error('Credenciales inválidas');
  }

  // Create token
  const token = await encrypt({ id: user.id, email: user.email, rol: user.rol });

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 1 day
  });

  return { success: true, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return { success: true };
}

export async function requestPasswordReset(email: string) {
  const res = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
  if (res.rows.length === 0) {
    // Return generic success to prevent email enumeration
    return { success: true, message: 'Si el correo existe, se han enviado las instrucciones.' };
  }
  
  // Generate token (UUID)
  const token = crypto.randomUUID();
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  await query(
    'UPDATE usuarios SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
    [token, expiry, email]
  );
  
  // In a real app we'd send an email. For now, we return it to display it.
  return { success: true, token, email };
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await query(
    'SELECT id FROM usuarios WHERE reset_token = $1 AND reset_token_expiry > NOW()',
    [token]
  );
  
  if (res.rows.length === 0) {
    throw new Error('El enlace de recuperación es inválido o ha expirado.');
  }
  
  const userId = res.rows[0].id;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await query(
    'UPDATE usuarios SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
    [hashedPassword, userId]
  );
  
  return { success: true };
}


export async function getUbicaciones() {
    return (await query(`
        SELECT u.*, ar.nombre as area_nombre, s.nombre as sede_nombre 
        FROM ubicaciones u
        JOIN areas ar ON u.area_id = ar.id
        JOIN sedes s ON ar.sede_id = s.id
        ORDER BY u.nombre ASC
    `)).rows;
}

export async function createUbicacion(nombre: string, area_id: string, activo: boolean = true) {
    await query('INSERT INTO ubicaciones (nombre, area_id, activo) VALUES ($1, $2, $3)', [nombre, area_id, activo]);
    revalidatePath('/configuracion/ubicaciones');
}

export async function updateUbicacion(id: string, nombre: string, area_id: string, activo: boolean) {
    await query('UPDATE ubicaciones SET nombre = $1, area_id = $2, activo = $3 WHERE id = $4', [nombre, area_id, activo, id]);
    revalidatePath('/configuracion/ubicaciones');
}

export async function deleteUbicacion(id: string) {
    await query('DELETE FROM ubicaciones WHERE id = $1', [id]);
    revalidatePath('/configuracion/ubicaciones');
}

// Areas
export async function getAreas() {
    return (await query(`
        SELECT a.*, s.nombre as sede_nombre 
        FROM areas a
        JOIN sedes s ON a.sede_id = s.id
        ORDER BY a.nombre ASC
    `)).rows;
}

export async function createArea(nombre: string, sede_id: string, activo: boolean = true) {
    await query('INSERT INTO areas (nombre, sede_id, activo) VALUES ($1, $2, $3)', [nombre, sede_id, activo]);
    revalidatePath('/configuracion/ubicaciones');
}

export async function updateArea(id: string, nombre: string, sede_id: string, activo: boolean) {
    await query('UPDATE areas SET nombre = $1, sede_id = $2, activo = $3 WHERE id = $4', [nombre, sede_id, activo, id]);
    revalidatePath('/configuracion/ubicaciones');
}

export async function deleteArea(id: string) {
    const check = await query('SELECT COUNT(*) FROM ubicaciones WHERE area_id = $1', [id]);
    if (parseInt(check.rows[0].count) > 0) {
        throw new Error('No se puede eliminar el área porque tiene ubicaciones asignadas.');
    }
    await query('DELETE FROM areas WHERE id = $1', [id]);
    revalidatePath('/configuracion/ubicaciones');
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
  
  try {
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
    revalidatePath('/mantenimiento');
  } catch (error) {
    console.error("Error in createBitacora:", error);
    throw error;
  }
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
