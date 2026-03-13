export type UserRole = 'SuperAdmin' | 'Admin' | 'Jefe' | 'Técnico';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  departamento_id?: string;
  created_at: Date;
}

export interface Sede {
  id: string;
  nombre: string;
  direccion?: string;
}

export interface Activo {
  id: string;
  nombre: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  codigo_activo?: string;
  descripcion?: string;
  anio?: number;
  estado: 'Operativo' | 'En Mantenimiento' | 'Fuera de Servicio' | 'Baja';
  sede_id?: string;
  area_id?: string;
  ubicacion_id?: string;
  departamento_id?: string;
  qr_code?: string;
  fecha_compra?: Date;
  vencimiento_garantia?: Date;
  ultima_inspeccion?: Date;
}

export interface Mantenimiento {
  id: string;
  activo_id: string;
  tipo: 'Preventivo' | 'Correctivo' | 'Predictivo' | 'Inspección';
  descripcion: string;
  fecha_programada: Date;
  fecha_inicio?: Date;
  fecha_fin?: Date;
  tecnico_id?: string;
  estado: 'Programado' | 'En Proceso' | 'Completado' | 'Cancelado' | 'Rechazado';
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  costo: number;
  comentarios?: string;
}
