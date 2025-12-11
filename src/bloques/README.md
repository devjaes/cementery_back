# Módulo de Bloques

Este módulo gestiona los bloques dentro de los cementerios. Cada bloque pertenece a un cementerio y contiene nichos organizados en filas y columnas que se crean automáticamente con comportamiento diferenciado según el tipo de bloque.

## Características

- **CRUD completo**: Crear, leer, actualizar y eliminar bloques
- **Dos tipos de bloques**: "Bloque" (estándar) y "Mausoleo" (personalizable)
- **Creación automática de nichos**: Al crear un bloque, se generan automáticamente todos los nichos según las dimensiones (filas × columnas)
- **Bloques tipo "Bloque"**: Nichos habilitados automáticamente con 1 hueco disponible cada uno
- **Bloques tipo "Mausoleo"**: Nichos deshabilitados que requieren habilitación manual
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
  tipo_bloque: string;        // Tipo: "Bloque" (default) o "Mausoleo"
  estado: string;             // Estado (Activo/Inactivo)
  fecha_creacion: string;     // Fecha de creación
  fecha_modificacion?: string; // Fecha de última modificación
  nichos: Nicho[];           // Relación con nichos
}
```

## Tipos de Bloque

### **Bloque** (Por defecto)
Bloques estándar con nichos listos para vender inmediatamente.
- Nichos creados en estado `DISPONIBLE`
- Cada nicho tiene 1 hueco automáticamente
- Tipo de nicho: "Nicho Simple"
- `fecha_adquisicion` establecida automáticamente
- ✅ Listos para reservar y vender

### **Mausoleo**
Estructuras personalizables que requieren configuración manual.
- Nichos creados en estado `DESHABILITADO`
- Sin huecos iniciales
- Tipo de nicho: null (configurar al habilitar)
- ⚙️ Requieren habilitación antes de vender

## Flujo de Creación de Bloque

Cuando se crea un bloque:

1. Se valida que el cementerio exista
2. Se verifica que no exista un bloque activo con el mismo nombre en el cementerio
3. Se asigna automáticamente el siguiente número disponible
4. Se define el `tipo_bloque` ("Bloque" por defecto o "Mausoleo")
5. **Se crean automáticamente todos los nichos** (filas × columnas)
6. Según el tipo:
   - **Bloque**: Nichos `DISPONIBLES` con 1 hueco cada uno
   - **Mausoleo**: Nichos `DESHABILITADOS` sin huecos

### Ejemplo: Bloque 2×3 tipo "Bloque"

Al crear un bloque de 2 filas × 3 columnas tipo "Bloque":

```
Fila 1: [Nicho(1,1) ✅, Nicho(1,2) ✅, Nicho(1,3) ✅]
Fila 2: [Nicho(2,1) ✅, Nicho(2,2) ✅, Nicho(2,3) ✅]

Estado: DISPONIBLE
Tipo: "Nicho Simple"
Huecos: 1 por nicho (estado "Disponible")
✅ Listos para vender
```

### Ejemplo: Bloque 2×3 tipo "Mausoleo"

Al crear un bloque de 2 filas × 3 columnas tipo "Mausoleo":

```
Fila 1: [Nicho(1,1) ⚠️, Nicho(1,2) ⚠️, Nicho(1,3) ⚠️]
Fila 2: [Nicho(2,1) ⚠️, Nicho(2,2) ⚠️, Nicho(2,3) ⚠️]

Estado: DESHABILITADO
Tipo: null
Huecos: ninguno
⚠️ Requieren habilitación
```

## Endpoints

### POST /bloques
Crear un nuevo bloque con nichos automáticos

**Request (Tipo "Bloque" - por defecto):**
```json
{
  "id_cementerio": "uuid-del-cementerio",
  "nombre": "Bloque A",
  "descripcion": "Bloque principal",
  "numero_filas": 10,
  "numero_columnas": 15,
  "tipo_bloque": "Bloque"  // Opcional, por defecto "Bloque"
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
    "tipo_bloque": "Bloque",
    "descripcion": "Bloque principal",
    "estado": "Activo",
    "fecha_creacion": "2024-01-15T10:00:00Z"
  },
  "nichos_creados": 150,
  "huecos_creados": 150,
  "mensaje": "Bloque tipo 'Bloque' creado con 150 nichos habilitados (1 hueco cada uno)"
}
```

**Request (Tipo "Mausoleo"):**
```json
{
  "id_cementerio": "uuid-del-cementerio",
  "nombre": "Mausoleo Familiar",
  "descripcion": "Estructura familiar",
  "numero_filas": 2,
  "numero_columnas": 3,
  "tipo_bloque": "Mausoleo"
}
```

**Response:**
```json
{
  "bloque": {
    "id_bloque": "uuid",
    "nombre": "Mausoleo Familiar",
    "numero": 2,
    "numero_filas": 2,
    "numero_columnas": 3,
    "tipo_bloque": "Mausoleo",
    "descripcion": "Estructura familiar",
    "estado": "Activo",
    "fecha_creacion": "2024-01-15T10:00:00Z"
  },
  "nichos_creados": 6,
  "huecos_creados": 0,
  "mensaje": "Bloque tipo 'Mausoleo' creado con 6 nichos deshabilitados"
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

**Solo para bloques tipo "Mausoleo":** Los nichos deshabilitados requieren habilitación manual antes de poder venderlos.

**Para bloques tipo "Bloque":** Los nichos ya están habilitados automáticamente y listos para vender.

Para habilitar un nicho de mausoleo, use el endpoint:

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