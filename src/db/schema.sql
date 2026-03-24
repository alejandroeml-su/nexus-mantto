-- Database Schema for NEXUS 4.0 - Normalized to 4NF
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Catalogs
CREATE TABLE IF NOT EXISTS sedes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tipos_activo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS marcas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS estados_activo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tipos_mantenimiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS prioridades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(20) NOT NULL UNIQUE,
    nivel INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS estados_mantenimiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Hierarchical Catalogs
CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    sede_id UUID REFERENCES sedes(id) ON DELETE CASCADE,
    UNIQUE(nombre, sede_id)
);

CREATE TABLE IF NOT EXISTS ubicaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
    UNIQUE(nombre, area_id)
);

CREATE TABLE IF NOT EXISTS modelos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    marca_id UUID REFERENCES marcas(id) ON DELETE CASCADE,
    UNIQUE(nombre, marca_id)
);

-- 3. Users
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(50) CHECK (rol IN ('Super Admin', 'Admin', 'Jefe', 'Técnico')),
    departamento_id UUID REFERENCES departamentos(id),
    password VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Assets
CREATE TABLE IF NOT EXISTS activos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    tipo_id UUID REFERENCES tipos_activo(id),
    modelo_id UUID REFERENCES modelos(id),
    serie VARCHAR(100),
    codigo_activo VARCHAR(50) UNIQUE,
    qr_code TEXT UNIQUE,
    estado_id UUID REFERENCES estados_activo(id),
    ubicacion_id UUID REFERENCES ubicaciones(id),
    departamento_id UUID REFERENCES departamentos(id),
    fecha_compra DATE,
    vencimiento_garantia DATE,
    ultima_inspeccion TIMESTAMP WITH TIME ZONE,
    creado_por VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Maintenance
CREATE TABLE IF NOT EXISTS mantenimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activo_id UUID REFERENCES activos(id) ON DELETE CASCADE,
    tipo_id UUID REFERENCES tipos_mantenimiento(id),
    prioridad_id UUID REFERENCES prioridades(id),
    estado_id UUID REFERENCES estados_mantenimiento(id),
    descripcion TEXT NOT NULL,
    fecha_programada TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    costo DECIMAL(12, 2) DEFAULT 0,
    comentarios TEXT,
    creado_por VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4NF: Multiple technicians per maintenance
CREATE TABLE IF NOT EXISTS mantenimiento_tecnicos (
    mantenimiento_id UUID REFERENCES mantenimientos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    PRIMARY KEY (mantenimiento_id, usuario_id)
);

-- 6. Activities and Items
CREATE TABLE IF NOT EXISTS mantenimiento_actividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mantenimiento_id UUID REFERENCES mantenimientos(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mantenimiento_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mantenimiento_id UUID REFERENCES mantenimientos(id) ON DELETE CASCADE,
    descripcion VARCHAR(255) NOT NULL,
    cantidad DECIMAL(12, 2) DEFAULT 1,
    precio_unitario DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Evidence and Auditing
CREATE TABLE IF NOT EXISTS evidencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mantenimiento_id UUID REFERENCES mantenimientos(id) ON DELETE CASCADE,
    tipo VARCHAR(20) CHECK (tipo IN ('Foto', 'Video', 'Documento', 'Imagen')),
    url TEXT NOT NULL,
    nombre VARCHAR(255),
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historial_cambios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mantenimiento_id UUID REFERENCES mantenimientos(id) ON DELETE CASCADE,
    campo VARCHAR(100),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_rol VARCHAR(50),
    fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
