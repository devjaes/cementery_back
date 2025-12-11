# Módulo de Nichos

Este módulo gestiona los nichos dentro de los cementerios. Los nichos se crean automáticamente al crear un bloque con comportamiento diferenciado según el tipo de bloque.

## Características

- **Creación automática**: Los nichos se crean automáticamente al crear un bloque
- **Tipos de bloque**: Comportamiento diferenciado para bloques tipo "Bloque" vs "Mausoleo"
- **Bloques tipo "Bloque"**: Nichos habilitados automáticamente con 1 hueco disponible
- **Bloques tipo "Mausoleo"**: Nichos deshabilitados que requieren habilitación manual
- **Sistema de huecos**: Cada nicho puede tener múltiples huecos para diferentes ocupantes
- **Gestión de ventas**: Flujo completo de reserva, venta y asignación de propietarios
- **Búsqueda avanzada**: Buscar nichos por fallecidos, propietarios o ubicación
- **Relaciones**: Integración con cementerios, bloques, inhumaciones y propietarios

## Entidad Nicho

```typescript
{
  id_nicho: string;              // UUID único
  id_cementerio: Cementerio;     // Relación con cementerio
  id_bloque: Bloque;             // Relación con bloque (nullable)
  fila: number;                  // Número de fila (int)
  columna: number;               // Número de columna (int)
  tipo: string;                  // Tipo: Nicho Simple, Nicho, Mausoleo, Fosa, Bóveda
  estado: string;                // Estado: Activo/Inactivo
  estadoVenta: EstadoNicho;      // Estado de venta (enum)
  num_huecos: number;            // Cantidad de huecos
  fecha_construccion: string;    // Fecha de construcción
  fecha_adquisicion: string;     // Fecha de adquisición (igual a fecha_creacion al crear)
  observaciones?: string;        // Observaciones opcionales
  fecha_creacion: string;        // Fecha de creación
  fecha_actualizacion: string;   // Fecha de última modificación
  huecos: HuecosNicho[];        // Relación con huecos
  inhumaciones: Inhumacion[];    // Relación con inhumaciones
  propietarios_nicho: PropietarioNicho[];  // Relación con propietarios
}
```

## Estados de Venta (EstadoNicho)

```typescript
enum EstadoNicho {
  DESHABILITADO = 'Deshabilitado',  // Estado inicial
  DISPONIBLE = 'Disponible',        // Habilitado y disponible
  RESERVADO = 'Reservado',          // Reservado con orden de pago
  VENDIDO = 'Vendido',              // Venta confirmada
  BLOQUEADO = 'Bloqueado',          // Bloqueado temporalmente
}
```

## Flujo de Trabajo

### 1. Creación Automática Según Tipo de Bloque

Al crear un bloque de **filas × columnas**, se crean automáticamente todos los nichos con comportamiento diferenciado:

#### **Tipo "Bloque"** (Por defecto)
```
Ejemplo: Bloque 3×4 (3 filas, 4 columnas) - Tipo: "Bloque"

Fila 1: [Nicho(1,1), Nicho(1,2), Nicho(1,3), Nicho(1,4)]
Fila 2: [Nicho(2,1), Nicho(2,2), Nicho(2,3), Nicho(2,4)]
Fila 3: [Nicho(3,1), Nicho(3,2), Nicho(3,3), Nicho(3,4)]

✅ Estado inicial: DISPONIBLE
✅ Tipo: "Nicho Simple"
✅ Num_huecos: 1
✅ Cada nicho tiene 1 hueco creado automáticamente
✅ Estado del hueco: "Disponible"
✅ fecha_construccion: fecha actual
✅ fecha_adquisicion: fecha actual (misma que fecha_creacion)
```

**Creación al crear bloque:**
```json
POST /bloques
{
  "id_cementerio": "uuid",
  "nombre": "Bloque A",
  "numero_filas": 3,
  "numero_columnas": 4,
  "tipo_bloque": "Bloque"  // o sin especificar (default)
}
```

**Resultado:**
- 12 nichos creados en estado `DISPONIBLE`
- 12 huecos creados automáticamente (1 por nicho)
- Listos para reservar y vender inmediatamente

#### **Tipo "Mausoleo"**
```
Ejemplo: Bloque 2×3 (2 filas, 3 columnas) - Tipo: "Mausoleo"

Fila 1: [Nicho(1,1), Nicho(1,2), Nicho(1,3)]
Fila 2: [Nicho(2,1), Nicho(2,2), Nicho(2,3)]

⚠️ Estado inicial: DESHABILITADO
⚠️ Tipo: null
⚠️ Num_huecos: null
⚠️ Sin huecos iniciales
⚠️ Requiere habilitación manual
```

**Creación al crear bloque:**
```json
POST /bloques
{
  "id_cementerio": "uuid",
  "nombre": "Mausoleo Familiar",
  "numero_filas": 2,
  "numero_columnas": 3,
  "tipo_bloque": "Mausoleo"
}
```

**Resultado:**
- 6 nichos creados en estado `DESHABILITADO`
- Sin huecos iniciales
- Requieren habilitación manual antes de usar

### 2. Habilitación de Nichos (Solo para Mausoleos)

Para habilitar un nicho deshabilitado de un mausoleo:

**POST /nichos/:id/habilitar**

```json
{
  "tipo": "Nicho",
  "num_huecos": 2,
  "fecha_construccion": "2024-01-15",
  "observaciones": "Nicho habilitado con características especiales"
}
```

**Respuesta:**
```json
{
  "id_nicho": "uuid",
  "fila": 1,
  "columna": 1,
  "tipo": "Nicho",
  "num_huecos": 2,
  "estadoVenta": "Disponible",
  "fecha_construccion": "2024-01-15",
  "observaciones": "...",
  "bloque": {
    "id_bloque": "uuid",
    "nombre": "Bloque A",
    "numero": 1
  },
  "cementerio": {
    "id_cementerio": "uuid",
    "nombre": "Cementerio Central"
  },
  "huecos": [
    {
      "id_detalle_hueco": "uuid",
      "num_hueco": 1,
      "estado": "Disponible"
    },
    {
      "id_detalle_hueco": "uuid",
      "num_hueco": 2,
      "estado": "Disponible"
    }
  ],
  "mensaje": "Nicho habilitado correctamente con 2 huecos"
}
```

### 3. Flujo de Venta

#### 3.1. Reservar Nicho (Solo nichos DISPONIBLES)

**POST /nicho-sales/reservar**

```json
{
  "idNicho": "uuid-del-nicho",
  "idPersona": "uuid-del-cliente",
  "monto": 500.00,
  "generadoPor": "admin@cemetery.com",
  "direccionComprador": "Calle Principal 123",
  "observaciones": "Reserva para adquisición familiar"
}
```

**Resultado:**
- Cambia estado del nicho a `RESERVADO`
- Genera orden de pago
- Retorna PDF del recibo

#### 3.2. Confirmar Venta

**PATCH /nicho-sales/confirmar-venta**

```json
{
  "idPago": "uuid-del-pago"
}
```

**Resultado:**
- Confirma el pago en el sistema
- Cambia estado del nicho a `VENDIDO`
- Indica siguiente paso: registrar propietario

#### 3.3. Registrar Propietario

**POST /nicho-sales/registrar-propietario/:idNicho/:idPersona**

```json
{
  "tipoDocumento": "cedula",
  "numeroDocumento": "1234567890",
  "razon": "Compra de nicho"
}
```

**Resultado:**
- Crea registro de PropietarioNicho
- Confirma propiedad legal

## Endpoints Principales

### Gestión de Nichos

#### POST /nichos
Crear un nuevo nicho manualmente (casos especiales)

**Nota:** Normalmente los nichos se crean automáticamente al crear un bloque.

```json
{
  "id_cementerio": "uuid",
  "fila": 1,
  "columna": 5
}
```

#### GET /nichos
Obtener todos los nichos activos con sus relaciones

**Respuesta incluye:**
- Información del cementerio
- Información del bloque
- Inhumaciones asociadas
- Propietarios
- Huecos y su estado

#### POST /nichos/:id/habilitar
Habilitar un nicho deshabilitado

**Request:**
```json
{
  "tipo": "Nicho",
  "num_huecos": 2,
  "fecha_construccion": "2024-01-15",
  "observaciones": "Opcional"
}
```

#### GET /nichos/:id
Obtener detalles de un nicho específico

#### PATCH /nichos/:id
Actualizar información de un nicho

```json
{
  "tipo": "Mausoleo",
  "observaciones": "Actualizado con nuevas especificaciones"
}
```

#### DELETE /nichos/:id
Eliminar un nicho (soft delete - cambia estado a "Inactivo")

### Búsqueda

#### GET /nichos/fallecidos/:busqueda
Buscar fallecidos en nichos por cédula, nombres o apellidos

**Ejemplo:** `/nichos/fallecidos/Pablo`

**Respuesta:**
```json
[
  {
    "nicho": {
      "id_nicho": "uuid",
      "fila": 1,
      "columna": 2,
      "cementerio": "Cementerio Central"
    },
    "fallecido": {
      "cedula": "1234567890",
      "nombres": "Pablo",
      "apellidos": "García",
      "fecha_defuncion": "2023-05-15"
    }
  }
]
```

#### GET /nichos/propietarios/:id
Obtener propietarios de un nicho específico

### Ventas de Nichos

#### POST /nicho-sales/reservar
Reservar un nicho y generar orden de pago (retorna PDF)

#### PATCH /nicho-sales/confirmar-venta
Confirmar venta después de aprobación de finanzas

#### POST /nicho-sales/registrar-propietario/:idNicho/:idPersona
Registrar propietario después de confirmar venta

#### GET /nicho-sales/historial
Obtener historial de ventas con filtros

**Query params opcionales:**
- `estado`: Filtrar por EstadoNicho
- `cementerio`: Filtrar por cementerio
- `fechaDesde`: Fecha desde (ISO string)
- `fechaHasta`: Fecha hasta (ISO string)

#### DELETE /nicho-sales/cancelar-reserva/:idNicho
Cancelar una reserva (solo si el pago no ha sido confirmado)

## Validaciones

- Los nichos se crean automáticamente al crear un bloque
- Un nicho debe estar en estado `DESHABILITADO` para ser habilitado
- Solo nichos en estado `DISPONIBLE` pueden ser reservados
- Solo nichos en estado `RESERVADO` pueden pasar a `VENDIDO`
- No se puede eliminar un nicho con inhumaciones activas
- El tipo debe ser uno de: Nicho, Mausoleo, Fosa, Bóveda
- El número de huecos debe ser mayor a 0

## Tipos de Nichos y Bloques

### Tipos de Bloque

| Tipo | Descripción | Estado Inicial Nichos | Huecos Iniciales |
|------|-------------|----------------------|------------------|
| **Bloque** | Bloques estándar de nichos | `DISPONIBLE` | 1 hueco por nicho |
| **Mausoleo** | Estructuras familiares personalizables | `DESHABILITADO` | Ninguno (crear al habilitar) |

### Tipos de Nichos

| Tipo | Descripción | Huecos típicos | Cuándo se asigna |
|------|-------------|----------------|------------------|
| **Nicho Simple** | Nicho individual estándar | 1 | Automático en bloques tipo "Bloque" |
| **Nicho** | Nicho estándar doble | 1-2 | Al habilitar mausoleos |
| **Mausoleo** | Estructura familiar grande | 4-8 | Al habilitar mausoleos |
| **Fosa** | Tumba en tierra | 1 | Al habilitar mausoleos |
| **Bóveda** | Estructura subterránea familiar | 2-6 | Al habilitar mausoleos |

## Relaciones

- **Cementerio**: Cada nicho pertenece a un cementerio específico
- **Bloque**: Los nichos creados automáticamente están asociados a un bloque
- **Huecos**: Cada nicho tiene múltiples huecos (espacios individuales)
- **Inhumaciones**: Registra los fallecidos en cada hueco
- **Propietarios**: Personas que adquirieron el nicho
- **Mejoras**: Mejoras realizadas al nicho
- **Exhumaciones**: Registro de exhumaciones realizadas

## Búsqueda Normalizada

El sistema implementa búsqueda normalizada para fallecidos:
- **Case-insensitive**: No distingue mayúsculas/minúsculas
- **Sin acentos**: Normaliza caracteres acentuados
- **Búsqueda parcial**: Encuentra coincidencias parciales en cédula, nombres o apellidos

Ejemplo: 
- Búsqueda: `pablo` → Encuentra: "Pablo", "PABLO", "Páblo"
- Búsqueda: `garcia` → Encuentra: "García", "GARCIA", "Garcìa"

## Integración con Pagos

El módulo de ventas se integra con el módulo de pagos:

1. **Reserva** → Genera orden de pago con estado `pending`
2. **Finanzas valida** → Marca pago como `paid`
3. **Sistema confirma venta** → Actualiza estado del nicho a `VENDIDO`
4. **Registro de propietario** → Completa el proceso de venta

## Ejemplo de Flujo Completo

### Flujo para Bloque Tipo "Bloque" (Nichos habilitados automáticamente)

```bash
# 1. Crear bloque tipo "Bloque" (los nichos se crean automáticamente DISPONIBLES)
POST /bloques
{
  "id_cementerio": "uuid",
  "nombre": "Bloque A",
  "numero_filas": 5,
  "numero_columnas": 10,
  "tipo_bloque": "Bloque"
}
# Resultado: 50 nichos creados en estado DISPONIBLE con 1 hueco cada uno
# ✅ Listos para vender inmediatamente

# 2. Reservar nicho (sin necesidad de habilitar)
POST /nicho-sales/reservar
{
  "idNicho": "uuid",
  "idPersona": "uuid-cliente",
  "monto": 500.00,
  "generadoPor": "admin@cemetery.com"
}
# Estado: DISPONIBLE → RESERVADO
# Se genera PDF del recibo

# 3. Finanzas valida el pago (en módulo de pagos)

# 4. Confirmar venta
PATCH /nicho-sales/confirmar-venta
{
  "idPago": "uuid"
}
# Estado: RESERVADO → VENDIDO

# 5. Registrar propietario
POST /nicho-sales/registrar-propietario/{id-nicho}/{id-persona}
{
  "tipoDocumento": "cedula",
  "numeroDocumento": "1234567890"
}
# Propiedad legal registrada

# 6. Realizar inhumación (cuando sea necesario)
POST /inhumaciones
{
  "id_nicho": "uuid",
  "id_hueco": "uuid",
  "id_fallecido": "uuid",
  ...
}
# Hueco pasa a estado "ocupado"
```

### Flujo para Bloque Tipo "Mausoleo" (Nichos deshabilitados)

```bash
# 1. Crear bloque tipo "Mausoleo" (los nichos se crean DESHABILITADOS)
POST /bloques
{
  "id_cementerio": "uuid",
  "nombre": "Mausoleo Familiar",
  "numero_filas": 2,
  "numero_columnas": 3,
  "tipo_bloque": "Mausoleo"
}
# Resultado: 6 nichos creados en estado DESHABILITADO sin huecos
# ⚠️ Requieren habilitación antes de vender

# Resultado: 6 nichos creados en estado DESHABILITADO sin huecos
# ⚠️ Requieren habilitación antes de vender

# 2. Habilitar nicho específico con características personalizadas
POST /nichos/{id-nicho}/habilitar
{
  "tipo": "Mausoleo",
  "num_huecos": 6
}
# Estado: DESHABILITADO → DISPONIBLE
# Se crean 6 huecos disponibles

# 3-6. Mismo flujo de venta que bloques tipo "Bloque"
# (Reservar → Confirmar → Registrar propietario → Inhumación)
```

## Consideraciones Especiales

### Diferencias entre Bloques y Mausoleos

**Bloques tipo "Bloque":**
- ✅ Nichos listos para vender inmediatamente
- ✅ 1 hueco por nicho (estándar)
- ✅ Proceso más ágil y rápido
- ✅ Ideal para cementerios con alta rotación
- ✅ `fecha_adquisicion` se establece automáticamente

**Bloques tipo "Mausoleo":**
- ⚙️ Nichos personalizables antes de vender
- ⚙️ Número de huecos configurable
- ⚙️ Tipos de nicho variados (Mausoleo, Bóveda, etc.)
- ⚙️ Ideal para estructuras familiares
- ⚙️ Mayor flexibilidad en configuración

### Nichos sin Bloque
Es posible crear nichos manualmente sin asociarlos a un bloque (casos especiales como tumbas históricas o temporales).

### Cancelación de Reservas
Solo se pueden cancelar reservas cuyo pago no ha sido confirmado por finanzas. Una vez el pago es confirmado, el nicho pasa a estado VENDIDO y no puede revertirse.

### Búsqueda de Disponibilidad
Al buscar nichos disponibles, el sistema automáticamente asigna el primer bloque disponible con espacio, siguiendo el orden numérico de los bloques.

### Estados No Reversibles
El flujo de estados es unidireccional:
```
Para Bloques:
DISPONIBLE → RESERVADO → VENDIDO

Para Mausoleos:
DESHABILITADO → DISPONIBLE → RESERVADO → VENDIDO
```

Solo la cancelación de reservas permite regresar de RESERVADO a DISPONIBLE.
