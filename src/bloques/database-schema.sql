-- Migración para crear la tabla de bloques
-- Esta tabla se creará automáticamente con TypeORM synchronize: true
-- pero aquí está la estructura para referencia

CREATE TABLE bloques (
    id_bloque UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cementerio UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500),
    numero_filas INTEGER NOT NULL CHECK (numero_filas > 0),
    numero_columnas INTEGER NOT NULL CHECK (numero_columnas > 0),
    estado VARCHAR(20) DEFAULT 'Activo',
    fecha_creacion VARCHAR(100) NOT NULL,
    fecha_modificacion VARCHAR(100),
    
    FOREIGN KEY (id_cementerio) REFERENCES "Cementerio"(id_cementerio),
    UNIQUE(nombre, id_cementerio) -- Nombre único por cementerio
);

-- Agregar columna id_bloque a la tabla nichos para la relación
ALTER TABLE nichos 
ADD COLUMN id_bloque UUID,
ADD CONSTRAINT fk_nicho_bloque 
    FOREIGN KEY (id_bloque) REFERENCES bloques(id_bloque);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_bloques_cementerio ON bloques(id_cementerio);
CREATE INDEX idx_bloques_nombre ON bloques(nombre);
CREATE INDEX idx_bloques_estado ON bloques(estado);
CREATE INDEX idx_nichos_bloque ON nichos(id_bloque);