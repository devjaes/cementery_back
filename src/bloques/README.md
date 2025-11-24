# Módulo de Bloques

Este módulo gestiona los bloques dentro de los cementerios. Cada bloque pertenece a un cementerio y contiene nichos organizados en filas y columnas que se crean automáticamente.

## Características

- **CRUD completo**: Crear, leer, actualizar y eliminar bloques
- **Creación automática de nichos**: Al crear un bloque, se generan automáticamente todos los nichos según las dimensiones (filas × columnas)
- **Nichos con estado inicial "Deshabilitado"**: Los nichos creados automáticamente requieren habilitación posterior
- **Relación con cementerios**: Cada bloque pertenece a un cementerio específico
- **Enumeración automática**: Los bloques se numeran automáticamente según el orden de creación en el cementerio
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
  numero: number;             // Número de bloque (asignado automáticamente)
  numero_filas: number;       // Cantidad de filas
  numero_columnas: number;    // Cantidad de columnas
  estado: string;             // Estado (Activo/Inactivo)
  fecha_creacion: string;     // Fecha de creación
  fecha_modificacion?: string; // Fecha de última modificación
  nichos: Nicho[];           // Relación con nichos
}
```

## Flujo de Creación de Bloque

Cuando se crea un bloque:

1. Se valida que el cementerio exista
2. Se verifica que no exista un bloque activo con el mismo nombre en el cementerio
3. Se asigna automáticamente el siguiente número disponible
4. **Se crean automáticamente todos los nichos** (filas × columnas)
5. Los nichos se crean con estado `Deshabilitado` y requieren habilitación posterior

### Ejemplo: Bloque 2×3

Al crear un bloque de 2 filas × 3 columnas, se crean automáticamente 6 nichos:

```
Fila 1: [Nicho(1,1), Nicho(1,2), Nicho(1,3)]
Fila 2: [Nicho(2,1), Nicho(2,2), Nicho(2,3)]
```

Todos con estado inicial: `estadoVenta: "Deshabilitado"`

## Endpoints

### POST /bloques
Crear un nuevo bloque con nichos automáticos

**Request:**
```json
{
  "id_cementerio": "uuid-del-cementerio",
  "nombre": "Bloque A",
  "descripcion": "Bloque principal",
  "numero_filas": 10,
  "numero_columnas": 15
}
```

**Response:**
```json
{
  "bloque": {
    "id_bloque": "uuid",
    "nombre": "Bloque A",
    "numero": 1,
    "numero_filas": 10,
    "numero_columnas": 15,
    "descripcion": "Bloque principal",
    "estado": "Activo",
    "fecha_creacion": "2024-01-15T10:00:00Z"
  },
  "nichos_creados": 150,
  "mensaje": "Bloque creado con 150 nichos deshabilitados"
}
```

### GET /bloques
Obtener todos los bloques activos

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
  "nichos": [
    {
      "id_nicho": "uuid",
      "fila": 1,
      "columna": 1,
      "estadoVenta": "Deshabilitado",
      "tipo": null,
      "num_huecos": null
    },
    // ... más nichos
  ],
  "total_nichos": 50,
  "nichos_deshabilitados": 45,
  "nichos_disponibles": 5,
  "espacios_ocupados": 0
}
```

### GET /bloques/search?nombre=nombreBloque
Buscar bloques por nombre

### GET /bloques/:id
Obtener un bloque específico por ID

### PATCH /bloques/:id
Actualizar un bloque existente

**Nota:** El número del bloque NO se puede modificar después de la creación

### DELETE /bloques/:id
Eliminar un bloque (soft delete - cambia estado a "Inactivo")

## Habilitación de Nichos

Los nichos creados automáticamente están en estado "Deshabilitado". Para habilitarlos, use el endpoint de nichos:

### POST /nichos/:id/habilitar

**Request:**
```json
{
  "tipo": "Nicho",
  "num_huecos": 2,
  "fecha_construccion": "2024-01-15",
  "observaciones": "Nicho habilitado con características especiales"
}
```

**Response:**
```json
{
  "nicho": {
    "id_nicho": "uuid",
    "fila": 1,
    "columna": 1,
    "tipo": "Nicho",
    "num_huecos": 2,
    "estadoVenta": "Disponible",
    "fecha_construccion": "2024-01-15",
    "observaciones": "..."
  },
  "huecos": [
    { "num_hueco": 1, "estado": "Disponible" },
    { "num_hueco": 2, "estado": "Disponible" }
  ],
  "mensaje": "Nicho habilitado correctamente con 2 huecos"
}
```

## Validaciones

- El nombre del bloque debe ser único dentro del cementerio (solo bloques activos)
- El número de filas y columnas debe ser mayor a 0
- El cementerio debe existir al crear o actualizar un bloque
- No se puede eliminar un bloque que tenga nichos activos asociados
- El número del bloque es inmutable después de la creación

## Enumeración Automática

Los bloques se enumeran automáticamente al momento de la creación:

- Si es el primer bloque del cementerio, recibe el número `1`
- Los siguientes reciben el número máximo existente + 1
- La enumeración es por cementerio (cada cementerio tiene su propia secuencia)
- El número NO se modifica al actualizar el bloque

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

Esto creará:
- Bloque A con 150 nichos deshabilitados (10×15)
- Bloque B con 96 nichos deshabilitados (8×12)

## Relaciones

- **Cementerio**: Muchos bloques pertenecen a un cementerio
- **Nichos**: Un bloque tiene muchos nichos (creados automáticamente en formato fila/columna)
- **Enumeración**: Los bloques se numeran secuencialmente por cementerio