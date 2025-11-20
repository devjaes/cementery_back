# Módulo de Bloques

Este módulo gestiona los bloques dentro de los cementerios. Cada bloque pertenece a un cementerio y puede contener múltiples nichos organizados en filas y columnas.

## Características

- **CRUD completo**: Crear, leer, actualizar y eliminar bloques
- **Relación con cementerios**: Cada bloque pertenece a un cementerio específico
- **Validaciones**: Nombres únicos por cementerio, valores mínimos para filas y columnas
- **Búsqueda**: Buscar bloques por nombre
- **Filtrado**: Obtener bloques por cementerio

## Entidad Bloque

```typescript
{
  id_bloque: string;          // UUID único
  id_cementerio: Cementerio;  // Relación con cementerio
  nombre: string;             // Nombre del bloque
  descripcion?: string;       // Descripción opcional
  numero_filas: number;       // Cantidad de filas
  numero_columnas: number;    // Cantidad de columnas
  estado: string;             // Estado (Activo/Inactivo)
  fecha_creacion: string;     // Fecha de creación
  fecha_modificacion?: string; // Fecha de última modificación
  nichos: Nicho[];           // Relación con nichos
}
```

## Endpoints

### POST /bloques
Crear un nuevo bloque
```json
{
  "id_cementerio": "uuid-del-cementerio",
  "nombre": "Bloque A",
  "descripcion": "Bloque principal",
  "numero_filas": 10,
  "numero_columnas": 15
}
```

### GET /bloques
Obtener todos los bloques

### GET /bloques/cementerio/:id_cementerio
Obtener bloques de un cementerio específico

### GET /bloques/:id/nichos
Obtener todos los nichos de un bloque específico

**Respuesta:**
```json
{
  "bloque": {
    "id_bloque": "uuid",
    "nombre": "Bloque A",
    "numero": 1,
    "numero_filas": 10,
    "numero_columnas": 5,
    "descripcion": "Descripción",
    "cementerio": { ... }
  },
  "nichos": [ ... ],
  "total_nichos": 25,
  "capacidad_total": 50,
  "espacios_disponibles": 25
}
```

### GET /bloques/search?nombre=nombreBloque
Buscar bloques por nombre

### GET /bloques/:id
Obtener un bloque específico por ID

### PATCH /bloques/:id
Actualizar un bloque existente

### DELETE /bloques/:id
Eliminar un bloque (soft delete - cambia estado a "Inactivo")

## Validaciones

- El nombre del bloque debe ser único dentro del cementerio
- El número de filas y columnas debe ser mayor a 0
- El cementerio debe existir al crear o actualizar un bloque
- No se puede eliminar un bloque que tenga nichos asociados

## Integración con Cementerios

Al crear un cementerio, opcionalmente se pueden incluir bloques:

```json
{
  "nombre": "Cementerio Municipal",
  "direccion": "Av. Principal 123",
  "telefono": "+593 2 1234567",
  "responsable": "Juan Pérez",
  "bloques": [
    {
      "nombre": "Bloque A",
      "descripcion": "Bloque principal",
      "numero_filas": 10,
      "numero_columnas": 15
    },
    {
      "nombre": "Bloque B",
      "numero_filas": 8,
      "numero_columnas": 12
    }
  ]
}
```

## Relaciones

- **Cementerio**: Muchos bloques pertenecen a un cementerio
- **Nichos**: Un bloque puede tener muchos nichos (relación añadida a la entidad Nicho)