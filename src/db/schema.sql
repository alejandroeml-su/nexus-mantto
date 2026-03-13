-- Database Schema for NEXUS 4.0

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tables
CREATE TABLE IF NOT EXISTS sedes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    sede_id UUID REFERENCES sedes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ubicaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(50) CHECK (rol IN ('SuperAdmin', 'Admin', 'Jefe', 'Técnico')),
    departamento_id UUID REFERENCES departamentos(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    serie VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'Operativo' CHECK (estado IN ('Operativo', 'En Mantenimiento', 'Fuera de Servicio', 'Baja')),
    sede_id UUID REFERENCES sedes(id),
    area_id UUID REFERENCES areas(id),
    ubicacion_id UUID REFERENCES ubicaciones(id),
    departamento_id UUID REFERENCES departamentos(id),
    qr_code TEXT UNIQUE,
    fecha_compra DATE,
    vencimiento_garantia DATE,
    ultima_inspeccion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mantenimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activo_id UUID REFERENCES activos(id) ON DELETE CASCADE,
    tipo VARCHAR(50) CHECK (tipo IN ('Preventivo', 'Correctivo', 'Predictivo', 'Inspección')),
    descripcion TEXT NOT NULL,
    fecha_programada TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    tecnico_id UUID REFERENCES usuarios(id),
    estado VARCHAR(50) DEFAULT 'Programado' CHECK (estado IN ('Programado', 'En Proceso', 'Completado', 'Cancelado', 'Rechazado')),
    costo DECIMAL(12, 2) DEFAULT 0,
    comentarios TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mantenimiento_id UUID REFERENCES mantenimientos(id) ON DELETE CASCADE,
    tipo VARCHAR(20) CHECK (tipo IN ('Foto', 'Video', 'Documento')),
    url TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Data (Optional for testing)
INSERT INTO departamentos (nombre) VALUES ('Mantenimiento'), ('Producción'), ('IT'), ('Administración');
INSERT INTO sedes (nombre, direccion) VALUES ('Sede Central', 'Av. Industrial 123, Ciudad de México');
